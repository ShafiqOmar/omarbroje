const jwt  = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

// ── Haversine distance in meters ──
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

module.exports = (io) => {

  // ── Auth Middleware ──
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token provided'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.user.userId} | Role: ${socket.user.roleId}`);

    // ── Join notification room ──
    socket.on('join_notifications', () => {
      socket.join(`user_${socket.user.userId}`);
      console.log(`🔔 User ${socket.user.userId} joined notifications room`);
    });

    // ── Volunteer: Join delivery room ──
    socket.on('join_delivery', ({ deliveryId }) => {
      socket.join(`delivery_${deliveryId}`);
      console.log(`🚗 Volunteer ${socket.user.userId} joined delivery_${deliveryId}`);
    });

    // ── Charity/Admin: Watch delivery ──
    socket.on('watch_delivery', ({ deliveryId }) => {
      socket.join(`delivery_${deliveryId}`);
      console.log(`👁️ User ${socket.user.userId} watching delivery_${deliveryId}`);
    });

    // ── Volunteer: Send GPS ──
    socket.on('update_location', async ({ deliveryId, lat, lng }) => {
      try {
        // تحقق أن الـ volunteer يملك هذا الـ delivery
        const [rows] = await pool.query(
          `SELECT delivery_id FROM deliveries
           WHERE delivery_id = ? AND volunteer_id = ?
             AND status IN ('ASSIGNED','PICKED_UP')`,
          [deliveryId, socket.user.userId]
        );
        if (rows.length === 0) return;

        // حدّث GPS في DB
        await pool.query(
          `UPDATE deliveries SET current_lat=?, current_lng=? WHERE delivery_id=?`,
          [lat, lng, deliveryId]
        );

        // أرسل الموقع لكل المشاهدين
        io.to(`delivery_${deliveryId}`).emit('location_update', {
          deliveryId, lat, lng,
          timestamp: new Date().toISOString()
        });

        // ── تحقق من القرب ──
        const [info] = await pool.query(
          `SELECT
             d.notify_pickup_approaching,
             d.notify_delivery_approaching,
             r.charity_id,
             fl.provider_id,
             fl.title,
             ST_X(fl.pickup_location)  AS pickup_lat,
             ST_Y(fl.pickup_location)  AS pickup_lng,
             ST_X(r.charity_location)  AS charity_lat,
             ST_Y(r.charity_location)  AS charity_lng
           FROM deliveries d
           JOIN requests r      ON d.request_id  = r.request_id
           JOIN food_listings fl ON r.listing_id  = fl.listing_id
           WHERE d.delivery_id = ?`,
          [deliveryId]
        );
        if (!info.length) return;

        const {
          provider_id, charity_id, title,
          pickup_lat, pickup_lng,
          charity_lat, charity_lng,
          notify_pickup_approaching,
          notify_delivery_approaching
        } = info[0];

        // ── قرب من المزود (pickup) ──
        if (pickup_lat && pickup_lng && !notify_pickup_approaching) {
          const dist = haversine(lat, lng, pickup_lat, pickup_lng);
          if (dist < 300) {
            await pool.query(
              `UPDATE deliveries SET notify_pickup_approaching=1 WHERE delivery_id=?`,
              [deliveryId]
            );

            const msg = `🚚 Gönüllü sağlayıcıya yaklaşıyor: "${title}"`;

            // احصل على الـ Admins
            const [admins] = await pool.query(
              `SELECT user_id FROM users WHERE role_id=1 AND status='ACTIVE' AND is_deleted=FALSE`
            );

            // أرسل تنبيه لـ Provider + Charity + Admins
            const targets = [provider_id, charity_id, ...admins.map(a => a.user_id)];
            for (const userId of targets) {
              await pool.query(
                `INSERT INTO notifications (user_id, message, type) VALUES (?,?,'DELIVERY')`,
                [userId, msg]
              );
              io.sendNotification(userId, { message: msg, type: 'DELIVERY' });
            }

            // أرسل تنبيه للخريطة
            io.to(`delivery_${deliveryId}`).emit('proximity_alert', {
              type: 'pickup', message: msg, deliveryId
            });

            console.log(`📍 Proximity alert (pickup): delivery ${deliveryId}`);
          }
        }

        // ── قرب من الجمعية (delivery) ──
        if (charity_lat && charity_lng && !notify_delivery_approaching) {
          const dist = haversine(lat, lng, charity_lat, charity_lng);
          if (dist < 300) {
            await pool.query(
              `UPDATE deliveries SET notify_delivery_approaching=1 WHERE delivery_id=?`,
              [deliveryId]
            );

            const msg = `🏢 Gönüllü kuruluşa yaklaşıyor: "${title}"`;

            const [admins] = await pool.query(
              `SELECT user_id FROM users WHERE role_id=1 AND status='ACTIVE' AND is_deleted=FALSE`
            );

            const targets = [provider_id, charity_id, ...admins.map(a => a.user_id)];
            for (const userId of targets) {
              await pool.query(
                `INSERT INTO notifications (user_id, message, type) VALUES (?,?,'DELIVERY')`,
                [userId, msg]
              );
              io.sendNotification(userId, { message: msg, type: 'DELIVERY' });
            }

            io.to(`delivery_${deliveryId}`).emit('proximity_alert', {
              type: 'delivery', message: msg, deliveryId
            });

            console.log(`📍 Proximity alert (delivery): delivery ${deliveryId}`);
          }
        }

      } catch (err) {
        console.error('GPS update error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.userId}`);
    });
  });

  // ── Helper: Send real-time notification ──
  io.sendNotification = (userId, data) => {
    io.to(`user_${userId}`).emit('new_notification', data);
  };

  return io;
};