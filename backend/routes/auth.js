const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { auth } = require('../middleware/auth');
require('dotenv').config();

// ... інший код вище ...

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Авторизація]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Іван Петренко
 *               email:
 *                 type: string
 *                 example: ivan@email.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *               role:
 *                 type: string
 *                 enum: [user, shelter_owner]
 *     responses:
 *       201:
 *         description: Користувача створено
 *       400:
 *         description: Email вже використовується
 */


router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Всі поля обов\'язкові' });

    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(400).json({ message: 'Email вже використовується' });

    const allowedRoles = ['user', 'shelter_owner'];
    const userRole = allowedRoles.includes(role) ? role : 'user';

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, userRole, phone || null]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: userRole, name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: result.insertId, name, email, role: userRole } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вхід у систему
 *     tags: [Авторизація]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@shelter.ua
 *               password:
 *                 type: string
 *                 example: password
 *     responses:
 *       200:
 *         description: Успішний вхід, повертає токен
 *       400:
 *         description: Невірний email або пароль
 */

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Невірний email або пароль' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Невірний email або пароль' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, phone, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Користувача не знайдено' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    await db.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);
    res.json({ message: 'Профіль оновлено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;
