
const GRID_SIZE = 7;

// --- UTILS (Copied from PatternUtils.js) ---

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

    // Deduplicate
    const unique = [];
    results.forEach(res => {
        const key = `${res.pair.join(',')}-${res.seed.join(',')}`;
        if (!unique.some(u => `${u.pair.join(',')}-${u.seed.join(',')}` === key)) {
            unique.push(res);
        }
    });

    return unique;
}

// --- DATA ---
// Pasting truestdata from data.js
const truestdata = [
    [2, 7, 8, 11, 14, 24, 35, 40, 28, 42, 46, 49],
    [4, 10, 11, 17, 22, 23, 27, 28, 29, 46, 42],
    [4, 6, 9, 13, 17, 18, 27, 34, 48],
    [7, 9, 11, 17, 19, 22, 28, 29, 34, 35, 37, 38, 42, 48],
    [5, 6, 9, 12, 23, 26, 39, 41],
    [7, 9, 30, 31, 38, 40, 45, 3, 17, 42, 49],
    [2, 7, 13, 16, 19, 28, 41, 3, 36, 48],
    [2, 10, 19, 22, 27, 28, 34, 36, 37, 39, 43, 46, 20, 25, 45],
    [3, 6, 15, 24, 28, 33, 35, 37, 2, 23, 34, 44, 47],
    [3, 20, 26, 28, 30, 31, 34, 40, 42, 46, 32, 48, 49],
    [2, 17, 25, 29, 35, 36, 38, 42, 43, 15, 23, 30],
    [5, 11, 22, 23, 26, 31, 34, 35, 36, 38, 43, 45, 21, 27],
    [8, 9, 14, 26, 33, 34, 36, 44, 47, 48, 4, 16, 42],
    [7, 11, 14, 33, 36, 37, 43, 44, 48, 20],
    [14, 16, 25, 28, 29, 31, 40, 42, 41],
    [3, 13, 18, 21, 22, 36, 48],
    [7, 22, 25, 35, 40, 27, 41, 45, 47],
    [9, 10, 12, 24, 27, 29, 31, 34, 45, 28, 33],
    [5, 9, 15, 16, 17, 18, 20, 31, 41, 14, 44],
    [3, 4, 35, 38, 49, 16, 25, 48, 1, 2],
    [11, 12, 13, 14, 18, 27, 29, 32, 36, 39, 41, 45, 5, 6, 44, 3, 16, 47],
    [3, 6, 18, 29, 45],
    [12, 15, 20, 22, 29, 32, 33, 37, 46, 48, 3, 42, 49],
    [17, 18, 19, 21, 26, 29, 31, 32, 37, 41, 45, 46, 49, 47, 5, 7, 48],
    [2, 13, 21, 26, 28, 35, 36, 44, 49, 1, 3, 10, 24, 48],
    [8, 31, 33, 40, 44, 3, 19, 41, 1, 38],
    [12, 17, 19, 20, 22, 26, 27, 28, 29, 30, 31, 44, 45, 47],
    [19, 20, 23, 28, 30, 41, 45],
    [1, 8, 9, 11, 17, 21, 27, 31, 37, 40, 49],
    [1, 2, 6, 8, 9, 10, 13, 17, 18, 20, 22, 24, 36],
    [2, 5, 15, 22, 25, 32, 36, 41],
    [7, 16, 18, 21, 24, 25, 29, 47],
    [5, 12, 19, 23, 26, 37, 41, 45],
    [6, 11, 16, 19, 21, 23, 24, 26, 27, 37, 41, 42, 46],
    [11, 13, 19, 22, 26, 31, 36, 45, 49],
    [5, 8, 13, 19, 41, 42, 43, 45, 47],
    [4, 10, 11, 12, 18, 20, 34, 36, 37, 40, 42, 43, 44, 46],
    [8, 10, 12, 27, 31, 33, 40],
    [4, 7, 8, 24, 29, 33, 41, 42, 45, 47, 48],
    [4, 6, 8, 9, 12, 15, 16, 18, 19, 22, 28, 36, 37, 46],
    [3, 11, 14, 19, 27, 28, 30, 33, 38, 40, 49],
    [3, 9, 12, 14, 16, 18, 19, 27, 29, 31, 34, 37, 39, 40, 44],
    [1, 2, 3, 15, 16, 25, 26, 28, 30, 33, 35, 40, 44, 49],
    [2, 4, 7, 9, 12, 16, 17, 23, 26],
    [2, 6, 8, 14, 18, 24, 26, 31, 35],
    [2, 4, 12, 13, 14, 18, 19, 20, 22, 24, 25, 26, 28, 29, 30, 31, 38, 45, 48],
    [4, 8, 12, 17, 20, 28, 29, 30, 33, 37, 39, 43, 47, 48, 49],
    [6, 8, 9, 10, 25, 28, 29, 30, 37, 38, 42],
    [1, 4, 5, 7, 8, 13, 17, 19, 25, 27, 30, 35, 37, 38, 45],
    [4, 13, 27, 30, 34, 35],
    [1, 11, 12, 15, 17, 22, 25, 30, 34, 37, 40, 41, 48, 49],
    [10, 12, 15, 17, 21, 22, 26, 36, 44],
    [14, 16, 17, 20, 22, 24, 31, 38, 43],
    [1, 17, 18, 30, 34, 39, 40, 41, 46],
    [1, 14, 20, 22, 23, 25, 28, 37, 45, 47, 48],
    [1, 7, 10, 23, 25, 26, 28, 34, 35, 36, 38, 44, 47, 48],
    [3, 4, 5, 6, 12, 13, 15, 16, 17, 19, 24, 26, 28, 32, 46],
    [3, 5, 9, 11, 14, 18, 21, 22, 26, 27, 31, 34, 35, 37, 39, 44, 45, 47],
    [4, 5, 10, 16, 23, 24, 29, 38, 41],
    [1, 4, 11, 16, 18, 23, 25, 26, 32, 35, 38, 48, 49],
    [3, 5, 7, 13, 15, 18, 20, 27, 31, 35, 36, 40, 44, 46],
    [3, 7, 12, 16, 17, 19, 20, 21, 23, 25, 26, 29, 32, 39, 40, 47, 49],
    [2, 4, 11, 13, 15, 16, 17, 19, 27, 30, 34, 36, 39, 44],
    [1, 2, 3, 4, 6, 10, 31, 32, 37, 38, 41, 44, 45],
    [3, 9, 13, 20, 21, 22, 23, 25, 29, 34, 35, 37],
    [1, 4, 9, 11, 18, 23, 29, 37, 38, 39, 43, 49],
    [1, 2, 4, 7, 10, 11, 13, 14, 15, 20, 23, 26, 32, 34, 40, 43, 46],
    [15, 16, 20, 24, 35, 37, 43],
    [2, 6, 7, 14, 17, 20, 22, 25, 27, 43, 44, 46, 48],
    [2, 5, 7, 11, 12, 17, 19, 21, 22, 31, 36, 37, 39, 41],
    [2, 5, 6, 15, 16, 18, 20, 26, 29, 31, 33, 39, 44, 45],
    [2, 3, 5, 7, 8, 17, 18, 27, 34, 36, 37, 41, 45],
    [3, 4, 5, 14, 19, 21, 25, 28, 30, 39, 49],
    [1, 5, 12, 15, 19, 20, 21, 25, 27, 29, 44, 48],
    [1, 3, 5, 9, 11, 23, 27, 28, 34, 45, 47],
    [2, 12, 13, 14, 15, 17, 20, 22, 23, 24, 37, 39, 41, 46],
    [7, 12, 13, 14, 15, 19, 21, 26, 29, 32, 33, 41, 42, 48],
    [1, 3, 4, 11, 31, 38, 40, 43, 44],
    [2, 3, 4, 9, 10, 12, 13, 18, 19, 31, 32, 33, 38, 44, 45],
    [2, 11, 23, 37, 49],
    [1, 4, 9, 16, 17, 22, 29, 30, 32, 40, 48],
    [1, 12, 17, 21, 23, 28, 32, 35, 40, 48],
    [5, 12, 20, 36, 37, 45],
    [11, 16, 17, 22, 30, 31, 33, 37, 40, 46, 48, 49],
    [3, 6, 23, 30, 32, 41],
    [2, 7, 8, 19, 20, 24, 26],
    [8, 12, 14, 15, 20, 21, 36, 42, 45, 48],
    [9, 13, 21, 24, 25, 27, 33, 34, 35, 37, 39, 43, 48],
    [4, 5, 8, 9, 11, 14, 15, 17, 19, 21, 45, 48],
    [11, 13, 18, 20, 23, 24, 25, 26, 33, 36, 44, 45]
];

