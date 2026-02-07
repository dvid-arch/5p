
const fs = require('fs');

// --- GRID UTILS ---
const GRID_SIZE = 7;
function areAdj(n1, n2) {
    const r1 = Math.floor((n1 - 1) / GRID_SIZE);
    const c1 = (n1 - 1) % GRID_SIZE;
    const r2 = Math.floor((n2 - 1) / GRID_SIZE);
    const c2 = (n2 - 1) % GRID_SIZE;
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && (r1 !== r2 || c1 !== c2);
}

function areOrtho(n1, n2) {
    const r1 = Math.floor((n1 - 1) / GRID_SIZE);
    const c1 = (n1 - 1) % GRID_SIZE;
    const r2 = Math.floor((n2 - 1) / GRID_SIZE);
    const c2 = (n2 - 1) % GRID_SIZE;
    return (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);
}

// --- ISOLATED CLUSTER DETECTION ---
function detectIsolatedClusters(draw) {
    const results = [];
    const n = draw.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            for (let k = j + 1; k < n; k++) {
                const triple = [draw[i], draw[j], draw[k]];
                const others = draw.filter(num => !triple.includes(num));
                const isIsolated = triple.every(t => !others.some(o => areAdj(t, o)));
                if (!isIsolated) continue;
                const validHits = [];
                for (let idx = 0; idx < 3; idx++) {
                    const mid = triple[idx];
                    const sibs = triple.filter((_, sIdx) => sIdx !== idx);
                    if (areAdj(mid, sibs[0]) && areAdj(mid, sibs[1])) {
                        const plusSet = new Set();
                        const multSet = new Set();
                        sibs.forEach(s => {
                            const sum = mid + s;
                            const mul = mid * s;
                            if (sum >= 1 && sum <= 49) plusSet.add(sum);
                            if (mul >= 1 && mul <= 49) multSet.add(mul);
                        });
                        if (plusSet.size === 2) {
                            validHits.push({ middle: mid, sibs, predictions: [...plusSet].sort((a, b) => a - b), type: 'addition' });
                        }
                        if (multSet.size === 2) {
                            validHits.push({ middle: mid, sibs, predictions: [...multSet].sort((a, b) => a - b), type: 'multiplication' });
                        }
                    }
                }
                if (validHits.length > 0) {
                    const hubs = [...new Set(validHits.map(h => h.middle))];
                    let bestMid = hubs.find(m => {
                        const sibs = triple.filter(t => t !== m);
                        return areOrtho(m, sibs[0]) && areOrtho(m, sibs[1]);
                    });
                    if (!bestMid) bestMid = hubs[0];
                    validHits.filter(h => h.middle === bestMid).forEach(hit => {
                        results.push({ numbers: triple, middle: hit.middle, predictions: hit.predictions, type: hit.type });
                    });
                }
            }
        }
    }
    return results;
}

const dataContent = fs.readFileSync('src/constant/data.js', 'utf8');
const match = dataContent.match(/export const truestdata = (\[[\s\S]*?\]);/);
if (!match) { process.exit(1); }
const truestdata = eval(match[1]);

function generateStaggered27Step() {
    const f = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711];
    let s = [];
    for (let i = 0; i < f.length; i++) {
        s.push(f[i]);
        if (i % 2 === 0) s.push(f[i]);
    }
    return s.slice(0, 27);
}

function runSimulation(odds, profitPercent) {
    const data = [...truestdata].reverse();
    const fibo = generateStaggered27Step();
    const ODDS = odds;
    let totalInvestment = 0;
    let totalRevenue = 0;
    let activeChases = [];
    let wins = 0;
    let losses = 0;
    let resets = 0;
    let maxDrawdown = 0;
    let currentCapital = 0;

    for (let i = 0; i < data.length; i++) {
        const drawResult = data[i];
        const drawnNums = drawResult.numbers || drawResult;
        let drawRevenue = 0;
        let drawInvestment = 0;

        for (let j = activeChases.length - 1; j >= 0; j--) {
            const chase = activeChases[j];
            const betAmount = fibo[chase.step];
            drawInvestment += betAmount;
            chase.totalSpent += betAmount;
            const hits = chase.pair.filter(n => drawnNums.includes(n)).length;
            if (hits === 2) {
                const payout = betAmount * ODDS;
                drawRevenue += payout;
                wins++;
                activeChases.splice(j, 1);
            } else {
                chase.step++;
                if (chase.step >= 27) {
                    losses++;
                    activeChases.splice(j, 1);
                }
            }
        }
        let currentTotalDebt = 0;
        activeChases.forEach(c => currentTotalDebt += c.totalSpent);
        totalInvestment += drawInvestment;
        totalRevenue += drawRevenue;
        currentCapital += (drawRevenue - drawInvestment);
        if (currentCapital < maxDrawdown) maxDrawdown = currentCapital;
        if (drawRevenue > 0 && activeChases.length > 0) {
            const totalRequired = currentTotalDebt * (1 + profitPercent);
            if (drawRevenue >= totalRequired) {
                activeChases.forEach(c => c.step = 0);
                resets++;
            }
        }
        const newClusters = detectIsolatedClusters(drawnNums);
        newClusters.forEach(c => {
            const pairKey = c.predictions.join(',');
            if (!activeChases.some(ac => ac.pair.join(',') === pairKey)) {
                activeChases.push({ pair: c.predictions, step: 0, totalSpent: 0 });
            }
        });
    }
    return { roi: (totalRevenue - totalInvestment) / totalInvestment * 100, net: totalRevenue - totalInvestment, drawdown: maxDrawdown, wins, losses, resets };
}

console.log("DETAILED RESET SWEEP (Isolated Clusters)");
[0.43, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].forEach(p => {
    const res = runSimulation(11.5, p);
    console.log(`P+${(p * 100).toFixed(0)}% | ROI: ${res.roi.toFixed(2)}% | Net: ${res.net.toLocaleString()} | DD: ${res.drawdown.toLocaleString()} | Busts: ${res.losses}`);
});
