import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

// Use the browser's built-in Web Speech API as a fallback
export function useDeepgramRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramConnectionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const fullTranscriptRef = useRef<string>('');

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
    setAudioLevel(average / 255);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const cleanup = useCallback(() => {
    // Stop media-recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Close Deepgram socket
    if (deepgramConnectionRef.current) {
      try {
        deepgramConnectionRef.current.close();
      } catch {
        // ignore
      }
      deepgramConnectionRef.current = null;
    }

    // Stop mic tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    analyserRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setConnectionStatus('connecting');

      // 1. Validate API key
      const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('Deepgram API key not found. Add VITE_DEEPGRAM_API_KEY to your .env');
      }
      const deepgram = createClient(apiKey);

      // 2. Ask for microphone
      // Request microphone without forcing a sampleRate. Some Bluetooth
      // headsets only support 8-16 kHz in hands-free mode; forcing 48 kHz can
      // result in a muted track or getUserMedia rejection. Let the browser
      // negotiate the best settings instead.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });
      streamRef.current = stream;

      // 3. Set up audio-level analyser (visual only)
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      updateAudioLevel();

      // 4. Open Deepgram live connection
      const dgConnection = deepgram.listen.live({
        model: 'nova-3',
        language: 'en-US',
        smart_format: true,
        interim_results: true,
        // Deepgram will auto-detect containerised WebM/Opus; omit encoding/sample_rate
      });
      deepgramConnectionRef.current = dgConnection;

      dgConnection.on(LiveTranscriptionEvents.Open, () => {
        console.log('🔊 Deepgram socket opened');
        setConnectionStatus('connected');
        setIsRecording(true);

        // Start MediaRecorder only after websocket is ready
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;

        recorder.addEventListener('dataavailable', async (evt) => {
          if (evt.data && evt.data.size > 0 && deepgramConnectionRef.current) {
            const buf = await evt.data.arrayBuffer();
            deepgramConnectionRef.current.send(buf);
          }
        });

        recorder.start(250); // emit chunks every 250 ms
      });

      dgConnection.on(LiveTranscriptionEvents.Transcript, (payload: any) => {
        const alt = payload?.channel?.alternatives?.[0];
        if (!alt?.transcript) return;

        if (payload.is_final) {
          fullTranscriptRef.current += alt.transcript + ' ';
        }
        const interim = payload.is_final ? '' : alt.transcript;
        setLiveTranscript(fullTranscriptRef.current + interim);
      });

      dgConnection.on(LiveTranscriptionEvents.Error, (err: any) => {
        console.error('Deepgram error', err);
        setError('Deepgram error: ' + (err?.message || 'unknown'));
        setConnectionStatus('error');
        cleanup();
      });

      dgConnection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram socket closed');
        setConnectionStatus('disconnected');
        setIsRecording(false);
      });
    } catch (e: any) {
      console.error('Failed to start recording', e);
      setError(e?.message || 'Failed to start recording');
      setConnectionStatus('error');
      cleanup();
      throw e;
    }
  }, [cleanup, updateAudioLevel]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    cleanup();
    setAudioLevel(0);
    setConnectionStatus('disconnected');
    setError(null);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioLevel,
    liveTranscript,
    connectionStatus,
    error
  };
}