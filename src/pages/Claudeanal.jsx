import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,  Scatter, PieChart, Pie, Cell } from 'recharts';
import { truestdata } from '../constant/data';

const LotteryDataAnalyzer = () => {
  // Sample data based on the uploaded file
  const sampleData = truestdata.reverse()

  const [selectedAnalysis, setSelectedAnalysis] = useState('overview');
  const [analysisResults, setAnalysisResults] = useState({});

  useEffect(() => {
    performAnalysis();
  }, []);

  const performAnalysis = () => {
    // Basic Statistics
    const lengths = sampleData.map(arr => arr.length);
    const sums = sampleData.map(arr => arr.reduce((a, b) => a + b, 0));
    const allNumbers = sampleData.flat();
    
    // Number Frequency Analysis
    const numberFreq = {};
    allNumbers.forEach(num => {
      numberFreq[num] = (numberFreq[num] || 0) + 1;
    });

    // Hot and Cold Numbers
    const sortedFreq = Object.entries(numberFreq).sort((a, b) => b[1] - a[1]);
    const hotNumbers = sortedFreq.slice(0, 10);
    const coldNumbers = sortedFreq.slice(-10);

    // Length Distribution
    const lengthDist = {};
    lengths.forEach(len => {
      lengthDist[len] = (lengthDist[len] || 0) + 1;
    });

    // Sum Distribution
    const sumRanges = {
      '0-100': 0, '101-200': 0, '201-300': 0, '301-400': 0, '401-500': 0, '500+': 0
    };
    sums.forEach(sum => {
      if (sum <= 100) sumRanges['0-100']++;
      else if (sum <= 200) sumRanges['101-200']++;
      else if (sum <= 300) sumRanges['201-300']++;
      else if (sum <= 400) sumRanges['301-400']++;
      else if (sum <= 500) sumRanges['401-500']++;
      else sumRanges['500+']++;
    });

    // Consecutive Numbers Analysis
    const consecutiveCount = sampleData.map(combo => {
      const sorted = [...combo].sort((a, b) => a - b);
      let consecutive = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1] === sorted[i] + 1) consecutive++;
      }
      return consecutive;
    });

    // Gap Analysis (distance between numbers)
    const gaps = sampleData.map(combo => {
      const sorted = [...combo].sort((a, b) => a - b);
      const gapList = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        gapList.push(sorted[i + 1] - sorted[i]);
      }
      return gapList;
    }).flat();

    setAnalysisResults({
      basic: {
        totalCombos: sampleData.length,
        avgLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
        minLength: Math.min(...lengths),
        maxLength: Math.max(...lengths),
        avgSum: sums.reduce((a, b) => a + b, 0) / sums.length,
        minSum: Math.min(...sums),
        maxSum: Math.max(...sums),
        numberRange: [Math.min(...allNumbers), Math.max(...allNumbers)]
      },
      frequency: {
        hot: hotNumbers,
        cold: coldNumbers,
        all: numberFreq
      },
      distributions: {
        length: lengthDist,
        sum: sumRanges
      },
      patterns: {
        consecutive: {
          avg: consecutiveCount.reduce((a, b) => a + b, 0) / consecutiveCount.length,
          max: Math.max(...consecutiveCount)
        },
        gaps: {
          avg: gaps.reduce((a, b) => a + b, 0) / gaps.length,
          min: Math.min(...gaps),
          max: Math.max(...gaps)
        }
      }
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analysisResults.basic?.totalCombos}</div>
          <div className="text-sm text-gray-600">Total Combinations</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{analysisResults.basic?.avgLength?.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Length</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{analysisResults.basic?.avgSum?.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Avg Sum</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {analysisResults.basic?.numberRange?.[0]}-{analysisResults.basic?.numberRange?.[1]}
          </div>
          <div className="text-sm text-gray-600">Number Range</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Hot Numbers (Most Frequent)</h3>
          <div className="space-y-2">
            {analysisResults.frequency?.hot?.slice(0, 5).map(([num, freq]) => (
              <div key={num} className="flex justify-between items-center">
                <span className="font-medium">Number {num}</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{width: `${(freq / analysisResults.basic?.totalCombos * 100) * 2}%`}}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{freq}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Cold Numbers (Least Frequent)</h3>
          <div className="space-y-2">
            {analysisResults.frequency?.cold?.slice(0, 5).map(([num, freq]) => (
              <div key={num} className="flex justify-between items-center">
                <span className="font-medium">Number {num}</span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{width: `${(freq / analysisResults.basic?.totalCombos * 100) * 2}%`}}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{freq}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFrequencyAnalysis = () => {
    const frequencyData = analysisResults.frequency?.hot?.map(([num, freq]) => ({
      number: parseInt(num),
      frequency: freq,
      percentage: ((freq / analysisResults.basic?.totalCombos) * 100).toFixed(1)
    })) || [];

    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Number Frequency Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={frequencyData.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="number" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, 'Frequency']} />
              <Bar dataKey="frequency" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Top 10 Hot Numbers</h3>
            <div className="space-y-2">
              {analysisResults.frequency?.hot?.slice(0, 10).map(([num, freq], index) => (
                <div key={num} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">#{index + 1} Number {num}</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
                    {freq} times ({((freq / analysisResults.basic?.totalCombos) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Bottom 10 Cold Numbers</h3>
            <div className="space-y-2">
              {analysisResults.frequency?.cold?.slice(0, 10).map(([num, freq], index) => (
                <div key={num} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">Number {num}</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                    {freq} times ({((freq / analysisResults.basic?.totalCombos) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDistributionAnalysis = () => {
    const lengthData = Object.entries(analysisResults.distributions?.length || {}).map(([len, count]) => ({
      length: parseInt(len),
      count: count
    })).sort((a, b) => a.length - b.length);

    const sumData = Object.entries(analysisResults.distributions?.sum || {}).map(([range, count]) => ({
      range: range,
      count: count
    }));

    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Combination Length Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={lengthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="length" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Sum Range Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sumData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({range, count}) => `${range}: ${count}`}
                >
                  {sumData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Statistical Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-lg font-bold">{analysisResults.patterns?.consecutive?.avg?.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Avg Consecutive Numbers</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-lg font-bold">{analysisResults.patterns?.consecutive?.max}</div>
              <div className="text-sm text-gray-600">Max Consecutive</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-lg font-bold">{analysisResults.patterns?.gaps?.avg?.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Gap Size</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-lg font-bold">{analysisResults.patterns?.gaps?.max}</div>
              <div className="text-sm text-gray-600">Max Gap</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPatternAnalysis = () => {
    // Calculate pattern insights
    const evenOddAnalysis = sampleData.map((combo, index) => {
      const even = combo.filter(n => n % 2 === 0).length;
      const odd = combo.filter(n => n % 2 === 1).length;
      return { index: index + 1, even, odd, total: combo.length };
    });

    const highLowAnalysis = sampleData.map((combo, index) => {
      const mid = (analysisResults.basic?.numberRange?.[0] + analysisResults.basic?.numberRange?.[1]) / 2;
      const low = combo.filter(n => n <= mid).length;
      const high = combo.filter(n => n > mid).length;
      return { index: index + 1, low, high, total: combo.length };
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Even vs Odd Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={evenOddAnalysis.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="even" stackId="a" fill="#8884d8" name="Even" />
                <Bar dataKey="odd" stackId="a" fill="#82ca9d" name="Odd" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">High vs Low Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={highLowAnalysis.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="low" stackId="a" fill="#ffc658" name="Low" />
                <Bar dataKey="high" stackId="a" fill="#ff7300" name="High" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Pattern Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">Most Balanced Even/Odd</h4>
              <p className="text-sm text-blue-600 mt-2">
                Combinations with nearly equal even and odd numbers tend to be more balanced statistically.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800">Number Clustering</h4>
              <p className="text-sm text-green-600 mt-2">
                Some combinations show clustering in specific ranges, which might indicate patterns.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800">Gap Analysis</h4>
              <p className="text-sm text-purple-600 mt-2">
                Average gap of {analysisResults.patterns?.gaps?.avg?.toFixed(1)} suggests good distribution.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Lottery Data Analysis Dashboard</h1>
        <p className="text-gray-600">Comprehensive analysis of number combinations and patterns</p>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'frequency', label: 'Frequency Analysis' },
            { key: 'distribution', label: 'Distributions' },
            { key: 'patterns', label: 'Pattern Analysis' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedAnalysis(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedAnalysis === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        {selectedAnalysis === 'overview' && renderOverview()}
        {selectedAnalysis === 'frequency' && renderFrequencyAnalysis()}
        {selectedAnalysis === 'distribution' && renderDistributionAnalysis()}
        {selectedAnalysis === 'patterns' && renderPatternAnalysis()}
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Analysis Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <h3 className="font-semibold text-yellow-800">Predictive Modeling</h3>
            <p className="text-sm text-yellow-700 mt-2">
              Use machine learning algorithms like Random Forest or Neural Networks to predict likely number combinations based on historical patterns.
            </p>
          </div>
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400">
            <h3 className="font-semibold text-blue-800">Time Series Analysis</h3>
            <p className="text-sm text-blue-700 mt-2">
              If you have temporal data, analyze trends over time to identify cyclical patterns or seasonal variations.
            </p>
          </div>
          <div className="p-4 bg-green-50 border-l-4 border-green-400">
            <h3 className="font-semibold text-green-800">Correlation Analysis</h3>
            <p className="text-sm text-green-700 mt-2">
              Examine correlations between numbers to identify which numbers tend to appear together frequently.
            </p>
          </div>
          <div className="p-4 bg-purple-50 border-l-4 border-purple-400">
            <h3 className="font-semibold text-purple-800">Clustering Analysis</h3>
            <p className="text-sm text-purple-700 mt-2">
              Group similar combinations using k-means or hierarchical clustering to identify distinct patterns.
            </p>
          </div>
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <h3 className="font-semibold text-red-800">Anomaly Detection</h3>
            <p className="text-sm text-red-700 mt-2">
              Identify unusual combinations that deviate significantly from typical patterns using statistical methods.
            </p>
          </div>
          <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400">
            <h3 className="font-semibold text-indigo-800">Monte Carlo Simulation</h3>
            <p className="text-sm text-indigo-700 mt-2">
              Run simulations to compare your data against truly random distributions and identify non-random patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryDataAnalyzer;