import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
            <Sidebar />
            <TopBar />
            <main className="ml-64 p-8 relative">
                {/* Global subtle background gradients */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/4" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
