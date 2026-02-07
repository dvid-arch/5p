
import { truestdata } from './src/constant/data.js';
import { detectIsolatedClusters } from './src/pages/PatternUtils.js';

const odds = 11.5;
const f = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711];
let fibo = [];
for (let i = 0; i < f.length; i++) {
    fibo.push(f[i]);
    if (i % 2 === 0) fibo.push(f[i]);
}
fibo = fibo.slice(0, 27);

const data = [...truestdata].reverse();
const stats = {}; // Key: "type-mid"

// Simulation
for (let i = 0; i < data.length; i++) {
    const clusters = detectIsolatedClusters(data[i]);

    clusters.forEach(c => {
        const key = `${c.type}-${c.middle}`;
        if (!stats[key]) {
            stats[key] = {
                type: c.type,
                mid: c.middle,
                occurrences: 0,
                wins: 0,
                totalSteps: 0,
                totalSpent: 0,
                totalRevenue: 0,
                maxStep: 0,
                history: []
            };
        }

        stats[key].occurrences++;

        // Track this specific chase in future draws
        let won = false;
        let step = 0;
        let spent = 0;

        for (let j = i + 1; j < Math.min(i + 28, data.length); j++) {
            spent += fibo[step];
            const futureDraw = data[j].numbers || data[j];
            const hits = c.predictions.filter(n => futureDraw.includes(n)).length;

            if (hits === 2) {
                won = true;
                stats[key].wins++;
                stats[key].totalSteps += (step + 1);
                stats[key].totalRevenue += (fibo[step] * odds);
                if (step > stats[key].maxStep) stats[key].maxStep = step;
                break;
            }
            step++;
        }

        stats[key].totalSpent += spent;
    });
}

// Format and Sort
const report = Object.values(stats)
    .filter(s => s.occurrences >= 3) // Only stable patterns
    .map(s => {
        const winRate = (s.wins / s.occurrences) * 100;
        const roi = ((s.totalRevenue - s.totalSpent) / s.totalSpent) * 100;
        return {
            label: `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} Hub ${s.mid}`,
            winRate: winRate.toFixed(1) + "%",
            avgStep: (s.wins > 0 ? (s.totalSteps / s.wins).toFixed(1) : "N/A"),
            maxStep: s.maxStep + 1,
            occurrences: s.occurrences,
            roi: roi.toFixed(1) + "%",
            score: (winRate * 2) + roi // Heuristic score
        };
    })
    .sort((a, b) => b.score - a.score);

console.log(JSON.stringify(report.slice(0, 20), null, 2));
