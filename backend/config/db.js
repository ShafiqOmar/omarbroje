const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             process.env.DB_PORT || 3306,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  timezone:         '+00:00'
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected: food_waste_system');
    conn.release();
  })
  .catch(err => console.error('❌ DB connection failed:', err.message));

  // تأكيد التوقيت عند كل اتصال
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

module.exports = pool;