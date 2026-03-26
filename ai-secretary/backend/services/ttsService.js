const axios = require('axios');
const { formatUzbekVoiceError } = require('./uzbekVoiceError');

function parseJsonBuffer(buffer) {
  try {
    return JSON.parse(Buffer.from(buffer).toString('utf8'));
  } catch {
    return null;
  }
}

async function synthesizeSpeech(text) {
  const apiKey = process.env.UZBEKVOICEAI_API_KEY;
  const ttsUrl = process.env.UZBEKVOICEAI_TTS_URL;
  const ttsModel = process.env.UZBEKVOICEAI_TTS_MODEL || 'lola';

  if (!apiKey || !ttsUrl) {
    throw new Error('UzbekVoiceAI API key yoki TTS URL sozlanmagan.');
  }

  let response;
  try {
    response = await axios.post(
      ttsUrl,
      {
        text,
        model: ttsModel,
        blocking: 'true',
      },
      {
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );
  } catch (error) {
    throw new Error(formatUzbekVoiceError('TTS xizmati', ttsUrl, error));
  }

  const contentType = response.headers?.['content-type'] || '';
  const payload =
    contentType.includes('application/json') || contentType.includes('text/json')
      ? parseJsonBuffer(response.data)
      : null;

  const audioUrl = payload?.result?.url || payload?.url || payload?.data?.url;
  if (audioUrl) {
    let audioResponse;
    try {
      audioResponse = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });
    } catch (error) {
      throw new Error(formatUzbekVoiceError('TTS audio yuklash', audioUrl, error));
    }

    return audioResponse.data;
  }

  return response.data;
}

module.exports = { synthesizeSpeech };
