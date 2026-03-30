import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AlertTriangle, CheckCircle, Clock, Camera, Eye, X, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import ViolationDetails from './ViolationDetails';

const Alerts = () => {
    const navigate = useNavigate();
    const { alerts, setAlerts, refreshAlerts, isDeleting: contextIsDeleting } = useNotifications();
    const [loading, setLoading] = useState(false); // Global sync is fast, skip local loading unless first load
    const [selectedAlertId, setSelectedAlertId] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [localDeleting, setLocalDeleting] = useState(false);

    const isDeleting = contextIsDeleting || localDeleting;

    // Initial load check
    useEffect(() => {
        if (alerts.length === 0) {
            setLoading(true);
            refreshAlerts().finally(() => setLoading(false));
        }
    }, []);

    const handleDeleteItem = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this evidence?")) return;
        
        setLocalDeleting(true);
        try {
            await api.delete(`/alerts/${id}`);
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("Deletion failed:", err);
            const msg = err.response?.data?.detail || err.message || "Unknown Error";
            alert(`Failed to delete alert: ${msg}`);
        } finally {
            setLocalDeleting(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected alerts?`)) return;

        setLocalDeleting(true);
        try {
            await api.post('/alerts/delete-bulk', Array.from(selectedIds));
            setAlerts(prev => prev.filter(a => !selectedIds.has(a.id)));
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Deletion failed:", err);
            const msg = err.response?.data?.detail || err.message || "Unknown Error";
            alert(`Failed to delete alerts: ${msg}`);
        } finally {
            setLocalDeleting(false);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("CRITICAL: Are you sure you want to PERMANENTLY CLEAR the entire evidence log? This action cannot be undone.")) return;

        setLocalDeleting(true);
        try {
            await api.post('/alerts/clear');
            setAlerts([]);
            setSelectedIds(new Set());
        } catch (err) {
            console.error("Clear failed:", err);
            alert("Failed to clear log");
        } finally {
            setLocalDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === alerts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(alerts.map(a => a.id)));
        }
    };

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };


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
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                        <p className="text-slate-400 mt-1 font-medium text-sm tracking-wide">Secure historical record of safety violations.</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {selectedIds.size > 0 && (
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="flex items-center px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedIds.size})
                        </motion.button>
                    )}
                    <button
                        onClick={handleClearAll}
                        disabled={isDeleting || alerts.length === 0}
                        className="flex items-center px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all group"
                    >
                        <ShieldAlert className="w-4 h-4 mr-2 group-hover:text-amber-400 transition-colors" />
                        Clear All Log
                    </button>
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
                                <th className="p-5 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 focus:ring-cyan-500/50 text-cyan-600"
                                        checked={alerts.length > 0 && selectedIds.size === alerts.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Type</th>
                                <th className="p-5">Description</th>
                                <th className="p-5">Camera Source</th>
                                <th className="p-5">Timestamp</th>
                                <th className="p-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium tracking-wide">Securely loading evidence...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium tracking-wide">No violations recorded.</td></tr>
                            ) : (
                                alerts.map((alert, index) => (
                                    <React.Fragment key={alert.id}>
                                    <motion.tr
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`hover:bg-slate-800/30 transition-colors group cursor-pointer ${selectedIds.has(alert.id) ? 'bg-cyan-500/5' : ''}`}
                                        onClick={() => setSelectedAlertId(selectedAlertId === alert.id ? null : alert.id)}
                                    >
                                        <td className="p-5" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 focus:ring-cyan-500/50 text-cyan-600"
                                                checked={selectedIds.has(alert.id)}
                                                onChange={() => toggleSelect(alert.id)}
                                            />
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                alert.is_resolved 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                {alert.is_resolved ? 'Resolved' : 'Open'}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="relative group/thumb">
                                                    <div className={`p-2 rounded-xl border shadow-sm ${getSeverityColor(alert.severity).replace('text-', 'bg-opacity-10 bg-')}`}>
                                                        <AlertTriangle className={`w-4 h-4 ${getSeverityColor(alert.severity).split(' ').pop()}`} />
                                                    </div>
                                                    {alert.image_url && (
                                                        <div className="absolute -top-1 -right-1 w-12 h-12 rounded-lg border-2 border-slate-900 overflow-hidden shadow-xl group-hover/thumb:scale-[2.5] group-hover/thumb:z-50 transition-all duration-300 pointer-events-none">
                                                            <img src={alert.image_url} alt="Evidence" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-bold text-slate-200 text-sm tracking-wide group-hover:text-white transition-colors">
                                                            {alert.alert_type}
                                                        </p>
                                                        {alert.video_url && (
                                                            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" title="Video Evidence Available" />
                                                        )}
                                                    </div>
                                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border mt-0.5 inline-block ${getSeverityColor(alert.severity)}`}>
                                                        {alert.severity}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-400 font-medium text-sm group-hover:text-slate-300 transition-colors max-w-xs">
                                            {alert.message}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center text-slate-500 text-sm font-mono">
                                                <Camera className="w-3.5 h-3.5 mr-2 text-cyan-500" />
                                                <span className="group-hover:text-cyan-400 transition-colors">CAM-{alert.camera_id}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-500 text-sm font-mono tracking-wider group-hover:text-slate-400 transition-colors">
                                            {new Date(alert.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                         <td className="p-5 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedAlertId(selectedAlertId === alert.id ? null : alert.id); }}
                                                    className="px-3 py-1.5 bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border border-slate-700 hover:border-cyan-500/30 flex items-center shadow-sm"
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteItem(e, alert.id)}
                                                    className="p-1.5 bg-slate-800/80 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-all border border-slate-700 hover:border-rose-500/30"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td >
                                    </motion.tr >
                                    
                                    {/* Expanded Row for Evidence Snapshots */}
                                    <AnimatePresence>
                                        {selectedAlertId === alert.id && (
                                            <motion.tr
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-slate-950/50 border-b border-slate-700/50"
                                            >
                                                <td colSpan="7" className="p-0">
                                                    <div className="p-6 border-l-2 border-cyan-500 overflow-hidden shadow-inner bg-slate-900/80">
                                                        <ViolationDetails 
                                                            id={alert.id} 
                                                            onClose={() => setSelectedAlertId(null)} 
                                                        />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>
                                    </React.Fragment>
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
