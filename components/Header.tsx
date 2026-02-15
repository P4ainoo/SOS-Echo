
import React from 'react';

interface HeaderProps {
  onLogout: () => void;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({ onLogout, userName }) => {
  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm no-print">
      <div className="flex items-center space-x-4">
        {/* Brand Logo Emblem Style (Page 1) */}
        <div className="flex flex-col items-start">
          <div className="flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-dark">
               <rect width="40" height="40" rx="8" fill="#1c325d"/>
               <path d="M12 28V20C12 18.8954 12.8954 18 14 18H16C17.1046 18 18 18.8954 18 20V28" stroke="white" strokeWidth="2"/>
               <circle cx="15" cy="14" r="3" fill="white"/>
               <path d="M22 28V20C22 18.8954 22.8954 18 24 18H26C27.1046 18 28 18.8954 28 20V28" stroke="white" strokeWidth="2"/>
               <circle cx="25" cy="14" r="3" fill="white"/>
               <path d="M20 22V28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tighter text-brand-dark leading-none">SOS CHILDREN'S</span>
              <span className="text-xs font-black uppercase tracking-tighter text-brand-dark leading-none">VILLAGES</span>
            </div>
          </div>
          <div className="h-0.5 w-full bg-brand-red mt-1"></div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 md:space-x-8">
        <div className="hidden lg:flex flex-col items-end">
           <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
              </span>
              <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Active Protection</span>
           </div>
        </div>
        
        <div className="flex items-center space-x-3 border-l border-slate-100 pl-4 md:pl-8">
          <div className="flex flex-col items-end mr-2 md:mr-3">
            <span className="text-xs font-black text-brand-dark leading-none truncate max-w-[120px] uppercase tracking-tight">{userName || 'Admin'}</span>
            <span className="text-[9px] text-brand-blue font-bold uppercase tracking-widest mt-1">Personnel Tunisie</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-red hover:bg-red-50 transition-all"
            title="Déconnexion"
          >
             <i className="fas fa-power-off"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
