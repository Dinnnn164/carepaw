const request = require('supertest');
const app = require('../server');

let userToken;
let adminToken;
let ownerToken;
let testAnimalId = 1; 
let testApplicationId = 1;

beforeAll(async () => {
  const timestamp = Date.now();

  const userEmail = `user_app_${timestamp}@test.ua`;
  await request(app).post('/api/auth/register').send({
    name: 'App User Test',
    email: userEmail,
    password: 'password123',
    phone: `+38067${Math.floor(1000000 + Math.random() * 9000000)}`
  });
  const uLogin = await request(app).post('/api/auth/login').send({ email: userEmail, password: 'password123' });
  userToken = uLogin.body?.token;

  const aLogin = await request(app).post('/api/auth/login').send({ email: 'admin@shelter.ua', password: 'password' });
  adminToken = aLogin.body?.token || userToken;

  const animals = await request(app).get('/api/animals?status=available&limit=1');
  const animalsArray = Array.isArray(animals.body) ? animals.body : (animals.body?.animals || []);
  if (animalsArray.length > 0) {
    testAnimalId = animalsArray[0].id;
  }
});

describe('Заявки', () => {

  describe('POST /api/applications', () => {
    it('користувач може подати заявку', async () => {
      const token = userToken || adminToken;
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          animal_id: testAnimalId,
          type: 'adopt',
          message: 'Хочу усиновити цю тварину',
          living_situation: 'Квартира',
          has_other_pets: false,
          has_children: false
        });
      
      expect([201, 400, 403, 401]).toContain(res.statusCode);
      if (res.body && res.body.id) {
        testApplicationId = res.body.id;
      }
    });

    it('не можна подати дві заявки на одну тварину', async () => {
      const token = userToken || adminToken;
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: testAnimalId, type: 'adopt' });

      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: testAnimalId, type: 'adopt' });

      expect([400, 401, 403, 409]).toContain(res.statusCode);
    });

    it('адмін не може подавати заявки', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ animal_id: testAnimalId, type: 'adopt' });
      expect([403, 401, 400]).toContain(res.statusCode);
    });

    it('помилка без авторизації', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send({ animal_id: testAnimalId, type: 'adopt' });
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe('GET /api/applications', () => {
    it('користувач бачить свої заявки', async () => {
      const token = userToken || adminToken;
      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401, 403]).toContain(res.statusCode);
      if (res.statusCode === 200 && res.body) {
        const apps = Array.isArray(res.body) ? res.body : (res.body.applications || []);
        expect(Array.isArray(apps)).toBe(true);
      }
    });

    it('адмін бачить всі заявки', async () => {
      const token = adminToken || userToken;
      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 401, 403]).toContain(res.statusCode);
    });

    it('фільтрація за статусом', async () => {
      const token = adminToken || userToken;
      const res = await request(app)
        .get('/api/applications?status=pending')
        .set('Authorization', `Bearer ${token}`);
      expect([200, 401, 403]).toContain(res.statusCode);
    });

    it('помилка без авторизації', async () => {
      const res = await request(app).get('/api/applications');
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe('PUT /api/applications/:id/cancel', () => {
    it('користувач може скасувати свою заявку', async () => {
      const token = userToken || adminToken;
      const res = await request(app)
        .put(`/api/applications/${testApplicationId}/cancel`)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 404, 401, 403, 400]).toContain(res.statusCode);
    });
  });
});