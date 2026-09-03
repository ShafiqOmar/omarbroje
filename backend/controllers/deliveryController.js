const pool = require('../config/db');

// Helper لحساب المسافة بالمتر بين نقطتين
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000; // نصف قطر الأرض بالمتر
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ── Get Available Deliveries (Volunteer) ──
exports.getAvailableDeliveries = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.request_id, r.requested_quantity,
         fl.title, fl.description, fl.expiry_date,
         ST_X(fl.pickup_location) AS pickup_lat,
         ST_Y(fl.pickup_location) AS pickup_lng,
         ST_X(r.charity_location) AS charity_lat,
         ST_Y(r.charity_location) AS charity_lng,
         u_provider.full_name AS provider_name,
         u_provider.phone     AS provider_phone,
         u_charity.full_name  AS charity_name,
         u_charity.phone      AS charity_phone
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u_provider  ON fl.provider_id = u_provider.user_id
       JOIN users u_charity   ON r.charity_id   = u_charity.user_id
       LEFT JOIN deliveries d ON r.request_id   = d.request_id
       WHERE r.status = 'APPROVED'
         AND d.delivery_id IS NULL
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Delivery error:', err); 
    res.status(500).json({ message: err.message });
  }
};

// ── Accept Delivery (Volunteer) ──
exports.acceptDelivery = async (req, res) => {
  try {
    const { request_id } = req.body;
    const volunteer_id   = req.user.userId;

    const [existing] = await pool.query(
      `SELECT delivery_id FROM deliveries WHERE request_id = ?`, [request_id]
    );
    if (existing.length > 0)
      return res.status(400).json({ message: 'Delivery already assigned' });

    const [result] = await pool.query(
      `INSERT INTO deliveries (request_id, volunteer_id, status)
       VALUES (?, ?, 'ASSIGNED')`,
      [request_id, volunteer_id]
    );

    const [info] = await pool.query(
      `SELECT r.charity_id, r.charity_location, fl.provider_id, fl.title,
              u_vol.full_name AS volunteer_name
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u_vol ON u_vol.user_id = ?
       WHERE r.request_id = ?`,
      [volunteer_id, request_id]
    );

    const { charity_id, provider_id, title, volunteer_name } = info[0];

    // إشعار للمزود والجمعية
    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES
       (?, ?, 'DELIVERY'), (?, ?, 'DELIVERY')`,
      [
        provider_id, `${volunteer_name} teslimatı kabul etti: ${title}`,
        charity_id,  `${volunteer_name} teslimatı kabul etti: ${title}`
      ]
    );

    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'DELIVERY', ?, 'ACCEPT', ?)`,
      [volunteer_id, result.insertId, `Delivery accepted: ${result.insertId}`]
    );

    res.status(201).json({ message: 'Delivery accepted successfully', deliveryId: result.insertId });
  } catch (err) {
    console.error('Delivery error:', err); 
    res.status(500).json({ message: err.message });
  }
};

