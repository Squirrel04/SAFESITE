import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, MessageSquare, AlertTriangle } from 'lucide-react';

const StandingSupervisor = () => {
    const [bubbleText, setBubbleText] = useState("Telemetry live. PPE check active!");
    const [showBubble, setShowBubble] = useState(true);

    const supervisorQuotes = [
        "Telemetry live. PPE check active!",
        "Gemini + YOLO ensembling at 98.8% fidelity.",
        "Remember: Double check harnesses on higher scaffolding!",
        "System check: GPU temperatures within bounds.",
        "Live feeds are looking clear and secure.",
        "Grok Scout active on CAM-01.",
        "Unauthorized zones clear of personnel."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setShowBubble(false);
            setTimeout(() => {
                const randomQuote = supervisorQuotes[Math.floor(Math.random() * supervisorQuotes.length)];
                setBubbleText(randomQuote);
                setShowBubble(true);
            }, 600);
        }, 12000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-auto select-none">
            {/* Speech Bubble */}
            <AnimatePresence>
                {showBubble && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.8 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="mb-2 mr-2 bg-slate-900/90 backdrop-blur-md border border-amber-500/40 text-slate-200 text-xs px-4 py-2.5 rounded-2xl rounded-br-none shadow-[0_4px_20px_rgba(245,158,11,0.15)] max-w-[200px] flex items-start space-x-2"
                    >
                        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="font-semibold text-[11px] leading-tight">{bubbleText}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hologram Base & Worker Character */}
            <div className="relative group cursor-pointer" onClick={() => {
                setShowBubble(false);
                setTimeout(() => {
                    const randomQuote = supervisorQuotes[Math.floor(Math.random() * supervisorQuotes.length)];
                    setBubbleText(randomQuote);
                    setShowBubble(true);
                }, 200);
            }}>
                {/* Holographic glowing ring underneath */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-amber-500/20 rounded-full blur-[2px] border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse" />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-amber-500/30 rounded-full blur-[1px]" />
                
                {/* Tiny Worker Avatar */}
                <motion.div
                    whileHover={{ y: -3, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="relative w-16 h-16 rounded-full overflow-hidden border border-amber-500/30 bg-slate-900/80 shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center justify-center p-1"
                >
                    <img 
                        src="/worker_standing.png" 
                        alt="Standing AI Supervisor" 
                        className="w-full h-full object-contain filter drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=120" }}
                    />
                </motion.div>

                {/* Micro badge indicator */}
                <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[8px] px-1.5 py-0.5 rounded-full flex items-center tracking-wider border border-slate-950 animate-bounce">
                    AI SUPERVISOR
                </div>
            </div>
        </div>
    );
};

const WalkingWorker = () => {
    const [walkCycle, setWalkCycle] = useState(0);

    // Trigger a walk cycle across the bottom of the screen every 40 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setWalkCycle(prev => prev + 1);
        }, 35000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-0 left-0 w-full z-[9998] pointer-events-none select-none overflow-hidden h-24">
            <AnimatePresence>
                {walkCycle >= 0 && (
                    <motion.div
                        key={walkCycle}
                        initial={{ x: "-120px", y: "15px" }}
                        animate={{ x: "105vw", y: "15px" }}
                        transition={{ 
                            duration: 25, 
                            ease: "linear",
                            repeat: 0
                        }}
                        className="absolute flex flex-col items-center"
                    >
                        {/* Mini floating hologram scanlines indicator */}
                        <div className="mb-1 bg-slate-900/80 border border-slate-700 px-2 py-0.5 rounded-md text-[8px] font-mono font-bold text-slate-300 shadow-lg tracking-wider flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span>PATROL_UNIT</span>
                        </div>

                        {/* Holographic base indicator */}
                        <div className="absolute bottom-0 w-10 h-3 bg-amber-500/20 rounded-full blur-[2px] border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />

                        {/* Walking Worker sprite */}
                        <div className="w-12 h-12 bg-slate-900/60 rounded-full border border-slate-700/50 p-1 flex items-center justify-center shadow-lg">
                            <img 
                                src="/worker_walking.png" 
                                alt="Walking Worker" 
                                className="w-full h-full object-contain filter drop-shadow(0 1px 3px rgba(0,0,0,0.5))"
                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=120" }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SittingWorker = () => {
    return (
        <div className="absolute top-[80px] -right-5 z-20 pointer-events-auto select-none shrink-0 group">
            {/* Holographic glow base */}
            <div className="absolute bottom-0 right-1 w-10 h-2 bg-amber-500/10 rounded-full blur-[1px] border border-amber-500/20" />

            {/* Sitting Worker sprite */}
            <motion.div
                whileHover={{ y: -2, rotate: [0, -3, 3, 0] }}
                transition={{ duration: 0.5 }}
                className="w-11 h-11 bg-slate-900/80 rounded-full border border-slate-700/50 p-0.5 flex items-center justify-center shadow-md relative cursor-pointer"
                title="AI Safety Observer"
            >
                <img 
                    src="/worker_sitting.png" 
                    alt="Sitting Observer" 
                    className="w-full h-full object-contain filter drop-shadow(0 2px 3px rgba(0,0,0,0.5))"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=120" }}
                />
                
                {/* Speech balloon on hover */}
                <div className="absolute right-full mr-2 bottom-1/2 translate-y-1/2 bg-slate-950 border border-slate-700 text-slate-300 text-[8px] font-mono px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl">
                    OBSERVER: "Detections online."
                </div>
            </motion.div>
        </div>
    );
};

const WalkingWorkers = () => {
    return (
        <>
            <StandingSupervisor />
            <WalkingWorker />
        </>
    );
};

export { WalkingWorkers, SittingWorker };
export default WalkingWorkers;
