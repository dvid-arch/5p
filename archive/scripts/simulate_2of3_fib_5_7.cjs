
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

function areOrtho(n1, n2) {
    const r1 = Math.floor((n1 - 1) / GRID_SIZE);
    const c1 = (n1 - 1) % GRID_SIZE;
    const r2 = Math.floor((n2 - 1) / GRID_SIZE);
    const c2 = (n2 - 1) % GRID_SIZE;
    return (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);
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
                    const { s1, s2, type } = cfg;
                    if (s1 >= 1 && s1 <= 49 && s2 >= 1 && s2 <= 49 && s1 !== s2 && s1 !== M && s2 !== M) {
                        if (areAdj(M, s1) && areAdj(M, s2)) {
                            results.push({
                                pair: [A, B].sort((a, b) => a - b),
                                seed: [M, s1, s2].sort((a, b) => a - b),
                                middle: M,
                                type,
                                isOrtho: areOrtho(M, s1) && areOrtho(M, s2)
                            });
                        }
                    }
                });
            }
        }
    }

    const unique = [];
    results.forEach(res => {
        const key = `${res.pair.join(',')}-${res.seed.join(',')}`;
        if (!unique.some(u => `${u.pair.join(',')}-${u.seed.join(',')}` === key)) {
            unique.push(res);
        }
    });

    return unique;
}

// --- LOAD DATA ---
const dataFilePath = path.join(__dirname, 'src', 'constant', 'data.js');
const dataContent = fs.readFileSync(dataFilePath, 'utf8');
// Extract the array using regex or simple parsing
const match = dataContent.match(/export const truestdata = (\[[\s\S]*?\]);/);
if (!match) {
    console.error("Could not find truestdata in data.js");
    process.exit(1);
}

// Clean up the string to be valid JSON (handles trailing commas if any, though lottery data usually is clean)
let dataString = match[1]
    .replace(/,(\s*\])/g, '$1') // Remove trailing commas before closing bracket
    .replace(/(\r\n|\n|\r)/gm, ""); // Remove newlines

// Note: truestdata in data.js is a JS array, not strictly JSON. 
// If it has complex formatting, we might need a more robust way.
// But for lottery numbers, it's usually just numbers.
let truestdata;
try {
    // Evaluating the string as JS (Careful with eval, but here it's our own data)
    truestdata = JSON.parse(dataString.replace(/(\d+)/g, '"$1"').replace(/"(\d+)"/g, '$1'));
    // Wait, the above might fail. Let's just use eval since it's a constant array of numbers.
    truestdata = eval(match[1]);
} catch (e) {
    console.error("Error parsing truestdata:", e);
    process.exit(1);
}

// --- SIMULATION ---

function runSimulationForLength(chaseLength, odds) {
    const data = [...truestdata].reverse(); // Oldest first
    const TOTAL_WEEKS = data.length;
    const CHASE_LENGTH = chaseLength;
    const ODDS = odds;

    // Fibo Sequence
    const fibo = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];

    let totalChases = 0;
    let successfulChases = 0;
    let failedChases = 0;

    let totalInvestment = 0;
    let totalRevenue = 0;

    for (let i = 0; i <= TOTAL_WEEKS - 1; i++) {
        const currentDraw = data[i];
        const clusters = detectInverseClusters(currentDraw);

        if (clusters.length === 0) continue;

        for (const cluster of clusters) {
            if (i + CHASE_LENGTH >= TOTAL_WEEKS) continue;

            totalChases++;
            const seed = cluster.seed;

            let chaseWon = false;
            let currentInvestmentForThisChase = 0;

            for (let step = 0; step < CHASE_LENGTH; step++) {
                const betAmount = fibo[step];
                currentInvestmentForThisChase += betAmount;

                const futureIdx = i + 1 + step;
                const futureDraw = data[futureIdx];

                const hits = seed.filter(n => futureDraw.includes(n)).length;

                if (hits >= 2) {
                    // WIN
                    const revenue = betAmount * ODDS;
                    totalRevenue += revenue;
                    totalInvestment += currentInvestmentForThisChase;
                    successfulChases++;
                    chaseWon = true;
                    break;
                }
            }

            if (!chaseWon) {
                // LOSS
                failedChases++;
                totalInvestment += currentInvestmentForThisChase;
            }
        }
    }

    const netProfit = totalRevenue - totalInvestment;
    const roi = (totalInvestment > 0) ? (netProfit / totalInvestment) * 100 : 0;

    return {
        chaseLength,
        totalChases,
        successRate: (successfulChases / totalChases) * 100,
        netProfit,
        roi
    };
}

console.log("=================================================");
console.log("RESEARCH REPORT: 2-of-3 Seed Cluster Strategy");
console.log(`Odds: 5.7`);
console.log(`Data Period: ${truestdata.length} Weeks`);
console.log("Strategy: Fibonacci Chase Progression");
console.log("=================================================");

const results = [
    runSimulationForLength(5, 5.7),
    runSimulationForLength(8, 5.7),
    runSimulationForLength(12, 5.7)
];

results.forEach(res => {
    console.log(`\n--- SCENARIO: ${res.chaseLength}-Week Window ---`);
    console.log(`Total Chases:   ${res.totalChases}`);
    console.log(`Success Rate:   ${res.successRate.toFixed(1)}%`);
    console.log(`Net Profit:     ${res.netProfit.toFixed(1)} units`);
    console.log(`ROI:            ${res.roi.toFixed(1)}%`);
});

console.log("\n=================================================");
