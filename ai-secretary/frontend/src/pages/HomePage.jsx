import React, { useState, useCallback, useEffect, useRef } from 'react';
import MicButton from '../components/MicButton.jsx';
import StatusIndicator from '../components/StatusIndicator.jsx';
import ResponseBubble from '../components/ResponseBubble.jsx';
import { useAudioRecorder } from '../hooks/useAudioRecorder.js';
import { useAudioPlayer } from '../hooks/useAudioPlayer.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { useApp } from '../context/AppContext.jsx';
import { sendAudioForSTT, sendToAssistant, sendForTTS } from '../services/api.js';
import { convertAudioBlobToWav } from '../utils/audio.js';

const HINTS = [
  '"Soat nechchi?"',
  '"Yangi task qo\'sh: Loyihani tugatish"',
  '"Bugungi rejalarimni ko\'rsat"',
  '"3 da meetingim bor, har 5 minutda eslat"',
  '"Ertaga 8 da uyg\'ot"',
  '"Tasklarimni ko\'rsat"',
];

export default function HomePage() {
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  const [currentHint, setCurrentHint] = useState(0);
  const [ttsError, setTtsError] = useState(false);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder();
  const { playAudioBuffer, stopAudio } = useAudioPlayer();
  const { requestPermission } = useNotifications();
  const { handleAssistantResult } = useApp();

  const processingRef = useRef(false);

  // Rotate hints
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHint((i) => (i + 1) % HINTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const handleMicPress = useCallback(async () => {
    setError('');
    setTtsError(false);

    // If recording, stop and process
    if (isRecording) {
      setStatus('thinking');
      processingRef.current = true;

      try {
        const audioBlob = await stopRecording();
        if (!audioBlob || audioBlob.size < 500) {
          setStatus('ready');
          setError('Ovoz juda qisqa. Yana bir bor urinib ko\'ring.');
          processingRef.current = false;
          return;
        }

        // Step 1: STT
        const normalizedAudioBlob = await convertAudioBlobToWav(audioBlob);
        const sttResult = await sendAudioForSTT(normalizedAudioBlob);
        const transcript = sttResult.transcript?.trim();

        if (!transcript) {
          setStatus('ready');
          setError('Sizni yaxshi tushunmadim. Yana bir bor ayting.');
          processingRef.current = false;
          return;
        }

        // Step 2: Assistant (Gemini)
        const assistantResult = await sendToAssistant(transcript);
        handleAssistantResult(assistantResult);

        setResponse({
          transcript,
          replyText: assistantResult.replyText,
          intent: assistantResult.intent,
          uiData: assistantResult.uiData,
        });

        // Step 3: TTS - auto play
        setStatus('speaking');
        stopAudio();

        try {
          const audioBuffer = await sendForTTS(assistantResult.replyText);
          await playAudioBuffer(audioBuffer);
        } catch (ttsErr) {
          console.warn('TTS failed, showing text only:', ttsErr.message);
          setTtsError(true);
        }

        setStatus('ready');
      } catch (err) {
        console.error('Pipeline error:', err.message);
        setStatus('error');
        setError('Xatolik: ' + err.message);
        setTimeout(() => setStatus('ready'), 3000);
      } finally {
        processingRef.current = false;
      }
      return;
    }

    // Start recording
    if (processingRef.current) return;

    try {
      await startRecording();
      setStatus('listening');
      setResponse(null);
    } catch (err) {
      setStatus('error');
      setError(err.message);
      setTimeout(() => setStatus('ready'), 3000);
    }
  }, [isRecording, startRecording, stopRecording, sendAudioForSTT, sendToAssistant, sendForTTS, playAudioBuffer, stopAudio, handleAssistantResult]);

  const isDisabled = status === 'thinking' || status === 'speaking';
  const today = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.greeting}>Salom! 👋</h1>
          <p style={styles.date}>{today}</p>
        </div>
        <div style={styles.logoWrap}>
          <span style={styles.logo}>✨</span>
        </div>
      </div>

      {/* Status */}
      <div style={styles.statusRow}>
        <StatusIndicator status={status} />
      </div>

      {/* Response area */}
      <div style={styles.responseArea}>
        {response ? (
          <ResponseBubble
            transcript={response.transcript}
            replyText={response.replyText}
            intent={response.intent}
            uiData={response.uiData}
          />
        ) : (
          <div style={styles.hintBox}>
            <p style={styles.hintLabel}>Misol:</p>
            <p style={styles.hint} key={currentHint} className="fade-in">
              {HINTS[currentHint]}
            </p>
          </div>
        )}

        {ttsError && (
          <p style={styles.ttsNote}>⚠️ Ovoz ijrosi mavjud emas, matn ko'rsatildi.</p>
        )}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
      </div>

      {/* Mic button */}
      <div style={styles.micArea}>
        <p style={styles.micLabel}>
          {isRecording ? 'Gapiring... (bosib to\'xtating)' : 'Bosib gapiring'}
        </p>
        <MicButton status={status} onPress={handleMicPress} disabled={isDisabled} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 20px',
    paddingBottom: 'calc(var(--nav-height) + 20px)',
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
    gap: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  greeting: {
    fontFamily: 'var(--font-serif)',
    fontSize: 26,
    fontWeight: 400,
    color: 'var(--text-primary)',
    letterSpacing: -0.3,
    lineHeight: 1.2,
  },
  date: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--accent-muted)',
  },
  logo: { fontSize: 20 },
  statusRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  responseArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 200,
  },
  hintBox: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    padding: '18px 20px',
    border: '1px solid var(--border)',
    textAlign: 'center',
    width: '100%',
    maxWidth: 380,
  },
  hintLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  errorBox: {
    background: 'var(--danger-light)',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 16px',
    width: '100%',
    maxWidth: 380,
  },
  errorText: {
    fontSize: 13,
    color: 'var(--danger)',
    margin: 0,
    textAlign: 'center',
  },
  ttsNote: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  micArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 8,
  },
  micLabel: {
    fontSize: 13,
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontWeight: 400,
  },
};
