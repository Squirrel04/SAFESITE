import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, color = 'cyan', onClick }) => {
    const colorClasses = {
        indigo: 'from-indigo-600 to-blue-600 text-indigo-400',
        rose: 'from-rose-600 to-orange-600 text-rose-400',
        slate: 'from-slate-700 to-slate-800 text-slate-400',
        emerald: 'from-emerald-600 to-teal-600 text-emerald-400',
        blue: 'from-blue-600 to-indigo-600 text-blue-400',
    };

    const gradientClass = colorClasses[color] || colorClasses['indigo'];
    const textClass = gradientClass.split(' ').find(c => c.startsWith('text-'));

    return (
        <div 
            onClick={onClick}
            className="relative overflow-hidden rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 group hover:border-slate-700 hover:bg-slate-900/60 transition-all duration-300 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1"
        >
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className="text-sm font-semibold text-slate-400 tracking-wide uppercase">{title}</p>
                    <p className="text-4xl font-bold text-white mt-2 tracking-tight drop-shadow-sm">{value}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                    <Icon className={`w-7 h-7 ${textClass}`} />
                </div>
            </div>

            {/* Background decorative element (hidden for non-neon look) */}
            <div className="hidden"></div>

            {trend !== undefined && (
                <div className="mt-6 flex items-center text-sm relative z-10">
                    <span className={`font-semibold px-2 py-1 rounded-md bg-opacity-10 backdrop-blur-sm shadow-sm ${trend > 0 ? 'text-emerald-400 bg-emerald-500 border border-emerald-500/20' : 'text-rose-400 bg-rose-500 border border-rose-500/20'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                    <span className="text-slate-500 ml-3 font-medium text-[13px] tracking-wide uppercase">from last hour</span>
                </div>
            )}
            {trend === undefined && (
                <div className="mt-6 flex items-center text-sm text-slate-500 relative z-10 font-medium tracking-wide">
                    <div className="w-2 h-2 rounded-full bg-slate-600 mr-2 -translate-y-[1px]"></div>
                    Consistent
                </div>
            )}
        </div>
    );
};

export default StatCard;
