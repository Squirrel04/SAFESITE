import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
            <Sidebar />
            <TopBar />
            <main className="ml-64 p-8 relative z-50">
                {/* Global subtle background (Standardized) */}
                <div className="hidden" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