// --- SIMULATION ---

function runSimulationForLength(chaseLength) {
    // 1. Data Prep: Oldest First
    const data = [...truestdata].reverse();
    const TOTAL_WEEKS = data.length;
    const CHASE_LENGTH = chaseLength;
    const ODDS = 4.3;

    // Fibo Sequence (Standard)
    const fibo = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];

    let totalChases = 0;
    let successfulChases = 0;
    let failedChases = 0;

    let totalInvestment = 0;
    let totalRevenue = 0;

    // Iterate through weeks.
    for (let i = 0; i <= TOTAL_WEEKS - 1; i++) {
        const currentDraw = data[i];
        const clusters = detectInverseClusters(currentDraw);

        if (clusters.length === 0) continue;

        for (const cluster of clusters) {
            // Check if we have enough future weeks to resolve this chase
            if (i + CHASE_LENGTH >= TOTAL_WEEKS) continue;

            totalChases++;
            const seed = cluster.seed;

            let chaseWon = false;
            let currentInvestment = 0;

            // Run the Chase
            for (let step = 0; step < CHASE_LENGTH; step++) {
                const betAmount = fibo[step];
                currentInvestment += betAmount;

                const futureIdx = i + 1 + step;
                const futureDraw = data[futureIdx];

                const hits = seed.filter(n => futureDraw.includes(n)).length;

                if (hits >= 2) {
                    // WIN
                    const revenue = betAmount * ODDS;
                    totalRevenue += revenue;
                    totalInvestment += currentInvestment;
                    successfulChases++;
                    chaseWon = true;
                    break;
                }
            }

            if (!chaseWon) {
                // LOSS
                failedChases++;
                totalInvestment += currentInvestment;
            }
        }
    }

    const netProfit = totalRevenue - totalInvestment;
    const roi = (totalInvestment > 0) ? (netProfit / totalInvestment) * 100 : 0;

    console.log(`\n--- SCENARIO: ${chaseLength}-Week Chase ---`);
    console.log(`Total Chases: ${totalChases}`);
    console.log(`Success Rate: ${((successfulChases / totalChases) * 100).toFixed(1)}%`);
    console.log(`Net Profit: ${netProfit.toFixed(1)} units`);
    console.log(`ROI: ${roi.toFixed(1)}%`);
}

console.log("Running Simulations for Method: Seed Cluster 2-of-3 Chase (Odds: 4.3)");
runSimulationForLength(5);
runSimulationForLength(8);
runSimulationForLength(12);
