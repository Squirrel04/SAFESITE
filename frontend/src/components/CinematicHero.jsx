import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Play, Pause, Camera, ChevronRight, Activity } from 'lucide-react';

const CinematicHero = () => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [videoLoaded, setVideoLoaded] = useState(false);

    useEffect(() => {
        // Attempt to auto-play when video element is ready
        if (videoRef.current) {
            videoRef.current.play().catch(err => {
                console.log("Autoplay was prevented by browser policies:", err);
                setIsPlaying(false);
            });
        }
    }, []);

    const togglePlay = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(err => console.log(err));
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="relative w-full h-[280px] md:h-[360px] rounded-3xl overflow-hidden border border-slate-700/40 shadow-2xl bg-slate-950 group">
            {/* Fallback & Poster image (displays while video is loading) */}
            <div 
                className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-out z-0 ${
                    videoLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                style={{ backgroundImage: 'url("/safety_hero_poster.png")' }}
            />

            {/* Background Video */}
            <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out z-0 ${
                    videoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                src="/mp.mp4"
                poster="/safety_hero_poster.png"
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => setVideoLoaded(true)}
            />

            {/* Cinematic Gradient Overlays for High Contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30 z-10" />
            <div className="absolute inset-0 bg-amber-500/[0.02] mix-blend-overlay z-10" />

            {/* Animated Interactive HUD Elements */}
            <div className="absolute top-6 right-6 z-20 flex items-center space-x-3 pointer-events-none">
                <div className="flex items-center space-x-1.5 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/40 text-xs font-semibold text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>SYSTEM ONLINE</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/40 text-xs font-semibold text-amber-500">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>AI LIVE</span>
                </div>
            </div>

            {/* Foreground Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10 select-none">
                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex items-center space-x-2 text-amber-500 font-bold tracking-wider text-xs uppercase mb-3"
                    >
                        <Shield className="w-4 h-4" />
                        <span>Autonomous Safety Intelligence</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                        className="text-2xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-3"
                    >
                        Supervising Construction Safety In Real-Time
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-slate-300 text-sm md:text-base leading-relaxed font-medium mb-6 line-clamp-2 md:line-clamp-none max-w-xl"
                    >
                        Using state-of-the-art YOLOv8 object detection to identify PPE violations, unsafe zones, and protect workers before accidents happen.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                        className="flex items-center space-x-4"
                    >
                        {/* Primary CTA Button */}
                        <button
                            onClick={() => navigate('/cameras')}
                            className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl flex items-center shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] hover:from-amber-400 hover:to-yellow-500 transition-all group/btn"
                        >
                            <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover/btn:animate-[shine_1s_ease-in-out]" />
                            <Camera className="w-4 h-4 mr-2" />
                            <span>Launch Live Feeds</span>
                            <ChevronRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>

                        {/* Video Controls (Mute / Unmute or Play / Pause) */}
                        <button
                            onClick={togglePlay}
                            className="p-3 bg-slate-900/60 backdrop-blur-md border border-slate-700/40 text-slate-300 hover:text-white rounded-xl transition-all hover:bg-slate-800/80 hover:border-slate-600"
                            title={isPlaying ? "Pause Background Cinematic" : "Play Background Cinematic"}
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Cinematic scanlines overlay effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(transparent_50%,rgba(0,0,0,0.4))] z-15" />
        </div>
    );
};

export default CinematicHero;
