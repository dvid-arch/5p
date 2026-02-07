
const fs = require('fs');
const path = require('path');

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
    results.forEach(res => {
        const key = res.seed.join(',');
        if (!unique.some(u => u.seed.join(',') === key)) unique.push(res);
    });
    return unique;
}

const dataContent = fs.readFileSync('src/constant/data.js', 'utf8');
const match = dataContent.match(/export const truestdata = (\[[\s\S]*?\]);/);
const truestdata = eval(match[1]);

function runRefinedSimulation(chaseLength, odds, topN = 1) {
    const data = [...truestdata].reverse();
    const TOTAL_WEEKS = data.length;
    const CHASE_LENGTH = chaseLength;
    const ODDS = odds;
    const fibo = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];

    let totalChases = 0;
    let successfulChases = 0;
    let totalInvestment = 0;
    let totalRevenue = 0;

    for (let i = 0; i <= TOTAL_WEEKS - 1; i++) {
        const clusters = detectInverseClusters(data[i]);
        if (clusters.length === 0) continue;

        // Take only topN clusters
        const selectedClusters = clusters.slice(0, topN);

        for (const cluster of selectedClusters) {
            if (i + CHASE_LENGTH >= TOTAL_WEEKS) continue;
            totalChases++;
            let chaseWon = false;
            let currentInvestment = 0;

            for (let step = 0; step < CHASE_LENGTH; step++) {
                const betAmount = fibo[step];
                currentInvestment += betAmount;
                const futureDraw = data[i + 1 + step];
                const hits = cluster.seed.filter(n => futureDraw.includes(n)).length;

                if (hits >= 2) {
                    totalRevenue += betAmount * ODDS;
                    totalInvestment += currentInvestment;
                    successfulChases++;
                    chaseWon = true;
                    break;
                }
            }
            if (!chaseWon) totalInvestment += currentInvestment;
        }
    }

    const netProfit = totalRevenue - totalInvestment;
    const roi = (totalInvestment > 0) ? (netProfit / totalInvestment) * 100 : 0;
    return { chaseLength, totalChases, successRate: (successfulChases / totalChases) * 100, netProfit, roi };
}

console.log("REFINED RESEARCH (Top 1 Cluster Only)");
[5, 8, 12].forEach(len => {
    const res = runRefinedSimulation(len, 5.7, 1);
    console.log(`\nWindow: ${res.chaseLength} weeks`);
    console.log(`Chases: ${res.totalChases} | Success: ${res.successRate.toFixed(1)}% | ROI: ${res.roi.toFixed(1)}%`);
});
