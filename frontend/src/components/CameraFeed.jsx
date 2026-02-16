import React, { useState } from 'react';
import { Maximize2, Camera, MoreVertical, Circle } from 'lucide-react';

const CameraFeed = ({ id, location, status = 'online' }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header / Status Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-2">
                    <span className={`flex h-2 w-2 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75 ${status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-xs font-medium text-white shadow-sm">{location}</span>
                </div>
                <button className="text-white/80 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            {/* Video Placeholder */}
            <div className="aspect-video bg-slate-800 relative flex items-center justify-center">
                {status === 'online' ? (
                    // In a real app, this would be an <img src="stream_url" /> or <video>
                    <div className="w-full h-full relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/10 to-transparent"></div>
                        {/* Simulated content */}
                        <div className="absolute bottom-4 left-4">
                            <p className="text-xs text-slate-400 font-mono">CAM-{id} • 1080p • 30FPS</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-600">
                        <Camera className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-sm">Signal Lost</span>
                    </div>
                )}
            </div>

            {/* Control Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-end space-x-2 transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors">
                    <Camera className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors">
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CameraFeed;
