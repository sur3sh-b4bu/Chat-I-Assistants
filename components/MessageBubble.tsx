import React from 'react';
import { ChatMessage, MessageType } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe }) => {
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAi = message.type === MessageType.AI;

  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}>
      <div 
        className={`relative max-w-[85%] sm:max-w-[65%] rounded-lg shadow-sm text-sm 
          ${isMe 
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none ml-auto' 
            : 'bg-white dark:bg-[#202c33] rounded-tl-none mr-auto'}
        `}
      >
        {/* Tail SVG */}
        <span className={`absolute top-0 z-[1] w-2 h-3 ${isMe ? '-right-2' : '-left-2'}`}>
            {isMe ? (
                <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="none" className="block fill-[#d9fdd3] dark:fill-[#005c4b]">
                    <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"/>
                </svg>
            ) : (
                <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="none" className="block fill-white dark:fill-[#202c33]">
                    <path d="M-2.288 1h5.187C5.451 1 4.7 2.156 5.82 3.568L12.288 12.193V1h-14.576z" transform="scale(-1, 1) translate(-8, 0)"/>
                </svg>
            )}
        </span>

        {/* Content Container */}
        <div className={`px-2 pt-1.5 pb-1 relative z-[2] overflow-hidden ${isAi ? 'pt-2' : ''}`}>
           
           {/* AI Header */}
           {isAi && (
             <div className="flex items-center gap-1.5 mb-1 text-[13px] font-medium text-[#00a884] dark:text-[#00a884] pb-1">
                <div className="w-5 h-5 rounded-full bg-[#e7fce3] dark:bg-[#0b141a]/50 flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M16.5 7.5h-9v9h9v-9z" opacity="0.3" />
                      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v3h3a.75.75 0 01.75.75v9a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75v-9a.75.75 0 01.75-.75h3v-3zM9 9v7.5h6V9H9z" clipRule="evenodd" />
                   </svg>
                </div>
                <span>Chat-I Assistant</span>
             </div>
           )}

           {/* Content Wrapper using Float Strategy for Metadata */}
           <div className="text-[#111b21] dark:text-[#e9edef] text-[14.2px] leading-[19px] whitespace-pre-wrap break-words relative">
               
               {/* Message Content */}
               {message.type === MessageType.TEXT || message.type === MessageType.AI ? (
                 <span>{message.content}</span>
               ) : null}

               {message.type === MessageType.IMAGE && (
                 <div className="mb-1 -ml-1 -mr-1 -mt-1 rounded-t-lg overflow-hidden">
                    <img src={message.content} alt="Media" className="w-full h-auto max-h-[350px] object-cover min-w-[200px]" />
                 </div>
               )}

               {message.type === MessageType.AUDIO && (
                 <div className="flex items-center gap-3 min-w-[220px] py-2 pr-2">
                    <div className="w-10 h-10 bg-[#f0f2f5] dark:bg-[#374248] rounded-full flex items-center justify-center text-[#54656f] dark:text-[#8696a0]">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                             <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                             <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                         </svg>
                    </div>
                    <audio controls src={message.content} className="h-8 w-[160px] opacity-80" />
                 </div>
               )}

               {/* Invisible Spacer to force wrapping if text ends near the time */}
               <span className="inline-block w-[72px] h-3 align-middle"></span>

               {/* Metadata: Floated Right */}
               <div className="float-right -mt-2.5 ml-1 flex items-center gap-1 relative top-1.5 h-4">
                  <span className="text-[11px] text-[#667781] dark:text-[#aebac1] font-medium min-w-fit">
                      {formatTime(message.timestamp)}
                  </span>
                  {isMe && (
                      <span className={`${message.status === 'seen' ? 'text-[#53bdeb]' : 'text-[#8696a0] dark:text-[#aebac1]'}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15" fill="currentColor">
                             <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-7.46a.366.366 0 0 0-.064-.54zm-4.72 2.741l-.478-.372a.365.365 0 0 0-.51.063L4.566 12.62a.32.32 0 0 1-.484.033L1.891 10.44a.319.319 0 0 0-.484.033l-.378.483a.418.418 0 0 0 .036.541l2.503 2.502c.143.14.361.125.484-.033l6.272-7.46a.366.366 0 0 0-.064-.54z"/>
                         </svg>
                      </span>
                  )}
               </div>

           </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;