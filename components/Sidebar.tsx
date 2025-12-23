import React, { useEffect, useState } from 'react';
import { AppUser, Chat } from '../types';
import { logoutUser, subscribeToChats } from '../services/firebase';
import { AI_NAME, AI_AVATAR } from '../constants';

interface SidebarProps {
  currentUser: AppUser;
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onSelectChat, selectedChatId, isDarkMode, toggleTheme }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!currentUser.uid) return;
    const unsubscribe = subscribeToChats(currentUser.uid, (fetchedChats) => {
        setChats(fetchedChats);
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  const filteredChats = chats.filter(chat => {
    if (chat.isAiChat) return true; 
    if (searchTerm) {
        return (chat.isAiChat && AI_NAME.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return true; 
  });

  return (
    <div className="flex flex-col h-full border-r border-[#e9edef] dark:border-[#202c33] bg-white dark:bg-[#111b21] w-full md:w-[35%] lg:w-[30%] min-w-[320px] transition-colors relative z-20">
      {/* Header */}
      <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center justify-between shrink-0 transition-colors border-r border-[#e9edef] dark:border-[#202c33]">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img 
              src={currentUser.photoURL || 'https://via.placeholder.com/40'} 
              alt="Me" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-[#111b21]"
            />
            <span className="font-semibold text-[#111b21] dark:text-[#e9edef] hidden sm:block truncate max-w-[120px]">
                {currentUser.displayName}
            </span>
        </div>
        
        <div className="flex gap-3 items-center text-[#54656f] dark:text-[#aebac1]">
           {/* Theme Toggle */}
           <button 
             onClick={toggleTheme} 
             title="Toggle Theme"
             className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
           >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
           </button>

           <button 
             title="Logout" 
             onClick={() => logoutUser()}
             className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
             </svg>
           </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 bg-white dark:bg-[#111b21] border-b border-[#f0f2f5] dark:border-[#202c33] transition-colors relative">
         <div className="bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg flex items-center px-4 py-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-[#54656f] dark:text-[#8696a0] mr-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="bg-transparent border-none outline-none text-[15px] w-full text-[#3b4a54] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111b21] transition-colors custom-scrollbar">
        {filteredChats.map((chat) => (
          <div 
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`
              flex items-center px-4 py-3 cursor-pointer transition-all duration-200 group relative
              ${selectedChatId === chat.id ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'}
            `}
          >
            <div className="relative">
                <img 
                src={chat.isAiChat ? AI_AVATAR : 'https://picsum.photos/200'} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full mr-3 object-cover shadow-sm group-hover:scale-105 transition-transform"
                />
                {chat.isAiChat && (
                    <div className="absolute bottom-0 right-3 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#111b21] rounded-full"></div>
                )}
            </div>
            <div className="flex-1 min-w-0 border-b border-[#f0f2f5] dark:border-[#222d34] pb-3 -mb-3 group-hover:border-transparent">
               <div className="flex justify-between items-baseline mb-0.5">
                 <h3 className="text-[#111b21] dark:text-[#e9edef] font-normal truncate text-[17px]">
                    {chat.isAiChat ? AI_NAME : 'Unknown Contact'}
                 </h3>
                 <span className="text-xs text-[#667781] dark:text-[#8696a0]">
                    {chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                 </span>
               </div>
               <div className="flex justify-between items-center">
                 <p className="text-sm text-[#667781] dark:text-[#8696a0] truncate pr-2 w-[90%]">
                    {chat.isAiChat && <span className="text-[#00a884] mr-1">✓</span>}
                    {chat.lastMessage || 'No messages yet'}
                 </p>
               </div>
            </div>
          </div>
        ))}
        {filteredChats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center opacity-50 mt-10">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                   <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-sm text-[#667781] dark:text-[#8696a0]">No chats found.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;