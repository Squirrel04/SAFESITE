import React from 'react';
import { Bell, Search, User, ShieldCheck } from 'lucide-react';

const TopBar = () => {
    return (
            <header className="h-20 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30 ml-64 shadow-sm">
            {/* Search / Breadcrumb Placeholder */}
            <div className="flex items-center">
                <div className="relative group">
                    <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search monitoring..."
                        className="bg-slate-950/50 border border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-slate-200 focus:ring-1 focus:ring-cyan-500 outline-none w-80 transition-all font-medium placeholder-slate-600 focus:border-cyan-500/50 shadow-inner"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-5">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-semibold tracking-wide uppercase">System Secure</span>
                </div>

                <div className="h-8 w-px bg-slate-800"></div>

                <button className="relative p-2.5 text-slate-400 hover:text-cyan-400 transition-colors rounded-xl hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></span>
                </button>

                <div className="flex items-center space-x-3 cursor-pointer p-1.5 pr-4 rounded-xl hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-slate-600 shadow-inner group-hover:border-cyan-500/50 transition-colors">
                        <User className="w-4 h-4 text-slate-300 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <div>
                        <p className="text-slate-200 font-semibold leading-none text-sm group-hover:text-white transition-colors">Admin User</p>
                        <p className="text-slate-500 text-[11px] mt-1 font-mono tracking-wider">SUPERVISOR</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
