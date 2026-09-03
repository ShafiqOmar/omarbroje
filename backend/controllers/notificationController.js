const pool = require('../config/db');

// ── Get My Notifications ──
exports.getMyNotifications = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         notification_id, message, type,
         is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get Unread Count ──
exports.getUnreadCount = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [req.user.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Mark One as Read ──
exports.markAsRead = async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notification_id = ? AND user_id = ?`,
      [req.params.id, req.user.userId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Notification not found' });

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Mark All as Read ──
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ? AND is_read = FALSE`,
      [req.user.userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete One Notification ──
exports.deleteNotification = async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM notifications
       WHERE notification_id = ? AND user_id = ?`,
      [req.params.id, req.user.userId]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Notification not found' });

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

 