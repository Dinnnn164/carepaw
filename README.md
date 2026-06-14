#  CarePaw — Платформа допомоги безпритульним тваринам

##  Що потрібно встановити

### 1. Node.js
- Завантажте з https://nodejs.org/ (версія 18 або вище)
- Перевірте: `node --version`

### 2. MySQL
- Завантажте з https://dev.mysql.com/downloads/mysql/ або використайте XAMPP
- Перевірте: `mysql --version`

---

##  Кроки запуску

### Крок 1 — Налаштування бази даних MySQL

Відкрийте MySQL і виконайте:

```sql
CREATE DATABASE animal_shelter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Потім виконайте SQL з файлу:
```
backend/config/init.sql
```

Команда (замість YOUR_PASSWORD — ваш пароль):
```bash
mysql -u root -p animal_shelter < backend/config/init.sql
```

---

### Крок 2 — Налаштування бекенду

```bash
# Перейти в папку backend
cd backend

# Встановити залежності
npm install

# Скопіювати файл конфігурації
copy .env.example .env        (Windows)
```

Відкрийте файл `backend/.env` та вкажіть ваші дані:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ВАШ_ПАРОЛЬ_MYSQL
DB_NAME=animal_shelter
JWT_SECRET=будь-який-секретний-рядок-123
ANTHROPIC_API_KEY=ваш_ключ_від_claude_api
```

---

### Крок 3 — Запуск бекенду

```bash
# У папці backend
npm run dev
```

Сервер запуститься на http://localhost:5000

---

### Крок 4 — Налаштування та запуск фронтенду

Відкрийте **НОВИЙ** термінал:

```bash
# Перейти в папку frontend
cd frontend

# Встановити залежності (займе 2-5 хвилин)
npm install

# Запустити
npm start
```

Браузер відкриється автоматично на http://localhost:3000

---

##  Тестові акаунти

| Роль | Email | Пароль |
|------|-------|--------|
| Адміністратор | admin@shelter.ua | password |
| Власник притулку | owner@shelter.ua | password |
| Звичайний користувач | user@shelter.ua | password |

---

##  Структура проекту

```
animal-shelter/
├── backend/
│   ├── config/
│   │   ├── db.js          — підключення до MySQL
│   │   └── init.sql       — схема бази даних
│   ├── middleware/
│   │   └── auth.js        — JWT авторизація
│   ├── routes/
│   │   ├── auth.js        — реєстрація/вхід
│   │   ├── animals.js     — CRUD тварин
│   │   ├── applications.js — заявки
│   │   ├── shelters.js    — притулки
│   │   ├── users.js       — управління юзерами (адмін)
│   │   ├── stats.js       — статистика
│   │   ├── ai.js          — AI чат
│   │   └── posts.js       — новини
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Layout.js  — навігація/сайдбар
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── Dashboard.js
    │   │   ├── AnimalsPage.js
    │   │   ├── AnimalDetailPage.js
    │   │   ├── SheltersPage.js
    │   │   ├── ApplicationsPage.js
    │   │   ├── ShelterManagePage.js
    │   │   ├── AdminUsersPage.js
    │   │   ├── AdminStatsPage.js
    │   │   ├── AIAssistantPage.js
    │   │   ├── ProfilePage.js
    │   │   └── NewsPage.js
    │   ├── services/
    │   │   └── api.js     — всі API запити
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

##  Можливі проблеми

**Помилка підключення до БД:**
- Перевірте, чи запущено MySQL
- Перевірте пароль у .env файлі

**Порт 3000 зайнятий:**
- Натисніть Y коли запитає "Would you like to run on another port?"

**npm install помилки:**
```bash
npm install --legacy-peer-deps
```

**Помилка "Module not found":**
- Переконайтесь, що ви в правильній папці (backend або frontend)

---

##  Налаштування AI Помічника

Для роботи AI потрібен безкоштовний API ключ Claude:
1. Зареєструйтесь на https://console.anthropic.com
2. Створіть API ключ
3. Додайте у backend/.env: `ANTHROPIC_API_KEY=sk-ant-...`
4. Перезапустіть сервер

Без ключа AI виведе повідомлення про необхідність налаштування.
