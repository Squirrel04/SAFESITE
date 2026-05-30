import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Camera, Settings, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { useNotifications } from '../context/NotificationContext';
import { Bell, XCircle, Trash2 } from 'lucide-react';

const Sidebar = () => {
    const { logout } = useAuth();
    const { alerts, dismissAlert, clearAllAlerts, isDeleting } = useNotifications();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/alerts', icon: AlertTriangle, label: 'Evidence' },
        { path: '/cameras', icon: Camera, label: 'Cameras' },
        { path: '/review', icon: Brain, label: 'Intelligence' },
    ];

    const getSeverityColor = (alert) => {
        const t = (alert.alert_type || '').toLowerCase();
        if (t.includes('danger') || t.includes('zone') || t.includes('unauthorized')) {
            return 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/60';
        }
        if (alert.severity === 'high') {
            return 'bg-red-500/10 border-red-500/30 hover:border-red-500/60';
        }
        return 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50';
    };

    const getLabelColor = (alert) => {
        const t = (alert.alert_type || '').toLowerCase();
        if (t.includes('danger') || t.includes('zone') || t.includes('unauthorized')) return 'text-purple-400';
        if (alert.severity === 'high') return 'text-red-400';
        return 'text-amber-400';
    };

    return (
        <div className="h-screen w-64 bg-slate-950/80 backdrop-blur-3xl border-r border-slate-800/50 flex flex-col fixed left-0 top-0 z-40 shadow-2xl">
            {/* Brand */}
            <div className="h-20 flex items-center px-6 border-b border-slate-800/50 bg-slate-900/50">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl mr-3 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center relative overflow-hidden">
                    <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">SafeSite</h1>
                    <p className="text-[10px] text-amber-500/80 tracking-wider font-semibold uppercase">Monitor Pro</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="py-6 px-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-amber-600/20 to-orange-500/5 text-amber-400 border border-amber-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                                )}
                                <item.icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-amber-400' : 'group-hover:text-slate-300'}`} />
                                <span className={`text-sm font-medium tracking-wide ${isActive ? 'font-semibold text-amber-400' : ''}`}>{item.label}</span>
                                {item.label === 'Evidence' && alerts.length > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {alerts.length > 99 ? '99+' : alerts.length}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Recent Alerts Panel */}
            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800/50">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Recent Alerts</h2>
                        {alerts.length > 0 && (
                            <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-red-500/30">
                                {alerts.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Bell className="w-3 h-3 text-amber-500/50" />
                        {alerts.length > 0 && (
                            <button
                                onClick={clearAllAlerts}
                                disabled={isDeleting}
                                title="Clear all alerts"
                                className="p-1 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6 custom-scrollbar">
                    {alerts.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-[10px] text-slate-600 font-medium italic">No active alerts</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert.id || alert._id}
                                className={`p-3 rounded-xl border transition-all duration-300 group relative overflow-hidden backdrop-blur-sm ${getSeverityColor(alert)}`}
                            >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                <div className="flex justify-between items-start gap-2 relative z-10">
                                    <div className="min-w-0">
                                        <p className={`text-[11px] font-bold truncate ${getLabelColor(alert)}`}>
                                            {alert.alert_type}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                            {alert.message}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => dismissAlert(alert.id || alert._id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all bg-slate-900/50 rounded-full"
                                        title="Dismiss"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center text-[8px] text-slate-500 font-mono relative z-10">
                                    <span className="bg-slate-800/80 border border-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded mr-auto">CAM-{alert.camera_id}</span>
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
