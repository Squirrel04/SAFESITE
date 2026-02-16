import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, color = 'cyan' }) => {
    const colorClasses = {
        cyan: 'from-cyan-500 to-blue-500 shadow-cyan-500/20 text-cyan-400',
        rose: 'from-rose-500 to-orange-500 shadow-rose-500/20 text-rose-400',
        violet: 'from-violet-500 to-purple-500 shadow-violet-500/20 text-violet-400',
        emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/20 text-emerald-400',
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6 group hover:border-gray-300 transition-colors shadow-sm cursor-pointer">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gray-50 ${colorClasses[color].split(' ').pop().replace('text-', 'text-opacity-80 text-')}`}>
                    <Icon className={`w-6 h-6 ${colorClasses[color].split(' ').pop()}`} />
                </div>
            </div>

            {/* Decorative gradient background glow - reduced opacity for light theme */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${colorClasses[color]} opacity-5 blur-2xl rounded-full group-hover:opacity-10 transition-opacity`}></div>

            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={`font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                    <span className="text-gray-400 ml-2">from last hour</span>
                </div>
            )}
            {!trend && (
                <div className="mt-4 flex items-center text-sm text-gray-400">
                    <span>Stable</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
