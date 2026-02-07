
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
                        const plusResults = new Set();
                        const multResults = new Set();
                        sibs.forEach(s => {
                            const sum = mid + s;
                            const mul = mid * s;
                            if (sum >= 1 && sum <= 49) plusResults.add(sum);
                            if (mul >= 1 && mul <= 49) multResults.add(mul);
                        });

                        if (plusResults.size === 2) {
                            validHits.push({ mid, sibs, preds: [...plusResults].sort((a, b) => a - b), type: 'addition' });
                        }
                        if (multResults.size === 2) {
                            validHits.push({ mid, sibs, preds: [...multResults].sort((a, b) => a - b), type: 'multiplication' });
                        }
                    }
                }

                if (validHits.length > 0) {
                    const hubs = [...new Set(validHits.map(h => h.mid))];
                    let bestMid = hubs.find(m => {
                        const sibs = triple.filter(t => t !== m);
                        return areOrtho(m, sibs[0]) && areOrtho(m, sibs[1]);
                    });
                    if (!bestMid) bestMid = hubs[0];
                    validHits.filter(h => h.mid === bestMid).forEach(hit => {
                        results.push({ numbers: triple, middle: hit.mid, predictions: hit.preds, type: hit.type });
                    });
                }
            }
        }
    }
    return results;
}

const dataContent = fs.readFileSync('src/constant/data.js', 'utf8');
const match = dataContent.match(/export const truestdata = (\[[\s\S]*?\]);/);
const truestdata = eval(match[1]);

// Staggered Stalled Sequence
function generateStaggered27Step() {
    const f = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711];
    let s = [];
    for (let i = 0; i < f.length; i++) {
        s.push(f[i]);
        if (i % 2 === 0) s.push(f[i]);
    }
    return s.slice(0, 27);
}

function runIsolatedStaggeredSimulation(odds, profitPercent) {
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
        let drawRevenue = 0;
        let drawInvestment = 0;

        // 1. Process active chases (Pair betting: both must hit)
        for (let j = activeChases.length - 1; j >= 0; j--) {
            const chase = activeChases[j];
            const betAmount = fibo[chase.step];
            drawInvestment += betAmount;
            chase.totalSpent += betAmount;

            const hits = chase.pair.filter(n => drawResult.includes(n)).length;
            if (hits === 2) { // Pair Hit condition
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
            // Breakeven + 43% Logic
            if (drawRevenue >= currentTotalDebt * (1 + profitPercent)) {
                activeChases.forEach(c => c.step = 0);
                resets++;
            }
        }

        // 2. Add new isolated clusters as chases
        const newClusters = detectIsolatedClusters(drawResult);
        newClusters.forEach(c => {
            const pairKey = c.predictions.join(',');
            if (!activeChases.some(ac => ac.pair.join(',') === pairKey)) {
                activeChases.push({ pair: c.predictions, step: 0, totalSpent: 0 });
            }
        });
    }

    return {
        roi: (totalRevenue - totalInvestment) / totalInvestment * 100,
        net: totalRevenue - totalInvestment,
        drawdown: maxDrawdown,
        wins,
        losses,
        resets,
        cap: fibo.reduce((a, b) => a + b, 0)
    };
}

console.log("RESEARCH: ISOLATED CLUSTER + STAGGERED FIBO (24.4K) + 43% PROFIT");
console.log("Target: Both numbers in pair must hit.");
const res = runIsolatedStaggeredSimulation(11.5, 0.43);
console.log(`ROI: ${res.roi.toFixed(2)}% | Net: ${res.net.toLocaleString()} | Drawdown: ${res.drawdown.toLocaleString()}`);
console.log(`Wins: ${res.wins} | Losses: ${res.losses} | Resets: ${res.resets}`);
