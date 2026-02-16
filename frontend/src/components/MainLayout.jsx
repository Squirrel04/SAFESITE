import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-100 font-sans selection:bg-cyan-500/30">
            <Sidebar />
            <TopBar />
            <main className="ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
