import React, { useState } from 'react';
import { 
    loginWithGoogle, 
    loginAnonymously, 
    loginDemoMode,
    registerWithEmail,
    loginWithEmail 
} from '../services/firebase';

interface LoginProps {
    isDarkMode?: boolean;
    toggleTheme?: () => void;
}

const Login: React.FC<LoginProps> = ({ isDarkMode, toggleTheme }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        if (isSignUp) {
            if (!displayName.trim()) throw new Error("Display Name is required.");
            await registerWithEmail(displayName, email, password);
        } else {
            await loginWithEmail(email, password);
        }
    } catch (err: any) {
        console.error("Email auth error:", err);
        let msg = err.message || "Authentication failed.";
        if (err.code === 'auth/email-already-in-use') msg = "Email is already in use.";
        if (err.code === 'auth/wrong-password') msg = "Invalid password.";
        if (err.code === 'auth/user-not-found') msg = "No account found.";
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
      setError(null);
      setLoading(true);
      try {
          await loginAnonymously();
      } catch (err: any) {
          setError("Guest login failed. Try Demo Mode.");
      } finally {
          setLoading(false);
      }
  };

  const handleDemoLogin = async () => {
      setError(null);
      setLoading(true);
      await loginDemoMode();
      setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-sans">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00a884] via-[#008f6f] to-[#111b21] animate-gradient bg-[length:200%_200%]"></div>
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      <div className="z-10 bg-white/90 dark:bg-[#202c33]/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-[420px] w-full flex flex-col items-center mx-4 border border-white/20 dark:border-gray-700 transition-colors duration-300">
        
        <div className="mb-6 text-center transform hover:scale-105 transition-transform duration-300">
           <div className="w-20 h-20 bg-[#00a884] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg rotate-3 hover:rotate-6 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
           </div>
           <h1 className="text-3xl font-light tracking-wide text-[#111b21] dark:text-[#e9edef]">Chat-I</h1>
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect instantly with Gemini AI</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg w-full border border-red-200 dark:border-red-800 flex items-center gap-2 animate-pulse">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
            </div>
        )}

        <form onSubmit={handleEmailAuth} className="w-full flex flex-col gap-3 mb-6">
            {isSignUp && (
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Display Name" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#111b21] border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] dark:text-[#e9edef] transition-all"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required={isSignUp}
                    />
                    <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
            )}
            <div className="relative">
                <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#111b21] border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] dark:text-[#e9edef] transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div className="relative">
                <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#111b21] border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a884] dark:text-[#e9edef] transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex justify-center"
            >
                {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                ) : (isSignUp ? 'Create Account' : 'Login')}
            </button>
        </form>

        <div className="w-full flex justify-center items-center mb-6 relative">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
             <span className="relative bg-white dark:bg-[#202c33] px-2 text-xs text-gray-400 font-medium">FAST ACCESS</span>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
            <button 
                onClick={handleGuestLogin}
                className="flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111b21] transition-colors"
            >
                Guest Login
            </button>
            <button 
                onClick={handleDemoLogin}
                className="flex items-center justify-center px-4 py-2 bg-[#111b21] text-[#00a884] border border-[#00a884] rounded-lg text-sm font-semibold hover:bg-[#0b141a] transition-colors"
            >
                ⚡ Demo Mode
            </button>
        </div>

        <div className="mt-8 text-center">
             <p className="text-sm text-gray-600 dark:text-gray-400">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <button 
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError(null);
                        setEmail('');
                        setPassword('');
                        setDisplayName('');
                    }}
                    className="ml-2 text-[#00a884] font-bold hover:underline"
                >
                    {isSignUp ? "Login" : "Sign Up"}
                </button>
             </p>
        </div>

      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 text-center w-full text-white/40 text-xs">
         &copy; 2025 Chat-I Web • Secure & Private
      </div>
      <style>{`
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient {
            animation: gradient 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;