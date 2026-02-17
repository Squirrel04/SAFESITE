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
            case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10';
            case 'medium': return 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-orange-500/10';
            case 'low': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-yellow-500/10';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-gray-900">
                    Evidence Log
                </h1>
                <p className="text-gray-500 mt-2">Historical record of safety violations and system alerts.</p>
            </motion.div>

            <motion.div
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                <th className="p-5">Status & Type</th>
                                <th className="p-5">Description</th>
                                <th className="p-5">Camera Source</th>
                                <th className="p-5">Timestamp</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading evidence...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No violations recorded.</td></tr>
                            ) : (
                                alerts.map((alert, index) => (
                                    <motion.tr
                                        key={alert.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg border shadow-sm ${getSeverityColor(alert.severity).replace('text-', 'bg-opacity-10 bg-')}`}>
                                                    <AlertTriangle className={`w-4 h-4 ${getSeverityColor(alert.severity).split(' ').pop()}`} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{alert.alert_type}</p>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getSeverityColor(alert.severity)}`}>
                                                        {alert.severity}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 font-medium text-sm">
                                            {alert.message}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center text-gray-500 text-sm">
                                                <Camera className="w-4 h-4 mr-2 text-cyan-600" />
                                                <span className="group-hover:text-cyan-700 transition-colors text-gray-700">{alert.camera_id}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm font-mono">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => navigate(`/violation/${alert.id}`)}
                                                className="px-3 py-1.5 bg-white hover:bg-cyan-50 hover:text-cyan-700 text-gray-600 text-xs font-medium rounded-lg transition-all border border-gray-200 hover:border-cyan-200 flex items-center ml-auto shadow-sm"
                                            >
                                                <Eye className="w-3 h-3 mr-2" />
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

            {/* Evidence Modal */}
            <AnimatePresence>
                {selectedAlert && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAlert(null)}
                            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl z-10"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Event Evidence</h2>
                                    <p className="text-gray-500 text-sm">ID: {selectedAlert.id}</p>
                                </div>
                                <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="aspect-video bg-slate-950 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden group">
                                    {selectedAlert.image_url ? (
                                        <img
                                            src={selectedAlert.image_url}
                                            alt="Evidence"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-500">
                                            <Camera className="w-12 h-12 mb-2 opacity-50" />
                                            <p>Snapshot Unavailable</p>
                                            <p className="text-xs">(Storage not connected)</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Violation Type</p>
                                        <p className="text-gray-200">{selectedAlert.alert_type}</p>
                                    </div>
                                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Confirmed Time</p>
                                        <p className="text-gray-200">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Alerts;
