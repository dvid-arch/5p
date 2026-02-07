
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

function runBreakevenPlusProfitSimulation(profitPercent) {
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

        // Current Debt = Total spent on active chases including this week's bets
        let currentTotalDebt = 0;

        // 1. Process active chases
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

        // Calculate Debt of remaining active chases
        activeChases.forEach(c => currentTotalDebt += c.totalSpent);

        totalInvestment += drawInvestment;
        totalRevenue += drawRevenue;
        currentCapital += (drawRevenue - drawInvestment);
        if (currentCapital < maxDrawdown) maxDrawdown = currentCapital;

        // 2. BREAKEVEN + PROFIT RESET LOGIC
        // Logic: Reset only if the draw revenue covers ALL money spent on remaining active chases AND provides X% profit on that debt.
        if (drawRevenue > 0 && activeChases.length > 0) {
            const requiredRevenue = currentTotalDebt * (1 + profitPercent);
            if (drawRevenue >= requiredRevenue) {
                activeChases.forEach(c => {
                    c.step = 0;
                });
                resets++;
            }
        }

        // 3. Add Top 3 new seeds
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

console.log("RESEARCH: BREAKEVEN + 43% PROFIT RESET");
console.log("Rule: Reset only if Draw Revenue >= 143% of total active debt.");

const res = runBreakevenPlusProfitSimulation(0.43);
console.log(`\nResults:`);
console.log(`Wins: ${res.wins} | Losses: ${res.losses} | Resets: ${res.resets}`);
console.log(`ROI: ${res.roi.toFixed(2)}% | Net: ${res.netProfit.toLocaleString()}`);
console.log(`Max Drawdown: ${res.maxDrawdown.toLocaleString()} units`);
