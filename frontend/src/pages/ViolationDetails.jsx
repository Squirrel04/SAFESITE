import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Camera, MapPin, AlertTriangle, Shield, Download, Mail, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const ViolationDetails = ({ id: propId, onClose }) => {
    const { id: paramsId } = useParams();
    const id = propId || paramsId;
    const navigate = useNavigate();
    const [violation, setViolation] = useState(null);
    const [loading, setLoading] = useState(true);
    const isModal = !!propId;

    // Mock data fallback if API fails or for demo
    const mockViolation = {
        id: id,
        timestamp: new Date().toISOString(),
        alert_type: 'PPE Violation',
        severity: 'High',
        camera_id: 'CAM-01',
        location: 'Main Entrance',
        status: 'Open',
        description: 'Individual detected without required safety helmet in hazardous zone.',
        person_id: 'Unknown',
        confidence: '98%'
    };

    useEffect(() => {
        // Simulating API fetch
        const fetchViolation = async () => {
            try {
                const response = await api.get(`/alerts/${id}`);
                setViolation(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch violation details:", error);
                // Fallback to mock if API fails (e.g. during development/demo)
                setViolation(mockViolation);
                setLoading(false);
            }
        };

        fetchViolation();
    }, [id]);

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!violation) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Violation Not Found</h2>
                <button onClick={() => navigate('/alerts')} className="mt-4 text-cyan-600 hover:underline">Return to Logs</button>
            </div>
        );
    }

    return (
        <div className={`space-y-6 max-w-7xl mx-auto ${isModal ? 'p-6 bg-slate-50/50 min-h-screen' : ''}`}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onClose || (() => navigate('/alerts'))}
                        className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 shadow-sm hover:shadow"
                    >
                        {isModal ? <XCircle className="w-5 h-5 text-gray-600" /> : <ArrowLeft className="w-5 h-5 text-gray-600" />}
                    </button>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold text-gray-900">Incident Report #{violation.id}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getSeverityColor(violation.severity)}`}>
                                {violation.severity} Severity
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </button>
                    <button className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-md shadow-cyan-600/20 font-medium transition-colors">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Report
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Evidence Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900 flex items-center text-sm">
                                <Camera className="w-4 h-4 mr-2 text-cyan-600" />
                                Visual Evidence Log
                            </h2>
                            <div className="flex gap-2">
                                <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md uppercase tracking-wider">CAM: {violation.camera_id}</span>
                                {violation.video_url && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />Video Evidence</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200">
                            {/* Snapshot Image */}
                            <div className="aspect-video bg-gray-950 relative overflow-hidden group">
                                {violation.image_url ? (
                                    <img
                                        src={violation.image_url}
                                        alt="Evidence Snapshot"
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <Camera className="w-10 h-10 mb-2 opacity-20" />
                                        <p className="text-xs font-medium uppercase tracking-widest opacity-40 leading-none">Still Snapshot</p>
                                        <p className="text-[10px] opacity-30 mt-1">Unavailable</p>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest">Snapshot</span>
                                </div>
                            </div>

                            {/* Video Evidence */}
                            <div className="aspect-video bg-gray-950 relative overflow-hidden group">
                                {violation.video_url ? (
                                    <video
                                        src={violation.video_url}
                                        controls
                                        className="w-full h-full object-cover"
                                        poster={violation.image_url}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 italic">
                                        <div className="relative">
                                            <AlertTriangle className="w-10 h-10 mb-2 opacity-20" />
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                                        </div>
                                        <p className="text-xs font-medium uppercase tracking-widest opacity-40 leading-none">Video Evidence</p>
                                        <p className="text-[10px] opacity-30 mt-1">Processing Clip...</p>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className="bg-rose-600/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest flex items-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" /> Recording
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="font-semibold text-gray-900 mb-4">Incident Description</h2>
                        <p className="text-gray-600 leading-relaxed">
                            {violation.description}
                            <br /><br />
                            This event was automatically flagged by the SafeSite AI Surveillance System. Manual review is recommended to confirm the violation and proceed with safety protocol enforcement.
                        </p>
                    </div>
                </motion.div>

                {/* Sidebar Details */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Key Details Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Incident Details</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Violation Type</label>
                                <p className="text-gray-900 font-medium mt-1">{violation.alert_type}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</label>
                                <div className="flex items-center mt-1 text-gray-700">
                                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                    {violation.location}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time</label>
                                <div className="flex items-center mt-1 text-gray-700">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                    {new Date(violation.timestamp).toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                <div className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {violation.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Resolution Actions</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <button className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium text-sm shadow-sm shadow-emerald-500/20">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Acknowledge & Resolve
                            </button>
                            <button className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm">
                                <XCircle className="w-4 h-4 mr-2 text-gray-400" />
                                Mark as False Positive
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ViolationDetails;
