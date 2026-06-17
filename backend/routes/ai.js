const express = require('express');
const router = express.Router();
const db = require('../config/db');
require('dotenv').config();

const SYSTEM_PROMPT = `Ти — AI-помічник платформи для допомоги безпритульним тваринам "CarePaw". 
Відповідай ТІЛЬКИ на питання пов'язані з тваринами: догляд, харчування, здоров'я, вакцинація, стерилізація, усиновлення, безпритульні тварини, притулки, породи.
Якщо питання НЕ стосується тварин — ввічливо відмов і поясни що можеш говорити тільки про тварин.
Відповідай українською мовою, дружньо та інформативно.`;

router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], user_id } = req.body;
    if (!message) return res.status(400).json({ message: 'Повідомлення не може бути порожнім' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ response: 'AI-помічник тимчасово недоступний. Не налаштовано API ключ.' });
    }

    // Формуємо історію для Gemini
    const contents = [];
    
    // Додаємо попередні повідомлення
    for (const h of history.slice(-8)) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      });
    }
    
    // Додаємо поточне повідомлення
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,       {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return res.json({ response: 'Виникла помилка при зверненні до AI. Спробуйте ще раз.' });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Не вдалося отримати відповідь';

    try {
      await db.query(
        'INSERT INTO ai_chats (user_id, user_message, ai_response) VALUES (?, ?, ?)',
        [user_id || null, message, aiResponse]
      );
    } catch {}

    res.json({ response: aiResponse });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;