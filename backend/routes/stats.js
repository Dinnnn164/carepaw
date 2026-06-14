const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/stats/general:
 *   get:
 *     summary: Загальна статистика платформи (публічна)
 *     tags: [Статистика]
 *     responses:
 *       200:
 *         description: Загальні показники платформи
 */
router.get('/general', async (req, res) => {
  try {
    const [[animals]] = await db.query('SELECT COUNT(*) as total FROM animals');
    const [[available]] = await db.query("SELECT COUNT(*) as total FROM animals WHERE status='available'");
    const [[adopted]] = await db.query("SELECT COUNT(*) as total FROM animals WHERE status='adopted'");
    const [[shelters]] = await db.query('SELECT COUNT(*) as total FROM shelters');
    const [[users]] = await db.query("SELECT COUNT(*) as total FROM users WHERE role='user'");
    const [[applications]] = await db.query("SELECT COUNT(*) as total FROM applications");

    res.json({
      total_animals: animals.total,
      available_animals: available.total,
      adopted_animals: adopted.total,
      total_shelters: shelters.total,
      total_users: users.total,
      total_applications: applications.total
    });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/stats/admin:
 *   get:
 *     summary: Детальна статистика для адміна
 *     tags: [Статистика]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Графіки та аналітика платформи
 *       403:
 *         description: Доступ заборонено
 */
router.get('/admin', auth, requireRole('admin'), async (req, res) => {
  try {
    const [bySpecies] = await db.query('SELECT species, COUNT(*) as count FROM animals GROUP BY species');
    const [byStatus] = await db.query('SELECT status, COUNT(*) as count FROM animals GROUP BY status');

    const [appsByMonth] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM applications
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `);

    const [appsByStatus] = await db.query('SELECT status, COUNT(*) as count FROM applications GROUP BY status');

    const [topShelters] = await db.query(`
      SELECT s.name, COUNT(a.id) as animal_count
      FROM shelters s LEFT JOIN animals a ON s.id = a.shelter_id
      GROUP BY s.id ORDER BY animal_count DESC LIMIT 5
    `);

    const [newUsers] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
      FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `);

    res.json({ bySpecies, byStatus, appsByMonth, appsByStatus, topShelters, newUsers });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * @swagger
 * /api/stats/shelter:
 *   get:
 *     summary: Статистика притулку для власника
 *     tags: [Статистика]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика притулку
 *       403:
 *         description: Доступ заборонено
 */
router.get('/shelter', auth, requireRole('shelter_owner'), async (req, res) => {
  try {
    const [shelter] = await db.query('SELECT id FROM shelters WHERE owner_id = ?', [req.user.id]);
    if (!shelter.length) return res.json({});

    const shelterId = shelter[0].id;

    const [[totalAnimals]] = await db.query('SELECT COUNT(*) as total FROM animals WHERE shelter_id = ?', [shelterId]);
    const [[available]] = await db.query("SELECT COUNT(*) as total FROM animals WHERE shelter_id = ? AND status='available'", [shelterId]);
    const [[adopted]] = await db.query("SELECT COUNT(*) as total FROM animals WHERE shelter_id = ? AND status='adopted'", [shelterId]);
    const [[pendingApps]] = await db.query("SELECT COUNT(*) as total FROM applications WHERE shelter_id = ? AND status='pending'", [shelterId]);

    const [bySpecies] = await db.query('SELECT species, COUNT(*) as count FROM animals WHERE shelter_id = ? GROUP BY species', [shelterId]);
    const [recentApps] = await db.query(`
      SELECT app.*, u.name as user_name, a.name as animal_name
      FROM applications app
      JOIN users u ON app.user_id = u.id
      JOIN animals a ON app.animal_id = a.id
      WHERE app.shelter_id = ?
      ORDER BY app.created_at DESC LIMIT 5
    `, [shelterId]);

    res.json({
      total_animals: totalAnimals.total,
      available_animals: available.total,
      adopted_animals: adopted.total,
      pending_applications: pendingApps.total,
      by_species: bySpecies,
      recent_applications: recentApps
    });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;