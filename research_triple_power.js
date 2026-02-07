
import { truestdata } from './src/constant/data.js';

const GRID_SIZE = 7;

function detectInverseClusters(draw) {
    const results = [];
    const n = draw.length;

    const areAdj = (n1, n2) => {
        const r1 = Math.floor((n1 - 1) / GRID_SIZE);
        const c1 = (n1 - 1) % GRID_SIZE;
        const r2 = Math.floor((n2 - 1) / GRID_SIZE);
        const c2 = (n2 - 1) % GRID_SIZE;
        return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && (r1 !== r2 || c1 !== c2);
    };

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
                                type
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

// Data is newest-first. Reverse for forward simulation.
const data = [...truestdata].reverse();
const totalDraws = data.length;

const stats = {
    totalSeedsDetected: 0,
    doubleHits: 0,
    tripleHits: 0,
    tripleWaitTimes: [],
    hubStats: {}
};

console.log(`Starting Triple Research over ${totalDraws} draws...`);

for (let i = 0; i < totalDraws - 52; i++) {
    const draw = data[i];
    const seeds = detectInverseClusters(draw);

    seeds.forEach(s => {
        stats.totalSeedsDetected++;
        const seedSet = new Set(s.seed);
        const hubKey = `Hub #${s.middle} (${s.type})`;

        if (!stats.hubStats[hubKey]) {
            stats.hubStats[hubKey] = { total: 0, doubles: 0, triples: 0, wait: 0 };
        }
        stats.hubStats[hubKey].total++;

        let foundDouble = false;
        let foundTriple = false;

        for (let j = i + 1; j < i + 53; j++) {
            const nextDraw = data[j];
            const matches = s.seed.filter(n => nextDraw.includes(n));

            if (matches.length === 3 && !foundTriple) {
                foundTriple = true;
                stats.tripleHits++;
                stats.tripleWaitTimes.push(j - i);
                stats.hubStats[hubKey].triples++;
                stats.hubStats[hubKey].wait += (j - i);
                break; // Stop after triple
            } else if (matches.length === 2 && !foundDouble) {
                foundDouble = true;
                stats.doubleHits++;
                stats.hubStats[hubKey].doubles++;
            }
        }
    });
}

const avgWait = stats.tripleWaitTimes.reduce((a, b) => a + b, 0) / stats.tripleHits;

console.log('\n--- TRIPLE HIT RESEARCH REPORT ---');
console.log(`Total Seeds Analyzed: ${stats.totalSeedsDetected}`);
console.log(`2-of-3 Success Rate: ${((stats.doubleHits / stats.totalSeedsDetected) * 100).toFixed(2)}%`);
console.log(`3-of-3 (TRIPLE) Success Rate: ${((stats.tripleHits / stats.totalSeedsDetected) * 100).toFixed(2)}%`);
console.log(`Average Triple Wait: ${avgWait.toFixed(1)} weeks`);

console.log('\n--- TOBHUB PERFORMANCE (TRIPLES) ---');
const sortedHubs = Object.entries(stats.hubStats)
    .sort((a, b) => (b[1].triples / b[1].total) - (a[1].triples / a[1].total))
    .slice(0, 10);

sortedHubs.forEach(([hub, data]) => {
    const rate = (data.triples / data.total * 100).toFixed(1);
    const avgHubWait = data.triples > 0 ? (data.wait / data.triples).toFixed(1) : 'N/A';
    console.log(`${hub.padEnd(25)} | Rate: ${rate}% | Avg Wait: ${avgHubWait}w | Sample: ${data.total}`);
});
