import React from 'react';

const MarkovTab = ({ analysis }) => {
    if (!analysis || !analysis.markov) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Markov Chain Transitions</h3>
                <p className="text-gray-600 mb-4">
                    Shows the probability of each number appearing in the next week based on its current appearance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.entries(analysis.markov)
                        .sort(([, a], [, b]) => b.probability - a.probability)
                        .slice(0, 20)
                        .map(([num, data]) => (
                            <div key={num} className="bg-gray-50 rounded-lg p-4">
                                <div className="text-lg font-bold text-gray-800">{num}</div>
                                <div className="text-sm text-gray-600">
                                    {(data.probability * 100).toFixed(1)}% chance
                                </div>
                                <div className="text-xs text-gray-500">
                                    {data.appears}/{data.total} times
                                </div>
                                <div className="mt-2 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${data.probability * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default MarkovTab;
