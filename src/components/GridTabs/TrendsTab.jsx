import React, { useMemo, useState } from 'react';
import { analyzeGridCenterFrequency } from '../../utils/gridPredictor';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const TrendsTab = ({ data }) => {
    const [weeks, setWeeks] = useState(0); // 0 = All

    const trends = useMemo(() => {
        return analyzeGridCenterFrequency(data, weeks).slice(0, 10);
    }, [data, weeks]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-lg">Historical Frequency Analysis</h3>
                <select
                    value={weeks}
                    onChange={e => setWeeks(Number(e.target.value))}
                    className="p-2 border rounded bg-white"
                >
                    <option value={0}>All Time (620 Weeks)</option>
                    <option value={52}>Last 1 Year (52 Weeks)</option>
                    <option value={26}>Last 6 Months (26 Weeks)</option>
                    <option value={13}>Last Quarter (13 Weeks)</option>
                </select>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 h-80">
                <h4 className="text-center font-semibold text-gray-500 mb-4">Top 10 Most Frequent Grid Centers</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="center" label={{ value: 'Grid Center', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Wins', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                            <LabelList dataKey="count" position="top" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold">
                        <tr>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Center</th>
                            <th className="p-3">Total Wins</th>
                            <th className="p-3">Frequency</th>
                            <th className="p-3">Avg Coverage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trends.map((item, idx) => (
                            <tr key={item.center} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">#{idx + 1}</td>
                                <td className="p-3 text-indigo-600 font-bold text-lg">{item.center}</td>
                                <td className="p-3 font-bold">{item.count}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500"
                                                style={{ width: `${Math.min(item.percentage * 2, 100)}%` }} // Scale for visual
                                            ></div>
                                        </div>
                                        {item.percentage}%
                                    </div>
                                </td>
                                <td className="p-3">{item.avgCoverage}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TrendsTab;
