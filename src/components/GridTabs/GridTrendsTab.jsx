import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Filter } from 'lucide-react';
import { analyzeGridCenterFrequency } from '../../utils/gridPredictor';

const GridTrendsTab = ({ data }) => {
    const [timeRange, setTimeRange] = useState('all');

    const trendsData = useMemo(() => {
        try {
            const weeks = timeRange === 'all' ? 620 : parseInt(timeRange);
            return analyzeGridCenterFrequency(weeks);
        } catch (err) {
            console.error('Error analyzing trends:', err);
            return [];
        }
    }, [timeRange]);

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                    <Filter size={24} className="text-amber-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Historical Grid Center Frequency</h2>
                </div>

                <div className="flex gap-4 flex-wrap">
                    {[
                        { label: 'All 620 Weeks', value: 'all' },
                        { label: 'Recent 13 Weeks', value: '13' },
                        { label: 'Recent 26 Weeks', value: '26' },
                        { label: 'Recent 52 Weeks', value: '52' }
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => setTimeRange(option.value)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                timeRange === option.value
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Summary */}
            {trendsData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{trendsData.length}</div>
                        <div className="text-sm text-gray-600">Unique Centers</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{trendsData[0]?.frequency || 0}</div>
                        <div className="text-sm text-gray-600">Top Center Frequency</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600">
                            {trendsData.slice(0, 3).reduce((sum, item) => sum + item.frequency, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Top 3 Combined</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="text-2xl font-bold text-orange-600">
                            {trendsData.length > 0 
                                ? ((trendsData.slice(0, 3).reduce((sum, item) => sum + item.frequency, 0) / 
                                   trendsData.reduce((sum, item) => sum + item.frequency, 0)) * 100).toFixed(1) 
                                : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Top 3 Coverage</div>
                    </div>
                </div>
            )}

            {/* Chart */}
            {trendsData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Grid Centers</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={trendsData.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="center" />
                            <YAxis />
                            <Tooltip 
                                formatter={(value) => [`${value} times`, 'Frequency']}
                                labelFormatter={(label) => `Center #${label}`}
                            />
                            <Bar dataKey="frequency" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Table */}
            {trendsData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Rank</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Center</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Frequency</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Percentage</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-700">Avg Coverage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trendsData.map((item, idx) => {
                                    const total = trendsData.reduce((sum, d) => sum + d.frequency, 0);
                                    return (
                                        <tr
                                            key={idx}
                                            className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                        >
                                            <td className="px-6 py-4 font-semibold text-gray-900">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                                                    #{item.center}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.frequency}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {((item.frequency / total) * 100).toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {item.averageCoverage?.toFixed(2) || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GridTrendsTab;