// ── Update Delivery Location (Volunteer) ──
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    // تحديث الموقع
    const [result] = await pool.query(
      `UPDATE deliveries SET volunteer_current_location = POINT(?, ?) WHERE delivery_id = ?`,
      [lat, lng, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Delivery not found' });

    // الحصول على معلومات التسليم للاستلام والتسليم
    const [deliveryInfo] = await pool.query(
      `SELECT d.request_id, d.notify_pickup_approaching, d.notify_delivery_approaching,
              r.charity_id, r.charity_location,
              fl.pickup_location, fl.provider_id, fl.title
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       WHERE d.delivery_id = ?`,
      [id]
    );
    const delivery = deliveryInfo[0];

    // حساب المسافة لإرسال إشعار الاقتراب
    const pickupDist = haversineDistance(lat, lng, ST_X(delivery.pickup_location), ST_Y(delivery.pickup_location));
    const deliveryDist = haversineDistance(lat, lng, ST_X(delivery.charity_location), ST_Y(delivery.charity_location));

    const io = req.app.get('io');

    // إشعار اقتراب من الاستلام
    if (pickupDist < 500 && delivery.notify_pickup_approaching === 0) {
      await pool.query(`UPDATE deliveries SET notify_pickup_approaching = 1 WHERE delivery_id = ?`, [id]);
      const message = `Gönüllü yaklaşıyor: ${delivery.title} teslim alınacak`;
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'DELIVERY')`,
        [delivery.provider_id, message]
      );
      if (io) io.sendNotification(delivery.provider_id, { message, type: 'DELIVERY' });
    }

    // إشعار اقتراب من التسليم
    if (deliveryDist < 500 && delivery.notify_delivery_approaching === 0) {
      await pool.query(`UPDATE deliveries SET notify_delivery_approaching = 1 WHERE delivery_id = ?`, [id]);
      const message = `Gönüllü yaklaşıyor: ${delivery.title} teslim edilecek`;
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'DELIVERY')`,
        [delivery.charity_id, message]
      );
      if (io) io.sendNotification(delivery.charity_id, { message, type: 'DELIVERY' });
    }

    if (io) io.emit(`delivery-${id}`, { lat, lng });

    res.json({ message: 'Location updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Update Delivery Status (Volunteer) ──
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['PICKED_UP','DELIVERED','FAILED'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const [rows] = await pool.query(
      `SELECT d.*, r.request_id, r.charity_id, fl.title, fl.provider_id
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       WHERE d.delivery_id = ? AND d.volunteer_id = ?`,
      [id, req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Delivery not found or unauthorized' });

    const delivery = rows[0];

    // تحديث الحالة والوقت
    let query = `UPDATE deliveries SET status = ?`;
    const params = [status];
    if (status === 'PICKED_UP') query += `, pickup_time = NOW()`;
    if (status === 'DELIVERED') query += `, delivery_time = NOW()`;
    query += ` WHERE delivery_id = ?`;
    params.push(id);
    await pool.query(query, params);

    // تحديث tracking_status في requests
    let trackingStatus = null;
    if (status === 'PICKED_UP') trackingStatus = 'ON_THE_WAY';
    if (status === 'DELIVERED') trackingStatus = 'DELIVERED';
    if (trackingStatus) {
      await pool.query(`UPDATE requests SET tracking_status = ? WHERE request_id = ?`, [trackingStatus, delivery.request_id]);
    }

    // الرسالة
    let message = '';
    if (status === 'PICKED_UP') message = `Gönüllü gıdayı teslim aldı, yola çıktı: ${delivery.title}`;
    if (status === 'DELIVERED') message = `Teslimat tamamlandı: ${delivery.title} ✅`;
    if (status === 'FAILED') message = `Teslimat başarısız oldu: ${delivery.title}`;

    const io = req.app.get('io');
    if (io) {
      io.sendNotification(delivery.provider_id, { message, type: 'DELIVERY' });
      io.sendNotification(delivery.charity_id, { message, type: 'DELIVERY' });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES
       (?, ?, 'DELIVERY'), (?, ?, 'DELIVERY')`,
      [delivery.provider_id, message, delivery.charity_id, message]
    );

    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'DELIVERY', ?, ?, ?)`,
      [req.user.userId, id, `STATUS_${status}`, message]
    );

    res.json({ message: `Delivery status updated to ${status}` });

    if (status === 'DELIVERED') {
  // أرسل إشعار للـ Admin
  const [admins] = await pool.query(
    `SELECT user_id FROM users 
     WHERE role_id = 1 AND status = 'ACTIVE' AND is_deleted = FALSE`
  );
  if (admins.length > 0) {
    const adminNotifs = admins.map(a => [
      a.user_id,
      `✅ Teslimat tamamlandı: ${delivery.title} — Gönüllü: ${req.user.userId}`,
      'DELIVERY'
    ]);
    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES ?',
      [adminNotifs]
    );
    // Real-time notification
    if (io) {
      admins.forEach(a => {
        io.sendNotification(a.user_id, {
          message: `✅ Teslimat tamamlandı: ${delivery.title}`,
          type: 'DELIVERY'
        });
      });
    }
  }
}

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ── Get My Deliveries (Volunteer) ──
exports.getMyDeliveries = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.delivery_id, d.status, d.pickup_time, d.delivery_time,
         ST_X(d.volunteer_current_location) AS current_lat,
         ST_Y(d.volunteer_current_location) AS current_lng,
         fl.title, fl.description,
         ST_X(fl.pickup_location) AS pickup_lat,
         ST_Y(fl.pickup_location) AS pickup_lng,
         ST_X(r.charity_location) AS charity_lat,
         ST_Y(r.charity_location) AS charity_lng,
         r.requested_quantity,
         u_provider.full_name AS provider_name,
         u_provider.phone     AS provider_phone,
         u_charity.full_name  AS charity_name,
         u_charity.phone      AS charity_phone
       FROM deliveries d
       JOIN requests r ON d.request_id = r.request_id
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u_provider ON fl.provider_id = u_provider.user_id
       JOIN users u_charity  ON r.charity_id   = u_charity.user_id
       WHERE d.volunteer_id = ?
       ORDER BY d.delivery_id DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Delivery error:', err); 
    res.status(500).json({ message: err.message });
  }
};

exports.getDelivery = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.delivery_id, d.status, d.pickup_time,
         d.delivery_time, d.current_lat, d.current_lng,
         fl.title, fl.description,
         ST_X(fl.pickup_location) AS pickup_lat,
         ST_Y(fl.pickup_location) AS pickup_lng,
         u_vol.full_name  AS volunteer_name,
         u_vol.phone      AS volunteer_phone
       FROM deliveries d
       JOIN requests r       ON d.request_id   = r.request_id
       JOIN food_listings fl  ON r.listing_id   = fl.listing_id
       JOIN users u_vol       ON d.volunteer_id = u_vol.user_id
       WHERE d.delivery_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Delivery not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getDeliveryByRequest = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.delivery_id, d.status,
              u.full_name AS volunteer_name,
              u.phone     AS volunteer_phone
       FROM deliveries d
       JOIN users u ON d.volunteer_id = u.user_id
       WHERE d.request_id = ?`,
      [req.params.requestId]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No delivery' });
    res.json(rows[0]);
  } catch (err) {
     console.error('Delivery  error:', err); 
    res.status(500).json({ message: err.message });
  }
};































/* const pool = require('../config/db');

// ── Get Available Deliveries (Volunteer) ──
exports.getAvailableDeliveries = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         r.request_id, r.requested_quantity,
         fl.title, fl.description, fl.expiry_date,
         ST_X(fl.pickup_location) AS pickup_lat,
         ST_Y(fl.pickup_location) AS pickup_lng,
         u_provider.full_name AS provider_name,
         u_provider.phone     AS provider_phone,
         u_charity.full_name  AS charity_name,
         u_charity.phone      AS charity_phone
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u_provider  ON fl.provider_id = u_provider.user_id
       JOIN users u_charity   ON r.charity_id   = u_charity.user_id
       LEFT JOIN deliveries d ON r.request_id   = d.request_id
       WHERE r.status = 'APPROVED'
         AND d.delivery_id IS NULL
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Delivery  error:', err); 
    res.status(500).json({ message: err.message });
  }
};

// ── Accept Delivery (Volunteer) ──
exports.acceptDelivery = async (req, res) => {
  try {
    const { request_id } = req.body;
    const volunteer_id   = req.user.userId;

    // Check request approved and not already taken
    const [existing] = await pool.query(
      `SELECT d.delivery_id FROM deliveries d
       WHERE d.request_id = ?`,
      [request_id]
    );
    if (existing.length > 0)
      return res.status(400).json({ message: 'Delivery already assigned' });

    // Create delivery
    const [result] = await pool.query(
      `INSERT INTO deliveries (request_id, volunteer_id, status)
       VALUES (?, ?, 'ASSIGNED')`,
      [request_id, volunteer_id]
    );

    // Get request info for notifications
    const [info] = await pool.query(
      `SELECT
         r.charity_id, fl.provider_id, fl.title,
         u_vol.full_name AS volunteer_name
       FROM requests r
       JOIN food_listings fl ON r.listing_id = fl.listing_id
       JOIN users u_vol ON u_vol.user_id = ?
       WHERE r.request_id = ?`,
      [volunteer_id, request_id]
    );
    const { charity_id, provider_id, title, volunteer_name } = info[0];

    // Notify provider and charity
    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES
       (?, ?, 'DELIVERY'),
       (?, ?, 'DELIVERY')`,
      [
        provider_id, `${volunteer_name} teslimatı kabul etti: ${title}`,
        charity_id,  `${volunteer_name} teslimatı kabul etti: ${title}`
      ]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'DELIVERY', ?, 'ACCEPT', ?)`,
      [volunteer_id, result.insertId, `Delivery accepted: ${result.insertId}`]
    );

    res.status(201).json({
      message: 'Delivery accepted successfully',
      deliveryId: result.insertId
    });
  } catch (err) {
     console.error('Delivery  error:', err); 
    res.status(500).json({ message: err.message });
  }
};

// ── Get My Deliveries (Volunteer) ──
exports.getMyDeliveries = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.delivery_id, d.status, d.pickup_time, d.delivery_time,
         d.current_lat, d.current_lng,
         fl.title, fl.description,
         ST_X(fl.pickup_location) AS pickup_lat,
         ST_Y(fl.pickup_location) AS pickup_lng,
         r.requested_quantity,
         u_provider.full_name AS provider_name,
         u_provider.phone     AS provider_phone,
         u_charity.full_name  AS charity_name,
         u_charity.phone      AS charity_phone
       FROM deliveries d
       JOIN requests r      ON d.request_id   = r.request_id
       JOIN food_listings fl ON r.listing_id   = fl.listing_id
       JOIN users u_provider ON fl.provider_id = u_provider.user_id
       JOIN users u_charity  ON r.charity_id   = u_charity.user_id
       WHERE d.volunteer_id = ?
       ORDER BY d.delivery_id DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
     console.error('Delivery  error:', err); 
    res.status(500).json({ message: err.message });
  }
};



// ── Update Delivery Status (Volunteer) ──
exports.updateStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const allowed = ['PICKED_UP', 'DELIVERED', 'FAILED'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    // Get delivery info
    const [rows] = await pool.query(
      `SELECT d.*, fl.title, fl.provider_id, r.charity_id
       FROM deliveries d
       JOIN requests r       ON d.request_id  = r.request_id
       JOIN food_listings fl ON r.listing_id  = fl.listing_id
       WHERE d.delivery_id = ? AND d.volunteer_id = ?`,
      [id, req.user.userId]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Delivery not found or unauthorized' });

    const delivery = rows[0];

    // Build update query
    let updateQuery = `UPDATE deliveries SET status = ?`;
    const params    = [status];

    if (status === 'PICKED_UP') updateQuery += `, pickup_time = NOW()`;
    if (status === 'DELIVERED') updateQuery += `, delivery_time = NOW()`;
    updateQuery += ` WHERE delivery_id = ?`;
    params.push(id);

    await pool.query(updateQuery, params);

    // --- تعريف الرسالة قبل إرسال الإشعارات ---
    let message = '';
    if (status === 'PICKED_UP') {
      message = `Gönüllü gıdayı teslim aldı, yola çıktı: ${delivery.title}`;
    } else if (status === 'DELIVERED') {
      message = `Teslimat tamamlandı: ${delivery.title} ✅`;
    } else if (status === 'FAILED') {
      message = `Teslimat başarısız oldu: ${delivery.title}`;
    }

    const io = req.app.get('io');
    if (io) {
      io.sendNotification(delivery.provider_id, { message, type: 'DELIVERY' });
      io.sendNotification(delivery.charity_id, { message, type: 'DELIVERY' });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES
       (?, ?, 'DELIVERY'), (?, ?, 'DELIVERY')`,
      [delivery.provider_id, message, delivery.charity_id, message]
    );

    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'DELIVERY', ?, ?, ?)`,
      [req.user.userId, id, `STATUS_${status}`, message]
    );

    res.json({ message: `Delivery status updated to ${status}` });
  } catch (err) {
    console.error('Delivery update error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Real-time notification via Socket.io


// ── Get Single Delivery ──
exports.getDelivery = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         d.delivery_id, d.status, d.pickup_time,
         d.delivery_time, d.current_lat, d.current_lng,
         fl.title, fl.description,
         ST_X(fl.pickup_location) AS pickup_lat,
         ST_Y(fl.pickup_location) AS pickup_lng,
         u_vol.full_name  AS volunteer_name,
         u_vol.phone      AS volunteer_phone
       FROM deliveries d
       JOIN requests r       ON d.request_id   = r.request_id
       JOIN food_listings fl  ON r.listing_id   = fl.listing_id
       JOIN users u_vol       ON d.volunteer_id = u_vol.user_id
       WHERE d.delivery_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Delivery not found' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getDeliveryByRequest = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.delivery_id, d.status,
              u.full_name AS volunteer_name,
              u.phone     AS volunteer_phone
       FROM deliveries d
       JOIN users u ON d.volunteer_id = u.user_id
       WHERE d.request_id = ?`,
      [req.params.requestId]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'No delivery' });
    res.json(rows[0]);
  } catch (err) {
     console.error('Delivery  error:', err); 
    res.status(500).json({ message: err.message });
  }
};

