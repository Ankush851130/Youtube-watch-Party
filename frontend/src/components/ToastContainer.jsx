import React from 'react';
import { useSocket } from '../context/SocketContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useSocket();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="pointer-events-auto bg-[#181818]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 text-xs transition-all duration-300"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-2 h-2 rounded-full ${
              toast.type === 'error' ? 'bg-red-500' : toast.type === 'warning' ? 'bg-amber-400' : toast.type === 'success' ? 'bg-emerald-400' : 'bg-[#FF4D4D]'
            } animate-pulse`}></span>
            <p className="text-slate-200 truncate">{toast.message}</p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="text-[#AAAAAA] hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
