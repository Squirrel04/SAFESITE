import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, color = 'cyan', onClick }) => {
    const colorClasses = {
        cyan: 'from-cyan-500 to-blue-500 shadow-cyan-500/20 text-cyan-400',
        rose: 'from-rose-500 to-orange-500 shadow-rose-500/20 text-rose-400',
        violet: 'from-violet-500 to-purple-500 shadow-violet-500/20 text-violet-400',
        emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/20 text-emerald-400',
        yellow: 'from-yellow-400 to-orange-500 shadow-yellow-500/20 text-yellow-400',
    };

    const gradientClass = colorClasses[color] || colorClasses['cyan'];
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

            {/* Glowing background blob */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${gradientClass} opacity-10 blur-[40px] rounded-full group-hover:opacity-30 group-hover:-translate-x-4 group-hover:translate-y-4 transition-all duration-500`}></div>

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
