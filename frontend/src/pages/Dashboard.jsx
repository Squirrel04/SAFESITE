import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import LiveCameraFeed from '../components/LiveCameraFeed';
import { AlertTriangle, Camera, Activity, Users, Shield } from 'lucide-react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const [statsData, setStatsData] = useState({
        total_alerts: 0,
        active_cameras: 0,
        system_status: 'Online',
        personnel: 0
    });

    // Mock data for the chart - in a real app, fetch historical stats
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
        // Poll every 5 seconds
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const stats = [
        { title: 'Total Alerts', value: statsData.total_alerts, icon: AlertTriangle, color: 'rose', trend: 15 },
        { title: 'Active Cameras', value: `${statsData.active_cameras}/4`, icon: Camera, color: 'cyan', trend: 0 },
        { title: 'System Status', value: statsData.system_status, icon: Activity, color: 'emerald' },
        { title: 'Personnel', value: statsData.personnel, icon: Users, color: 'violet', trend: -5 },
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
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Safety Monitor
                        </h1>
                        <p className="text-gray-500 mt-1">Real-time surveillance and anomaly detection system.</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <Camera className="w-5 h-5 mr-2 text-cyan-600" />
                            Live Feeds
                        </h2>
                        <button className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors font-medium">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {cameras.map((cam) => (
                            <div key={cam.id} className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-violet-600" />
                        Activity Trends
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 h-[400px] shadow-sm">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1e293b' }}
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
