import React from 'react';

const PatternTab = ({ analysis }) => {
    if (!analysis) return null;

    const { hotNumbers, coldNumbers, momentum, frequencyData, stats } = analysis;
    const totalDraws = stats.totalDraws;

    // Classification
    const trending = Object.entries(momentum)
        .filter(([, m]) => m > 0.1)
        .map(([num]) => parseInt(num));

    const declining = Object.entries(momentum)
        .filter(([, m]) => m < -0.1)
        .map(([num]) => parseInt(num));

    const getFrequency = (num) => {
        const item = frequencyData.find(f => f.number === parseInt(num));
        return item ? item.percentage : '0.0';
    };

    const getMomentum = (num) => {
        return (momentum[num] * 100).toFixed(1);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Pattern Recognition</h3>
                <p className="text-gray-600 mb-4">
                    Identifies hot, cold, trending, and declining numbers based on frequency and momentum analysis.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-red-600">Hot Numbers</h4>
                        <div className="space-y-2">
                            {hotNumbers.slice(0, 10).map(item => (
                                <div key={item.number} className="bg-red-50 rounded-lg p-3">
                                    <div className="font-bold text-red-800">{item.number}</div>
                                    <div className="text-sm text-red-600">
                                        {item.percentage}% freq
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-blue-600">Cold Numbers</h4>
                        <div className="space-y-2">
                            {coldNumbers.slice(0, 10).map(item => (
                                <div key={item.number} className="bg-blue-50 rounded-lg p-3">
                                    <div className="font-bold text-blue-800">{item.number}</div>
                                    <div className="text-sm text-blue-600">
                                        {item.percentage}% freq
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-green-600">Trending Up</h4>
                        <div className="space-y-2">
                            {trending.slice(0, 10).map(num => (
                                <div key={num} className="bg-green-50 rounded-lg p-3">
                                    <div className="font-bold text-green-800">{num}</div>
                                    <div className="text-sm text-green-600">
                                        +{getMomentum(num)}% momentum
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-orange-600">Declining</h4>
                        <div className="space-y-2">
                            {declining.slice(0, 10).map(num => (
                                <div key={num} className="bg-orange-50 rounded-lg p-3">
                                    <div className="font-bold text-orange-800">{num}</div>
                                    <div className="text-sm text-orange-600">
                                        {getMomentum(num)}% momentum
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatternTab;
