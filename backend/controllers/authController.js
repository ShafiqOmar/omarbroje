const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
const createTransporter = require('../config/mailer');
require('dotenv').config();

// ── Helper: Generate Tokens ──
const generateTokens = (userId, roleId) => {
  const accessToken = jwt.sign(
    { userId, roleId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};

// ── Register ──
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, phone, role_id } = req.body;

    // Validate role — Admin cannot self-register
    if (role_id === 1)
      return res.status(400).json({ message: 'Cannot register as admin' });

    // Check duplicate email
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0)
      return res.status(400).json({ message: 'Email already registered' });

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role_id, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [full_name, email, password_hash, phone || null, role_id]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'USER', ?, 'REGISTER', ?)`,
      [result.insertId, result.insertId, `New user registered: ${email}`]
    );

    res.status(201).json({
      message: 'Registration successful. Awaiting admin approval.',
      userId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Login ──
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with role
    const [rows] = await pool.query(
      `SELECT u.*, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = ? AND u.is_deleted = FALSE`,
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];

    // Check account status
    if (user.status === 'PENDING')
      return res.status(403).json({ message: 'Account pending admin approval' });
    if (user.status === 'SUSPENDED')
      return res.status(403).json({ message: 'Account suspended' });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id, user.role_id);

    // Save refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES (?, ?, ?)`,
      [user.user_id, refreshToken, expiresAt]
    );

    // Log
    await pool.query(
      `INSERT INTO logs (actor_id, entity_type, entity_id, action, description)
       VALUES (?, 'USER', ?, 'LOGIN', ?)`,
      [user.user_id, user.user_id, `User logged in: ${email}`]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        userId:   user.user_id,
        fullName: user.full_name,
        email:    user.email,
        role:     user.role_name,
        status:   user.status
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Refresh Token ──
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: 'No refresh token provided' });

    // Check token in DB
    const [rows] = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token = ? AND revoked = 0 AND expires_at > NOW()`,
      [refreshToken]
    );
    if (rows.length === 0)
      return res.status(403).json({ message: 'Invalid or expired refresh token' });

    // Verify JWT
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user role
    const [user] = await pool.query(
      'SELECT role_id FROM users WHERE user_id = ?',
      [payload.userId]
    );

    // New access token
    const accessToken = jwt.sign(
      { userId: payload.userId, roleId: user[0].role_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// ── Logout ──
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = 1 WHERE token = ?',
        [refreshToken]
      );
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get My Profile ──
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.phone,
              u.status, u.average_rating, u.rating_count,
              u.created_at, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [req.user.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? AND is_deleted = FALSE',
      [email]
    );
    if (users.length === 0)
      return res.status(404).json({ message: 'Bu e-posta adresi kayıtlı değil' });

    // توليد token عشوائي
    const token     = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 دقيقة

    await pool.query(
      `INSERT INTO password_resets (email, token, expires_at)
       VALUES (?, ?, ?)`,
      [email, token, expiresAt]
    );

    // رابط إعادة التعيين
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const transporter = createTransporter();
    await transporter.sendMail({
      from:    `"SmartFoodAid" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: 'SmartFoodAid — Şifre Sıfırlama',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                    background: #f4faf6; padding: 2rem; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <h1 style="color: #1b5e20; margin: 0;">🌿 SmartFoodAid</h1>
            <p style="color: #666;">Şifre Sıfırlama</p>
          </div>
          <div style="background: #fff; padding: 1.5rem; border-radius: 12px;
                      border: 1px solid #c8e6c9; text-align: center;">
            <p style="color: #333; margin-bottom: 1.5rem;">
              Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.
            </p>
            <a href="${resetLink}"
               style="display: inline-block; padding: 14px 32px; border-radius: 10px;
                      background: linear-gradient(135deg, #1b5e20, #43a047);
                      color: #fff; text-decoration: none; font-weight: 700;
                      font-size: 1rem; box-shadow: 0 4px 12px rgba(46,125,50,0.3);">
              🔒 Şifremi Sıfırla
            </a>
            <p style="color: #9e9e9e; font-size: 0.85rem; margin-top: 1.5rem;">
              Bu bağlantı <strong>30 dakika</strong> geçerlidir.
            </p>
          </div>
          <p style="color: #9e9e9e; font-size: 0.75rem; text-align: center; margin-top: 1rem;">
            Bu e-postayı siz talep etmediyseniz lütfen dikkate almayın.
          </p>
        </div>
      `
    });

    res.json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Reset Password ──
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    console.log('Verifying token for:', email, token)

    // Verify token
    const [rows] = await pool.execute(
      `SELECT * FROM password_resets
       WHERE email = ? AND token = ? AND used = 0 AND expires_at > UTC_TIMESTAMP()
       ORDER BY created_at DESC LIMIT 1`,
      [email.trim(), token.trim()]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'Kod geçersiz veya süresi dolmuş' });

    // Hash new password
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [password_hash, email.trim()]
    );

    // Mark token as used
    await pool.execute(
      'UPDATE password_resets SET used = 1 WHERE id = ?',
      [rows[0].id]
    );

    res.json({ message: 'Şifreniz başarıyla güncellendi' });
  } catch (err) {
    console.error(err);
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateCapacity = async (req, res) => {
  try {
    const { capacity_status } = req.body;
    if (!['ACCEPTING', 'FULL'].includes(capacity_status))
      return res.status(400).json({ message: 'Invalid status' });

    await pool.query(
      `UPDATE users SET capacity_status = ? WHERE user_id = ?`,
      [capacity_status, req.user.userId]
    );

    res.json({ message: 'Kapasite durumu güncellendi', capacity_status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};