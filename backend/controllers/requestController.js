const pool = require('../config/db');

// ── Create Request (Charity) ──
exports.createRequest = async (req, res) => {
  try {
    const { listing_id, requested_quantity, charity_lat, charity_lng } = req.body;
    const charity_id = req.user.userId;

    if (charity_lat === null || charity_lng === null) {
      return res.status(400).json({ message: 'Charity location required' });
    }

    const [listing] = await pool.query(
      `SELECT * FROM food_listings
       WHERE listing_id = ? AND is_deleted = FALSE
         AND status IN ('AVAILABLE','PARTIAL')
         AND expiry_date > DATE_SUB(NOW(), INTERVAL 3 HOUR)`,
      [listing_id]
    );

    if (listing.length === 0)
      return res.status(404).json({ message: 'Listing not available' });

    if (requested_quantity > listing[0].remaining_quantity)
      return res.status(400).json({
        message: `Only ${listing[0].remaining_quantity} units available`
      });

    const [duplicate] = await pool.query(
      `SELECT request_id FROM requests
       WHERE listing_id = ? AND charity_id = ? AND status = 'PENDING'`,
      [listing_id, charity_id]
    );

    if (duplicate.length > 0)
      return res.status(400).json({ message: 'You already have a pending request' });

    const [result] = await pool.query(
      `INSERT INTO requests (listing_id, charity_id, requested_quantity, charity_location)
       VALUES (?, ?, ?, POINT(?, ?))`,
       [listing_id, charity_id, requested_quantity, charity_lat, charity_lng]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'REQUEST')`,
      [listing[0].provider_id,
       `Yeni talep: ${listing[0].title} için ${requested_quantity} birim talep edildi`]
    );

    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'REQUEST', ?, 'CREATE', ?)`,
      [charity_id, result.insertId, `Request created for listing: ${listing_id}`]
    );

    res.status(201).json({
      message: 'Request submitted successfully',
      requestId: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Get Requests for Provider ──
exports.getProviderRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.request_id, r.requested_quantity, r.status, r.tracking_status, r.created_at,
         ST_X(r.charity_location) AS charity_lat,
         ST_Y(r.charity_location) AS charity_lng,
         fl.title AS listing_title, fl.listing_id,
         u.full_name AS charity_name, u.phone AS charity_phone
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u ON r.charity_id = u.user_id
       WHERE fl.provider_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Get My Requests (Charity) ──
exports.getMyRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.request_id, r.requested_quantity, r.status, r.tracking_status, r.created_at,
         fl.title AS listing_title, fl.expiry_date,
         ST_X(fl.pickup_location) AS pickup_lat,
         ST_Y(fl.pickup_location) AS pickup_lng,
         ST_X(r.charity_location) AS charity_lat,
         ST_Y(r.charity_location) AS charity_lng,
         u.full_name AS provider_name, u.phone AS provider_phone
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u ON fl.provider_id = u.user_id
       WHERE r.charity_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Approve Request (Provider) ──
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT r.*, fl.provider_id, fl.title,
              fl.remaining_quantity, fl.listing_id
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       WHERE r.request_id = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Request not found' });

    const request = rows[0];
    
    // تحقق الصلاحية
    if (request.provider_id !== req.user.userId)
      return res.status(403).json({ message: 'Unauthorized' });

    // تحقق الحالة
    if (request.status !== 'PENDING')
      return res.status(400).json({ message: 'Request already processed' });

    // ✅ 🛑 أهم إضافة: تحقق من الكمية قبل الخصم
    if (request.requested_quantity > request.remaining_quantity) {
      return res.status(400).json({
        message: `Not enough quantity. Available: ${request.remaining_quantity}`
      });
    }

   await pool.query(
  `UPDATE requests 
   SET status = 'APPROVED', tracking_status = 'WAITING' 
   WHERE request_id = ?`,
  [id]
);

    // Notify volunteers
    const [volunteers] = await pool.query(
      `SELECT user_id FROM users
       WHERE role_id = 4 AND status = 'ACTIVE' AND is_deleted = FALSE`
    );

    if (volunteers.length > 0) {
      const notifs = volunteers.map(v => [
        v.user_id,
        `Yeni teslimat görevi mevcut: ${request.title}`,
        'DELIVERY'
      ]);

      await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ?',
        [notifs]
      );
    }

    // Notify charity
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'APPROVED')`,
      [request.charity_id, `Talebiniz onaylandı: ${request.title}`]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'REQUEST', ?, 'APPROVE', ?)`,
      [req.user.userId, id, `Request approved: ${id}`]
    );

    res.json({ message: 'Request approved successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Reject Request (Provider) ──
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT r.*, fl.provider_id, fl.title
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       WHERE r.request_id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });

    const request = rows[0];
    if (request.provider_id !== req.user.userId)
      return res.status(403).json({ message: 'Unauthorized' });

    await pool.query(
      `UPDATE requests SET status = 'REJECTED' WHERE request_id = ?`,
      [id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'REQUEST')`,
      [request.charity_id, `Talebiniz reddedildi: ${request.title}`]
    );

    res.json({ message: 'Request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Cancel Request (Charity) ──
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE requests SET status = 'CANCELLED'
       WHERE request_id = ? AND charity_id = ? AND status = 'PENDING'`,
      [id, req.user.userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Request not found or cannot be cancelled' });

    res.json({ message: 'Request cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Update Approaching Notifications (Volunteer) ──
exports.updateApproaching = async (req, res) => {
  try {
    const { id } = req.params; // delivery_id
    const { type } = req.body; // "pickup" | "delivery"

    if (!['pickup','delivery'].includes(type))
      return res.status(400).json({ message: 'Invalid type' });

    const column = type === 'pickup' ? 'notify_pickup_approaching' : 'notify_delivery_approaching';

    // Update notification flag
    await pool.query(
      `UPDATE deliveries SET ${column} = 1 WHERE delivery_id = ?`,
      [id]
    );

    // Get delivery info to send notification
    const [delivery] = await pool.query(
      `SELECT d.delivery_id, r.listing_id, r.charity_id, fl.title, fl.provider_id
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       WHERE d.delivery_id = ?`,
      [id]
    );
    if (delivery.length === 0) return res.status(404).json({ message: 'Delivery not found' });

    const targetUserId = type === 'pickup' ? delivery[0].provider_id : delivery[0].charity_id;
    const message = type === 'pickup'
      ? `المتطوع يقترب لاستلام: ${delivery[0].title}`
      : `المتطوع يقترب للتسليم: ${delivery[0].title}`;

    // Send notification
    await pool.query(
      `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
      [targetUserId, message]
    );

    res.json({ message: 'Approaching notification sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


exports.getCharityReport = async (req, res) => {
  try {
    const charityId = req.user.userId;

    // إجمالي الطعام المستلم
    const [[overview]] = await pool.query(
      `SELECT
         COUNT(DISTINCT r.request_id)           AS total_requests,
         SUM(CASE WHEN r.status='APPROVED' THEN r.requested_quantity ELSE 0 END) AS total_received,
         COUNT(CASE WHEN r.status='APPROVED'  THEN 1 END) AS approved,
         COUNT(CASE WHEN r.status='PENDING'   THEN 1 END) AS pending,
         COUNT(CASE WHEN r.status='REJECTED'  THEN 1 END) AS rejected
       FROM requests r
       WHERE r.charity_id = ?`,
      [charityId]
    );

    // التوصيلات المكتملة
    const [[deliveries]] = await pool.query(
      `SELECT
         COUNT(d.delivery_id) AS total_deliveries,
         COALESCE(SUM(r.requested_quantity), 0) AS delivered_units
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       WHERE r.charity_id = ? AND d.status = 'DELIVERED'`,
      [charityId]
    );

    // أفضل المتطوعين الذين خدموا هذه الجمعية
    const [topVolunteers] = await pool.query(
      `SELECT
         u.full_name, u.average_rating,
         COUNT(d.delivery_id)                   AS total_deliveries,
         COALESCE(SUM(r.requested_quantity), 0) AS units_delivered
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       JOIN users u    ON d.volunteer_id = u.user_id
       WHERE r.charity_id = ? AND d.status = 'DELIVERED'
       GROUP BY d.volunteer_id
       ORDER BY total_deliveries DESC
       LIMIT 5`,
      [charityId]
    );

    // آخر 5 توصيلات
    const [recentDeliveries] = await pool.query(
      `SELECT
         fl.title, r.requested_quantity,
         d.status, d.delivery_time,
         u.full_name AS volunteer_name
       FROM deliveries d
       JOIN requests r      ON d.request_id   = r.request_id
       JOIN food_listings fl ON r.listing_id   = fl.listing_id
       JOIN users u          ON d.volunteer_id = u.user_id
       WHERE r.charity_id = ?
       ORDER BY d.delivery_time DESC
       LIMIT 5`,
      [charityId]
    );

    res.json({ overview, deliveries, topVolunteers, recentDeliveries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

























/* const pool = require('../config/db');
 
// ── Create Request (Charity) ──
exports.createRequest = async (req, res) => {
  try {
    const { listing_id, requested_quantity } = req.body;
    const charity_id = req.user.userId;

    // Check listing exists and available
    const [listing] = await pool.query(
      `SELECT * FROM food_listings
       WHERE listing_id = ? AND is_deleted = FALSE
         AND status IN ('AVAILABLE','PARTIAL')
         AND (expiry_date > NOW() OR expiry_date > DATE_SUB(NOW(), INTERVAL 3 HOUR) )`,
      [listing_id]
    );
    if (listing.length === 0)
      return res.status(404).json({ message: 'Listing not available' });

    // Check requested quantity
    if (requested_quantity > listing[0].remaining_quantity)
      return res.status(400).json({
        message: `Only ${listing[0].remaining_quantity} units available`
      });

    // Check no duplicate pending request
    const [duplicate] = await pool.query(
      `SELECT request_id FROM requests
       WHERE listing_id = ? AND charity_id = ? AND status = 'PENDING'`,
      [listing_id, charity_id]
    );
    if (duplicate.length > 0)
      return res.status(400).json({ message: 'You already have a pending request' });

    // Insert request
    const [result] = await pool.query(
      `INSERT INTO requests (listing_id, charity_id, requested_quantity)
       VALUES (?, ?, ?)`,
      [listing_id, charity_id, requested_quantity]
    );

    // Notify provider
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'REQUEST')`,
      [listing[0].provider_id,
       `Yeni talep: ${listing[0].title} için ${requested_quantity} birim talep edildi`]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'REQUEST', ?, 'CREATE', ?)`,
      [charity_id, result.insertId, `Request created for listing: ${listing_id}`]
    );

    res.status(201).json({
      message: 'Request submitted successfully',
      requestId: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Get Requests for Provider ──
exports.getProviderRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.request_id, r.requested_quantity, r.status, r.created_at,
         fl.title AS listing_title, fl.listing_id,
         u.full_name AS charity_name, u.phone AS charity_phone
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u ON r.charity_id = u.user_id
       WHERE fl.provider_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Get My Requests (Charity) ──
exports.getMyRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.request_id, r.requested_quantity, r.status, r.created_at,
         fl.title AS listing_title, fl.expiry_date,
         ST_X(fl.pickup_location) AS lat,
         ST_Y(fl.pickup_location) AS lng,
         u.full_name AS provider_name, u.phone AS provider_phone
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u ON fl.provider_id = u.user_id
       WHERE r.charity_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Approve Request (Provider) ──
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Get request + listing info
    const [rows] = await pool.query(
      `SELECT r.*, fl.provider_id, fl.title,
              fl.remaining_quantity, fl.listing_id
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       WHERE r.request_id = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Request not found' });

    const request = rows[0];

    // Check ownership
    if (request.provider_id !== req.user.userId)
      return res.status(403).json({ message: 'Unauthorized' });

    if (request.status !== 'PENDING')
      return res.status(400).json({ message: 'Request already processed' });

    // Update request status
    await pool.query(
      `UPDATE requests SET status = 'APPROVED' WHERE request_id = ?`, [id]
    );

    // Update remaining quantity
    const newQty = request.remaining_quantity - request.requested_quantity;
    const newStatus = newQty === 0 ? 'COMPLETED' : 'PARTIAL';
    await pool.query(
      `UPDATE food_listings
       SET remaining_quantity = ?, status = ?
       WHERE listing_id = ?`,
      [newQty, newStatus, request.listing_id]
    );

    // Notify all active volunteers
    const [volunteers] = await pool.query(
      `SELECT user_id FROM users
       WHERE role_id = 4 AND status = 'ACTIVE' AND is_deleted = FALSE`
    );
    if (volunteers.length > 0) {
      const notifs = volunteers.map(v => [
        v.user_id,
        `Yeni teslimat görevi mevcut: ${request.title}`,
        'DELIVERY'
      ]);
      await pool.query(
        'INSERT INTO notifications (user_id, message, type) VALUES ?',
        [notifs]
      );
    }

    // Notify charity
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'APPROVED')`,
      [request.charity_id, `Talebiniz onaylandı: ${request.title}`]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'REQUEST', ?, 'APPROVE', ?)`,
      [req.user.userId, id, `Request approved: ${id}`]
    );

    res.json({ message: 'Request approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Reject Request (Provider) ──
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT r.*, fl.provider_id, fl.title
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       WHERE r.request_id = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Request not found' });

    const request = rows[0];

    if (request.provider_id !== req.user.userId)
      return res.status(403).json({ message: 'Unauthorized' });

    await pool.query(
      `UPDATE requests SET status = 'REJECTED' WHERE request_id = ?`, [id]
    );

    // Notify charity
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'REQUEST')`,
      [request.charity_id, `Talebiniz reddedildi: ${request.title}`]
    );

    res.json({ message: 'Request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Cancel Request (Charity) ──
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE requests SET status = 'CANCELLED'
       WHERE request_id = ? AND charity_id = ? AND status = 'PENDING'`,
      [id, req.user.userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Request not found or cannot be cancelled' });

    res.json({ message: 'Request cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getCharityReport = async (req, res) => {
  try {
    const charityId = req.user.userId;

    // إجمالي الطعام المستلم
    const [[overview]] = await pool.query(
      `SELECT
         COUNT(DISTINCT r.request_id)           AS total_requests,
         SUM(CASE WHEN r.status='APPROVED' THEN r.requested_quantity ELSE 0 END) AS total_received,
         COUNT(CASE WHEN r.status='APPROVED'  THEN 1 END) AS approved,
         COUNT(CASE WHEN r.status='PENDING'   THEN 1 END) AS pending,
         COUNT(CASE WHEN r.status='REJECTED'  THEN 1 END) AS rejected
       FROM requests r
       WHERE r.charity_id = ?`,
      [charityId]
    );

    // التوصيلات المكتملة
    const [[deliveries]] = await pool.query(
      `SELECT
         COUNT(d.delivery_id) AS total_deliveries,
         COALESCE(SUM(r.requested_quantity), 0) AS delivered_units
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       WHERE r.charity_id = ? AND d.status = 'DELIVERED'`,
      [charityId]
    );

    // أفضل المتطوعين الذين خدموا هذه الجمعية
    const [topVolunteers] = await pool.query(
      `SELECT
         u.full_name, u.average_rating,
         COUNT(d.delivery_id)                   AS total_deliveries,
         COALESCE(SUM(r.requested_quantity), 0) AS units_delivered
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       JOIN users u    ON d.volunteer_id = u.user_id
       WHERE r.charity_id = ? AND d.status = 'DELIVERED'
       GROUP BY d.volunteer_id
       ORDER BY total_deliveries DESC
       LIMIT 5`,
      [charityId]
    );

    // آخر 5 توصيلات
    const [recentDeliveries] = await pool.query(
      `SELECT
         fl.title, r.requested_quantity,
         d.status, d.delivery_time,
         u.full_name AS volunteer_name
       FROM deliveries d
       JOIN requests r      ON d.request_id   = r.request_id
       JOIN food_listings fl ON r.listing_id   = fl.listing_id
       JOIN users u          ON d.volunteer_id = u.user_id
       WHERE r.charity_id = ?
       ORDER BY d.delivery_time DESC
       LIMIT 5`,
      [charityId]
    );

    res.json({ overview, deliveries, topVolunteers, recentDeliveries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}; */