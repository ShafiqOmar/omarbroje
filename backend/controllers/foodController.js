const pool = require('../config/db');

// ── Create Listing ──
exports.createListing = async (req, res) => {
  try {
    const { title, description, total_quantity, expiry_date, lat, lng } = req.body;
    const provider_id = req.user.userId;

    const [result] = await pool.query(
      `INSERT INTO food_listings
       (provider_id, title, description, total_quantity, remaining_quantity,
        expiry_date, pickup_location)
       VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromText(?))`,
      [provider_id, title, description,
       total_quantity, total_quantity,
       expiry_date, `POINT(${lat} ${lng})`]
    );

    // Notify all ACTIVE charities
     const [charities] = await pool.query(
   `SELECT user_id FROM users 
     WHERE role_id = 3 
     AND status = 'ACTIVE' 
     AND is_deleted = FALSE
     AND capacity_status = 'ACCEPTING'`
    );
    if (charities.length > 0) {
      const notifications = charities.map(c => [
        c.user_id,
        `Yeni gıda ilanı mevcut: ${title}`,
        'NEW_LISTING'
      ]);
      await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ?',
        [notifications]
      );
    } 

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'FOOD_LISTING', ?, 'CREATE', ?)`,
      [provider_id, result.insertId, `Food listing created: ${title}`]
    );

    res.status(201).json({
      message: 'Listing created successfully',
      listingId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




exports.getListings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         fl.listing_id, fl.title, fl.description,
         fl.total_quantity, fl.remaining_quantity,
         fl.expiry_date, fl.status, fl.created_at,
         ST_X(fl.pickup_location) AS lat,
         ST_Y(fl.pickup_location) AS lng,
         u.full_name AS provider_name,
         u.phone    AS provider_phone
       FROM food_listings fl
       JOIN users u ON fl.provider_id = u.user_id
       WHERE fl.is_deleted = FALSE
         AND fl.status IN ('AVAILABLE','PARTIAL')
         AND (
           fl.expiry_date > NOW()              -- إعلانات صالحة الآن
           OR fl.expiry_date > DATE_SUB(NOW(), INTERVAL 3 HOUR) -- إعلانات انتهت مؤخراً
         )
       ORDER BY fl.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

 

// ── Get All Available Listings ──
/* exports.getListings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         fl.listing_id, fl.title, fl.description,
         fl.total_quantity, fl.remaining_quantity,
         fl.expiry_date, fl.status, fl.created_at,
         ST_X(fl.pickup_location) AS lat,
         ST_Y(fl.pickup_location) AS lng,
         u.full_name AS provider_name,
         u.phone    AS provider_phone
       FROM food_listings fl
       JOIN users u ON fl.provider_id = u.user_id
       WHERE fl.status IN ('AVAILABLE','PARTIAL')
         AND fl.is_deleted = FALSE
         
         AND fl.expiry_date > DATE_SUB(NOW(), INTERVAL 3 HOUR)
       ORDER BY fl.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; */
//AND fl.expiry_date > NOW() 

// ── Get My Listings (Provider) ──
exports.getMyListings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         fl.listing_id, fl.title, fl.description,
         fl.total_quantity, fl.remaining_quantity,
         fl.expiry_date, fl.status, fl.created_at,
         ST_X(fl.pickup_location) AS lat,
         ST_Y(fl.pickup_location) AS lng
       FROM food_listings fl
       WHERE fl.provider_id = ? AND fl.is_deleted = FALSE
       ORDER BY fl.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Single Listing ──
 exports.getListing = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         fl.*,
         ST_X(fl.pickup_location) AS lat,
         ST_Y(fl.pickup_location) AS lng,
         u.full_name AS provider_name
       FROM food_listings fl
       JOIN users u ON fl.provider_id = u.user_id
       WHERE fl.listing_id = ? AND fl.is_deleted = FALSE`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Listing not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 

// ── Update Listing ──
exports.updateListing = async (req, res) => {
  try {
    const { title, description, total_quantity, expiry_date } = req.body;
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE food_listings
       SET title = ?, description = ?, total_quantity = ?,
           remaining_quantity = ?, expiry_date = ?
       WHERE listing_id = ? AND provider_id = ? AND is_deleted = FALSE`,
      [title, description, total_quantity,
       total_quantity, expiry_date, id, req.user.userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Listing not found or unauthorized' });

    res.json({ message: 'Listing updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete Listing (Soft Delete) ──
exports.deleteListing = async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE food_listings SET is_deleted = TRUE
       WHERE listing_id = ? AND provider_id = ?`,
      [req.params.id, req.user.userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Listing not found or unauthorized' });

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'FOOD_LISTING', ?, 'DELETE', ?)`,
      [req.user.userId, req.params.id, `Listing deleted: ${req.params.id}`]
    );

    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};