import React, { useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Graph } from '@visx/network';
import { ParentSize } from '@visx/responsive'; // <-- IMPORT THE RESPONSIVE WRAPPER
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { truestdata } from '../constant/data';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- Raw Data: An array of number arrays ---
const rawCombinations = truestdata.reverse();

// --- Analysis Helper Functions (Unchanged) ---
const getNumberFrequencies = (data) => {
  const allNumbers = data.flatMap(c => c.numbers);
  const frequencies = {};
  for (let i = 1; i <= 49; i++) frequencies[i] = 0;
  allNumbers.forEach(num => {
    if (frequencies[num] !== undefined) frequencies[num]++;
  });
  return frequencies;
};

const getCommonPairs = (data, topN = 10) => {
  const pairCounts = {};
  data.forEach(combo => {
    const sortedNumbers = [...combo.numbers].sort((a, b) => a - b);
    for (let i = 0; i < sortedNumbers.length; i++) {
      for (let j = i + 1; j < sortedNumbers.length; j++) {
        const key = `${sortedNumbers[i]}-${sortedNumbers[j]}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  });
  return Object.entries(pairCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN);
};

const getStats = (arr) => {
  const sum = arr.reduce((a, b) => a + b, 0);
  const mean = sum / arr.length;
  const sorted = [...arr].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[Math.floor(sorted.length / 2) - 1] + sorted[Math.floor(sorted.length / 2)]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const range = sorted[sorted.length - 1] - sorted[0];
  return { mean: mean.toFixed(2), median, range };
};


// --- Reusable Tailwind Styled Components (Unchanged) ---
const Card = ({ children, className }) => (
  <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-md ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 className="text-xl font-bold text-gray-800 mb-4">{children}</h3>
);


// --- Visualization Components (NetworkGraph is updated) ---

const FrequencyBarChart = ({ frequencies }) => {
  const data = {
    labels: Object.keys(frequencies),
    datasets: [{
      label: 'Frequency',
      data: Object.values(frequencies),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }],
  };
  return <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />;
};

const GridHeatmap = ({ frequencies }) => {
  const maxFreq = Math.max(...Object.values(frequencies));
  const grid = Array.from({ length: 7 }, (_, rowIndex) =>
    Array.from({ length: 7 }, (_, colIndex) => {
      const number = rowIndex * 7 + colIndex + 1;
      return { number, freq: frequencies[number] || 0 };
    })
  );

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {grid.flat().map(({ number, freq }) => (
        <div
          key={number}
          className="flex flex-col items-center justify-center aspect-square rounded-md p-1 border border-gray-200"
          style={{
            backgroundColor: `rgba(34, 197, 94, ${maxFreq > 0 ? freq / maxFreq : 0})`,
            color: maxFreq > 0 && freq / maxFreq > 0.5 ? 'white' : 'black',
          }}
        >
          <span className="font-bold text-sm sm:text-base">{number}</span>
          <span className="text-xs">({freq})</span>
        </div>
      ))}
    </div>
  );
};

const SmallPieChart = ({ data, labels, colors, title }) => {
    const chartData = {
        labels,
        datasets: [{ data, backgroundColor: colors }],
    };
    return (
        <div className="flex flex-col items-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32">
                <Pie data={chartData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: title, position: 'bottom' }}}}/>
            </div>
        </div>
    );
};


// --- UPDATED NetworkGraph Component ---
const NetworkGraph = ({ pairs }) => {
    const nodes = useMemo(() =>
        [...new Set(pairs.flatMap(([pair]) => pair.split('-')))].map(id => ({ id, radius: 8, color: '#2563eb' }))
    , [pairs]);

    const links = useMemo(() =>
        pairs.map(([pair, freq]) => {
            const [source, target] = pair.split('-');
            return { source, target, weight: freq };
        })
    , [pairs]);

    if (!nodes.length || !links.length) return <p className="text-gray-500 text-center">Not enough data for graph.</p>

    const graph = { nodes, links };

    // Use ParentSize to make the graph responsive
    return (
        <div className="w-full h-96">
            <ParentSize>
                {({ width, height }) => (
                    <svg width={width} height={height}>
                        <rect width={width} height={height} fill="#f9fafb" rx={14} />
                        <Graph
                            key={`graph-${width}-${height}`} // Re-render graph on resize
                            graph={graph}
                            nodeComponent={({ node }) => (
                                <circle
                                    r={node.radius}
                                    fill={node.color}
                                    onClick={() => alert(`Node: ${node.id}`)}
                                    className="cursor-pointer"
                                />
                            )}
                            linkComponent={({ link }) => (
                                <line
                                    x1={link.source.x} y1={link.source.y}
                                    x2={link.target.x} y2={link.target.y}
                                    strokeWidth={link.weight * 1.5}
                                    stroke="#9ca3af" strokeOpacity={0.6}
                                />
                            )}
                        />
                    </svg>
                )}
            </ParentSize>
        </div>
    );
}

// --- Main Page Component (Unchanged, but now calls the fixed NetworkGraph) ---
export default function DataAnalysisPage() {
  const combinationsData = useMemo(() => {
    return rawCombinations.map((numbers, index) => ({
      id: index + 1,
      numbers,
      sum: numbers.reduce((a, b) => a + b, 0),
      length: numbers.length,
    }));
  }, []);

  const frequencies = useMemo(() => getNumberFrequencies(combinationsData), [combinationsData]);
  const commonPairs = useMemo(() => getCommonPairs(combinationsData, 30), [combinationsData]);
  const sumStats = useMemo(() => getStats(combinationsData.map(c => c.sum)), [combinationsData]);
  const lengthStats = useMemo(() => getStats(combinationsData.map(c => c.length)), [combinationsData]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-8">
          Lottery Data Analysis
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card className="lg:col-span-2">
            <CardTitle>Descriptive Summary</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 text-center divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                <div className="py-4">
                    <h4 className="text-lg font-semibold text-gray-700">Sum of Combinations</h4>
                    <p className="text-gray-600">Mean: <span className="font-bold">{sumStats.mean}</span></p>
                    <p className="text-gray-600">Median: <span className="font-bold">{sumStats.median}</span></p>
                    <p className="text-gray-600">Range: <span className="font-bold">{sumStats.range}</span></p>
                </div>
                 <div className="py-4">
                    <h4 className="text-lg font-semibold text-gray-700">Length of Combinations</h4>
                    <p className="text-gray-600">Mean: <span className="font-bold">{lengthStats.mean}</span></p>
                    <p className="text-gray-600">Median: <span className="font-bold">{lengthStats.median}</span></p>
                    <p className="text-gray-600">Range: <span className="font-bold">{lengthStats.range}</span></p>
                </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Number Frequency (Hot & Cold)</CardTitle>
            <div className="h-80"><FrequencyBarChart frequencies={frequencies} /></div>
          </Card>

          <Card>
            <CardTitle>Spatial Frequency Heatmap</CardTitle>
            <GridHeatmap frequencies={frequencies} />
          </Card>

           <Card className="lg:col-span-2">
              <CardTitle>Relational Analysis</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Most Common Pairs</h4>
                    <ul className="space-y-1 text-gray-600">
                        {getCommonPairs(combinationsData).map(([pair, count]) => (
                            <li key={pair} className="flex justify-between p-2 bg-gray-50 rounded">
                                <span>Pair: <span className="font-mono font-bold">{pair}</span></span>
                                <span className="font-semibold">{count} times</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="md:col-span-2">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2 text-center">Co-occurrence Network Graph</h4>
                    <NetworkGraph pairs={commonPairs} />
                </div>
              </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardTitle>Breakdown by Combination</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Even/Odd Ratios</h4>
                    <div className="flex flex-wrap justify-center gap-4">
                        {combinationsData.map(c => (
                            <SmallPieChart
                                key={c.id}
                                title={`Set ${c.id}`}
                                data={[c.numbers.filter(n => n % 2 === 0).length, c.numbers.filter(n => n % 2 !== 0).length]}
                                labels={['Even', 'Odd']}
                                colors={['#60a5fa', '#f87171']}
                            />
                        ))}
                    </div>
                </div>
                 <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Low/High Ratios</h4>
                    <div className="flex flex-wrap justify-center gap-4">
                        {combinationsData.map(c => (
                            <SmallPieChart
                                key={c.id}
                                title={`Set ${c.id}`}
                                data={[c.numbers.filter(n => n <= 25).length, c.numbers.filter(n => n > 25).length]}
                                labels={['Low (1-25)', 'High (26-49)']}
                                colors={['#facc15', '#4ade80']}
                            />
                        ))}
                    </div>
                </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}