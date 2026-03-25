import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AlertTriangle, CheckCircle, Clock, Camera, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Alerts = () => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState(null);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await api.get('/alerts/');
                setAlerts(response.data);
            } catch (error) {
                console.error("Failed to fetch alerts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, []);

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10';
            case 'medium': return 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/10';
            case 'low': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-yellow-500/10';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-tr from-rose-500 to-orange-600 rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.3)] relative group w-14 h-14 flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/20 skew-x-[-20deg] translate-x-[-150%] animate-[shine_3s_infinite]" />
                        <AlertTriangle className="w-8 h-8 text-white relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">
                            Evidence Log
                        </h1>
                        <p className="text-slate-400 mt-1 font-medium text-sm tracking-wide">Historical record of safety violations and system alerts.</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="p-5">Status & Type</th>
                                <th className="p-5">Description</th>
                                <th className="p-5">Camera Source</th>
                                <th className="p-5">Timestamp</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium tracking-wide">Securely loading evidence...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium tracking-wide">No violations recorded.</td></tr>
                            ) : (
                                alerts.map((alert, index) => (
                                    <motion.tr
                                        key={alert.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/violation/${alert.id}`)}
                                    >
                                        <td className="p-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <div className={`p-2.5 rounded-xl border shadow-sm ${getSeverityColor(alert.severity).replace('text-', 'bg-opacity-10 bg-')}`}>
                                                        <AlertTriangle className={`w-5 h-5 ${getSeverityColor(alert.severity).split(' ').pop()}`} />
                                                    </div>
                                                    {alert.image_url && (
                                                        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-lg border-2 border-slate-900 overflow-hidden shadow-lg group-hover:scale-150 transition-transform z-10">
                                                            <img src={alert.image_url} alt="Still" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-200 text-sm tracking-wide group-hover:text-white transition-colors flex items-center">
                                                        {alert.alert_type}
                                                        {alert.video_url && <span className="ml-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" title="Video Available" />}
                                                    </p>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border mt-1 inline-block ${getSeverityColor(alert.severity)}`}>
                                                        {alert.severity}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-400 font-medium text-sm group-hover:text-slate-300 transition-colors">
                                            {alert.message}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center text-slate-500 text-sm">
                                                <Camera className="w-4 h-4 mr-2 text-cyan-500" />
                                                <span className="group-hover:text-cyan-400 transition-colors font-mono tracking-wide">{alert.camera_id}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-500 text-sm font-mono tracking-wider group-hover:text-slate-400 transition-colors">
                                            {new Date(alert.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/violation/${alert.id}`); }}
                                                className="px-4 py-2 bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-700 hover:border-cyan-500/30 flex items-center ml-auto shadow-sm"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Report
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default Alerts;