// ── Update Location ──
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    const [result] = await pool.query(
      `UPDATE deliveries
       SET current_lat = ?, current_lng = ?
       WHERE delivery_id = ?`,
      [lat, lng, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Delivery not found' });

    // إرسال مباشر (Realtime)
    const io = req.app.get('io');
    if (io) {
      io.emit(`delivery-${id}`, { lat, lng });
    }

    res.json({ message: 'Location updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}; */





// ── Update Delivery Status (Volunteer) ──
/* exports.updateStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const allowed = ['PICKED_UP', 'DELIVERED', 'FAILED'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    // Get delivery info
    const [rows] = await pool.query(
      `SELECT d.*, fl.title, fl.provider_id, r.charity_id
       FROM deliveries d
       JOIN requests r      ON d.request_id  = r.request_id
       JOIN food_listings fl ON r.listing_id  = fl.listing_id
       WHERE d.delivery_id = ? AND d.volunteer_id = ?`,
      [id, req.user.userId]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: 'Delivery not found or unauthorized' });

    const delivery = rows[0];

    // Build update query based on status
    let updateQuery = `UPDATE deliveries SET status = ?`;
    const params    = [status];

    if (status === 'PICKED_UP') {
      updateQuery += `, pickup_time = NOW()`;
    } else if (status === 'DELIVERED') {
      updateQuery += `, delivery_time = NOW()`;
    }
    updateQuery += ` WHERE delivery_id = ?`;
    params.push(id);

    await pool.query(updateQuery, params);

    const io = req.app.get('io');
if (io) {
  io.sendNotification(delivery.provider_id, {
    message,
    type: 'DELIVERY'
  });
  io.sendNotification(delivery.charity_id, {
    message,
    type: 'DELIVERY'
  });
}

    // Notifications based on status
    let message = '';
    if (status === 'PICKED_UP') {
      message = `Gönüllü gıdayı teslim aldı, yola çıktı: ${delivery.title}`;
    } else if (status === 'DELIVERED') {
      message = `Teslimat tamamlandı: ${delivery.title} ✅`;
    } else if (status === 'FAILED') {
      message = `Teslimat başarısız oldu: ${delivery.title}`;
    }

    await pool.query(
      `INSERT INTO notifications (user_id, message, type) VALUES
       (?, ?, 'DELIVERY'), (?, ?, 'DELIVERY')`,
      [
        delivery.provider_id, message,
        delivery.charity_id,  message
      ]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'DELIVERY', ?, ?, ?)`,
      [req.user.userId, id, `STATUS_${status}`, message]
    );

    res.json({ message: `Delivery status updated to ${status}` });
  } catch (err) {
     console.error('Delivery update error:', err); 
    res.status(500).json({ message: err.message });
  }
}; */
