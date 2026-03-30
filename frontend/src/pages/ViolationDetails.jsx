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
        confidence: '98%',
        image_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800',
        video_url: null
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
            case 'high': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'low': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
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
            // Wait for images to be loaded
            const images = reportRef.current.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0f172a', // Slate-900 for dark mode export
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
            pdf.save(`SafeSite_Report_${id.slice(-6).toUpperCase()}.pdf`);
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!violation) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white">Violation Not Found</h2>
                <button onClick={() => navigate('/alerts')} className="mt-4 text-indigo-400 hover:underline">Return to Logs</button>
            </div>
        );
    }

    return (
        <div ref={reportRef} className={`space-y-6 max-w-7xl mx-auto p-2 ${isModal ? 'p-6 bg-slate-900 min-h-screen' : ''}`}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onClose || (() => navigate('/alerts'))}
                        className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl transition-all border border-slate-700/50 shadow-xl no-export"
                    >
                        {isModal ? <XCircle className="w-5 h-5 text-slate-400" /> : <ArrowLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white leading-tight tracking-tighter italic">
                            Incident Ref: <span className="text-indigo-400">#{id.slice(-6).toUpperCase()}</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Safety Violation Intelligence Report</p>
                    </div>
                </div>

                <div className="flex space-x-3 no-export">
                    <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20 font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {isExporting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        {isExporting ? 'Exporting...' : 'Export Report'}
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
                    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 backdrop-blur-md">
                            <h2 className="font-bold text-white flex items-center text-xs uppercase tracking-widest leading-none">
                                <Camera className="w-4 h-4 mr-3 text-indigo-400" />
                                Visual Evidence Log
                            </h2>
                            <div className="flex gap-2">
                                <span className="text-[10px] font-black text-slate-400 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full uppercase tracking-widest">CAM: {violation.camera_id}</span>
                                {violation.video_url && <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest flex items-center no-export"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />Video Source</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800">
                            {/* Snapshot Image */}
                            <div className="aspect-video bg-black relative overflow-hidden group">
                                {violation.image_url ? (
                                    <img
                                        src={violation.image_url.startsWith('http') ? violation.image_url : `http://localhost:8000${violation.image_url}`}
                                        alt="Evidence Snapshot"
                                        crossOrigin="anonymous"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <Camera className="w-10 h-10 mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-40">Still Snapshot</p>
                                        <p className="text-[10px] opacity-30 mt-1 italic tracking-[0.2em]">Unavailable</p>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-[0.2em]">Static_Still</span>
                                </div>
                            </div>

                            {/* Video Evidence */}
                            <div className="aspect-video bg-black relative overflow-hidden group no-export">
                                {violation.video_url ? (
                                    <video
                                        src={violation.video_url.startsWith('http') ? violation.video_url : `http://localhost:8000${violation.video_url}`}
                                        controls
                                        className="w-full h-full object-cover"
                                        poster={violation.image_url}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                        <div className="relative">
                                            <AlertTriangle className="w-10 h-10 mb-2 opacity-20 text-rose-500" />
                                            <div className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-40 leading-none">Live Playback</p>
                                        <p className="text-[10px] opacity-30 mt-1 italic tracking-[0.2em]">Syndicating Clip...</p>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="bg-rose-600/80 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-[0.2em] flex items-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse" /> Recording
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
                        <h2 className="text-lg font-black text-white italic tracking-tighter uppercase mb-6 flex items-center">
                            <Shield className="w-5 h-5 mr-3 text-indigo-400" /> Incident Semantic breakdown
                        </h2>
                        <div className="space-y-6 text-slate-400 text-sm leading-relaxed font-medium">
                            <p>
                                {violation.description || 'System reasoning: Individual detected with behavioral anomalies or missing PPE equipment in high-risk zones.'}
                            </p>
                            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">AI Recommendation</p>
                                <p className="text-slate-300 text-sm italic">
                                    {violation.recommendation || "Immediate safety protocol enforcement required. Site supervisor should verify worker's certification and PPE compliance before continuing tasks."}
                                </p>
                            </div>
                        </div>
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
                    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-6 bg-slate-800/20 border-b border-slate-800 backdrop-blur-md">
                            <h3 className="font-bold text-white text-xs uppercase tracking-[0.2em]">Incident Details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Violation Type</label>
                                <p className="text-white font-bold mt-2 text-lg tracking-tight italic">{violation.alert_type}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Location</label>
                                <div className="flex items-center mt-2 text-slate-300 font-bold">
                                    <MapPin className="w-4 h-4 mr-2 text-indigo-400" />
                                    {violation.location}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Registered</label>
                                <div className="flex items-center mt-2 text-slate-300 font-bold">
                                    <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                                    {new Date(violation.timestamp).toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operational Status</label>
                                <div className="mt-2">
                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${violation.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                        {violation.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
                        <div className="p-6 bg-slate-800/20 border-b border-slate-800 backdrop-blur-md">
                            <h3 className="font-bold text-white text-xs uppercase tracking-[0.2em]">Resolution Bridge</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <button 
                                onClick={handleResolve}
                                disabled={isResolving || violation.status === 'Resolved'}
                                className={`w-full flex items-center justify-center px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${violation.status === 'Resolved' ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20'}`}
                            >
                                {isResolving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-3" />
                                )}
                                {violation.status === 'Resolved' ? 'Incident Archived' : 'Enforce & Resolve'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ViolationDetails;
