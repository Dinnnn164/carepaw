const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Отримати список публікацій
 *     tags: [Новини]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [news, success_story, event, urgent]
 *       - in: query
 *         name: shelter_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 9
 *     responses:
 *       200:
 *         description: Список публікацій з пагінацією
 */
router.get('/', async (req, res) => {
  try {
    const { category, shelter_id, page = 1, limit = 9 } = req.query;
    let where = ['p.is_published = 1'];
    let params = [];
    if (category) { where.push('p.category = ?'); params.push(category); }
    if (shelter_id) { where.push('p.shelter_id = ?'); params.push(shelter_id); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [rows] = await db.query(
      `SELECT p.*, u.name as author_name, s.name as shelter_name
       FROM posts p JOIN users u ON p.author_id = u.id
       LEFT JOIN shelters s ON p.shelter_id = s.id
       WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[count]] = await db.query(`SELECT COUNT(*) as total FROM posts p WHERE ${where.join(' AND ')}`, params);
    res.json({ posts: rows, total: count.total });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Отримати публікацію за ID
 *     tags: [Новини]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Дані публікації
 *       404:
 *         description: Новину не знайдено
 */
router.get('/:id', async (req, res) => {
  try {
    await db.query('UPDATE posts SET views = views + 1 WHERE id = ?', [req.params.id]);
    const [rows] = await db.query(
      `SELECT p.*, u.name as author_name, s.name as shelter_name
       FROM posts p JOIN users u ON p.author_id = u.id
       LEFT JOIN shelters s ON p.shelter_id = s.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Новину не знайдено' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Створити публікацію
 *     tags: [Новини]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Нові мешканці притулку
 *               content:
 *                 type: string
 *                 example: Сьогодні до нас потрапили нові тварини
 *               image:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               category:
 *                 type: string
 *                 enum: [news, success_story, event, urgent]
 *                 example: news
 *               shelter_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Публікацію додано
 *       403:
 *         description: Доступ заборонено
 */
router.post('/', auth, requireRole('admin', 'shelter_owner'), async (req, res) => {
  try {
    const { title, content, image, category, shelter_id } = req.body;
    const [result] = await db.query(
      'INSERT INTO posts (author_id, shelter_id, title, content, image, category) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, shelter_id || null, title, content, image, category || 'news']
    );
    res.status(201).json({ id: result.insertId, message: 'Публікацію додано' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Видалити публікацію
 *     tags: [Новини]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Публікацію видалено
 *       403:
 *         description: Доступ заборонено
 */
router.delete('/:id', auth, requireRole('admin', 'shelter_owner'), async (req, res) => {
  try {
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Публікацію видалено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;