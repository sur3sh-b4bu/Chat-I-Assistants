import React, { useEffect, useState, useRef } from 'react';
import { Chat, ChatMessage, AppUser, MessageType } from '../types';
import { subscribeToMessages, sendChatMessage } from '../services/firebase';
import { getGeminiTextResponse } from '../services/geminiService';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { AI_AVATAR, AI_NAME } from '../constants';
import LiveVoiceModal from './LiveVoiceModal';

interface ChatWindowProps {
  chat: Chat;
  currentUser: AppUser;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!chat.id) return;
    const unsubscribe = subscribeToMessages(chat.id, (msgs) => {
        setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!chat.isAiChat) return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    
    if (lastMsg && lastMsg.senderId === currentUser.uid && !loadingAi) {
        const generateAiReply = async () => {
            setLoadingAi(true);
            setIsTyping(true);
            try {
                const history = messages.map(m => ({
                    role: (m.senderId === currentUser.uid) ? 'user' : 'model',
                    parts: [{ text: m.type === MessageType.TEXT ? m.content : `[Sent a ${m.type}]` }]
                }));
                const aiHistory = history.map(h => ({
                    role: h.role as 'user' | 'model',
                    parts: h.parts
                }));
                const replyText = await getGeminiTextResponse(aiHistory);
                await sendChatMessage(chat.id, {
                    type: MessageType.AI,
                    content: replyText
                }, 'gemini-bot');
            } catch (error) {
                console.error("Failed to generate AI response", error);
            } finally {
                setIsTyping(false);
                setLoadingAi(false);
            }
        };
        generateAiReply();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, chat.isAiChat, currentUser.uid]);


  const handleSendMessage = async (type: MessageType, content: string) => {
    try {
        await sendChatMessage(chat.id, {
            type,
            content
        }, currentUser.uid);
    } catch (e) {
        console.error("Error sending message", e);
        alert("Failed to send message.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] w-full relative transition-colors">
       {isLiveModalOpen && (
           <LiveVoiceModal onClose={() => setIsLiveModalOpen(false)} />
       )}

      {/* Header */}
      <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 flex items-center justify-between shadow-sm shrink-0 z-20 transition-colors border-b border-[#e9edef] dark:border-none">
        <div className="flex items-center gap-3">
            <img 
              src={chat.isAiChat ? AI_AVATAR : 'https://picsum.photos/200'} 
              alt="Contact" 
              className="w-10 h-10 rounded-full object-cover shadow-sm cursor-pointer"
            />
            <div className="flex flex-col cursor-pointer">
                <span className="text-[#111b21] dark:text-[#e9edef] font-medium leading-tight">
                    {chat.isAiChat ? AI_NAME : 'User'}
                </span>
                <span className="text-xs text-[#667781] dark:text-[#8696a0] leading-tight">
                    {chat.isAiChat ? (isTyping ? 'typing...' : 'Online') : 'click for info'}
                </span>
            </div>
        </div>
        
        <div className="flex gap-4 items-center">
             {chat.isAiChat && (
                 <button 
                    onClick={() => setIsLiveModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-[#2a3942] text-[#008069] dark:text-[#00a884] rounded-full text-sm font-semibold border border-[#e9edef] dark:border-[#0b141a] shadow-sm hover:shadow-md hover:bg-[#f0f2f5] dark:hover:bg-[#32414a] transition-all active:scale-95"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 9.375v1.875h3.75a.75.75 0 010 1.5h-9a.75.75 0 010-1.5h3.75v-1.875A6.751 6.751 0 015.25 12.75v-1.5a.75.75 0 01.75-.75z" />
                    </svg>
                    <span>Live Voice</span>
                 </button>
             )}
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#54656f] dark:text-[#aebac1] cursor-pointer">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
             </svg>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#54656f] dark:text-[#aebac1] cursor-pointer">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
             </svg>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:px-16 md:py-6 space-y-1 relative z-10 custom-scrollbar"
      >
        {/* Background Image Layer */}
        <div 
            className="absolute inset-0 z-0 pointer-events-none opacity-60 dark:opacity-[0.06] mix-blend-overlay dark:mix-blend-normal transition-opacity duration-300"
            style={{ 
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
                backgroundRepeat: 'repeat',
                backgroundSize: '400px'
            }}
        ></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-1.5 pb-2">
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} isMe={msg.senderId === currentUser.uid} />
            ))}
            
            {isTyping && (
                <div className="flex justify-start mb-2 pl-2">
                    <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5 w-16">
                      <div className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-2 shrink-0 transition-colors z-20">
         <div className="max-w-4xl mx-auto">
            <ChatInput onSend={handleSendMessage} />
         </div>
      </div>
    </div>
    );
};

export default ChatWindow;