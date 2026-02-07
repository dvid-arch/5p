
import { truestdata } from './src/constant/data.js';
import { detectIsolatedClusters } from './src/pages/PatternUtils.js';

const odds = 11.5;
const profitTrigger = 0.50;
const data = [...truestdata].reverse();

const f = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711];
let fibo = [];
for (let i = 0; i < f.length; i++) {
    fibo.push(f[i]);
    if (i % 2 === 0) fibo.push(f[i]);
}
fibo = fibo.slice(0, 27);

let totalInvestment = 0;
let totalRevenue = 0;
let activeChases = [];
let maxDrawdown = 0;
let currentCapital = 0;
let maxDebt = 0;
let peakDebtInfo = null;
let peakDrawdownInfo = null;

for (let i = 0; i < data.length; i++) {
    const drawResult = data[i].numbers || data[i];
    let drawRevenue = 0;
    let drawInvestment = 0;

    // Execute Bets
    for (let j = activeChases.length - 1; j >= 0; j--) {
        const chase = activeChases[j];
        const betAmount = fibo[chase.step];
        drawInvestment += betAmount;
        chase.totalSpent += betAmount;

        const hits = chase.pair.filter(n => drawResult.includes(n)).length;
        if (hits === 2) {
            drawRevenue += betAmount * odds;
            activeChases.splice(j, 1);
        } else {
            chase.step++;
            if (chase.step >= 27) activeChases.splice(j, 1);
        }
    }

    currentCapital += (drawRevenue - drawInvestment);
    if (currentCapital < maxDrawdown) {
        maxDrawdown = currentCapital;
        peakDrawdownInfo = { week: i, capital: currentCapital, activeCount: activeChases.length };
    }

    let currentTotalDebt = 0;
    activeChases.forEach(c => currentTotalDebt += c.totalSpent);
    if (currentTotalDebt > maxDebt) {
        maxDebt = currentTotalDebt;
        peakDebtInfo = { week: i, debt: currentTotalDebt, activeCount: activeChases.length, steps: activeChases.map(c => c.step) };
    }

    // Global Reset
    if (drawRevenue > 0 && activeChases.length > 0) {
        if (drawRevenue >= currentTotalDebt * (1 + profitTrigger)) {
            activeChases.forEach(c => { c.step = 0; c.totalSpent = 0; });
        }
    }

    // Detect New Clusters
    const newClusters = detectIsolatedClusters(drawResult);
    newClusters.forEach(c => {
        const pairKey = c.predictions.join(',');
        if (!activeChases.some(ac => ac.pair.join(',') === pairKey)) {
            activeChases.push({ pair: c.predictions, step: 0, totalSpent: 0 });
        }
    });
}

console.log("Max Drawdown:", maxDrawdown);
console.log("Peak Drawdown Info:", peakDrawdownInfo);
console.log("Max Debt (Congestion):", maxDebt);
console.log("Peak Debt Info:", JSON.stringify(peakDebtInfo, null, 2));
