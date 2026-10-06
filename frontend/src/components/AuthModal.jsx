import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onSuccess }) {
  const { login, register } = useAuth();

  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (tab === 'login') {
        if (!email.trim() || !password) {
          setErrorMsg('Please enter both email and password.');
          setIsSubmitting(false);
          return;
        }
        await login(email.trim(), password);
      } else {
        if (!username.trim() || !email.trim() || !password) {
          setErrorMsg('Please fill in all required fields.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }
        await register(username.trim(), email.trim(), password);
      }

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 relative text-white">
        
        {/* Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
          >
            ✕
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF0000] to-[#FF4D4D] mx-auto flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#FF0000]/30">
            🎬
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {tab === 'login' 
              ? 'Log in to join watch parties and control synchronized playback.' 
              : 'Sign up for a free account to host or join YouTube Watch Parties.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#1A1A1A] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'login' 
                ? 'bg-[#FF0000] text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'register' 
                ? 'bg-[#FF0000] text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Username / Display Name</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Aman"
                className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#181818] border border-white/10 focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-[#FF0000]/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 pt-1">
          {tab === 'login' ? (
            <p>Don't have an account? <button type="button" onClick={() => setTab('register')} className="text-[#FF8080] hover:underline font-semibold cursor-pointer">Sign up now</button></p>
          ) : (
            <p>Already registered? <button type="button" onClick={() => setTab('login')} className="text-[#FF8080] hover:underline font-semibold cursor-pointer">Log in</button></p>
          )}
        </div>

      </div>
    </div>
  );
}
