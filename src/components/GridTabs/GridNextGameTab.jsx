import React, { useState, useEffect } from 'react';
import { calculateDrawFeatures } from '../../utils/gridMLTraining';
import { analyzeGridCenterFrequency, getGridCells, findOptimalGridCenters } from '../../utils/gridPredictor';
import { truestdata } from '../../constant/data';
import { Award, TrendingUp, Zap, RotateCcw } from 'lucide-react';

export default function GridNextGameTab() {
  const [recentDraws, setRecentDraws] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverConnected, setServerConnected] = useState(false);

  useEffect(() => {
    checkServerConnection();
    generateNextGamePredictions();
  }, []);

  const checkServerConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      setServerConnected(response.ok);
    } catch (e) {
      setServerConnected(false);
    }
  };

  const generateNextGamePredictions = async () => {
    setLoading(true);
    try {
      // Get the most recent 13 draws (2-3 months)
      const recent = truestdata.slice(0, 13);
      setRecentDraws(recent);

      // Flatten all numbers from recent draws
      const allRecentNumbers = [];
      recent.forEach(draw => {
        const numbers = Array.isArray(draw) ? draw : draw.value || [];
        allRecentNumbers.push(...numbers);
      });

      if (allRecentNumbers.length === 0) {
        console.error('No recent numbers found');
        return;
      }

      // Calculate features from recent numbers
      const features = calculateDrawFeatures(allRecentNumbers);
      const featureArray = [
        features.count || 0,
        features.sum || 0,
        features.average || 0,
        features.median || 0,
        features.min || 0,
        features.max || 0,
        features.range || 0,
        features.oddCount || 0,
        features.evenCount || 0,
        features.lowCount || 0,
        features.highCount || 0,
        features.midCount || 0,
        features.variance || 0,
        features.standardDeviation || 0,
        features.avgGap || 0,
        features.maxGap || 0,
        features.sumOfSquares || 0,
        features.skewness || 0,
        features.q1 || 0,
        features.q3 || 0,
        features.iqr || 0,
      ];

      // Get ML prediction
      let mlPrediction = null;
      if (serverConnected) {
        try {
          const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              features: featureArray,
              inputNumbers: allRecentNumbers.slice(0, 6),
              timestamp: new Date().toISOString()
            })
          });

          if (response.ok) {
            mlPrediction = await response.json();
          }
        } catch (e) {
          console.warn('ML prediction failed, continuing without it');
        }
      }

      setPrediction(mlPrediction);

      // Generate recommendations
      const recs = generateRecommendations(mlPrediction, allRecentNumbers);
      setRecommendations(recs);
    } catch (e) {
      console.error('Error generating predictions:', e);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (mlPrediction, recentNumbers) => {
    try {
      // Get frequency analysis
      const freqResults = analyzeGridCenterFrequency(620);

      if (!freqResults || freqResults.length === 0) {
        return [];
      }

      // Find optimal centers for recent numbers
      const optimal = findOptimalGridCenters(recentNumbers, 10);

      // Combine analysis
      const recommendations = freqResults.slice(0, 15).map((item, idx) => {
        const isOptimal = optimal.some(o => o.center === item.center);
        const isInTop10 =
          mlPrediction?.top10?.prediction === 1 &&
          [9, 10, 11, 12, 13, 16, 18, 19, 23, 31].includes(item.center);

        // Calculate combined confidence
        let confidence = 0.5; // Base

        // Add ML confidence if applicable
        if (
          mlPrediction?.top10?.prediction === 1 &&
          [9, 10, 11, 12, 13, 16, 18, 19, 23, 31].includes(item.center)
        ) {
          confidence += mlPrediction.top10.confidence * 0.2;
        }

        // Add frequency boost
        confidence += (1 - idx / 15) * 0.3;

        // Add optimal boost
        if (isOptimal) {
          confidence += 0.2;
        }

        return {
          center: item.center,
          frequency: item.frequency,
          coverage: item.averageCoverage || 0,
          cells: getGridCells(item.center),
          confidence: Math.min(confidence, 0.95),
          isOptimal,
          isInTop10,
          rank: idx + 1
        };
      });

      return recommendations.slice(0, 5);
    } catch (e) {
      console.error('Error generating recommendations:', e);
      return [];
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">🎮 Next Game Predictions</h2>
        <p className="text-purple-100">Automatic predictions based on the most recent {recentDraws.length} draws</p>
      </div>

      {/* Server Status */}
      <div className={`p-4 rounded-lg ${serverConnected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${serverConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className={serverConnected ? 'text-green-700' : 'text-yellow-700'}>
              {serverConnected ? '✓ Full ML Analysis' : '⚠️ Basic Analysis (ML Server Offline)'}
            </span>
          </div>
          <button
            onClick={generateNextGamePredictions}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded text-sm"
          >
            <RotateCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full"></div>
          <p className="mt-4 text-gray-600">Analyzing recent draws...</p>
        </div>
      ) : (
        <>
          {/* Recent Draws Summary */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Most Recent Draws
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentDraws.map((draw, idx) => {
                const numbers = Array.isArray(draw) ? draw : draw.value || [];
                return (
                  <div key={idx} className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded border border-blue-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Week {idx + 1} (Most Recent)</p>
                    <div className="flex flex-wrap gap-2">
                      {numbers.map((num, i) => (
                        <span key={i} className="bg-blue-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-300">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Award size={24} className="text-yellow-600" />
                  🎯 TOP 5 PICKS FOR NEXT GAME
                </h3>

                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-lg border-l-4 border-yellow-400 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                            {rec.rank}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-800">Center #{rec.center}</h4>
                            <div className="flex gap-2 flex-wrap mt-1">
                              {rec.isOptimal && (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                  ✓ Best for recent draws
                                </span>
                              )}
                              {rec.isInTop10 && (
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                  ⭐ ML Top-10
                                </span>
                              )}
                              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                🔥 Historically frequent
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Confidence</p>
                          <p className="text-2xl font-bold text-yellow-600">{Math.round(rec.confidence * 100)}%</p>
                        </div>
                      </div>

                      {/* Confidence Bar */}
                      <div className="mb-3">
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all"
                            style={{ width: `${rec.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Grid Cells */}
                      <div className="bg-gray-50 p-3 rounded mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Grid Cells Covered:</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.cells.map((cell, i) => (
                            <span key={i} className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                              {cell}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-gray-600">Appeared</p>
                          <p className="font-bold text-blue-600">{rec.frequency}x in 620 weeks</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-gray-600">Avg Coverage</p>
                          <p className="font-bold text-purple-600">{Math.round(rec.coverage * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Box */}
                <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">📋 How to Play:</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Play the grid centers listed above for the next draw</li>
                    <li>Start with #1 (highest confidence), then #2, #3, etc.</li>
                    <li>Each center covers specific numbers shown above</li>
                    <li>Higher confidence = stronger signal from recent patterns</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ML Details */}
          {prediction && (
            <details className="bg-white p-4 rounded-lg border">
              <summary className="font-semibold cursor-pointer text-gray-700 hover:text-gray-900">
                📊 ML Analysis Details (expand to see)
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-medium text-blue-700 mb-3">Binary Classifier (High/Low)</h4>
                  <p className="text-xl font-bold text-blue-600 mb-2">{prediction.binary.label}</p>
                  <div className="bg-blue-100 rounded-full h-6 flex items-center px-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${prediction.binary.confidence * 100}%` }}
                    ></div>
                    <span className="ml-2 text-xs font-semibold text-blue-700">
                      {Math.round(prediction.binary.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                  <h4 className="font-medium text-purple-700 mb-3">Top-10 Classifier</h4>
                  <p className="text-xl font-bold text-purple-600 mb-2">{prediction.top10.label}</p>
                  <div className="bg-purple-100 rounded-full h-6 flex items-center px-3">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${prediction.top10.confidence * 100}%` }}
                    ></div>
                    <span className="ml-2 text-xs font-semibold text-purple-700">
                      {Math.round(prediction.top10.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
