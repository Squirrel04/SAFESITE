import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        if (showProfileDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileDropdown]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-20 bg-slate-950/50 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-8 sticky top-0 z-30 ml-64 shadow-md">
            {/* Search / Breadcrumb Placeholder */}
            <div className="flex items-center">
                <div className="relative group">
                    <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search monitoring..."
                        className="bg-slate-900/50 border border-slate-800/80 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-slate-200 focus:ring-1 focus:ring-amber-500/50 outline-none w-80 transition-all font-medium placeholder-slate-600 focus:border-amber-500/50 shadow-inner"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-5">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-semibold tracking-wide uppercase">System Secure</span>
                </div>

                <div className="h-8 w-px bg-slate-800"></div>

                <div className="relative" ref={dropdownRef}>
                    <div 
                        className="flex items-center space-x-3 cursor-pointer p-1.5 pr-4 rounded-xl hover:bg-slate-900/80 border border-transparent hover:border-slate-800 transition-all group"
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    >
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700 shadow-inner group-hover:border-amber-500/50 transition-colors">
                            <User className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
                        </div>
                        <div className="flex items-center">
                            <div>
                                <p className="text-slate-200 font-semibold leading-none text-sm group-hover:text-white transition-colors">{user?.username || 'Admin User'}</p>
                                <p className="text-amber-500/70 text-[11px] mt-1 font-mono tracking-wider">SUPERVISOR</p>
                            </div>
                            <ChevronDown className={`w-4 h-4 ml-3 text-slate-500 transition-transform ${showProfileDropdown ? 'rotate-180 text-amber-500' : 'group-hover:text-slate-400'}`} />
                        </div>
                    </div>

                    <AnimatePresence>
                        {showProfileDropdown && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-56 p-2 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl z-20 backdrop-blur-xl"
                            >
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-4 py-3 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors font-medium text-sm group"
                                >
                                    <LogOut className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
                                    Log Out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default TopBar;

