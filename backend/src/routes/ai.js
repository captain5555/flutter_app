const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/permission');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

// Get AI settings
router.get('/settings', authenticateToken, asyncHandler(async (req, res) => {
  const settings = await db.getAISettings();
  sendSuccess(res, {
    api_url: settings?.api_url || '',
    api_key: settings?.api_key || '',
    model: settings?.model || '',
    title_prompt: settings?.title_prompt || '',
    description_prompt: settings?.description_prompt || '',
    safety_rules: settings?.safety_rules || '',
    replacement_words: settings?.replacement_words || ''
  });
}));

// Save AI settings (admin only)
router.put('/settings', authenticateToken, asyncHandler(async (req, res) => {
  if (!isAdmin(req)) {
    return sendError(res, 'Permission denied', 403);
  }

  const { api_url, api_key, model, title_prompt, description_prompt, safety_rules, replacement_words } = req.body;

  await db.saveAISettings({
    api_url: api_url || '',
    api_key: api_key || '',
    model: model || '',
    title_prompt: title_prompt || '',
    description_prompt: description_prompt || '',
    safety_rules: safety_rules || '',
    replacement_words: replacement_words || ''
  });

  sendSuccess(res, { success: true });
}));

// Call AI API helper
async function callAIAPI(settings, prompt, imageBase64) {
  const https = require('https');
  const http = require('http');
  const url = require('url');

  return new Promise((resolve, reject) => {
    try {
      let apiUrl = settings.api_url;
      if (!apiUrl.includes('/chat/completions')) {
        if (apiUrl.includes('ark.cn-beijing.volces.com')) {
          if (apiUrl.includes('/api/coding/v3')) {
            apiUrl = apiUrl.replace('/api/coding/v3', '/api/v3/chat/completions');
          } else if (!apiUrl.includes('/api/v3')) {
            apiUrl = apiUrl.replace(/\/api(?!.*\/api)/, '/api/v3/chat/completions');
          } else {
            apiUrl = apiUrl + '/chat/completions';
          }
        } else if (apiUrl.endsWith('/')) {
          apiUrl = apiUrl + 'chat/completions';
        } else if (apiUrl.endsWith('/v3')) {
          apiUrl = apiUrl + '/chat/completions';
        } else if (!apiUrl.includes('/v3/')) {
          apiUrl = apiUrl.replace(/\/api(?!.*\/api)/, '/api/v3/chat/completions');
          if (!apiUrl.includes('/chat/completions')) {
            apiUrl = apiUrl + '/v3/chat/completions';
          }
        } else {
          apiUrl = apiUrl + '/chat/completions';
        }
      }

      const parsedUrl = new URL(apiUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      let messagesContent;
      if (imageBase64) {
        messagesContent = [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: imageBase64 }
          }
        ];
      } else {
        messagesContent = prompt;
      }

      const requestBody = JSON.stringify({
        model: settings.model || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: messagesContent
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.api_key}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const reqAI = client.request(options, (resAI) => {
        let data = '';
        resAI.on('data', (chunk) => {
          data += chunk;
        });
        resAI.on('end', () => {
          try {
            if (resAI.statusCode >= 200 && resAI.statusCode < 300) {
              const result = JSON.parse(data);
              if (result.choices && result.choices.length > 0) {
                resolve(result.choices[0].message.content.trim());
              } else {
                resolve('AI返回格式异常');
              }
            } else {
              reject(new Error(`API请求失败: ${resAI.statusCode} - ${data}`));
            }
          } catch (e) {
            reject(new Error('解析AI响应失败'));
          }
        });
      });

      reqAI.on('error', (e) => reject(e));
      reqAI.write(requestBody);
      reqAI.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Apply safety rules and replacement words
function applySafetyRules(text, settings) {
  let result = text;

  if (settings.replacement_words) {
    try {
      const replacements = JSON.parse(settings.replacement_words);
      if (Array.isArray(replacements)) {
        replacements.forEach(item => {
          if (item.original && item.replacement) {
            const regex = new RegExp(item.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, item.replacement);
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse replacement words:', e);
    }
  }

  return result;
}

// Generate title
router.post('/generate-title', authenticateToken, asyncHandler(async (req, res) => {
  const { image, current_title } = req.body;
  const settings = await db.getAISettings();

  if (!settings?.api_url || !settings?.api_key) {
    return sendError(res, 'Please configure AI API settings first');
  }

  let prompt = settings.title_prompt || '请生成一个标题';
  if (current_title && current_title.trim()) {
    if (image) {
      prompt = `参考以下标题和图片，优化或重新生成一个标题。现有标题：${current_title}\n\n${prompt}`;
    } else {
      prompt = `参考以下标题，优化或重新生成一个标题。现有标题：${current_title}`;
    }
  }

  try {
    let title = await callAIAPI(settings, prompt, image);
    title = applySafetyRules(title, settings);
    sendSuccess(res, { title });
  } catch (apiErr) {
    sendSuccess(res, { title: '【API调用失败，请检查配置】' + apiErr.message });
  }
}));

// Generate description
router.post('/generate-description', authenticateToken, asyncHandler(async (req, res) => {
  const { image, current_description } = req.body;
  const settings = await db.getAISettings();

  if (!settings?.api_url || !settings?.api_key) {
    return sendError(res, 'Please configure AI API settings first');
  }

  let prompt = settings.description_prompt || '请生成一段文案';
  if (current_description && current_description.trim()) {
    if (image) {
      prompt = `参考以下文案和图片，优化或重新生成一段文案。现有文案：${current_description}\n\n${prompt}`;
    } else {
      prompt = `参考以下文案，优化或重新生成一段文案。现有文案：${current_description}`;
    }
  }

  try {
    let description = await callAIAPI(settings, prompt, image);
    description = applySafetyRules(description, settings);
    sendSuccess(res, { description });
  } catch (apiErr) {
    sendSuccess(res, { description: '【API调用失败，请检查配置】' + apiErr.message });
  }
}));

// Translate text
router.post('/translate', authenticateToken, asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return sendError(res, 'Please provide text to translate');
  }

  const settings = await db.getAISettings();

  if (!settings?.api_url || !settings?.api_key) {
    return sendError(res, 'Please configure AI API settings first');
  }

  const translatePrompt = `Please translate the following text into American English. Use natural, colloquial American expressions and phrasing. Maintain the original meaning but adapt it to sound natural for American readers. Only return the translated text, no explanations:\n\n${text}`;

  try {
    const translated = await callAIAPI(settings, translatePrompt, null);
    sendSuccess(res, { translated });
  } catch (apiErr) {
    sendError(res, 'Translation failed: ' + apiErr.message);
  }
}));

module.exports = router;
