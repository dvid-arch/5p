import React from 'react';
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Tooltip, Scatter } from 'recharts';

const GapTab = ({ analysis }) => {
    if (!analysis || !analysis.gapAnalysis) return null;

    // Prepare chart data for gap analysis
    const gapScatterData = Object.entries(analysis.gapAnalysis)
        .filter(([num, data]) => data.avgGap !== null)
        .map(([num, data]) => ({
            number: parseInt(num),
            avgGap: data.avgGap,
            dueScore: Math.min(data.dueScore, 5),
            // frequency handles differently in the new hook, might need to derive it if not present
            // In usage analysis, it was used for chart. 
            // In the new hook, it's not directly in gapAnalysis object but in frequencyData
            // Let's assume user wants to see dueScore vs avgGap
        }));

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Gap Analysis</h3>
                <p className="text-gray-600 mb-4">
                    Identifies numbers that are overdue based on their historical appearance patterns.
                </p>

                <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-2">Average Gap vs Due Score</h4>
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart data={gapScatterData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="avgGap"
                                name="Average Gap"
                                label={{ value: 'Average Gap (weeks)', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis
                                dataKey="dueScore"
                                name="Due Score"
                                label={{ value: 'Due Score', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : value, name]}
                                labelFormatter={(label) => `Number: ${label}`}
                            />
                            <Scatter name="Numbers" dataKey="dueScore" fill="#8884d8" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-lg font-semibold mb-3">Most Overdue Numbers</h4>
                        <div className="space-y-2">
                            {Object.entries(analysis.gapAnalysis)
                                .filter(([num, data]) => data.status === 'overdue')
                                .sort(([, a], [, b]) => b.dueScore - a.dueScore)
                                .slice(0, 10)
                                .map(([num, data]) => (
                                    <div key={num} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                                        <div>
                                            <span className="font-bold text-red-800">{num}</span>
                                            <span className="text-sm text-red-600 ml-2">
                                                {data.weeksSinceLast} weeks ago
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-red-700">
                                                {data.dueScore.toFixed(1)}x overdue
                                            </div>
                                            <div className="text-xs text-red-500">
                                                Avg gap: {data.avgGap?.toFixed(1)} weeks
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-3">Never Appeared</h4>
                        <div className="space-y-2">
                            {Object.entries(analysis.gapAnalysis)
                                .filter(([num, data]) => data.status === 'never_appeared')
                                .slice(0, 10)
                                .map(([num, data]) => (
                                    <div key={num} className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                                        <span className="font-bold text-yellow-800">{num}</span>
                                        <span className="text-sm text-yellow-600">Never appeared</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GapTab;
