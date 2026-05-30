import React, { useEffect, useRef, useState } from 'react';
import { Camera, Maximize2, RefreshCw } from 'lucide-react';

const LiveCameraFeed = ({ id, location }) => {
    const [status, setStatus] = useState('connecting'); // connecting, online, offline
    const [frameUrl, setFrameUrl] = useState(null);

    const wsRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const prevUrlRef = useRef(null);

    const connect = () => {
        const wsUrl = `ws://localhost:8000/ws/stream/client/${id}`;
        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'blob';
        wsRef.current = ws;

        ws.onopen = () => {
            console.log(`[CAM-${id}] Connected`);
            setStatus('online');
        };

        ws.onmessage = (event) => {
            const blob = event.data;
            const newUrl = URL.createObjectURL(blob);

            // Revoke old URL to prevent memory leak
            if (prevUrlRef.current) {
                URL.revokeObjectURL(prevUrlRef.current);
            }
            prevUrlRef.current = newUrl;
            setFrameUrl(newUrl);
        };

        ws.onclose = () => {
            console.log(`[CAM-${id}] Disconnected`);
            setStatus('offline');
            setFrameUrl(null);
            retryTimeoutRef.current = setTimeout(connect, 5000);
        };

        ws.onerror = (err) => {
            console.error(`[CAM-${id}] WebSocket error:`, err);
            ws.close();
        };
    };

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) {
                wsRef.current.onclose = null; // Prevent auto-reconnect on unmount
                wsRef.current.close();
            }
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        };
    }, []);

    return (
        <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 group shadow-md">
            {/* Header / Status Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center space-x-2">
                    <span className={`relative flex h-2.5 w-2.5`}>
                        {status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === 'online' ? 'bg-yellow-500' : status === 'connecting' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-xs font-medium text-white shadow-sm drop-shadow-md tracking-wide">{location}</span>
                </div>
                {status === 'offline' && (
                    <button onClick={() => { setStatus('connecting'); connect(); }} className="text-white/80 hover:text-white transition-colors bg-white/10 p-1 rounded-full backdrop-blur-sm hover:bg-white/20">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Video Content */}
            <div className="aspect-video bg-gray-950 relative flex items-center justify-center overflow-hidden">
                {frameUrl ? (
                    /* Live AI stream frame */
                    <img
                        src={frameUrl}
                        alt={`Live Feed CAM-${id}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    /* Waiting / Offline state */
                    <div className="flex flex-col items-center text-gray-600 justify-center h-full w-full bg-gray-900">
                        {status === 'connecting' ? (
                            <>
                                <RefreshCw className="w-10 h-10 mb-3 opacity-50 animate-spin text-yellow-500" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-yellow-500/70">Connecting to CAM-{id}...</span>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <Camera className="w-12 h-12 mb-3 opacity-20 text-gray-400" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-0.5 bg-gray-700 rotate-45 transform origin-center translate-y-[-12px]"></div>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">OFFLINE</span>
                                <span className="text-[10px] text-gray-600 mt-1">CAM-{id} · Retrying in 5s...</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] text-gray-400 font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">CAM-{id} · YOLO + Grok</p>
                <div className="flex space-x-2">
                    <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveCameraFeed;
