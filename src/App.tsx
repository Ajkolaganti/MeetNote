import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, MessageCircle, BookOpen, History } from 'lucide-react';
import { Header } from './components/Header';
import { WaveAnimation } from './components/WaveAnimation';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { AnalysisPopup } from './components/AnalysisPopup';
import { ChatPopup } from './components/ChatPopup';
import { useDeepgramRecording } from './hooks/useDeepgramRecording';
import { useOpenAI } from './hooks/useOpenAI';
import { HistoryPopup } from './components/HistoryPopup';
import { MeetingHistoryPopup } from './components/MeetingHistoryPopup';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Persisted meeting history entry
interface HistoryItem {
  id: string;
  timestamp: string;
  transcript: string;
  analysis: string;
}

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'recording'>('home');
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [sessionAnalyses, setSessionAnalyses] = useState<string[]>([]);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionId] = useState(() => Date.now().toString());
  const [showHomeHistoryPopup, setShowHomeHistoryPopup] = useState(false);

  // Load meeting history from localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('meetingHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const saveToHistory = (transcriptData: string, analysisData: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      transcript: transcriptData,
      analysis: analysisData,
    };
    const updated = [...history, newItem];
    setHistory(updated);
    localStorage.setItem('meetingHistory', JSON.stringify(updated));
  };

  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    audioLevel, 
    liveTranscript,
    connectionStatus,
    error 
  } = useDeepgramRecording();

  const { generateAnalysis, sendChatMessage } = useOpenAI();

  useEffect(() => {
    if (liveTranscript) {
      setTranscript(liveTranscript);
    }
  }, [liveTranscript]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setCurrentView('recording');
      setTranscript('');
      setChatMessages([]);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSendForAnalysis = async () => {
    if (!transcript.trim()) {
      alert('No transcript available for analysis');
      return;
    }
    
    setIsAnalyzing(true);
    setShowAnalysisPopup(true);
    
    try {
      const result = await generateAnalysis(transcript, partial => {
        // stream partial tokens into state for live UI updates
        setAnalysis(partial);
      });
      setAnalysis(result); // ensure final result stored
      saveToHistory(transcript, result);
      setSessionAnalyses(prev => [...prev, result]);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis(
        "Sorry, I couldn't analyze the meeting transcript. Please check your OpenAI API key and try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await sendChatMessage(message, transcript, analysis);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat message failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please check your OpenAI API key.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setShowAnalysisPopup(false);
    setShowChatPopup(false);
    setShowHistoryPopup(false);
    setSessionAnalyses([]);
    if (isRecording) {
      stopRecording();
    }
  };

  const handleCloseAnalysis = () => {
    setShowAnalysisPopup(false);
  };

  const handleOpenChat = () => {
    setShowChatPopup(true);
    setShowAnalysisPopup(false);
    setShowHistoryPopup(false);
  };

  const handleCloseChat = () => {
    setShowChatPopup(false);
  };

  const handleOpenHistory = () => {
    setShowHistoryPopup(true);
    setShowAnalysisPopup(false);
    setShowChatPopup(false);
  };

  const handleCloseHistory = () => {
    setShowHistoryPopup(false);
  };

  const handleOpenHomeHistory = () => setShowHomeHistoryPopup(true);
  const handleCloseHomeHistory = () => setShowHomeHistoryPopup(false);

  if (currentView === 'home') {
    return (
      <div key="home" className="min-h-screen bg-neutral-950 text-white overflow-hidden">
        <div className="relative min-h-screen flex flex-col">
          <Header />
          
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-light mb-4 tracking-wide font-mono-bold">
                Good Evening!
              </h1>
              <p className="text-lg text-slate-300 max-w-md mx-auto leading-relaxed font-mono-transcript">
                How may I assist you today?
              </p>
            </div>
            
            <WaveAnimation />
            
            {/* Mic Button below the waveform */}
            <button
              onClick={handleStartRecording}
              aria-label="Start Meeting Assistant"
              className="mt-16 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-emerald-500/30 transition-all duration-300 transform hover:scale-110 active:scale-95 animate-fadeIn"
            >
              <Mic className="w-9 h-9" />
            </button>
            
            <p className="mt-6 text-sm text-neutral-400 font-mono-transcript animate-slideUp">
              Tap the mic to start live transcription and analysis
            </p>

            <button
              onClick={handleOpenHomeHistory}
              className="fixed bottom-6 right-6 w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors border border-slate-600"
            >
              <History className="w-6 h-6 text-slate-300" />
            </button>
          </div>
        </div>
        {showHomeHistoryPopup && (
          <MeetingHistoryPopup history={history} onClose={handleCloseHomeHistory} />
        )}
      </div>
    );
  }

  if (currentView === 'recording') {
    return (
      <div key="recording" className="min-h-screen bg-neutral-950 text-white animate-pageEnter">
        <div className="flex flex-col h-screen">
          <Header onBack={handleBackToHome} />
          
          <div className="flex-1 flex flex-col p-6 min-h-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  connectionStatus === 'error' ? 'bg-red-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-lg font-medium font-mono-bold">
                  {connectionStatus === 'connected' ? 'Recording Live' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'error' ? 'Error' :
                   'Disconnected'}
                </span>
              </div>
              
              {/* Placeholder to keep space; stop button moved below */}
              <div className="w-10"></div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-xl">
                <p className="text-red-300 text-sm font-mono-transcript">{error}</p>
              </div>
            )}

            <TranscriptDisplay 
              transcript={transcript}
              isRecording={isRecording}
              audioLevel={audioLevel}
            />

            {/* Bottom Action Buttons - Styled like the image */}
            <div className="mt-6 flex items-center justify-center gap-4">
              {/* Stop Recording Button */}
              <button
                onClick={handleStopRecording}
                aria-label="Stop Recording"
                className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-full flex items-center justify-center shadow-xl ring-4 ring-red-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <MicOff className="w-6 h-6" />
              </button>
              
              {/* Main Microphone Button */}
              <button
                onClick={handleSendForAnalysis}
                disabled={!transcript.trim()}
                className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl ring-4 ring-emerald-500/30"
              >
                <Send className="w-7 h-7" />
              </button>
              
              {/* Menu/Chat Button */}
              <button
                onClick={handleOpenChat}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors border border-slate-600"
              >
                <MessageCircle className="w-6 h-6 text-slate-300" />
              </button>

              {/* History Button */}
              <button
                onClick={handleOpenHistory}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors border border-slate-600"
              >
                <BookOpen className="w-6 h-6 text-slate-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Popup Overlay */}
        {showAnalysisPopup && (
          <AnalysisPopup
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onClose={handleCloseAnalysis}
            onStartChat={handleOpenChat}
          />
        )}

        {/* Chat Popup Overlay */}
        {showChatPopup && (
          <ChatPopup
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            onClose={handleCloseChat}
            isRecording={isRecording}
          />
        )}

        {/* History Popup Overlay */}
        {showHistoryPopup && (
          <HistoryPopup analyses={sessionAnalyses} onClose={handleCloseHistory} />
        )}
      </div>
    );
  }

  return null;
}

export default App;