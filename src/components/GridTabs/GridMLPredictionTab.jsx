import React, { useState, useEffect } from 'react';
import { calculateDrawFeatures } from '../../utils/gridMLTraining';
import { analyzeGridCenterFrequency, getGridCells, findOptimalGridCenters } from '../../utils/gridPredictor';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Zap, Trash2, RefreshCw, Award, Target } from 'lucide-react';

export default function GridMLPredictionTab() {
  const [inputNumbers, setInputNumbers] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [serverConnected, setServerConnected] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    checkServerConnection();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('mlPredictionHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mlPredictionHistory', JSON.stringify(history));
  }, [history]);

  const checkServerConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      setServerConnected(response.ok);
    } catch (e) {
      setServerConnected(false);
    }
  };

  const generateRecommendations = (mlPrediction, inputNumbers) => {
    try {
      // Get frequency analysis - returns array of {center, frequency, averageCoverage}
      const freqResults = analyzeGridCenterFrequency(620);
      
      if (!freqResults || freqResults.length === 0) {
        console.warn('Frequency analysis returned empty');
        return [];
      }
      
      // Find optimal centers for these specific numbers
      const optimal = findOptimalGridCenters(inputNumbers, 10);

      // Combine ML prediction with frequency + optimal analysis
      const recommendations = freqResults.slice(0, 15).map((item, idx) => {
        const isOptimal = optimal.some(o => o.center === item.center);
        const isInTop10 = mlPrediction?.top10?.prediction === 1 && 
                         [9, 10, 11, 12, 13, 16, 18, 19, 23, 31].includes(item.center);
        
        // Calculate combined confidence
        let confidence = 0.5; // Base
        
        // Add ML confidence if applicable
        if (mlPrediction?.top10?.prediction === 1 && [9, 10, 11, 12, 13, 16, 18, 19, 23, 31].includes(item.center)) {
          confidence += mlPrediction.top10.confidence * 0.2;
        }
        
        // Add frequency boost (top centers get more)
        confidence += (1 - (idx / 15)) * 0.3;
        
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

      const topRecs = recommendations.slice(0, 5);
      console.log('Generated recommendations:', topRecs);
      return topRecs;
    } catch (e) {
      console.error('Error generating recommendations:', e);
      return [];
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError('');

    if (!serverConnected) {
      setError('ML Server not running. Start with: node ml_prediction_server.js');
      return;
    }

    const numbers = inputNumbers
      .split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n > 0 && n <= 49);

    if (numbers.length === 0) {
      setError('Please enter valid numbers (1-49)');
      return;
    }

    setLoading(true);

    try {
      const features = calculateDrawFeatures(numbers);
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

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          features: featureArray,
          inputNumbers: numbers,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const result = await response.json();
      setPrediction(result);

      // Generate actionable recommendations
      const recs = generateRecommendations(result, numbers);
      setRecommendations(recs);

      // Add to history
      setHistory([...history, { ...result, recommendations: recs }]);
    } catch (err) {
      setError('Error making prediction: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('mlPredictionHistory');
  };

  const retryLastPrediction = () => {
    if (history.length > 0) {
      const last = history[history.length - 1];
      setInputNumbers(last.inputNumbers.join(', '));
      setPrediction(last);
      setRecommendations(last.recommendations || []);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Server Status */}
      <div className={`p-4 rounded-lg ${serverConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${serverConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={serverConnected ? 'text-green-700' : 'text-red-700'}>
            {serverConnected ? '✓ ML Server Connected' : '✗ ML Server Offline'}
          </span>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handlePredict} className="space-y-4 bg-white p-4 rounded-lg border">
        <div>
          <label className="block text-sm font-medium mb-2">Enter Numbers (1-49)</label>
          <input
            type="text"
            placeholder="e.g., 5, 12, 23, 35, 41, 45"
            value={inputNumbers}
            onChange={(e) => setInputNumbers(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated lottery numbers to analyze</p>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !serverConnected}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            {loading ? 'Analyzing...' : 'Get Recommendations'}
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={retryLastPrediction}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Last
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </form>

      {/* Top Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-300">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Award size={24} className="text-yellow-600" />
              🎯 TOP RECOMMENDATIONS FOR YOUR NEXT GAME
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
                        <h4 className="font-bold text-lg text-gray-800">
                          Center #{rec.center}
                        </h4>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {rec.isOptimal && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                              ✓ Optimal for your numbers
                            </span>
                          )}
                          {rec.isInTop10 && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                              ⭐ ML Top-10
                            </span>
                          )}
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                            🔥 Historically #1 frequent
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {Math.round(rec.confidence * 100)}%
                      </p>
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
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Grid Cells Covered:</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.cells.map((cell, i) => (
                        <span
                          key={i}
                          className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full"
                        >
                          {cell}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-gray-600">Historical Frequency</p>
                      <p className="font-bold text-blue-600">{rec.frequency} times</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <p className="text-gray-600">Coverage</p>
                      <p className="font-bold text-purple-600">{Math.round(rec.coverage * 100)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2">📋 How to Use These Recommendations:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Play the grid centers listed above in order of confidence</li>
                <li>Each center covers multiple numbers (shown in "Grid Cells")</li>
                <li>Higher confidence = better chance based on ML + historical patterns</li>
                <li>If your numbers match a center's cells, that's a strong signal!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ML Analysis Details (collapsed) */}
      {prediction && (
        <details className="bg-white p-4 rounded-lg border">
          <summary className="font-semibold cursor-pointer text-gray-700 hover:text-gray-900">
            📊 ML Model Details (expand to see)
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Binary Prediction */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-medium text-blue-700 mb-3">Binary Classifier (High/Low)</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Prediction</p>
                    <p className="text-xl font-bold text-blue-600">{prediction.binary.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confidence</p>
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
                </div>
              </div>

              {/* Top-10 Prediction */}
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                <h4 className="font-medium text-purple-700 mb-3">Top-10 Classifier</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Prediction</p>
                    <p className="text-xl font-bold text-purple-600">{prediction.top10.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confidence</p>
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
              </div>
            </div>
          </div>
        </details>
      )}

      {/* Prediction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Prediction History ({history.length})</h3>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
            >
              <Trash2 size={16} />
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
            No predictions yet. Make your first prediction above!
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...history].reverse().map((pred, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border text-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">
                    {pred.inputNumbers.join(', ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(pred.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Binary: </span>
                    <span className="font-semibold">{pred.binary.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Top-10: </span>
                    <span className="font-semibold">{pred.top10.label}</span>
                  </div>
                </div>
                {pred.recommendations && pred.recommendations.length > 0 && (
                  <div className="mt-2 text-xs font-semibold text-yellow-600">
                    Top Pick: Center #{pred.recommendations[0].center} ({Math.round(pred.recommendations[0].confidence * 100)}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
