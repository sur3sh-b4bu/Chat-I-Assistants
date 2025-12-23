import React, { useEffect, useState, useRef } from 'react';
import { GeminiLiveClient } from '../services/geminiService';
import { AI_AVATAR } from '../constants';

interface LiveVoiceModalProps {
  onClose: () => void;
}

const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ onClose }) => {
  const [status, setStatus] = useState('initializing');
  const [audioLevel, setAudioLevel] = useState(0);
  const clientRef = useRef<GeminiLiveClient | null>(null);

  useEffect(() => {
    clientRef.current = new GeminiLiveClient(
        (newStatus) => setStatus(newStatus),
        (level) => setAudioLevel(level)
    );
    clientRef.current.connect();
    return () => {
        clientRef.current?.disconnect();
    };
  }, []);

  const getVisualizerScale = () => {
    return 1 + Math.min(audioLevel * 6, 1.5);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-[#111b21]/90 backdrop-blur-xl w-full max-w-sm rounded-3xl p-10 flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 transform transition-all">
            
            <div className="absolute top-4 right-4">
                <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <h2 className="text-white text-lg font-medium mb-12 tracking-wider uppercase text-opacity-80">Gemini Live</h2>
            
            {/* Visualizer Circle */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-16">
                {/* Outer Glow */}
                <div 
                    className="absolute inset-0 bg-gradient-to-tr from-[#00a884] to-[#005c4b] rounded-full opacity-30 blur-2xl transition-transform duration-100 ease-linear"
                    style={{ transform: `scale(${getVisualizerScale() * 1.2})` }}
                ></div>
                
                {/* Inner Pulse */}
                <div 
                    className="absolute inset-0 border-2 border-[#00a884] rounded-full opacity-60 transition-transform duration-75 ease-out"
                    style={{ transform: `scale(${getVisualizerScale()})` }}
                ></div>
                
                {/* Avatar Container */}
                <div className="relative z-10 w-36 h-36 rounded-full overflow-hidden border-4 border-[#111b21] shadow-2xl">
                    <img 
                        src={AI_AVATAR} 
                        alt="AI" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#00a884]/10 mix-blend-overlay"></div>
                </div>
            </div>

            <div className="space-y-2 text-center mb-10 h-12">
                <p className="text-white/90 text-lg font-light">
                    {status === 'connecting' && "Connecting..."}
                    {status === 'connected' && (
                        <span className="flex items-center gap-2 justify-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            Listening...
                        </span>
                    )}
                    {status === 'error' && <span className="text-red-400">Connection Failed</span>}
                    {status === 'disconnected' && "Call Ended"}
                </p>
                {status === 'connected' && (
                    <p className="text-white/40 text-xs">Speak naturally, I'm listening.</p>
                )}
            </div>

            <div className="flex gap-6 w-full justify-center">
                <button 
                    onClick={onClose}
                    className="bg-red-500/90 hover:bg-red-600 text-white rounded-full p-5 shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 group-hover:rotate-12 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25z" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
  );
};

export default LiveVoiceModal;