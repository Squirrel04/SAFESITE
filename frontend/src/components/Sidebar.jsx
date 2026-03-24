import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Camera, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
        { path: '/cameras', icon: Camera, label: 'Cameras' },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900/40 backdrop-blur-3xl border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50 shadow-2xl">
            {/* Brand */}
            <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-900/20">
                <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl mr-3 shadow-lg shadow-cyan-500/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 skew-x-[-20deg] translate-x-[-150%] animate-[shine_3s_infinite]" />
                    <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">SafeSite</h1>
                    <p className="text-[10px] text-cyan-400 tracking-wider font-mono uppercase">Monitor Pro</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive
                                ? 'bg-cyan-500/10 text-cyan-400 shadow-sm border border-cyan-500/20'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                )}
                                <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-cyan-400' : 'group-hover:text-slate-300'}`} />
                                <span className={`font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-2xl transition-all duration-300 group"
                >
                    <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium tracking-wide">Secure Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
