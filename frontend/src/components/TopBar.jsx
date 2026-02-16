import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const TopBar = () => {
    return (
        <header className="h-16 bg-white/50 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 ml-64">
            {/* Search / Breadcrumb Placeholder */}
            <div className="flex items-center">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm text-gray-700 focus:ring-2 focus:ring-cyan-500/50 outline-none w-64 transition-all"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-gray-500 hover:text-cyan-600 transition-colors rounded-full hover:bg-gray-100">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                <div className="h-6 w-px bg-gray-200"></div>

                <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                        <User className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                        <p className="text-gray-900 font-medium leading-none">Admin User</p>
                        <p className="text-gray-500 text-xs mt-1">safesite03</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
