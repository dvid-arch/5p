
import React, { useState } from 'react';
import { useProfessionalChase } from '../hooks/useProfessionalChase';
import { truestdata } from '../constant/data';
import ChaseMonitor from '../components/ProfessionalChase/ChaseMonitor';
import HistoryExplorer from '../components/ProfessionalChase/HistoryExplorer';
import CapitalAnalytics from '../components/ProfessionalChase/CapitalAnalytics';
import {
    TrendingUp,
    History,
    BarChart3,
    ShieldCheck,
    Zap,
    AlertCircle
} from 'lucide-react';

const ProfessionalChase = () => {
    const [activeTab, setActiveTab] = useState('monitor');
    const analysis = useProfessionalChase(truestdata);

    if (!analysis) return <div className="p-8 text-gray-500">Initializing Intelligence Engine...</div>;

    const { stats, currentChases, history } = analysis;

    return (
        <div className="space-y-6">
            {/* Header / Stats Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Professional Chase Dashboard
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
                            Elite 50 Build
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Isolated Clusters • Staggered 27-step Fibonacci • 50% Profit Reset
                    </p>
                </div>

                <div className="grid grid-cols-2 md:flex gap-4">
                    <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">ROI (621w)</p>
                        <p className="text-xl font-bold text-blue-600">+{stats.roi.toFixed(1)}%</p>
                    </div>
                    <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Net Profit</p>
                        <p className="text-xl font-bold text-green-600">+{stats.netProfit.toLocaleString()}</p>
                    </div>
                    <div className="px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Max Drawdown</p>
                        <p className="text-xl font-bold text-red-600">{stats.drawdown.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Quick Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-2xl text-white flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-white/70 font-medium">Active Chases</p>
                        <p className="text-lg font-bold">{currentChases.length} Seeds Pending</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="bg-green-100 p-2 rounded-lg text-green-600">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Strategy Survival</p>
                        <p className="text-lg font-bold text-gray-800">{stats.losses === 0 ? '100%' : ((1 - stats.losses / stats.wins) * 100).toFixed(1) + '%'} Efficiency</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Reset Triggers</p>
                        <p className="text-lg font-bold text-gray-800">{stats.resets} Profit Re-entries</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100/50 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('monitor')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'monitor'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <TrendingUp size={16} />
                    Chase Monitor
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <History size={16} />
                    Hit History
                </button>
                <button
                    onClick={() => setActiveTab('capital')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'capital'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <BarChart3 size={16} />
                    Analytics
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
                {activeTab === 'monitor' && <ChaseMonitor currentChases={currentChases} fibo={analysis.fibo} />}
                {activeTab === 'history' && <HistoryExplorer history={history} />}
                {activeTab === 'capital' && <CapitalAnalytics stats={stats} history={history} />}
            </div>
        </div>
    );
};

export default ProfessionalChase;
