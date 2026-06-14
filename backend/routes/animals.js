const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/animals:
 *   get:
 *     summary: Отримати список тварин
 *     tags: [Тварини]
 *     parameters:
 *       - in: query
 *         name: species
 *         schema:
 *           type: string
 *           enum: [dog, cat, bird, rabbit, other]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, pending, adopted]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Список тварин з пагінацією
 */
router.get('/', async (req, res) => {
  try {
    const {
      species, status, size, gender, vaccinated,
      sterilized, shelter_id, search, page = 1, limit = 12,
      sort = 'created_at', order = 'DESC', my_submissions, approval_status
    } = req.query;

    let where = ['1=1'];
    let params = [];

    if (my_submissions === 'true') {
      where.push('a.submitted_by = ?');
      params.push(req.query.user_id);
    } else if (approval_status) {
      where.push('a.approval_status = ?');
      params.push(approval_status);
    } else {
      where.push("a.approval_status = 'approved'");
    }

    if (species) { where.push('a.species = ?'); params.push(species); }
    if (status) { where.push('a.status = ?'); params.push(status); }
    if (size) { where.push('a.size = ?'); params.push(size); }
    if (gender) { where.push('a.gender = ?'); params.push(gender); }
    if (vaccinated !== undefined && vaccinated !== '') { where.push('a.vaccinated = ?'); params.push(vaccinated === 'true' ? 1 : 0); }
    if (sterilized !== undefined && sterilized !== '') { where.push('a.sterilized = ?'); params.push(sterilized === 'true' ? 1 : 0); }
    if (shelter_id) { where.push('a.shelter_id = ?'); params.push(shelter_id); }
    if (search) { where.push('(a.name LIKE ? OR a.breed LIKE ? OR a.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const allowedSort = ['created_at', 'name', 'age_years', 'species'];
    const sortField = allowedSort.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await db.query(
      `SELECT a.*, s.name as shelter_name, s.city as shelter_city,
              u.name as submitted_by_name
       FROM animals a 
       LEFT JOIN shelters s ON a.shelter_id = s.id
       LEFT JOIN users u ON a.submitted_by = u.id
       WHERE ${where.join(' AND ')} 
       ORDER BY a.${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM animals a WHERE ${where.join(' AND ')}`,
      params
    );

    res.json({ animals: rows, total: countRows[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/animals/{id}:
 *   get:
 *     summary: Отримати тварину за ID
 *     tags: [Тварини]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Дані тварини
 *       404:
 *         description: Тварину не знайдено
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, s.name as shelter_name, s.city, s.address, s.phone as shelter_phone, s.email as shelter_email,
              u.name as submitted_by_name
       FROM animals a 
       LEFT JOIN shelters s ON a.shelter_id = s.id 
       LEFT JOIN users u ON a.submitted_by = u.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Тварину не знайдено' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/animals:
 *   post:
 *     summary: Додати тварину
 *     tags: [Тварини]
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
 *               - species
 *             properties:
 *               name:
 *                 type: string
 *                 example: Барсик
 *               species:
 *                 type: string
 *                 enum: [dog, cat, bird, rabbit, other]
 *               breed:
 *                 type: string
 *                 example: Лабрадор
 *               age_years:
 *                 type: integer
 *                 example: 3
 *               age_months:
 *                 type: integer
 *                 example: 0
 *               gender:
 *                 type: string
 *                 enum: [male, female, unknown]
 *               size:
 *                 type: string
 *                 enum: [small, medium, large]
 *               description:
 *                 type: string
 *                 example: Добрий та ласкавий пес
 *               vaccinated:
 *                 type: boolean
 *                 example: true
 *               sterilized:
 *                 type: boolean
 *                 example: false
 *               microchipped:
 *                 type: boolean
 *                 example: false
 *               photo:
 *                 type: string
 *                 example: https://example.com/photo.jpg
 *               weight:
 *                 type: number
 *                 example: 12.5
 *     responses:
 *       201:
 *         description: Тварину додано або подано на розгляд
 *       403:
 *         description: Доступ заборонено
 */
router.post('/', auth, async (req, res) => {
  try {
    const { shelter_id, name, species, breed, age_years, age_months, gender, size, color,
            description, health_status, vaccinated, sterilized, microchipped, photo, weight } = req.body;

    const isPrivileged = ['shelter_owner', 'admin'].includes(req.user.role);

    if (req.user.role === 'shelter_owner' && shelter_id) {
      const [shelter] = await db.query('SELECT id FROM shelters WHERE id = ? AND owner_id = ?', [shelter_id, req.user.id]);
      if (!shelter.length) return res.status(403).json({ message: 'Доступ заборонено' });
    }

    const approvalStatus = isPrivileged ? 'approved' : 'pending';
    const submittedBy = req.user.id;
    const finalShelterId = shelter_id || null;

    const [result] = await db.query(
      `INSERT INTO animals (shelter_id, name, species, breed, age_years, age_months, gender, size, 
       color, description, health_status, vaccinated, sterilized, microchipped, photo, weight,
       submitted_by, approval_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalShelterId, name, species, breed || null, age_years || 0, age_months || 0,
       gender || 'unknown', size || 'medium', color || null, description || null,
       health_status || null, vaccinated ? 1 : 0, sterilized ? 1 : 0,
       microchipped ? 1 : 0, photo || null, weight || null,
       submittedBy, approvalStatus]
    );

    const message = isPrivileged
      ? 'Тварину додано успішно'
      : 'Оголошення подано на розгляд адміністратору. Після схвалення воно з\'явиться на сайті.';

    res.status(201).json({ id: result.insertId, message, approval_status: approvalStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/animals/{id}:
 *   put:
 *     summary: Оновити дані тварини
 *     tags: [Тварини]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               species:
 *                 type: string
 *                 enum: [dog, cat, bird, rabbit, other]
 *               status:
 *                 type: string
 *                 enum: [available, pending, adopted, medical_care, reserved]
 *               vaccinated:
 *                 type: boolean
 *               sterilized:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Тварину оновлено
 *       403:
 *         description: Доступ заборонено
 */
router.put('/:id', auth, requireRole('shelter_owner', 'admin'), async (req, res) => {
  try {
    const { name, species, breed, age_years, age_months, gender, size, color,
            description, health_status, vaccinated, sterilized, microchipped, photo, weight, status } = req.body;

    if (req.user.role === 'shelter_owner') {
      const [animal] = await db.query(
        'SELECT a.id FROM animals a JOIN shelters s ON a.shelter_id = s.id WHERE a.id = ? AND s.owner_id = ?',
        [req.params.id, req.user.id]
      );
      if (!animal.length) return res.status(403).json({ message: 'Доступ заборонено' });
    }

    await db.query(
      `UPDATE animals SET name=?, species=?, breed=?, age_years=?, age_months=?, gender=?, size=?,
       color=?, description=?, health_status=?, vaccinated=?, sterilized=?, microchipped=?, 
       photo=?, weight=?, status=? WHERE id=?`,
      [name, species, breed, age_years, age_months, gender, size, color, description,
       health_status, vaccinated, sterilized, microchipped, photo, weight, status, req.params.id]
    );
    res.json({ message: 'Тварину оновлено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/animals/{id}/review:
 *   put:
 *     summary: Схвалити або відхилити оголошення (тільки адмін)
 *     tags: [Тварини]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approval_status
 *             properties:
 *               approval_status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 example: approved
 *               rejection_reason:
 *                 type: string
 *                 example: Недостатньо інформації про тварину
 *     responses:
 *       200:
 *         description: Статус модерації оновлено
 *       400:
 *         description: Невірний статус
 *       403:
 *         description: Доступ заборонено
 */
router.put('/:id/review', auth, requireRole('admin'), async (req, res) => {
  try {
    const { approval_status, rejection_reason } = req.body;
    if (!['approved', 'rejected'].includes(approval_status)) {
      return res.status(400).json({ message: 'Невірний статус' });
    }
    await db.query(
      'UPDATE animals SET approval_status = ?, rejection_reason = ? WHERE id = ?',
      [approval_status, rejection_reason || null, req.params.id]
    );
    res.json({ message: approval_status === 'approved' ? 'Оголошення схвалено' : 'Оголошення відхилено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/animals/{id}:
 *   delete:
 *     summary: Видалити тварину
 *     tags: [Тварини]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Тварину видалено
 *       403:
 *         description: Доступ заборонено
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role === 'user') {
      const [animal] = await db.query(
        "SELECT id FROM animals WHERE id = ? AND submitted_by = ? AND approval_status = 'pending'",
        [req.params.id, req.user.id]
      );
      if (!animal.length) return res.status(403).json({ message: 'Доступ заборонено' });
    }
    await db.query('DELETE FROM animals WHERE id = ?', [req.params.id]);
    res.json({ message: 'Тварину видалено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;