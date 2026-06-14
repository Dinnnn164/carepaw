const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Отримати список заявок
 *     tags: [Заявки]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewing, approved, rejected, cancelled]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [adopt, foster, volunteer, donate_supplies]
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
 *         description: Список заявок
 *       401:
 *         description: Не авторизовано
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    let where = ['1=1'];
    let params = [];

    if (req.user.role === 'user') {
      where.push('app.user_id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'shelter_owner') {
      where.push('s.owner_id = ?');
      params.push(req.user.id);
    }

    if (status) { where.push('app.status = ?'); params.push(status); }
    if (type) { where.push('app.type = ?'); params.push(type); }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await db.query(
      `SELECT app.*, 
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              a.name as animal_name, a.species, a.photo as animal_photo,
              s.name as shelter_name
       FROM applications app
       JOIN users u ON app.user_id = u.id
       JOIN animals a ON app.animal_id = a.id
       LEFT JOIN shelters s ON app.shelter_id = s.id
       WHERE ${where.join(' AND ')}
       ORDER BY app.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM applications app 
       LEFT JOIN shelters s ON app.shelter_id = s.id
       WHERE ${where.join(' AND ')}`,
      params
    );

    res.json({ applications: rows, total: countRows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Подати заявку на опіку тварини
 *     tags: [Заявки]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - animal_id
 *             properties:
 *               animal_id:
 *                 type: integer
 *                 example: 1
 *               type:
 *                 type: string
 *                 enum: [adopt, foster, volunteer, donate_supplies]
 *                 example: adopt
 *               message:
 *                 type: string
 *                 example: Хочу усиновити цю тварину
 *               living_situation:
 *                 type: string
 *                 example: Квартира з балконом
 *               has_other_pets:
 *                 type: boolean
 *                 example: false
 *               has_children:
 *                 type: boolean
 *                 example: true
 *               experience:
 *                 type: string
 *                 example: Маю досвід утримання собак
 *               contact_preferred:
 *                 type: string
 *                 enum: [phone, email, any]
 *                 example: any
 *     responses:
 *       201:
 *         description: Заявку подано успішно
 *       400:
 *         description: Вже є активна заявка на цю тварину
 *       404:
 *         description: Тварину не знайдено
 */
router.post('/', auth, requireRole('user'), async (req, res) => {
  try {
    const { animal_id, type, message, living_situation, has_other_pets, has_children, experience, contact_preferred } = req.body;

    const [animal] = await db.query('SELECT shelter_id, status FROM animals WHERE id = ?', [animal_id]);
    if (!animal.length) return res.status(404).json({ message: 'Тварину не знайдено' });
    if (animal[0].status === 'adopted') return res.status(400).json({ message: 'Тварина вже прилаштована' });

    const [existing] = await db.query(
      'SELECT id FROM applications WHERE user_id = ? AND animal_id = ? AND status IN ("pending","reviewing")',
      [req.user.id, animal_id]
    );
    if (existing.length) return res.status(400).json({ message: 'Ви вже подали заявку на цю тварину' });

    const shelterId = animal[0].shelter_id || null;

    const [result] = await db.query(
      `INSERT INTO applications (user_id, animal_id, shelter_id, type, message, living_situation, 
       has_other_pets, has_children, experience, contact_preferred) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, animal_id, shelterId, type || 'adopt', message,
       living_situation, has_other_pets || false, has_children || false, experience, contact_preferred || 'any']
    );

    res.status(201).json({ id: result.insertId, message: 'Заявку подано успішно' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     summary: Оновити статус заявки (власник притулку або адмін)
 *     tags: [Заявки]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewing, approved, rejected, cancelled]
 *                 example: approved
 *               admin_notes:
 *                 type: string
 *                 example: Кандидат відповідає вимогам
 *     responses:
 *       200:
 *         description: Статус заявки оновлено
 *       400:
 *         description: Невірний статус
 *       403:
 *         description: Доступ заборонено
 */
router.put('/:id', auth, requireRole('shelter_owner', 'admin'), async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Невірний статус' });

    await db.query(
      'UPDATE applications SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes, req.params.id]
    );

    if (status === 'approved') {
      const [app] = await db.query('SELECT animal_id, type FROM applications WHERE id = ?', [req.params.id]);
      if (app[0]?.type === 'adopt') {
        await db.query("UPDATE animals SET status = 'adopted' WHERE id = ?", [app[0].animal_id]);
      }
    }

    res.json({ message: 'Статус заявки оновлено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/applications/{id}/cancel:
 *   put:
 *     summary: Скасувати заявку (тільки користувач)
 *     tags: [Заявки]
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
 *         description: Заявку скасовано
 *       403:
 *         description: Доступ заборонено
 */
router.put('/:id/cancel', auth, requireRole('user'), async (req, res) => {
  try {
    await db.query(
      "UPDATE applications SET status = 'cancelled' WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Заявку скасовано' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;