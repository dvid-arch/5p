
const fs = require('fs');

// --- UTILS ---
const GRID_SIZE = 7;
function areAdj(n1, n2) {
    const r1 = Math.floor((n1 - 1) / GRID_SIZE);
    const c1 = (n1 - 1) % GRID_SIZE;
    const r2 = Math.floor((n2 - 1) / GRID_SIZE);
    const c2 = (n2 - 1) % GRID_SIZE;
    return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && (r1 !== r2 || c1 !== c2);
}

function detectInverseClusters(draw) {
    const results = [];
    const n = draw.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const A = draw[i];
            const B = draw[j];
            for (let M = 1; M <= 49; M++) {
                const configs = [
                    { type: 'addition', s1: A - M, s2: B - M },
                    { type: 'multiplication', s1: A % M === 0 ? A / M : -1, s2: B % M === 0 ? B / M : -1 }
                ];
                configs.forEach(cfg => {
                    const { s1, s2 } = cfg;
                    if (s1 >= 1 && s1 <= 49 && s2 >= 1 && s2 <= 49 && s1 !== s2 && s1 !== M && s2 !== M) {
                        if (areAdj(M, s1) && areAdj(M, s2)) {
                            results.push({ seed: [M, s1, s2].sort((a, b) => a - b) });
                        }
                    }
                });
            }
        }
    }
    const unique = [];
    const keys = new Set();
    results.forEach(res => {
        const key = res.seed.join(',');
        if (!keys.has(key)) {
            unique.push(res);
            keys.add(key);
        }
    });
    return unique;
}

const dataContent = fs.readFileSync('src/constant/data.js', 'utf8');
const match = dataContent.match(/export const truestdata = (\[[\s\S]*?\]);/);
const truestdata = eval(match[1]);

// Repeated Fibonacci: Each number played TWICE
// 1, 1, 2, 2, 3, 3, 5, 5, 8, 8, 13, 13, 21, 21, 34, 34, 55, 55, 89, 89, 144, 144, 233, 233, 377, 377, 610
function generateRepeatedFibo(totalSteps) {
    const base = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
    const seq = [];
    for (let b of base) {
        seq.push(b);
        seq.push(b);
        if (seq.length >= totalSteps) break;
    }
    return seq.slice(0, totalSteps);
}

function runRepeatedSimulation(odds, threshold) {
    const data = [...truestdata].reverse();
    const fibo = generateRepeatedFibo(27);
    const MAX_STEPS = 27;
    const ODDS = odds;

    let totalInvestment = 0;
    let totalRevenue = 0;
    let activeChases = [];
    let sessionPnl = 0;

    let wins = 0;
    let losses = 0;
    let resets = 0;
    let maxDrawdown = 0;
    let currentCapital = 0;

    for (let i = 0; i < data.length; i++) {
        const drawResult = data[i];

        for (let j = activeChases.length - 1; j >= 0; j--) {
            const chase = activeChases[j];
            const betAmount = fibo[chase.step];

            totalInvestment += betAmount;
            sessionPnl -= betAmount;
            currentCapital -= betAmount;

            const hits = chase.seed.filter(n => drawResult.includes(n)).length;
            if (hits >= 2) {
                const payout = betAmount * ODDS;
                totalRevenue += payout;
                sessionPnl += payout;
                currentCapital += payout;
                wins++;
                activeChases.splice(j, 1);
            } else {
                chase.step++;
                if (chase.step >= MAX_STEPS) {
                    losses++;
                    activeChases.splice(j, 1);
                }
            }
        }

        if (currentCapital < maxDrawdown) maxDrawdown = currentCapital;

        if (sessionPnl >= threshold && activeChases.length > 0) {
            activeChases.forEach(c => {
                c.step = 0;
            });
            sessionPnl = 0;
            resets++;
        }

        const newClusters = detectInverseClusters(drawResult).slice(0, 3);
        newClusters.forEach(c => {
            if (!activeChases.some(ac => ac.seed.join(',') === c.seed.join(','))) {
                activeChases.push({ seed: c.seed, step: 0 });
            }
        });
    }

    const netProfit = totalRevenue - totalInvestment;
    const roi = (netProfit / totalInvestment) * 100;

    return { totalInvestment, totalRevenue, netProfit, roi, wins, losses, resets, maxDrawdown, seq: fibo };
}

console.log("REPEATED FIBONACCI RESEARCH (27 STEPS)");
console.log("Odd: 5.7 | Logic: Each level played TWICE");

const results = runRepeatedSimulation(5.7, 0);
console.log("\nSequence Used:", results.seq.join(', '));
console.log(`Max Step Value: ${results.seq[26]} units`);
console.log(`Total Sequence Sum (Capital for 1 chase): ${results.seq.reduce((a, b) => a + b, 0)} units`);

console.log(`\nResults (Threshold +0):`);
console.log(`Wins: ${results.wins} | Losses: ${results.losses} | Resets: ${results.resets}`);
console.log(`ROI: ${results.roi.toFixed(2)}% | Net: ${results.netProfit.toLocaleString()}`);
console.log(`Max Drawdown: ${results.maxDrawdown.toLocaleString()} units`);
