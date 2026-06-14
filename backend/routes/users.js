const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Отримати список користувачів (тільки адмін)
 *     tags: [Користувачі]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user, shelter_owner]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: Іван
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Список користувачів
 *       403:
 *         description: Доступ заборонено
 */
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    let where = ['1=1'];
    let params = [];

    if (role) { where.push('role = ?'); params.push(role); }
    if (search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await db.query(
      `SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[count]] = await db.query(`SELECT COUNT(*) as total FROM users WHERE ${where.join(' AND ')}`, params);
    res.json({ users: rows, total: count.total });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/users/{id}/toggle:
 *   put:
 *     summary: Заблокувати або розблокувати користувача
 *     tags: [Користувачі]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Статус користувача змінено
 *       403:
 *         description: Доступ заборонено
 */
router.put('/:id/toggle', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ message: 'Статус оновлено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Змінити роль користувача
 *     tags: [Користувачі]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user, shelter_owner]
 *                 example: shelter_owner
 *     responses:
 *       200:
 *         description: Роль оновлено
 *       400:
 *         description: Невірна роль
 *       403:
 *         description: Доступ заборонено
 */
router.put('/:id/role', auth, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'user', 'shelter_owner'];
    if (!validRoles.includes(role)) return res.status(400).json({ message: 'Невірна роль' });
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Роль оновлено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Видалити користувача
 *     tags: [Користувачі]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Користувача видалено
 *       400:
 *         description: Не можна видалити себе
 *       403:
 *         description: Доступ заборонено
 */
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    if (req.user.id === parseInt(req.params.id)) return res.status(400).json({ message: 'Не можна видалити себе' });
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Користувача видалено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;