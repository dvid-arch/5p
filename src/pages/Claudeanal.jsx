import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Scatter, PieChart, Pie, Cell } from 'recharts';
import { truestdata } from '../constant/data';

const LotteryDataAnalyzer = () => {
  // Sample data based on the uploaded file
  const sampleData = truestdata.slice().reverse()

  const [selectedAnalysis, setSelectedAnalysis] = useState('overview');
  const [analysisResults, setAnalysisResults] = useState({});

  useEffect(() => {
    performAnalysis();
  }, []);

  const performAnalysis = () => {
    // Basic Statistics
    const allNumbers = sampleData.flat().filter(n => typeof n === 'number' && !isNaN(n));
    const numberFreq = {};
    allNumbers.forEach(num => {
      numberFreq[num] = (numberFreq[num] || 0) + 1;
    });

    const sortedFreq = Object.entries(numberFreq)
      .map(([num, count]) => ({ number: parseInt(num), frequency: count }))
      .sort((a, b) => b.frequency - a.frequency);

    const lengthDist = {};
    sampleData.forEach(arr => {
      const len = arr.length;
      lengthDist[len] = (lengthDist[len] || 0) + 1;
    });

    const sumDist = {};
    sampleData.forEach(arr => {
      const sum = arr.reduce((a, b) => a + b, 0);
      const bucket = Math.floor(sum / 20) * 20;
      sumDist[bucket] = (sumDist[bucket] || 0) + 1;
    });

    // Pattern Detection (Pairs)
    const pairCounts = {};
    sampleData.forEach(numbers => {
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pair = [numbers[i], numbers[j]].sort((a, b) => a - b).join(',');
          pairCounts[pair] = (pairCounts[pair] || 0) + 1;
        }
      }
    });

    const sortedPairs = Object.entries(pairCounts)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count);

    // Trending Analysis (last 20% vs overall)
    const recentSample = sampleData.slice(0, Math.floor(sampleData.length * 0.2));
    const recentFreq = {};
    recentSample.flat().forEach(num => {
      recentFreq[num] = (recentFreq[num] || 0) + 1;
    });

    const trending = sortedFreq.map(f => {
      const overallRate = f.frequency / sampleData.length;
      const recentRate = (recentFreq[f.number] || 0) / recentSample.length;
      return {
        number: f.number,
        momentum: recentRate - overallRate
      };
    })
      .filter(t => t.momentum > 0.05)
      .sort((a, b) => b.momentum - a.momentum);

    setAnalysisResults({
      frequencyData: sortedFreq.slice().sort((a, b) => a.number - b.number),
      hotNumbers: sortedFreq.slice(0, 10),
      coldNumbers: sortedFreq.slice(-10),
      hotPairs: sortedPairs.slice(0, 12),
      trendingNumbers: trending.slice(0, 10),
      lengthData: Object.entries(lengthDist).map(([len, count]) => ({ length: parseInt(len), count })),
      sumData: Object.entries(sumDist).map(([bucket, count]) => ({ bucket, count })),
      stats: {
        totalDraws: sampleData.length,
        avgNumbers: (allNumbers.length / sampleData.length).toFixed(1),
        maxFrequency: Math.max(...Object.values(numberFreq))
      }
    });
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Total Datasets</h3>
        <p className="text-3xl font-bold text-gray-800">{analysisResults.stats?.totalDraws}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Avg No. per Draw</h3>
        <p className="text-3xl font-bold text-blue-600">{analysisResults.stats?.avgNumbers}</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Peak Frequency</h3>
        <p className="text-3xl font-bold text-green-600">{analysisResults.stats?.maxFrequency}</p>
      </div>
    </div>
  );

  const renderFrequencyAnalysis = () => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-6">Number Frequency Map</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analysisResults.frequencyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="number" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="frequency" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDistributionAnalysis = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6">Draw Length Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysisResults.lengthData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="length" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6">Sum Buckets</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysisResults.sumData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderPatternAnalysis = () => (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          Hot Number Pairs (Co-occurrence)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {analysisResults.hotPairs?.map((pair, idx) => (
            <div key={idx} className="bg-orange-50/50 border border-orange-100 p-3 rounded-xl text-center">
              <div className="text-sm font-bold text-orange-800">{pair.pair.split(',').join(' & ')}</div>
              <div className="text-[10px] text-orange-600 uppercase font-bold mt-1">{pair.count} times</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Trending Momentum (Recent vs Historical)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {analysisResults.trendingNumbers?.map((t, idx) => (
            <div key={idx} className="bg-green-50/50 border border-green-100 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-green-800">#{t.number}</div>
                <div className="text-[10px] text-green-600 uppercase font-bold">Trending Up</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-700">+{(t.momentum * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">AI Intelligence Analysis</h1>
          <p className="text-sm text-gray-500">Enhanced pattern recognition using advanced statistical models</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'frequency', label: 'Frequency' },
          { key: 'distribution', label: 'Distributions' },
          { key: 'patterns', label: 'Patterns' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedAnalysis(tab.key)}
            className={`px-5 py-2 rounded-xl font-medium transition-all ${selectedAnalysis === tab.key
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {selectedAnalysis === 'overview' && renderOverview()}
        {selectedAnalysis === 'frequency' && renderFrequencyAnalysis()}
        {selectedAnalysis === 'distribution' && renderDistributionAnalysis()}
        {selectedAnalysis === 'patterns' && renderPatternAnalysis()}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 relative">Analysis Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          <RecommendationCard
            title="Predictive Modeling"
            desc="Use machine learning algorithms like Random Forest or Neural Networks to predict likely number combinations."
            color="yellow"
          />
          <RecommendationCard
            title="Time Series Analysis"
            desc="Analyze trends over time to identify cyclical patterns or seasonal variations in data."
            color="blue"
          />
          <RecommendationCard
            title="Correlation Analysis"
            desc="Examine correlations between numbers to identify which numbers tend to appear together frequently."
            color="green"
          />
          <RecommendationCard
            title="Clustering Analysis"
            desc="Group similar combinations using k-means or hierarchical clustering to identify distinct patterns."
            color="purple"
          />
          <RecommendationCard
            title="Anomaly Detection"
            desc="Identify unusual combinations that deviate significantly from typical patterns."
            color="red"
          />
          <RecommendationCard
            title="Monte Carlo Simulation"
            desc="Run simulations to compare your data against truly random distributions."
            color="indigo"
          />
        </div>
      </div>
    </div>
  );
};

const RecommendationCard = ({ title, desc, color }) => {
  const colors = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  };

  return (
    <div className={`p-5 rounded-2xl border ${colors[color]} transition-all hover:scale-[1.02]`}>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-80">{desc}</p>
    </div>
  );
};

export default LotteryDataAnalyzer;