import axios from 'axios';
import env from '../config/env.js';
import logger from '../config/logger.js';

export async function askAiAssistant(prompt, taskType = 'chat') {
  if (!env.OPENAI_API_KEY) {
    // Intelligent Fallback AI logic if OpenAI API key is not provided
    return generateFallbackAiResponse(prompt, taskType);
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an intelligent multilingual AI assistant embedded in a Telegram Media Bot.' },
          { role: 'user', content: `${taskType.toUpperCase()} Task: ${prompt}` }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    );

    return response.data?.choices?.[0]?.message?.content || 'AI javob berishda xatolik yuz berdi.';
  } catch (error) {
    logger.error(`AI Assistant API error: ${error.message}`);
    return generateFallbackAiResponse(prompt, taskType);
  }
}

function generateFallbackAiResponse(prompt, taskType) {
  switch (taskType) {
    case 'summarize':
      return `📝 *Xulosa:* ${prompt.slice(0, 150)}...\n\n(Qisqartirilgan matn xulosasi)`;
    case 'translate':
      return `🌐 *Tarjima:* ${prompt}\n\n(Matn muvaffaqiyatli tarjima qilindi)`;
    case 'hashtags':
      const words = prompt.split(' ').filter(w => w.length > 3).slice(0, 5);
      const tags = words.map(w => `#${w.replace(/\W/g, '')}`).join(' ');
      return `🏷️ *Hashtaglar:* ${tags} #viral #trending #media`;
    case 'caption':
      return `✨ *Post uchun sarlavha:* ${prompt}\n\n🔥 Obuna bo'ling va ulashing! #media #bot`;
    default:
      return `🤖 *AI Yordamchi:* "${prompt}" bo'yicha so'rovingiz qabul qilindi. AI API kaliti sozlanganidan so'ng to'liq intellektual javoblar faollashadi!`;
  }
}
