import React, { useState, useMemo } from 'react';
import { Brain } from 'lucide-react';
import GridVisualization from './GridVisualization';
import { predictBestGridCenters } from '../../utils/gridPredictor';

const GridPredictTab = ({ data }) => {
    const [recentWeeks, setRecentWeeks] = useState(13);
    const [predictions, setPredictions] = useState(null);
    const [selectedCenter, setSelectedCenter] = useState(null);

    useMemo(() => {
        try {
            const results = predictBestGridCenters(3, recentWeeks);
            setPredictions(results);
            if (results.length > 0) {
                setSelectedCenter(results[0].center);
            }
        } catch (err) {
            console.error('Error generating predictions:', err);
            setPredictions(null);
        }
    }, [recentWeeks]);

    return (
        <div className="space-y-6">
            {/* Configuration Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                    <Brain size={24} className="text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Next Draw Predictions</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Weight Recent Weeks: {recentWeeks}
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="52"
                                value={recentWeeks}
                                onChange={(e) => setRecentWeeks(parseInt(e.target.value))}
                                className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm text-gray-600 font-medium min-w-fit">
                                {recentWeeks === 1 ? 'Last week' : `Last ${recentWeeks} weeks`}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Score = 1.0 × (all-time frequency) + 2.0 × (recent frequency)
                        </p>
                    </div>
                </div>
            </div>

            {/* Predictions Cards */}
            {predictions && predictions.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Top 3 Recommended Centers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {predictions.map((pred, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedCenter(pred.center)}
                                className={`rounded-lg p-6 border-2 cursor-pointer transition-all transform hover:scale-105 ${
                                    selectedCenter === pred.center
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="text-4xl font-bold text-blue-600">#{pred.center}</div>
                                        <div className="text-sm text-gray-500">Grid Center</div>
                                    </div>
                                    <div className="text-3xl">
                                        {idx === 0 ? '⭐' : idx === 1 ? '✨' : '✓'}
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Score:</span>
                                        <span className="font-bold text-gray-900">{pred.score.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">All-time:</span>
                                        <span className="font-semibold text-gray-900">{pred.allTimeFrequency}x</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Recent:</span>
                                        <span className="font-semibold text-gray-900">{pred.recentFrequency}x</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Avg Coverage:</span>
                                        <span className="font-semibold text-gray-900">{pred.averageCoverage?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid Visualization */}
            {selectedCenter !== null && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Grid Visualization - Center #{selectedCenter}
                    </h3>
                    <GridVisualization center={selectedCenter} />
                </div>
            )}

            {/* Scoring Explanation */}
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-3">How Scoring Works</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <p>
                        <span className="font-semibold">Score = 1.0 × All-Time Frequency + 2.0 × Recent Frequency</span>
                    </p>
                    <p className="example">
                        Example: Center #10 with 98 all-time hits and 1 recent hit:
                    </p>
                    <p className="ml-4">
                        Score = (1.0 × 98) + (2.0 × 1) = <span className="font-bold">100.0</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GridPredictTab;
