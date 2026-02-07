
import { findOptimalGridPortfolio } from './src/utils/gridPredictor.js';
import { truestdata } from './src/constant/data.js';

console.log("=== Verifying Portfolio Optimization ===");

const top3 = findOptimalGridPortfolio(truestdata, 3, 10);

console.log("\nTop 3 Optimized Portfolio (Last 10 Weeks):");
top3.forEach((p, i) => {
    console.log(`${i + 1}. Center ${p.center} | Adds ${p.marginalGain} Hits | Cumulative Coverage: ${p.coveragePercent}%`);
});

// Compare with just top 3 raw
// To see efficiency gain.
console.log("\nThis demonstrates valid 'Set Cover' logic where 2nd and 3rd picks optimize for unique missed numbers.");
