require('dotenv').config(); 

const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
 
process.env.TZ = 'UTC';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Make io accessible in controllers
app.set('io', io);

// ── Routes (نضيف واحدة واحدة) ──
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/food', require('./routes/food.routes'));
app.use('/api/requests', require('./routes/request.routes'));
app.use('/api/deliveries', require('./routes/delivery.routes'));
app.use('/api/ratings', require('./routes/rating.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));


// GPS Socket.io
require('./config/socket')(io);

// Error handler
app.use(require('./middleware/errorMiddleware'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ── Auto Expiry Alert (runs every hour) ──
const checkExpiryAlerts = async () => {
  try {
    const pool = require('./config/db');

    // Find listings expiring in next 2 hours
    const [listings] = await pool.query(
      `SELECT fl.listing_id, fl.title, fl.provider_id
       FROM food_listings fl
       WHERE fl.status IN ('AVAILABLE','PARTIAL')
         AND fl.is_deleted = FALSE
         AND fl.expiry_date BETWEEN NOW()
         AND DATE_ADD(NOW(), INTERVAL 2 HOUR)`
    );

    for (const listing of listings) {
      // Check not already notified
      const [existing] = await pool.query(
        `SELECT notification_id FROM notifications
         WHERE user_id = ? AND type = 'EXPIRY_ALERT'
           AND message LIKE ?
           AND created_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)`,
        [listing.provider_id, `%${listing.title}%`]
      );
      if (existing.length > 0) continue;

      // Send notification
      await pool.query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES (?, ?, 'EXPIRY_ALERT')`,
        [listing.provider_id,
         `⚠️ "${listing.title}" ilanınızın süresi 2 saat içinde dolacak!`]
      );

      // Real-time via Socket.io
      io.sendNotification(listing.provider_id, {
        message: `⚠️ "${listing.title}" ilanınızın süresi 2 saat içinde dolacak!`,
        type: 'EXPIRY_ALERT'
      });

      console.log(`⚠️ Expiry alert sent for listing: ${listing.title}`);
    }
  } catch (err) {
    console.error('Expiry check error:', err.message);
  }
};

// Run every hour
setInterval(checkExpiryAlerts, 60 * 60 * 1000);
// Run once on startup
checkExpiryAlerts();