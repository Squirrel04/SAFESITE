import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import LiveCameraFeed from '../components/LiveCameraFeed';
import { AlertTriangle, Camera, Activity, Users, Shield } from 'lucide-react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { alerts } = useNotifications();
    const [statsData, setStatsData] = useState({
        total_alerts: 0,
        active_cameras: 0
    });

    const chartData = [
        { time: '08:00', detections: 2, violations: 0 },
        { time: '09:00', detections: 15, violations: 1 },
        { time: '10:00', detections: 45, violations: 2 },
        { time: '11:00', detections: 30, violations: 0 },
        { time: '12:00', detections: 20, violations: 1 },
        { time: '13:00', detections: 35, violations: 3 },
        { time: '14:00', detections: 50, violations: 0 },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/');
                setStatsData(response.data);
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const stats = [
        { 
            title: 'Total Alerts', 
            value: alerts.length, 
            icon: AlertTriangle, 
            color: 'rose', 
            trend: 15,
            onClick: () => navigate('/alerts')
        },
        { 
            title: 'Active Cameras', 
            value: `${statsData.active_cameras || 0}/${statsData.total_cameras || 2}`, 
            icon: Camera, 
            color: 'cyan', 
            trend: 0,
            onClick: () => navigate('/cameras')
        },
    ];

    const cameras = [
        { id: '01', location: 'Main Entrance - AI Stream', status: 'online' },
        { id: '02', location: 'Warehouse A', status: 'offline' },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] relative group">
                        <div className="absolute inset-0 bg-white/20 skew-x-[-20deg] translate-x-[-150%] animate-[shine_3s_infinite]" />
                        <Shield className="w-8 h-8 text-white relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">
                            Safety Monitor
                        </h1>
                        <p className="text-slate-400 mt-1 font-medium text-sm tracking-wide">Real-time surveillance and anomaly detection system.</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <StatCard {...stat} />
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Feeds Section */}
                <motion.div
                    className="lg:col-span-2 space-y-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
                            <Camera className="w-5 h-5 mr-3 text-cyan-400" />
                            Live Feeds
                        </h2>
                        <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-semibold tracking-wide uppercase">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {cameras.map((cam) => (
                            <div key={cam.id} className="bg-slate-900/40 backdrop-blur-xl p-1.5 rounded-3xl border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 transition-colors">
                                <LiveCameraFeed {...cam} />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Activity Chart Section */}
                <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
                        <Activity className="w-5 h-5 mr-3 text-violet-400" />
                        Activity Trends
                    </h2>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 h-[400px] shadow-xl relative overflow-hidden group">
                        {/* Background glow for chart */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-violet-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-violet-500/20 transition-all duration-700" />
                        
                        <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#475569" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                                        backdropFilter: 'blur(12px)',
                                        borderColor: '#334155', 
                                        borderRadius: '16px', 
                                        color: '#f8fafc',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                    }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: '500' }}
                                />
                                <Area type="monotone" dataKey="detections" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorDetections)" />
                                <Area type="monotone" dataKey="violations" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorViolations)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
