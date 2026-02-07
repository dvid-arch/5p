
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

function generateSequence(totalSteps) {
    const base = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
    const seq = [1, 2, 3];
    for (let i = 3; i < base.length; i++) {
        seq.push(base[i]);
        seq.push(base[i]);
    }
    return seq.slice(0, totalSteps);
}

function run50PercentSimulation(yieldThreshold) {
    const data = [...truestdata].reverse();
    const fibo = generateSequence(27);
    const ODDS = 5.7;

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

        // 1. Calculate historical investment in active chases for relative yield
        let currentAtRiskTotal = 0;
        activeChases.forEach(c => currentAtRiskTotal += c.totalSpent);

        // 2. Process active chases
        for (let j = activeChases.length - 1; j >= 0; j--) {
            const chase = activeChases[j];
            const betAmount = fibo[chase.step];

            drawInvestment += betAmount;
            chase.totalSpent += betAmount;

            const hits = chase.seed.filter(n => drawResult.includes(n)).length;
            if (hits >= 2) {
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

        totalInvestment += drawInvestment;
        totalRevenue += drawRevenue;
        currentCapital += (drawRevenue - drawInvestment);
        if (currentCapital < maxDrawdown) maxDrawdown = currentCapital;

        // 3. 50% YIELD RESET LOGIC
        // "Yield" = Net profit from this draw's win divided by total money currently missing in these chases
        const drawNet = drawRevenue - drawInvestment;
        if (drawRevenue > 0 && activeChases.length > 0) {
            // If the profit from the winning seed(s) covers at least 50% of the money spent on all current active seeds
            if (drawNet >= (currentAtRiskTotal * yieldThreshold)) {
                activeChases.forEach(c => {
                    c.step = 0;
                });
                resets++;
            }
        }

        // 4. Add new seeds (Top 3)
        const newClusters = detectInverseClusters(drawResult).slice(0, 3);
        newClusters.forEach(c => {
            if (!activeChases.some(ac => ac.seed.join(',') === c.seed.join(','))) {
                activeChases.push({ seed: c.seed, step: 0, totalSpent: 0 });
            }
        });
    }

    const netProfit = totalRevenue - totalInvestment;
    const roi = (netProfit / totalInvestment) * 100;
    return { roi, netProfit, wins, losses, resets, maxDrawdown };
}

console.log("RESEARCH: 50% CAPITAL YIELD RESET");
console.log("Odd: 5.7 | Sequence: Double-Stay 27-Step");
console.log("Logic: Only reset if Win Profit covers 50% of total 'Hole' (money spent on active seeds).");

const res = run50PercentSimulation(0.5);
console.log(`\nResults:`);
console.log(`Wins: ${res.wins} | Losses: ${res.losses} | Resets: ${res.resets}`);
console.log(`ROI: ${res.roi.toFixed(2)}% | Net: ${res.netProfit.toLocaleString()}`);
console.log(`Max Drawdown: ${res.maxDrawdown.toLocaleString()} units`);
