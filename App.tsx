import React, { useEffect, useState } from 'react';
import { getUserProfile, onAuthChange, ensureAiChat } from './services/firebase';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { AppUser, Chat } from './types';

function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Ensure we have the full profile
        let profile = await getUserProfile(firebaseUser.uid);
        if(!profile) {
             profile = {
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL
             };
        }
        setUser(profile);
        
        // Ensure Gemini Chat Exists (safely via service)
        try {
            await ensureAiChat(firebaseUser.uid);
        } catch (e) {
            console.warn("Could not create AI chat:", e);
        }

      } else {
        setUser(null);
        setSelectedChat(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#e9edef] dark:bg-[#111b21] flex-col gap-4">
             <div className="w-12 h-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
             <div className="text-[#00a884] font-medium">Loading Chat-I...</div>
        </div>
    );
  }

  if (!user) {
    return <Login isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="flex h-screen w-full mx-auto max-w-[1600px] bg-[#d1d7db] dark:bg-[#0b141a] relative transition-colors duration-200">
      {/* Background Strip (Green) */}
      <div className="absolute top-0 w-full h-32 bg-[#00a884] dark:bg-[#00a884] z-0 hidden lg:block transition-colors"></div>
      
      <div className="z-10 flex w-full h-full lg:h-[95%] lg:my-auto lg:rounded-lg overflow-hidden shadow-2xl bg-white dark:bg-[#111b21] dark:border dark:border-[#202c33]">
          <Sidebar 
            currentUser={user} 
            onSelectChat={setSelectedChat} 
            selectedChatId={selectedChat?.id}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
          
          {selectedChat ? (
            <ChatWindow chat={selectedChat} currentUser={user} />
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#222e35] border-b-[6px] border-[#25d366] dark:border-[#00a884] transition-colors">
                <div className="mb-8">
                     {/* Dynamic Illustration for Empty State */}
                     {isDarkMode ? (
                        <svg viewBox="0 0 24 24" className="w-64 h-64 text-[#374248]" fill="currentColor">
                           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" opacity="0.5"/>
                        </svg>
                     ) : (
                        <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae.svg" alt="Welcome" className="w-64 opacity-60" />
                     )}
                </div>
                <h1 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-4">Chat-I Web</h1>
                <p className="text-[#667781] dark:text-[#8696a0] text-sm text-center max-w-md">
                    Send and receive messages with Gemini AI support.<br/>
                    Try the Live Voice feature for real-time conversation.
                </p>
                <div className="mt-10 flex items-center gap-2 text-[#8696a0] text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>
                    End-to-end encrypted
                </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default App;