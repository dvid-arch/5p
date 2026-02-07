import React, { useMemo } from 'react';
import { analyzeGridRegions } from '../../utils/gridPredictor';

const RegionsTab = ({ data }) => {
    const regions = useMemo(() => analyzeGridRegions(data), [data]);

    // Find max format for heatmap intensity
    const maxPercent = Math.max(...regions.map(r => parseFloat(r.percent)));

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Heatmap Grid */}
            <div className="flex-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-bold text-lg mb-6 text-center">3x3 Regional Heatmap</h3>
                <div className="grid grid-cols-3 gap-2 w-full max-w-md mx-auto aspect-square">
                    {regions.map((region) => {
                        const intensity = parseFloat(region.percent) / maxPercent;
                        return (
                            <div
                                key={region.id}
                                className="relative rounded-lg flex flex-col items-center justify-center p-2 border transition-all hover:scale-105"
                                style={{
                                    backgroundColor: `rgba(79, 70, 229, ${0.1 + (intensity * 0.9)})`,
                                    borderColor: `rgba(79, 70, 229, ${0.3 + intensity})`,
                                    color: intensity > 0.6 ? 'white' : 'black'
                                }}
                            >
                                <span className="text-2xl font-bold">{region.id}</span>
                                <span className="text-sm font-medium">{region.percent}%</span>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                    Regions represent clusters of grid centers. Darker = Higher Frequency.
                </div>
            </div>

            {/* List View */}
            <div className="w-full md:w-64 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Region Rankings</h4>
                <div className="space-y-3">
                    {[...regions].sort((a, b) => b.count - a.count).map((r, idx) => (
                        <div key={r.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">#{idx + 1}</span>
                                <span className="font-bold text-indigo-700">Region {r.id}</span>
                            </div>
                            <span className="bg-white px-2 py-1 rounded border text-sm font-medium">
                                {r.percent}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RegionsTab;
