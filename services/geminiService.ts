import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_LIVE_MODEL } from '../constants';

// Initialize Gemini
// NOTE: In a real production app, ensure strict API key protection.
// The prompt assumes process.env.API_KEY is available.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

// --- Text Chat Service ---

export const getGeminiTextResponse = async (history: {role: 'user' | 'model', parts: {text: string}[]}[]): Promise<string> => {
  try {
    // We assume the last message in history is the new prompt from the user.
    // The previous messages form the history.
    if (history.length === 0) return "Hello!";

    // Extract last message
    const lastMsg = history[history.length - 1];
    const prevHistory = history.slice(0, -1);
    
    // Check for text content
    const promptText = lastMsg.parts.find(p => p.text)?.text;
    if (!promptText) return "I cannot process this message (no text).";

    const chatSession = ai.chats.create({
      model: GEMINI_TEXT_MODEL,
      history: prevHistory,
      config: {
        systemInstruction: "You are Chat-I, a helpful, witty, and concise AI assistant integrated into a messaging app. Keep responses brief and conversational, like a WhatsApp message.",
      }
    });
    
    const result = await chatSession.sendMessage({ message: promptText });
    return result.text || "I'm having trouble thinking right now.";
  } catch (error) {
    console.error("Gemini Text Error:", error);
    return "Sorry, I couldn't process that.";
  }
};

// --- Live Voice Service ---

// Audio Utils for Live API
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export class GeminiLiveClient {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private session: any = null; // Typing as any because session type isn't fully exported in simple usage
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private onStatusChange: (status: string) => void;
  private onAudioLevel: (level: number) => void;

  constructor(onStatusChange: (status: string) => void, onAudioLevel: (level: number) => void) {
    this.onStatusChange = onStatusChange;
    this.onAudioLevel = onAudioLevel;
  }

  async connect() {
    this.onStatusChange('connecting');
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: GEMINI_LIVE_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: "You are Chat-I, a helpful voice assistant.",
      },
      callbacks: {
        onopen: () => {
            this.onStatusChange('connected');
            this.processInput(stream, sessionPromise);
        },
        onmessage: (message: LiveServerMessage) => this.handleMessage(message),
        onclose: () => this.onStatusChange('disconnected'),
        onerror: (err) => {
            console.error(err);
            this.onStatusChange('error');
        },
      }
    });
    
    this.session = await sessionPromise;
  }

  private processInput(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputAudioContext) return;
    const source = this.inputAudioContext.createMediaStreamSource(stream);
    const processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for visualizer
      let sum = 0;
      for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      this.onAudioLevel(rms);

      const pcm16 = floatTo16BitPCM(inputData);
      const uint8 = new Uint8Array(pcm16.buffer);
      const base64 = uint8ArrayToBase64(uint8);
      
      sessionPromise.then(session => {
          session.sendRealtimeInput({
              media: {
                  mimeType: 'audio/pcm;rate=16000',
                  data: base64
              }
          });
      });
    };

    source.connect(processor);
    processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext) return;
    
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      const audioBytes = base64ToUint8Array(audioData);
      
      // Manual PCM decoding
      const dataInt16 = new Int16Array(audioBytes.buffer);
      const buffer = this.outputAudioContext.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputAudioContext.destination);
      
      // Simple queuing
      const currentTime = this.outputAudioContext.currentTime;
      if (this.nextStartTime < currentTime) {
          this.nextStartTime = currentTime;
      }
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      
      this.sources.add(source);
      source.onended = () => this.sources.delete(source);
    }
  }

  disconnect() {
    if (this.session) {
        try {
          this.session.close();
        } catch (e) {
          console.error("Error closing session", e);
        }
        this.session = null;
    }
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.onStatusChange('disconnected');
  }
}