import { useState, useRef, useCallback } from 'react';

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
    setAudioLevel(average / 255);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone without forcing a fixed sampleRate so that
      // browsers can choose the most compatible settings for the currently
      // selected input device (e.g. built-in mic, wired headset, or Bluetooth
      // hands-free profile). For some Bluetooth devices, forcing an
      // unsupported sample-rate can cause the media stream to fail silently
      // which leads to missing audio in the live transcript.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;

      // Set up audio analysis
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      updateAudioLevel();

      // Set up MediaRecorder for potential future use
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }, [updateAudioLevel]);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    mediaRecorderRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioLevel
  };
}