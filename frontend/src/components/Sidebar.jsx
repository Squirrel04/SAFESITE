import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Camera, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { useNotifications } from '../context/NotificationContext';
import { Bell, XCircle } from 'lucide-react';

const Sidebar = () => {
    const { logout } = useAuth();
    const { alerts, dismissAlert } = useNotifications();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/alerts', icon: AlertTriangle, label: 'Evidence' },
        { path: '/cameras', icon: Camera, label: 'Cameras' },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900/40 backdrop-blur-3xl border-r border-slate-800 flex flex-col fixed left-0 top-0 z-40 shadow-2xl">
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
            <nav className="py-6 px-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive
                                ? 'bg-cyan-500/10 text-cyan-400 shadow-sm border border-cyan-500/20'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                )}
                                <item.icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-cyan-400' : 'group-hover:text-slate-300'}`} />
                                <span className={`text-sm font-medium tracking-wide ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Recent Alerts Panel */}
            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800/50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Recent Alerts</h2>
                    <Bell className="w-3 h-3 text-cyan-500/50" />
                </div>
                <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6 custom-scrollbar">
                    {alerts.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-[10px] text-slate-600 font-medium italic">No active alerts</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div 
                                key={alert.id}
                                className={`p-3 rounded-xl border transition-all duration-300 group ${
                                    alert.severity === 'high' 
                                    ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30' 
                                    : 'bg-orange-500/5 border-orange-500/10 hover:border-orange-500/30'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <p className={`text-[11px] font-bold truncate ${
                                            alert.severity === 'high' ? 'text-rose-400' : 'text-orange-400'
                                        }`}>
                                            {alert.alert_type}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                            {alert.message}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => dismissAlert(alert.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400 transition-all"
                                        title="Ignore"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center text-[8px] text-slate-600 font-mono">
                                    <span className="bg-slate-800 px-1.5 py-0.5 rounded mr-auto">CAM 0{alert.camera_id}</span>
                                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

export default Sidebar;
