import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Camera, MapPin, AlertTriangle, Shield, Download, Mail, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ViolationDetails = ({ id: propId, onClose }) => {
    const { id: paramsId } = useParams();
    const id = propId || paramsId;
    const navigate = useNavigate();
    const reportRef = useRef(null);
    const [violation, setViolation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
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

    const handleResolve = async () => {
        setIsResolving(true);
        try {
            await api.patch(`/alerts/${id}`, { is_resolved: true });
            setViolation(prev => ({ ...prev, status: 'Resolved' }));
        } catch (error) {
            console.error("Failed to resolve alert:", error);
        } finally {
            setIsResolving(false);
        }
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f8fafc',
                logging: false,
                onclone: (clonedDoc) => {
                    const elementsToHide = clonedDoc.querySelectorAll('.no-export');
                    elementsToHide.forEach(el => el.style.display = 'none');
                }
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`SafeSite_Report_${id}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
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
        <div ref={reportRef} className={`space-y-6 max-w-7xl mx-auto ${isModal ? 'p-6 bg-slate-50/50 min-h-screen' : ''}`}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onClose || (() => navigate('/alerts'))}
                        className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 shadow-sm hover:shadow no-export"
                    >
                        {isModal ? <XCircle className="w-5 h-5 text-gray-600" /> : <ArrowLeft className="w-5 h-5 text-gray-600" />}
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">
                            Incident Ref: <span className="text-cyan-600">#{id.slice(-6).toUpperCase()}</span>
                        </h1>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Safety Violation Intelligence Report</p>
                    </div>
                </div>

                <div className="flex space-x-3 no-export">
                    <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-colors disabled:opacity-50"
                    >
                        {isExporting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600 mr-2"></div>
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        {isExporting ? 'Exporting...' : 'Export PDF'}
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
                                {violation.video_url && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center no-export"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />Video Evidence</span>}
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
                            <div className="aspect-video bg-gray-950 relative overflow-hidden group no-export">
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
                            <button 
                                onClick={handleResolve}
                                disabled={isResolving || violation.status === 'Resolved'}
                                className={`w-full flex items-center justify-center px-4 py-2 ${violation.status === 'Resolved' ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20'} rounded-xl transition-colors font-medium text-sm`}
                            >
                                {isResolving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                {violation.status === 'Resolved' ? 'Resolved / Muted' : 'Acknowledge & Resolve'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ViolationDetails;
