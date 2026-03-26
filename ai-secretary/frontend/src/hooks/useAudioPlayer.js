import { useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const audioRef = useRef(null);

  const playAudioBuffer = useCallback(async (arrayBuffer) => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };

    try {
      await audio.play();
    } catch (err) {
      console.warn('Autoplay failed:', err.message);
      URL.revokeObjectURL(url);
      throw err;
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  return { playAudioBuffer, stopAudio };
}
