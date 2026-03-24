import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, User, ChevronRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await login(username, password);
        setIsLoading(false);
        if (success) {
            navigate('/');
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden font-sans">
            {/* Background glowing orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md p-8 relative z-10"
            >
                {/* Glass frame */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex justify-center mb-8">
                        <motion.div 
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30"
                        >
                            <Shield className="w-8 h-8 text-white" />
                        </motion.div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-400 text-center mb-8 text-sm">Secure access to SafeSite Monitor</p>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden bg-white text-slate-950 py-3.5 rounded-xl font-bold tracking-wide flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover:bg-cyan-50 transition-colors mt-8"
                        >
                            {/* Hover effect gradient */}
                            <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-[-20deg] group-hover:animate-shine" />
                            
                            <span className="flex items-center">
                                {isLoading ? 'Authenticating...' : 'Sign In'}
                                {!isLoading && <ChevronRight className="w-5 h-5 ml-2 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                            </span>
                        </button>
                    </form>
                </div>
                
                {/* Footer text */}
                <p className="text-center text-slate-600 text-xs mt-8 font-medium tracking-wider uppercase">
                    SafeSite Advanced Surveillance © 2026
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
