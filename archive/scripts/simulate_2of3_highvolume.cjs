
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

function runHighVolumeSimulation(odds, profitThreshold = 0) {
    const data = [...truestdata].reverse();
    const fibo = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
    const MAX_STEPS = 15;
    const ODDS = odds;

    let totalInvestment = 0;
    let totalRevenue = 0;
    let activeChases = [];
    let sessionPnl = 0;

    let wins = 0;
    let losses = 0;
    let resets = 0;

    for (let i = 0; i < data.length; i++) {
        const drawResult = data[i];

        // 1. Process active chases
        let hitsThisWeek = false;
        for (let j = activeChases.length - 1; j >= 0; j--) {
            const chase = activeChases[j];
            const betAmount = fibo[chase.step];

            totalInvestment += betAmount;
            sessionPnl -= betAmount;

            const hits = chase.seed.filter(n => drawResult.includes(n)).length;
            if (hits >= 2) {
                const payout = betAmount * ODDS;
                totalRevenue += payout;
                sessionPnl += payout;
                wins++;
                activeChases.splice(j, 1);
                hitsThisWeek = true;
            } else {
                chase.step++;
                if (chase.step >= MAX_STEPS) {
                    losses++;
                    activeChases.splice(j, 1);
                }
            }
        }

        // 2. Global Reset Logic: If we are in profit and had a hit, reset all current progressions
        if (hitsThisWeek && sessionPnl >= profitThreshold) {
            activeChases.forEach(c => {
                c.step = 0;
            });
            sessionPnl = 0;
            resets++;
        }

        // 3. New seeds (EVERYTHING identified)
        const newClusters = detectInverseClusters(drawResult);
        newClusters.forEach(c => {
            if (!activeChases.some(ac => ac.seed.join(',') === c.seed.join(','))) {
                activeChases.push({ seed: c.seed, step: 0 });
            }
        });
    }

    const netProfit = totalRevenue - totalInvestment;
    const roi = (netProfit / totalInvestment) * 100;

    return { totalInvestment, totalRevenue, netProfit, roi, wins, losses, resets };
}

console.log("HIGH VOLUME RESEARCH: Seed Cluster 2-of-3");
console.log("Odd: 5.7 | Sequence: 1,2,3...15 | Reset: PnL >= 0");

const res = runHighVolumeSimulation(5.7, 0);
console.log(`\nWins: ${res.wins} | Losses: ${res.losses} | Resets: ${res.resets}`);
console.log(`Total Invested: ${res.totalInvestment.toFixed(1)}`);
console.log(`Total Return:   ${res.totalRevenue.toFixed(1)}`);
console.log(`Net Profit:     ${res.netProfit.toFixed(1)}`);
console.log(`ROI:            ${res.roi.toFixed(2)}%`);

console.log("\nTrying with +100 Threshold...");
const res2 = runHighVolumeSimulation(5.7, 100);
console.log(`ROI (+100):     ${res2.roi.toFixed(2)}%`);
