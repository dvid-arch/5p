import React, { useMemo } from 'react';
import { Grid3x3 } from 'lucide-react';
import { analyzeGridRegions } from '../../utils/gridPredictor';

const GridRegionsTab = ({ data }) => {
    const regionsData = useMemo(() => {
        try {
            return analyzeGridRegions();
        } catch (err) {
            console.error('Error analyzing regions:', err);
            return null;
        }
    }, []);

    if (!regionsData) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-lg">Unable to load region analysis data</p>
            </div>
        );
    }

    const { regions, heatmap } = regionsData;
    const maxValue = Math.max(...regions.flat().map(r => r.frequency));

    const getHeatmapColor = (frequency) => {
        const intensity = frequency / maxValue;
        if (intensity > 0.8) return 'bg-red-500';
        if (intensity > 0.6) return 'bg-orange-500';
        if (intensity > 0.4) return 'bg-yellow-500';
        if (intensity > 0.2) return 'bg-blue-200';
        return 'bg-gray-100';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200">
                <div className="flex items-center gap-3 mb-2">
                    <Grid3x3 size={24} className="text-cyan-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Grid Region Clustering</h2>
                </div>
                <p className="text-gray-600">
                    Analysis of how winning numbers cluster across the 7×7 grid divided into 9 regions
                </p>
            </div>

            {/* 3x3 Region Grid */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Region Heatmap (3×3)</h3>

                <div className="inline-block gap-2 grid grid-cols-3 mb-6">
                    {regions.map((row, rowIdx) =>
                        row.map((region, colIdx) => (
                            <div
                                key={`${rowIdx}-${colIdx}`}
                                className={`w-32 h-32 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-lg transition-transform hover:scale-110 cursor-pointer ${getHeatmapColor(
                                    region.frequency
                                )}`}
                            >
                                <div className="text-2xl">{region.frequency}</div>
                                <div className="text-xs opacity-90 mt-1">
                                    {((region.frequency / 620) * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs opacity-75 mt-2">
                                    Region {rowIdx * 3 + colIdx + 1}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Legend */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
                    <div className="grid grid-cols-5 gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-500 rounded"></div>
                            <span className="text-sm text-gray-700">&gt;80%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500 rounded"></div>
                            <span className="text-sm text-gray-700">60-80%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-500 rounded"></div>
                            <span className="text-sm text-gray-700">40-60%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-200 rounded"></div>
                            <span className="text-sm text-gray-700">20-40%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded border border-gray-300"></div>
                            <span className="text-sm text-gray-700">&lt;20%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{regions.flat().reduce((max, r) => Math.max(max, r.frequency), 0)}</div>
                    <div className="text-sm text-gray-700 mt-1">Highest Region Frequency</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                        {(regions.flat().reduce((sum, r) => sum + r.frequency, 0) / 9).toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">Average Region Frequency</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">9</div>
                    <div className="text-sm text-gray-700 mt-1">Total Regions Analyzed</div>
                </div>
            </div>

            {/* Region Details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Region</th>
                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Position</th>
                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Frequency</th>
                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Percentage</th>
                                <th className="text-left px-6 py-3 font-semibold text-gray-700">Intensity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regions.flat().map((region, idx) => {
                                const percentage = ((region.frequency / 620) * 100).toFixed(1);
                                const rowIdx = Math.floor(idx / 3);
                                const colIdx = idx % 3;
                                return (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 font-semibold text-gray-900">Region {idx + 1}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            Row {rowIdx + 1}, Col {colIdx + 1}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{region.frequency}</td>
                                        <td className="px-6 py-4 text-gray-600">{percentage}%</td>
                                        <td className="px-6 py-4">
                                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                    style={{
                                                        width: `${(region.frequency / maxValue) * 100}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GridRegionsTab;
