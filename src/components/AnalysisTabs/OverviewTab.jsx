import React from 'react';
import { Target, TrendingUp, Clock, TrendingDown } from 'lucide-react';

const SummaryCard = ({ title, value, subtitle, icon: Icon, bgColor, textColor }) => (
    <div className={`${bgColor} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
            <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
            <Icon size={20} className={textColor} />
        </div>
        <div className="text-sm text-gray-600">{subtitle || title}</div>
    </div>
);

const OverviewTab = ({ analysis, data, onSelectDraw }) => {
    if (!analysis) return null;

    const { stats, hotNumbers, coldNumbers, momentum } = analysis;

    const trendingUpCount = Object.values(momentum).filter(m => m > 0.1).length;
    const decliningCount = Object.values(momentum).filter(m => m < -0.1).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Data Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                    <SummaryCard
                        title="Total Weeks"
                        value={stats.totalDraws}
                        icon={Clock}
                        bgColor="bg-blue-50"
                        textColor="text-blue-600"
                    />
                    <SummaryCard
                        title="Unique Numbers"
                        value={analysis.frequencyData.length}
                        icon={Target}
                        bgColor="bg-green-50"
                        textColor="text-green-600"
                    />
                    <SummaryCard
                        title="Hot Numbers"
                        value={hotNumbers.length}
                        icon={TrendingUp}
                        bgColor="bg-purple-50"
                        textColor="text-purple-600"
                    />
                    <SummaryCard
                        title="Cold Numbers"
                        value={coldNumbers.length}
                        icon={TrendingDown}
                        bgColor="bg-orange-50"
                        textColor="text-orange-600"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
                <h3 className="text-xl font-semibold mb-4">Recent Data</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Week</th>
                                <th className="text-left p-2">Numbers</th>
                                <th className="text-left p-2">Sum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...analysis.processedDraws]
                                .sort((a, b) => (a.week || a.index) - (b.week || b.index)) // Sort by Week (Newest-to-Oldest label)
                                .slice(0, 10) // Take top 10 labels (1, 2, 3...)
                                .map((draw, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => onSelectDraw && onSelectDraw({ week: draw.week, numbers: draw.numbers })}
                                    >
                                        <td className="p-2 font-medium">{draw.week || draw.index}</td>
                                        <td className="p-2">
                                            <div className="flex gap-1">
                                                {draw.numbers.map((num, i) => (
                                                    <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                        {num}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-2 font-semibold text-gray-700">{draw.sum}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
