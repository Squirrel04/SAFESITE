import React from 'react';
import LiveCameraFeed from '../components/LiveCameraFeed';
import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const Cameras = () => {
    // In a real app, fetch from API
    const cameras = [
        { id: '01', location: 'Main Entrance - AI Stream', status: 'online' },
        { id: '02', location: 'Warehouse A', status: 'offline' },
        { id: '03', location: 'Loading Dock', status: 'offline' },
        { id: '04', location: 'Perimeter Fence', status: 'offline' },
    ];

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-4"
            >
                <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] relative group w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/20 skew-x-[-20deg] translate-x-[-150%] animate-[shine_3s_infinite]" />
                    <Camera className="w-8 h-8 text-white relative z-10" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">
                        Live Feeds
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium text-sm tracking-wide">Real-time surveillance from all active camera sources.</p>
                </div>
            </motion.div>

            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                {cameras.map((cam, index) => (
                    <motion.div 
                        key={cam.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group bg-slate-900/40 backdrop-blur-xl p-2 rounded-3xl border border-slate-800 shadow-xl overflow-hidden hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-300"
                    >
                        {/* Enhanced wrapper for larger view */}
                        <div className="rounded-2xl overflow-hidden relative">
                            <LiveCameraFeed {...cam} />
                        </div>
                        <div className="absolute top-6 right-6 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider text-white border border-slate-700/50 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg translate-y-2 group-hover:translate-y-0">
                            CAM-{cam.id}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default Cameras;
