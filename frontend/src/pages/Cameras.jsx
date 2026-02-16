import React from 'react';
import LiveCameraFeed from '../components/LiveCameraFeed';

const Cameras = () => {
    // In a real app, fetch from API
    const cameras = [
        { id: '01', location: 'Main Entrance - AI Stream', status: 'online' },
        { id: '02', location: 'Warehouse A', status: 'offline' },
        { id: '03', location: 'Loading Dock', status: 'offline' },
        { id: '04', location: 'Perimeter Fence', status: 'offline' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Live Feeds
                </h1>
                <p className="text-gray-500 mt-2">Real-time surveillance from all active camera sources.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cameras.map((cam) => (
                    <div key={cam.id} className="relative group bg-white p-2 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Enhanced wrapper for larger view */}
                        <LiveCameraFeed {...cam} />
                        <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            Camera {cam.id}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Cameras;
