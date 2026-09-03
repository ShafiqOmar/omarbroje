const pool = require('../config/db');

// ── Get All Users ──
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.user_id, u.full_name, u.email, u.phone,
         u.status, u.average_rating, u.rating_count,
         u.created_at, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.is_deleted = FALSE
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Pending Users ──
exports.getPendingUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.user_id, u.full_name, u.email,
         u.phone, u.created_at, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.status = 'PENDING' AND u.is_deleted = FALSE
       ORDER BY u.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Approve User ──
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `UPDATE users SET status = 'ACTIVE'
       WHERE user_id = ? AND status = 'PENDING'`,
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'User not found or already active' });

    // Notify user
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'APPROVED')`,
      [id, 'Hesabınız onaylandı. Sisteme giriş yapabilirsiniz ✅']
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'USER', ?, 'APPROVE', ?)`,
      [req.user.userId, id, `User approved: ${id}`]
    );

    res.json({ message: 'User approved successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Suspend User ──
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot suspend admin
    const [user] = await pool.query(
      'SELECT role_id FROM users WHERE user_id = ?', [id]
    );
    if (user.length === 0)
      return res.status(404).json({ message: 'User not found' });
    if (user[0].role_id === 1)
      return res.status(403).json({ message: 'Cannot suspend admin' });

    await pool.query(
      `UPDATE users SET status = 'SUSPENDED' WHERE user_id = ?`, [id]
    );

    // Notify user
    await pool.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES (?, ?, 'REQUEST')`,
      [id, 'Hesabınız askıya alındı. Detaylar için iletişime geçin.']
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'USER', ?, 'SUSPEND', ?)`,
      [req.user.userId, id, `User suspended: ${id}`]
    );

    res.json({ message: 'User suspended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete User (Soft Delete) ──
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await pool.query(
      'SELECT role_id FROM users WHERE user_id = ?', [id]
    );
    if (user.length === 0)
      return res.status(404).json({ message: 'User not found' });
    if (user[0].role_id === 1)
      return res.status(403).json({ message: 'Cannot delete admin' });

    await pool.query(
      `UPDATE users SET is_deleted = TRUE WHERE user_id = ?`, [id]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'USER', ?, 'DELETE', ?)`,
      [req.user.userId, id, `User deleted: ${id}`]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Statistics ──
exports.getStatistics = async (req, res) => {
  try {
    const [[users]]      = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'ACTIVE')    AS active,
         SUM(status = 'PENDING')   AS pending,
         SUM(status = 'SUSPENDED') AS suspended
       FROM users WHERE is_deleted = FALSE`
    );
    const [[listings]]   = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'AVAILABLE') AS available,
         SUM(status = 'PARTIAL')   AS partial,
         SUM(status = 'COMPLETED') AS completed,
         SUM(status = 'EXPIRED')   AS expired,
         SUM(total_quantity)       AS total_quantity,
         SUM(total_quantity - remaining_quantity) AS donated_quantity
       FROM food_listings WHERE is_deleted = FALSE`
    );
    const [[requests]]   = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'PENDING')   AS pending,
         SUM(status = 'APPROVED')  AS approved,
         SUM(status = 'REJECTED')  AS rejected,
         SUM(status = 'CANCELLED') AS cancelled
       FROM requests`
    );
    const [[deliveries]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'ASSIGNED')  AS assigned,
         SUM(status = 'PICKED_UP') AS picked_up,
         SUM(status = 'DELIVERED') AS delivered,
         SUM(status = 'FAILED')    AS failed
       FROM deliveries`
    );
    const [[ratings]]    = await pool.query(
      `SELECT
         COUNT(*) AS total,
         ROUND(AVG(rating), 2) AS average_rating
       FROM ratings`
    );

    res.json({ users, listings, requests, deliveries, ratings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get All Logs ──
exports.getLogs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         l.log_id, l.entity_type, l.entity_id,
         l.action, l.description, l.created_at,
         u.full_name AS actor_name
       FROM logs l
       LEFT JOIN users u ON l.actor_id = u.user_id
       ORDER BY l.created_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Pending Requests (not handled > 1 hour) ──
exports.getPendingAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.request_id, r.created_at, r.requested_quantity,
         fl.title, fl.expiry_date,
         u.full_name AS charity_name
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u          ON r.charity_id  = u.user_id
       WHERE r.status = 'PENDING'
         AND r.created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
       ORDER BY r.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ── Get Impact Report ──
exports.getImpactReport = async (req, res) => {
  try {
    const [[foodSaved]] = await pool.query(
      `SELECT 
         COALESCE(SUM(r.requested_quantity), 0) AS total_units_saved,
         COUNT(DISTINCT d.delivery_id)           AS total_deliveries,
         COUNT(DISTINCT r.charity_id)            AS total_beneficiary_orgs
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       WHERE d.status = 'DELIVERED'`
    );

    const [[monthly]] = await pool.query(
      `SELECT
         COALESCE(SUM(r.requested_quantity), 0) AS monthly_units,
         COUNT(d.delivery_id)                    AS monthly_deliveries
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       WHERE d.status = 'DELIVERED'
         AND d.delivery_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    const [weekly] = await pool.query(
      `SELECT 
         YEAR(d.delivery_time)                    AS year,
         WEEK(d.delivery_time)                    AS week,
         COUNT(d.delivery_id)                     AS deliveries,
         COALESCE(SUM(r.requested_quantity), 0)   AS units_saved
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       WHERE d.status = 'DELIVERED'
         AND d.delivery_time >= DATE_SUB(NOW(), INTERVAL 7 WEEK)
       GROUP BY YEAR(d.delivery_time), WEEK(d.delivery_time)
       ORDER BY year ASC, week ASC`
    );

    const [topVolunteers] = await pool.query(
      `SELECT
         u.full_name, u.average_rating, u.rating_count,
         COUNT(d.delivery_id)                   AS total_deliveries,
         COALESCE(SUM(r.requested_quantity), 0) AS units_delivered
       FROM deliveries d
       JOIN users u    ON d.volunteer_id = u.user_id
       JOIN requests r ON d.request_id   = r.request_id
       WHERE d.status = 'DELIVERED'
       GROUP BY u.user_id
       ORDER BY total_deliveries DESC
       LIMIT 5`
    );

    const [topCharities] = await pool.query(
      `SELECT
         u.full_name AS charity_name,
         COUNT(r.request_id)                    AS total_requests,
         COALESCE(SUM(r.requested_quantity), 0) AS total_units_received
       FROM requests r
       JOIN users u ON r.charity_id = u.user_id
       WHERE r.status = 'APPROVED'
       GROUP BY r.charity_id
       ORDER BY total_units_received DESC
       LIMIT 5`
    );

    const [topProviders] = await pool.query(
      `SELECT
         u.full_name AS provider_name,
         COUNT(fl.listing_id)                                          AS total_listings,
         COALESCE(SUM(fl.total_quantity - fl.remaining_quantity), 0)  AS units_donated
       FROM food_listings fl
       JOIN users u ON fl.provider_id = u.user_id
       WHERE fl.is_deleted = FALSE
       GROUP BY fl.provider_id
       ORDER BY units_donated DESC
       LIMIT 5`
    );

    const [[ratio]] = await pool.query(
      `SELECT
         COALESCE(SUM(total_quantity), 0)                             AS total_available,
         COALESCE(SUM(total_quantity - remaining_quantity), 0)        AS total_distributed
       FROM food_listings
       WHERE is_deleted = FALSE`
    );

    const rescueRate = ratio.total_available > 0
      ? Math.round((ratio.total_distributed / ratio.total_available) * 100)
      : 0;

    res.json({
      overview: {
        total_units_saved:      foodSaved.total_units_saved,
        total_deliveries:       foodSaved.total_deliveries,
        total_beneficiary_orgs: foodSaved.total_beneficiary_orgs,
        monthly_units:          monthly.monthly_units,
        monthly_deliveries:     monthly.monthly_deliveries,
        rescue_rate:            rescueRate,
        total_distributed:      ratio.total_distributed,
        total_available:        ratio.total_available,
      },
      weekly,
      topVolunteers,
      topCharities,
      topProviders,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Active Deliveries for Admin ──
exports.getActiveDeliveries = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.delivery_id, d.status, d.pickup_time,
         d.current_lat, d.current_lng,
         r.request_id, r.requested_quantity,
         r.tracking_status,
         ST_X(fl.pickup_location) AS pickup_lat,
         ST_Y(fl.pickup_location) AS pickup_lng,
         ST_X(r.charity_location) AS charity_lat,
         ST_Y(r.charity_location) AS charity_lng,
         fl.title AS listing_title,
         u_vol.full_name  AS volunteer_name,
         u_vol.phone      AS volunteer_phone,
         u_prov.full_name AS provider_name,
         u_char.full_name AS charity_name
       FROM deliveries d
       JOIN requests r       ON d.request_id   = r.request_id
       JOIN food_listings fl  ON r.listing_id   = fl.listing_id
       JOIN users u_vol       ON d.volunteer_id  = u_vol.user_id
       JOIN users u_prov      ON fl.provider_id  = u_prov.user_id
       JOIN users u_char      ON r.charity_id    = u_char.user_id
       WHERE d.status IN ('ASSIGNED', 'PICKED_UP')
       ORDER BY d.delivery_id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};