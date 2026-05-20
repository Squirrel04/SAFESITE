import React, { useEffect, useRef, useState } from 'react';
import { Camera, Maximize2, RefreshCw } from 'lucide-react';

const LiveCameraFeed = ({ id, location }) => {
    const [activeBuffer, setActiveBuffer] = useState(1);
    const [buffer1, setBuffer1] = useState(null);
    const [buffer2, setBuffer2] = useState(null);
    const [status, setStatus] = useState('connecting'); // connecting, online, offline
    const wsRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    const connect = () => {
        // Use standard WebSocket
        // In dev, backend is localhost:8000
        const wsUrl = `ws://localhost:8000/ws/stream/client/${id}`;

        const ws = new WebSocket(wsUrl);
        ws.binaryType = 'blob';
        wsRef.current = ws;

        ws.onopen = () => {
            console.log(`Connected to camera ${id}`);
            setStatus('online');
        };

        ws.onmessage = (event) => {
            const blob = event.data;
            const url = URL.createObjectURL(blob);
            if (activeBuffer === 1) {
                setBuffer2(url);
            } else {
                setBuffer1(url);
            }
        };

        ws.onclose = () => {
            console.log(`Disconnected from camera ${id}`);
            setStatus('offline');
            // Retry after 5s
            retryTimeoutRef.current = setTimeout(connect, 5000);
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            ws.close();
        };
    };

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            if (buffer1) URL.revokeObjectURL(buffer1);
            if (buffer2) URL.revokeObjectURL(buffer2);
        };
    }, []);

    return (
        <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 group shadow-md">
            {/* Header / Status Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center space-x-2">
                    <span className={`relative flex h-2.5 w-2.5`}>
                        {status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === 'online' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-xs font-medium text-slate-900 shadow-sm drop-shadow-md tracking-wide">{location}</span>
                </div>
                {status === 'offline' && (
                    <button onClick={() => { setStatus('connecting'); connect(); }} className="text-slate-900/80 hover:text-slate-900 transition-colors bg-white/10 p-1 rounded-full backdrop-blur-sm hover:bg-white/20">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Video Content */}
            <div className="aspect-video bg-gray-950 relative flex items-center justify-center overflow-hidden">
                {status === 'online' && (buffer1 || buffer2) ? (
                    <div className="w-full h-full relative">
                        {buffer1 && (
                            <img
                                src={buffer1}
                                alt={`Live Feed ${id} - B1`}
                                className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-100 ${activeBuffer === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                onLoad={() => {
                                    if (activeBuffer === 2) {
                                        setActiveBuffer(1);
                                        if (buffer2) {
                                            setTimeout(() => URL.revokeObjectURL(buffer2), 100);
                                        }
                                    }
                                }}
                            />
                        )}
                        {buffer2 && (
                            <img
                                src={buffer2}
                                alt={`Live Feed ${id} - B2`}
                                className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-100 ${activeBuffer === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                onLoad={() => {
                                    if (activeBuffer === 1) {
                                        setActiveBuffer(2);
                                        if (buffer1) {
                                            setTimeout(() => URL.revokeObjectURL(buffer1), 100);
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                ) : id === '02' || status === 'offline' ? (
                    /* High-fidelity Cinematic Diagnostic Fallback */
                    <div className="w-full h-full relative flex items-center justify-center">
                        <video
                            src="/mp.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-60"
                        />
                        {/* Scanline / Grid overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(245,158,11,0.04)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none" />
                        
                        {/* Tiny Simulated Bounding Box for PPE monitoring */}
                        <div className="absolute top-1/3 left-1/4 w-1/4 h-1/3 border border-emerald-500/80 rounded shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse p-0.5 flex flex-col justify-between">
                            <span className="text-[6px] font-mono font-bold text-emerald-400 bg-slate-950/70 w-fit px-1 rounded-sm leading-none scale-75 origin-top-left">HELMET: PASS</span>
                        </div>
                        
                        <div className="absolute top-1/2 left-2/3 w-1/5 h-1/4 border border-amber-500/80 rounded shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse p-0.5 flex flex-col justify-between">
                            <span className="text-[6px] font-mono font-bold text-amber-500 bg-slate-950/70 w-fit px-1 rounded-sm leading-none scale-75 origin-top-left">VEST: MISSING</span>
                        </div>

                        {/* Status overlays */}
                        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black font-mono text-amber-500 border border-amber-500/25 flex items-center shadow-lg uppercase tracking-widest scale-90 origin-bottom-left animate-pulse">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 shrink-0" />
                            <span>Telemetry Syndication Feed</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-gray-600 justify-center h-full w-full bg-gray-900">
                        {status === 'connecting' ? (
                            <RefreshCw className="w-10 h-10 mb-3 opacity-50 animate-spin text-yellow-500" />
                        ) : (
                            <div className="relative">
                                <Camera className="w-12 h-12 mb-3 opacity-20 text-gray-400" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-0.5 bg-gray-700 rotate-45 transform origin-center translate-y-[-12px]"></div>
                                </div>
                            </div>
                        )}
                        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{status}</span>
                    </div>
                )}
            </div>

            {/* Footer Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] text-gray-400 font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">ID: {id}</p>
                <div className="flex space-x-2">
                    <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-900 backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveCameraFeed;

