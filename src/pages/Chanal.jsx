// src/App.js
import React, { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, ResponsiveContainer, Cell
} from 'recharts';
import { truestdata } from '../constant/data';


// A reusable container for consistent chart styling
const ChartContainer = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md p-4 md:p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
    <div className="w-full h-80 md:h-96">
      {children}
    </div>
  </div>
);

// A reusable custom tooltip for a consistent look
const CustomTooltip = ({ active, payload, content }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 text-white p-3 border border-gray-600 rounded shadow-lg text-sm">
                {content(payload)}
            </div>
        );
    }
    return null;
};

// --- Analysis 1: Correlation of Set Length vs. Sum ---
const LengthSumCorrelationChart = ({ data }) => (
  <ChartContainer title="Analysis 1: Sum vs. Length Correlation">
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="length" name="Length" unit=" items" stroke="#6b7280" />
        <YAxis type="number" dataKey="sum" name="Sum" stroke="#6b7280" />
        <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={ <CustomTooltip content={p => <p>{`Set #${p[0].payload.id}: (${p[0].payload.length} items, Sum ${p[0].payload.sum})`}</p>} /> }
        />
        <Scatter name="Number Sets" data={data} fill="#4f46e5" />
      </ScatterChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// --- Analysis 2: Frequency of Each Number ---
const NumberFrequencyChart = ({ data }) => {
  const frequencyData = useMemo(() => {
    const freqMap = new Map(Array.from({ length: 49 }, (_, i) => [i + 1, 0]));
    data.flatMap(set => set.numbers).forEach(num => freqMap.set(num, freqMap.get(num) + 1));
    return Array.from(freqMap, ([number, frequency]) => ({ number, frequency }));
  }, [data]);
  return (
    <ChartContainer title="Analysis 2: Frequency of Each Number">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={frequencyData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="number" tick={{ fontSize: 10 }} stroke="#6b7280" />
          <YAxis allowDecimals={false} stroke="#6b7280" />
          <Tooltip content={ <CustomTooltip content={p => <p>{`Number ${p[0].payload.number}: ${p[0].value} time(s)`}</p>} /> } />
          <Bar dataKey="frequency" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// --- Analysis 3: Distribution of Odd vs. Even Numbers ---
const OddEvenChart = ({ data }) => {
  const categoryData = useMemo(() => {
    const counts = data.flatMap(set => set.numbers).reduce(
      (acc, num) => { num % 2 === 0 ? acc.even++ : acc.odd++; return acc; }, { odd: 0, even: 0 }
    );
    return [{ name: 'Odd', value: counts.odd }, { name: 'Even', value: counts.even }];
  }, [data]);
  const COLORS = ['#3b82f6', '#14b8a6'];
  return (
    <ChartContainer title="Analysis 3: Odd vs. Even Distribution">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip content={ <CustomTooltip content={p => <p>{`${p[0].name}: ${p[0].value} total`}</p>} /> } />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// --- Analysis 4: Frequency by Grid Row ---
const RowFrequencyChart = ({ data }) => {
  const rowData = useMemo(() => {
    const counts = data.flatMap(set => set.numbers).reduce((acc, num) => {
      const row = `Row ${Math.ceil(num / 7)}`;
      acc[row] = (acc[row] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => a.name.localeCompare(b.name));
  }, [data]);
  return (
    <ChartContainer title="Analysis 4: Selections by Grid Row">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rowData} layout="vertical" margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" stroke="#6b7280" />
          <YAxis dataKey="name" type="category" stroke="#6b7280" width={80} />
          <Tooltip content={ <CustomTooltip content={p => <p>{`${p[0].payload.name}: ${p[0].value} selections`}</p>} /> } />
          <Bar dataKey="count" name="Selections" fill="#f97316" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// --- Analysis 5: CORRECTED Pairwise Number Correlation Heatmap ---
const CorrelationHeatmap = ({ data }) => {
  const getColor = (value, maxValue) => {
    if (!value || maxValue === 0) return '#f0f0f0';
    const intensity = Math.sqrt(value / maxValue);
    const hue = 60 - (intensity * 60);
    return `hsl(${hue}, 100%, ${100 - 55 * intensity}%)`;
  };

  const heatmap = useMemo(() => {
    const coOccurrence = new Map();
    let maxCount = 0;
    data.forEach(set => {
      for (let i = 0; i < set.numbers.length; i++) {
        for (let j = i + 1; j < set.numbers.length; j++) {
          const pair = [set.numbers[i], set.numbers[j]].sort((a, b) => a - b);
          const key = `${pair[0]}-${pair[1]}`;
          const count = (coOccurrence.get(key) || 0) + 1;
          coOccurrence.set(key, count);
          if (count > maxCount) maxCount = count;
        }
      }
    });
    const points = [];
    for (let i = 1; i <= 49; i++) {
      for (let j = 1; j <= 49; j++) {
        if (i === j) continue;
        const pair = [i, j].sort((a, b) => a - b);
        const key = `${pair[0]}-${pair[1]}`;
        points.push({ x: i, y: j, count: coOccurrence.get(key) || 0 });
      }
    }
    return { points, maxCount };
  }, [data]);

  const { points, maxCount } = heatmap;

  return (
    <ChartContainer title="Analysis 5: Pairwise Number Correlation Heatmap" className="lg:col-span-2">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="x" name="Number" domain={[0, 50]} tickCount={10} stroke="#6b7280" />
          <YAxis type="number" dataKey="y" name="Number" domain={[0, 50]} tickCount={10} stroke="#6b7280" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={ <CustomTooltip content={p => <p>{`Pair (${p[0].payload.x}, ${p[0].payload.y}): ${p[0].payload.count} co-occurrences`}</p>} /> }/>
          <Scatter data={points} shape="square" nodeSize={9}>
            {points.map((entry, index) => <Cell key={`cell-${index}`} fill={getColor(entry.count, maxCount)} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// --- Main App Component ---
function Chanal() {
  const processedData = useMemo(() => {
    return truestdata.reverse().map((arr, index) => ({
      id: index + 1,
      numbers: arr,
      length: arr.length,
      sum: arr.reduce((acc, current) => acc + current, 0),
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            Comprehensive Data Analysis Dashboard
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CorrelationHeatmap data={processedData} />
            <LengthSumCorrelationChart data={processedData} />
            <NumberFrequencyChart data={processedData} />
            <OddEvenChart data={processedData} />
            <RowFrequencyChart data={processedData} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Chanal;