function interleaveChannels(audioBuffer) {
  const channels = [];
  for (let index = 0; index < audioBuffer.numberOfChannels; index += 1) {
    channels.push(audioBuffer.getChannelData(index));
  }

  const length = audioBuffer.length;
  const interleaved = new Float32Array(length);

  for (let sampleIndex = 0; sampleIndex < length; sampleIndex += 1) {
    let sample = 0;
    for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
      sample += channels[channelIndex][sampleIndex] || 0;
    }
    interleaved[sampleIndex] = sample / channels.length;
  }

  return interleaved;
}

function encodeWav(samples, sampleRate) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset, value) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += bytesPerSample;
  }

  return buffer;
}

async function resampleToMono(audioBuffer, targetSampleRate) {
  if (typeof OfflineAudioContext === 'undefined') {
    return {
      samples: interleaveChannels(audioBuffer),
      sampleRate: audioBuffer.sampleRate,
    };
  }

  const frameCount = Math.ceil(audioBuffer.duration * targetSampleRate);
  const offlineContext = new OfflineAudioContext(1, frameCount, targetSampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  return {
    samples: renderedBuffer.getChannelData(0),
    sampleRate: renderedBuffer.sampleRate,
  };
}

export async function convertAudioBlobToWav(audioBlob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return audioBlob;
  }

  const audioContext = new AudioContextClass();

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const { samples, sampleRate } = await resampleToMono(decodedBuffer, 16000);
    const wavBuffer = encodeWav(samples, sampleRate);

    return new Blob([wavBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.warn('Audio conversion failed, using original blob:', error);
    return audioBlob;
  } finally {
    await audioContext.close().catch(() => {});
  }
}
