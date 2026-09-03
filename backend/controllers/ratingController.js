const pool = require('../config/db');

// ── Submit Rating (Charity rates Volunteer) ──
exports.submitRating = async (req, res) => {
  try {
    const { delivery_id, rating, comment } = req.body;
    const rater_user_id = req.user.userId;

    // Validate score
    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    // Get delivery info
    const [rows] = await pool.query(
      `SELECT d.volunteer_id, d.status, r.charity_id
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       WHERE d.delivery_id = ?`,
      [delivery_id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Delivery not found' });

    const delivery = rows[0];

    // Only charity can rate
    if (delivery.charity_id !== rater_user_id)
      return res.status(403).json({ message: 'Only the charity can rate this delivery' });

    // Only rate completed deliveries
    if (delivery.status !== 'DELIVERED')
      return res.status(400).json({ message: 'Can only rate completed deliveries' });

    // Check duplicate rating
    const [duplicate] = await pool.query(
      `SELECT rating_id FROM ratings
       WHERE delivery_id = ? AND rater_user_id = ?`,
      [delivery_id, rater_user_id]
    );
    if (duplicate.length > 0)
      return res.status(400).json({ message: 'Already rated this delivery' });

    // Insert rating
    const [result] = await pool.query(
      `INSERT INTO ratings
       (delivery_id, rated_user_id, rater_user_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [delivery_id, delivery.volunteer_id, rater_user_id, rating, comment || null]
    );

    // Update volunteer average_rating in users table
    await pool.query(
      `UPDATE users
       SET rating_count   = rating_count + 1,
           average_rating = (
             SELECT AVG(r.rating)
             FROM ratings r
             WHERE r.rated_user_id = ?
           )
       WHERE user_id = ?`,
      [delivery.volunteer_id, delivery.volunteer_id]
    );

    // Notify volunteer
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'RATING')`,
      [delivery.volunteer_id,
       `Yeni değerlendirme aldınız: ${rating}/5 ⭐`]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'RATING', ?, 'CREATE', ?)`,
      [rater_user_id, result.insertId,
       `Rating submitted: ${rating}/5 for volunteer ${delivery.volunteer_id}`]
    );

    res.status(201).json({
      message: 'Rating submitted successfully',
      ratingId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Volunteer Ratings ──
exports.getVolunteerRatings = async (req, res) => {
  try {
    const { volunteerId } = req.params;

    const [rows] = await pool.query(
      `SELECT
         ra.rating_id, ra.rating, ra.comment, ra.created_at,
         u.full_name AS rater_name,
         fl.title    AS listing_title
       FROM ratings ra
       JOIN users u        ON ra.rater_user_id = u.user_id
       JOIN deliveries d   ON ra.delivery_id   = d.delivery_id
       JOIN requests r     ON d.request_id     = r.request_id
       JOIN food_listings fl ON r.listing_id   = fl.listing_id
       WHERE ra.rated_user_id = ?
       ORDER BY ra.created_at DESC`,
      [volunteerId]
    );

    // Get summary
    const [summary] = await pool.query(
      `SELECT average_rating, rating_count
       FROM users WHERE user_id = ?`,
      [volunteerId]
    );

    res.json({
      summary: summary[0],
      ratings: rows
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get My Rating for a Delivery ──
exports.getDeliveryRating = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM ratings
       WHERE delivery_id = ? AND rater_user_id = ?`,
      [req.params.deliveryId, req.user.userId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};