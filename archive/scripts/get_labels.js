
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
const stats = {};

for (let i = 0; i < data.length; i++) {
    const clusters = detectIsolatedClusters(data[i]);
    clusters.forEach(c => {
        const key = `${c.type}-${c.middle}`;
        if (!stats[key]) {
            stats[key] = { type: c.type, mid: c.middle, occurrences: 0, wins: 0, totalSpent: 0, totalRevenue: 0, maxStep: 0 };
        }
        stats[key].occurrences++;
        let step = 0;
        let spent = 0;
        for (let j = i + 1; j < Math.min(i + 28, data.length); j++) {
            spent += fibo[step];
            const futureDraw = data[j].numbers || data[j];
            if (c.predictions.filter(n => futureDraw.includes(n)).length === 2) {
                stats[key].wins++;
                stats[key].totalRevenue += (fibo[step] * odds);
                if (step > stats[key].maxStep) stats[key].maxStep = step;
                break;
            }
            step++;
        }
        stats[key].totalSpent += spent;
    });
}

const final = Object.values(stats)
    .map(s => {
        const winRate = (s.wins / s.occurrences) * 100;
        const roi = ((s.totalRevenue - s.totalSpent) / s.totalSpent) * 100;
        let grade = "C";
        if (winRate >= 100) grade = "Elite Alpha";
        else if (winRate >= 80) grade = "Premium Beta";
        else if (winRate >= 60) grade = "Standard Gamma";
        return { key: `${s.type}-${s.mid}`, winRate: winRate.toFixed(1) + "%", roi: roi.toFixed(1) + "%", grade, occurrences: s.occurrences };
    })
    .filter(s => s.occurrences >= 2)
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

console.log(JSON.stringify(final, null, 2));
