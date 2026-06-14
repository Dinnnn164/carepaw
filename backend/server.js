const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const allowedOrigins = [
  'http://localhost:3000', 
  'https://carepaw-ua.netlify.app',
  'https://carepaw-production.up.railway.app' // Додаємо сам бекенд (для роботи Swagger та внутрішніх запитів)
];

app.use(cors({
  origin: function (origin, callback) {
    // 1. Дозволяємо запити без origin (Postman, мобільні додатки)
    if (!origin) return callback(null, true);
    
    // 2. Перевіряємо, чи є origin у списку дозволених
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Важливо для застарілих браузерів та деяких preflight-запитів
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/animals', require('./routes/animals'));
app.use('/api/shelters', require('./routes/shelters'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/posts', require('./routes/posts'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Сервер працює' }));

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n Сервер запущено на порту ${PORT}`);
    console.log(` API доступне за адресою: http://localhost:${PORT}/api`);
    console.log(`  Адмін:    admin@shelter.ua  / password`);
    console.log(`  Власник:  owner@shelter.ua  / password`);
    console.log(`  Юзер:     user@shelter.ua   / password\n`);
  });
}

module.exports = app;