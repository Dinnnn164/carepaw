const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Поки не підключено власний домен, листи можна надсилати лише з onboarding@resend.dev
const FROM = 'CarePaw <onboarding@resend.dev>';

async function sendMail(to, subject, html) {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message || err);
    return false;
  }
}

async function sendWelcomeEmail(to, name) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #FF6B35;">Вітаємо у CarePaw, ${name}!</h2>
      <p>Ваш акаунт успішно створено. Тепер ви можете переглядати тварин, подавати заявки на усиновлення та спілкуватись з нашим AI-помічником.</p>
      <p style="color: #6B7280; font-size: 0.9em;">Якщо це не ви реєструвались — просто ігноруйте цей лист.</p>
    </div>
  `;
  return sendMail(to, 'Вітаємо у CarePaw — реєстрацію підтверджено', html);
}

async function sendApplicationStatusEmail(to, name, animalName, status) {
  const statusLabels = {
    approved: 'Заявку схвалено! ',
    rejected: 'Заявку відхилено',
    reviewing: 'Заявка на розгляді',
  };
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #FF6B35;">${statusLabels[status] || 'Статус заявки оновлено'}</h2>
      <p>Шановний(а) ${name}, статус вашої заявки на тварину <b>${animalName}</b> змінено.</p>
      <p>Перейдіть у свій кабінет на CarePaw, щоб дізнатись деталі.</p>
    </div>
  `;
  return sendMail(to, `CarePaw — оновлення заявки на ${animalName}`, html);
}

async function sendAnimalStatusEmail(to, name, animalName, status) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #2D6A4F;">Оновлення про тварину</h2>
      <p>Шановний(а) ${name}, статус тварини <b>${animalName}</b> у вашому притулку змінено на: <b>${status}</b>.</p>
    </div>
  `;
  return sendMail(to, `CarePaw — статус тварини ${animalName} оновлено`, html);
}

module.exports = {
  sendWelcomeEmail,
  sendApplicationStatusEmail,
  sendAnimalStatusEmail,
};