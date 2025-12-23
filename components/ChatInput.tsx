import React, { useState, useRef, useEffect } from 'react';
import { MessageType } from '../types';
import { uploadFile } from '../services/firebase';

interface ChatInputProps {
  onSend: (type: MessageType, content: string) => void;
}

const COMMON_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", 
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛", 
  "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", 
  "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", 
  "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", 
  "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", 
  "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", 
  "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", 
  "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", 
  "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "👋", 
  "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", 
  "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", 
  "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", 
  "💪", "🧠", "👀", "👁", "👄", "💋", "❤️", "🧡", "💛", "💚", 
  "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", 
  "💗", "💖", "💘", "💝", "🔥", "✨", "🌟", "💫", "💥", "💯"
];

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleSendText = () => {
    if (!text.trim()) return;
    onSend(MessageType.TEXT, text);
    setText('');
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const url = await uploadFile(file, `chat-images/${Date.now()}_${file.name}`);
        onSend(MessageType.IMAGE, url);
      } catch (error) {
        console.error("Upload failed", error);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = await uploadFile(audioBlob, `chat-audio/${Date.now()}.webm`);
        onSend(MessageType.AUDIO, url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex items-end gap-2 h-full py-2 relative">
      
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div 
            ref={emojiRef}
            className="absolute bottom-16 left-0 bg-white dark:bg-[#1f2c34] shadow-[0_0_20px_rgba(0,0,0,0.15)] rounded-xl p-3 w-72 h-80 overflow-y-auto z-50 border border-gray-100 dark:border-[#2a3942] animate-in slide-in-from-bottom-5 duration-200"
        >
            <div className="grid grid-cols-6 gap-2">
                {COMMON_EMOJIS.map((emoji, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => addEmoji(emoji)}
                        className="text-xl p-1 hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded transition-colors"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Emoji Button */}
      <div className="pb-2">
        <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`text-[#54656f] dark:text-[#8696a0] p-2 hover:bg-gray-100 dark:hover:bg-[#374248] rounded-full transition-colors ${showEmojiPicker ? 'text-[#00a884] dark:text-[#00a884]' : ''}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
        </button>
      </div>

      {/* Attachment */}
      <div className="relative pb-2">
        <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            onChange={handleImageUpload}
        />
        <button className="text-[#54656f] dark:text-[#8696a0] p-2 hover:bg-gray-100 dark:hover:bg-[#374248] rounded-full transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transform rotate-45">
             <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
           </svg>
        </button>
      </div>

      {/* Input Field */}
      <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600 px-4 py-2 min-h-[42px] flex items-center transition-colors shadow-sm">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          className="w-full outline-none bg-transparent text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] text-[15px]"
        />
      </div>

      {/* Audio / Send Button */}
      <div className="pb-2">
        {text ? (
            <button onClick={handleSendText} className="text-[#54656f] dark:text-[#aebac1] p-2 hover:bg-gray-100 dark:hover:bg-[#374248] rounded-full transition-colors transform active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#00a884]">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
            </button>
        ) : (
            <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full transition-all duration-200 ${isRecording ? 'bg-red-500 text-white shadow-lg scale-110' : 'text-[#54656f] dark:text-[#8696a0] hover:bg-gray-100 dark:hover:bg-[#374248]'}`}
            >
            {isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 animate-pulse">
                    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 9.375v1.875h3.75a.75.75 0 010 1.5h-9a.75.75 0 010-1.5h3.75v-1.875A6.751 6.751 0 015.25 12.75v-1.5a.75.75 0 01.75-.75z" />
                </svg>
            )}
            </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;