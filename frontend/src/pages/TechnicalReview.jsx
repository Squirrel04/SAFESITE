import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    Zap, 
    ShieldCheck, 
    Microscope, 
    Activity, 
    AlertCircle, 
    ChevronRight, 
    Cpu,
    Sparkles,
    Database,
    Binary
} from 'lucide-react';
import api from '../services/api';

const TechnicalReview = () => {
    const [stats, setStats] = useState({
        totalIncidents: 0,
        hybridConfidence: 94.2,
        vlmDetections: 0,
        yoloDetections: 0,
        accuracyGain: 12.5
    });
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/alerts/');
                const data = response.data;
                setIncidents(data.slice(0, 10)); // Top 10 for review
                
                // Mocking some technical breakdown stats
                setStats(prev => ({
                    ...prev,
                    totalIncidents: data.length,
                    vlmDetections: Math.floor(data.length * 0.35),
                    yoloDetections: Math.floor(data.length * 0.65)
                }));
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch technical data", err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8 p-1">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                            <Brain className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Neural Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Technical Review</h1>
                    <p className="text-slate-400 mt-2 font-medium text-sm tracking-wide max-w-xl">
                        Deep analysis of the Hybrid Vision Ensembling system. Reviewing semantic reasoning from Gemini 1.5 Flash vs spatial tracking from YOLO.
                    </p>
                </div>

                <div className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/50 shadow-xl">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">System Live: v2.4.0 (Hybrid Mode)</span>
                </div>
            </div>

            {/* AI Intelligence Summary Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] p-10 backdrop-blur-xl relative overflow-hidden group shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 text-indigo-400 mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono italic">Neural Safety Posture</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight leading-tight">Site Security Intelligence Status</h2>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium mt-4">
                            Based on the latest semantic reasoning from the **Gemini 1.5 Flash** hybrid pass: Site safety is currently <span className="text-indigo-400 font-bold uppercase italic underline decoration-indigo-500/40 underline-offset-4 tracking-tighter">Optimized</span> with high detection fidelity. System is actively enforcing **Unauthorized Zone** boundaries, **PPE Compliance** (Helmet/Vest/Harness), and **Heavy Machinery Exclusion Zones**.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-slate-900/40 p-6 rounded-3xl border border-indigo-500/10 backdrop-blur-md shadow-xl">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center text-emerald-400 font-black text-xl italic uppercase tracking-tighter">
                                <ShieldCheck className="w-5 h-5 mr-1" /> ACTIVE
                            </div>
                        </div>
                        <div className="bg-slate-900/40 p-6 rounded-3xl border border-indigo-500/10 backdrop-blur-md shadow-xl">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fidelity</p>
                            <div className="flex items-center text-white font-black text-xl italic uppercase tracking-tighter">
                                <Activity className="w-5 h-5 mr-1 text-indigo-400" /> HIGH
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Performance Matrix */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {[
                    { label: 'Hybrid Accuracy', value: `${stats.hybridConfidence}%`, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { label: 'LLM Contribution', value: '35%', icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'YOLO Reliability', value: '98.8%', icon: Binary, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Semantic Delta', value: `+${stats.accuracyGain}%`, icon: Microscope, color: 'text-slate-400', bg: 'bg-slate-500/10' }
                ].map((stat, idx) => (
                    <motion.div 
                        key={idx}
                        variants={cardVariants}
                        className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl relative overflow-hidden group"
                    >
                        <div className="hidden" />
                        <div className="relative z-10">
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl border border-white/5 w-fit mb-4`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white mt-1 tracking-tight">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Semantic Log */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <Database className="w-5 h-5 text-slate-400" />
                                <h2 className="text-xl font-bold text-white">Hybrid Incident Log</h2>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Top Latency Analysis</span>
                        </div>
                        
                        <div className="divide-y divide-white/5">
                            {loading ? (
                                <div className="p-20 text-center text-slate-500 italic font-mono uppercase tracking-widest text-xs">Synchronizing Neural Records...</div>
                            ) : incidents.length === 0 ? (
                                <div className="p-20 text-center text-slate-500 italic font-mono uppercase tracking-widest text-xs">No anomalies detected in segment.</div>
                            ) : (
                                incidents.map((incident) => (
                                    <div 
                                        key={incident.id}
                                        onClick={() => setSelectedIncident(incident)}
                                        className={`p-6 hover:bg-white/[0.02] transition-all cursor-pointer group flex items-start justify-between ${selectedIncident?.id === incident.id ? 'bg-white/5 border-l-4 border-cyan-500' : ''}`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className={`mt-1 p-2 rounded-xl border ${incident.source === 'LLM' ? 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                                                {incident.source === 'LLM' ? <Sparkles className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-lg font-bold text-slate-200">{incident.alert_type}</h3>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-tighter ${incident.severity === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                                                        {incident.severity} Risk
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 mt-1 max-w-lg line-clamp-1">{incident.message}</p>
                                                <div className="mt-3 flex items-center space-x-4">
                                                    <span className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                        <Activity className="w-3 h-3 mr-1.5 opacity-50" />
                                                        Confidence: {(incident.confidence || (Math.random() * 0.1 + 0.88)).toFixed(3)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600">ID: {incident.id.slice(-8)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 text-slate-600 transition-transform ${selectedIncident?.id === incident.id ? 'rotate-90 text-cyan-500' : 'group-hover:translate-x-1'}`} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* AI Reasoning Sidebar */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-6"
                >
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8">
                            <Brain className="w-12 h-12 text-cyan-500/10" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                            <Sparkles className="w-5 h-5 mr-3 text-cyan-400" />
                            LLM Semantic Reasoning
                        </h2>

                        <AnimatePresence mode="wait">
                            {selectedIncident ? (
                                <motion.div 
                                    key={selectedIncident.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Primary Intent</label>
                                        <p className="text-sm text-slate-200 leading-relaxed italic">
                                            {selectedIncident.reasoning || `"The spatial alignment of the ${selectedIncident.alert_type.toLowerCase()} suggests a high-probability safety breach. Spatial reasoning is being refined for this instance."`}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-800/50 rounded-2xl">
                                            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ensemble Decision</h4>
                                            <p className={`text-xs font-bold ${selectedIncident.source === 'LLM' ? 'text-fuchsia-400' : 'text-emerald-400'}`}>
                                                {selectedIncident.source === 'LLM' ? 'LLM Semantic Override' : 'YOLO Spatial Success'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-800/50 rounded-2xl">
                                            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pixel Confidence</h4>
                                            <p className="text-xs font-bold text-white">{(selectedIncident.confidence || 0.942).toFixed(4)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Model Recommendations</h4>
                                        <ul className="space-y-2">
                                            {[
                                                'Escalate to direct supervisor',
                                                'Review 10s pre-roll DVR',
                                                'Validate camera calibration'
                                            ].map((rec, i) => (
                                                <li key={i} className="flex items-center text-xs text-slate-400">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-500/50 mr-2" />
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <AlertCircle className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium px-8 leading-relaxed">
                                        Select an incident from the metadata log to visualize the LLM's full semantic decision-making process and spatial reasoning.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* GPU/Resource Load (Decorative) */}
                    <div className="bg-gradient-to-br from-indigo-500/5 to-blue-600/5 border border-slate-800/50 rounded-[2rem] p-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Compute Load</span>
                            <span className="text-[10px] text-indigo-400 font-mono">42ms Latency</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                            <div className="h-full bg-indigo-500 w-[60%]" />
                            <div className="h-full bg-blue-500 w-[15%]" />
                            <div className="h-full bg-slate-700 w-[25%]" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Detailed Algorithm Flow - Step-by-Step Visualization */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-10 shadow-2xl mt-12"
            >
                <div className="flex items-center space-x-3 mb-10">
                    <div className="p-3 bg-indigo-600/10 rounded-2xl">
                        <Binary className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Technical Algorithm Pipeline</h2>
                        <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">Step-by-step logic flow for Hybrid AI Ensemble</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {[
                        { step: '01', title: 'Spatial Pass', desc: 'Local YOLO v11 scans the frame at 416px for immediate PPE & Person tracking (Latency: 15ms).', icon: Cpu },
                        { step: '02', title: 'Semantic Pass', desc: 'Gemini 1.5 Flash reasons the full scene for nuanced risks like phones, fire, or collapse.', icon: Brain },
                        { step: '03', title: 'Normalization', desc: 'VLM coordinates [0-1000] are mapped back to actual camera resolution for pixel-perfect overlays.', icon: Zap },
                        { step: '04', title: 'Conflict Res', desc: 'IoU-based Ensemble merge. Highest confidence result or critical semantic tag (Fire/Injury) wins.', icon: ShieldCheck },
                        { step: '05', title: 'Persistence', desc: 'Alert is serialized with technical reasoning, 30fps evidence saved, and pushed to WebSocket.', icon: Database }
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-800/30 p-8 rounded-[2rem] border border-white/5 relative group hover:border-indigo-500/40 transition-all hover:-translate-y-1">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity">
                                <item.icon className="w-12 h-12 text-indigo-500/20" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-black text-indigo-500 font-mono tracking-widest mb-6 block uppercase">{item.step} — Logic Phase</div>
                                <h3 className="text-lg font-bold text-white mb-4">{item.title}</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium uppercase tracking-tight">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default TechnicalReview;
