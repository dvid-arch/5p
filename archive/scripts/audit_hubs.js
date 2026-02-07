
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
        // We track by (Type, Hub, Ortho)
        const isOrtho = (n1, n2, mid) => {
            const r1 = Math.floor((n1 - 1) / 7), c1 = (n1 - 1) % 7;
            const r2 = Math.floor((n2 - 1) / 7), c2 = (n2 - 1) % 7;
            const rm = Math.floor((mid - 1) / 7), cm = (mid - 1) % 7;
            const o1 = (r1 === rm && Math.abs(c1 - cm) === 1) || (c1 === cm && Math.abs(r1 - rm) === 1);
            const o2 = (r2 === rm && Math.abs(c2 - cm) === 1) || (c2 === cm && Math.abs(r2 - rm) === 1);
            return o1 && o2;
        };
        const orthoStatus = isOrtho(c.numbers[0], c.numbers[1], c.middle) || isOrtho(c.numbers[0], c.numbers[2], c.middle) || isOrtho(c.numbers[1], c.numbers[2], c.middle);
        const key = `${c.type}-${c.middle}-${orthoStatus ? 'ortho' : 'diag'}`;

        if (!stats[key]) {
            stats[key] = { type: c.type, mid: c.middle, ortho: orthoStatus, occurrences: 0, wins: 0, totalSpent: 0, totalRevenue: 0, maxStep: 0 };
        }

        stats[key].occurrences++;
        let step = 0;
        let spent = 0;
        let won = false;

        for (let j = i + 1; j < Math.min(i + 28, data.length); j++) {
            spent += fibo[step];
            const futureDraw = data[j].numbers || data[j];
            if (c.predictions.filter(n => futureDraw.includes(n)).length === 2) {
                won = true;
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

const final = Object.values(stats).map(s => {
    const winRate = (s.wins / s.occurrences) * 100;
    const roi = ((s.totalRevenue - s.totalSpent) / s.totalSpent) * 100;
    return { ...s, winRate, roi };
}).sort((a, b) => b.roi - a.roi);

console.log("TOP PERFORMANCE (ROI > 0):");
console.log(JSON.stringify(final.filter(f => f.roi > 0), null, 2));
console.log("\nSTABLE ALPHA (OCCURRENCES >= 3, WR >= 70%):");
console.log(JSON.stringify(final.filter(f => f.occurrences >= 3 && f.winRate >= 70), null, 2));
