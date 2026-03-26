const axios = require('axios');
const FormData = require('form-data');
const { formatUzbekVoiceError } = require('./uzbekVoiceError');

async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  const apiKey = process.env.UZBEKVOICEAI_API_KEY;
  const sttUrl = process.env.UZBEKVOICEAI_STT_URL;

  if (!apiKey || !sttUrl) {
    throw new Error('UzbekVoiceAI API key yoki URL sozlanmagan.');
  }

  const form = new FormData();
  form.append('file', audioBuffer, {
    filename: 'audio.webm',
    contentType: mimeType,
  });
  form.append('return_offsets', 'false');
  form.append('run_diarization', 'false');
  form.append('language', 'uz');
  form.append('blocking', 'true');

  let response;
  try {
    response = await axios.post(sttUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: apiKey,
      },
      timeout: 30000,
    });
  } catch (error) {
    throw new Error(formatUzbekVoiceError('STT xizmati', sttUrl, error));
  }

  const data = response.data;

  // Handle different possible response shapes
  const transcript =
    data?.text ||
    data?.transcript ||
    data?.result?.text ||
    data?.result?.conversation_text ||
    data?.result ||
    data?.data?.text ||
    '';

  if (typeof transcript === 'string') {
    return transcript.trim();
  }

  if (transcript == null) {
    return '';
  }

  return String(transcript).trim();
}

module.exports = { transcribeAudio };
