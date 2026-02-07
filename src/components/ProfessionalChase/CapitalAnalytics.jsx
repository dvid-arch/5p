
import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { TrendingUp, Wallet, ArrowDownCircle, PieChart } from 'lucide-react';

const CapitalAnalytics = ({ stats, history }) => {
    // Sample history for charting (every 5th week to keep it smooth)
    const chartData = history.filter((_, idx) => idx % 5 === 0).reverse().map(h => ({
        week: h.week,
        capital: Math.round(h.capital),
        debt: Math.round(h.totalDebt)
    }));

    return (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Wallet size={20} />
                        </div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Invested</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalInvestment.toLocaleString()}</p>
                    <p className="text-xs text-blue-500 font-medium mt-1">Capital Cycle: 621w</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-50 rounded-xl text-green-600">
                            <TrendingUp size={20} />
                        </div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Returns</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-green-500 font-medium mt-1">Efficiency: {stats.roi.toFixed(1)}%</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 rounded-xl text-red-600">
                            <ArrowDownCircle size={20} />
                        </div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drawdown Pool</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.drawdown.toLocaleString()}</p>
                    <p className="text-xs text-red-500 font-medium mt-1">Historical Max Deep</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                            <PieChart size={20} />
                        </div>
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Win/Step Ratio</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.winRate.toFixed(1)}%</p>
                    <p className="text-xs text-purple-500 font-medium mt-1">{stats.wins} Profitable Cycles</p>
                </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Capital Equity Curve</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Cumulative Growth over 621 Weeks</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                            <div className="w-3 h-3 bg-blue-600 rounded"></div> Net Capital
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                            <div className="w-3 h-3 bg-indigo-200 rounded"></div> Active Debt
                        </div>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="week"
                            stroke="#9ca3af"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `W${val}`}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => val.toLocaleString()}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            labelFormatter={(val) => `Week ${val}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="capital"
                            stroke="#2563eb"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCap)"
                        />
                        <Area
                            type="monotone"
                            dataKey="debt"
                            stroke="#818cf8"
                            strokeDasharray="5 5"
                            fillOpacity={0.1}
                            fill="#818cf8"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Strategic Footnote */}
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-center text-xs text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
                    Note: The equity curve shows the massive advantage of the **50% Profit Reset**.
                    While traditional Martingales or Fibonaccis often crash, this build leverages "Isolated Resonances"
                    to secure capital gains before volatility can take them back.
                </p>
            </div>
        </div>
    );
};

export default CapitalAnalytics;
