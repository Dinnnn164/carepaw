const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/shelters:
 *   get:
 *     summary: Отримати список притулків
 *     tags: [Притулки]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *           example: Київ
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: Тепле серце
 *     responses:
 *       200:
 *         description: Список притулків
 */
router.get('/', async (req, res) => {
  try {
    const { city, search } = req.query;
    let where = ['1=1'];
    let params = [];
    if (city) { where.push('s.city = ?'); params.push(city); }
    if (search) { where.push('(s.name LIKE ? OR s.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const [rows] = await db.query(
      `SELECT s.*, u.name as owner_name, u.email as owner_email,
              COUNT(DISTINCT a.id) as animal_count,
              SUM(CASE WHEN a.status='available' THEN 1 ELSE 0 END) as available_count
       FROM shelters s
       LEFT JOIN users u ON s.owner_id = u.id
       LEFT JOIN animals a ON s.id = a.shelter_id
       WHERE ${where.join(' AND ')}
       GROUP BY s.id ORDER BY s.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/shelters/my/info:
 *   get:
 *     summary: Отримати свій притулок (власник притулку)
 *     tags: [Притулки]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Дані притулку власника
 *       403:
 *         description: Доступ заборонено
 */
router.get('/my/info', auth, requireRole('shelter_owner'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shelters WHERE owner_id = ?', [req.user.id]);
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/shelters/{id}:
 *   get:
 *     summary: Отримати притулок за ID
 *     tags: [Притулки]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Дані притулку
 *       404:
 *         description: Притулок не знайдено
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.name as owner_name,
              COUNT(DISTINCT a.id) as animal_count
       FROM shelters s LEFT JOIN users u ON s.owner_id = u.id
       LEFT JOIN animals a ON s.id = a.shelter_id
       WHERE s.id = ? GROUP BY s.id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Притулок не знайдено' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/shelters:
 *   post:
 *     summary: Створити притулок
 *     tags: [Притулки]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Тепле серце
 *               description:
 *                 type: string
 *                 example: Притулок для безпритульних тварин
 *               address:
 *                 type: string
 *                 example: вул. Садова 14
 *               city:
 *                 type: string
 *                 example: Київ
 *               phone:
 *                 type: string
 *                 example: +380441234567
 *               email:
 *                 type: string
 *                 example: shelter@email.com
 *               website:
 *                 type: string
 *                 example: https://shelter.com
 *               capacity:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       201:
 *         description: Притулок створено
 *       403:
 *         description: Доступ заборонено
 */
router.post('/', auth, requireRole('shelter_owner', 'admin'), async (req, res) => {
  try {
    const { name, description, address, city, phone, email, website, capacity } = req.body;
    const [result] = await db.query(
      'INSERT INTO shelters (owner_id, name, description, address, city, phone, email, website, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, description, address, city, phone, email, website, capacity || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Притулок створено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/shelters/{id}:
 *   put:
 *     summary: Оновити притулок
 *     tags: [Притулки]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Притулок оновлено
 *       403:
 *         description: Доступ заборонено
 */
router.put('/:id', auth, requireRole('shelter_owner', 'admin'), async (req, res) => {
  try {
    const { name, description, address, city, phone, email, website, capacity } = req.body;
    if (req.user.role === 'shelter_owner') {
      const [s] = await db.query('SELECT id FROM shelters WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
      if (!s.length) return res.status(403).json({ message: 'Доступ заборонено' });
    }
    await db.query(
      'UPDATE shelters SET name=?, description=?, address=?, city=?, phone=?, email=?, website=?, capacity=? WHERE id=?',
      [name, description, address, city, phone, email, website, capacity, req.params.id]
    );
    res.json({ message: 'Притулок оновлено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;