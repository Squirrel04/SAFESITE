import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Camera, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
        { path: '/cameras', icon: Camera, label: 'Cameras' },
    ];

    return (
        <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50 shadow-sm">
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg mr-3 shadow-lg shadow-cyan-500/20"></div>
                <h1 className="text-xl font-bold text-gray-900">
                    SafeSite
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-cyan-50 text-cyan-700 shadow-sm ring-1 ring-cyan-200'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon className={`w-5 h-5 mr-3 transition-colors ${item.isActive ? 'text-cyan-600' : ''}`} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
