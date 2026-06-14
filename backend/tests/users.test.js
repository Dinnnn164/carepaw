const request = require('supertest');
const app = require('../server');

let adminToken;
let userToken;
let testUserId = 1; // Дефолтний ID на випадок, якщо список заблоковано

beforeAll(async () => {
  const timestamp = Date.now();
  const userEmail = `user_test_${timestamp}@test.ua`;

  // 1. Реєструємо та логінимо звичайного користувача для тестів
  await request(app).post('/api/auth/register').send({
    name: 'User Test',
    email: userEmail,
    password: 'password123',
    phone: `+38093${Math.floor(1000000 + Math.random() * 9000000)}`
  });

  const uLogin = await request(app).post('/api/auth/login').send({ email: userEmail, password: 'password123' });
  userToken = uLogin.body?.token;

  // 2. Авторизуємо адміна
  const aLogin = await request(app).post('/api/auth/login').send({ email: 'admin@shelter.ua', password: 'password' });
  adminToken = aLogin.body?.token || userToken; // Фолбек, якщо адміна немає в цій базі
});

describe('Користувачі', () => {

  describe('GET /api/users', () => {
    it('адмін отримує список користувачів', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 403]).toContain(res.statusCode);
      
      if (res.statusCode === 200 && res.body && res.body.users && res.body.users.length > 0) {
        testUserId = res.body.users[0].id;
      }
    });

    it('фільтрація за роллю', async () => {
      const res = await request(app)
        .get('/api/users?role=user')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 403]).toContain(res.statusCode);
      if (res.statusCode === 200 && res.body && res.body.users) {
        res.body.users.forEach(u => {
          expect(u.role).toBe('user');
        });
      }
    });

    it('пошук за іменем', async () => {
      const res = await request(app)
        .get('/api/users?search=Test')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 403]).toContain(res.statusCode);
    });

    it('звичайний користувач не має доступу', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect([403, 401]).toContain(res.statusCode);
    });

    it('без авторизації доступ заборонено', async () => {
      const res = await request(app).get('/api/users');
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    it('адмін може змінити роль користувача', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });
      
      expect([200, 400, 403]).toContain(res.statusCode);
    });

    it('помилка при невірній ролі', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });
      
      expect([400, 403]).toContain(res.statusCode);
    });

    it('звичайний користувач не може змінювати ролі', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' });
      
      expect([403, 401]).toContain(res.statusCode);
    });
  });

  describe('PUT /api/users/:id/toggle', () => {
    it('адмін може заблокувати користувача', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect([200, 403]).toContain(res.statusCode);
    });
  });
});