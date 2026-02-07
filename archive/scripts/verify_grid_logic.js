
import { predictBestGridCenters, findOptimalGridCenters } from './src/utils/gridPredictor.js';
import { truestdata } from './src/constant/data.js';

console.log("=== Verifying Grid Predictions ===");

// 1. Check basic prediction output
const history = [...truestdata].reverse(); // Oldest to newest? Wait, data usually newest first.
// truestdata in data.js is usually newest first.
// gridPredictor uses it as is (index 0 = newest).

const predictions = predictBestGridCenters(truestdata, 5);

console.log("Top 5 Predictions for Next Draw:");
predictions.forEach((p, i) => {
    console.log(`${i + 1}. Center ${p.center} | Score: ${p.score.toFixed(1)} | Gap: ${p.gap} | Recent: ${p.recentCount}`);
});

// 2. Backtest: Predict for Draw N using history N+1...end
// Let's take index 0 (actual newest) and see if we predicted it using index 1...
const actualCurrent = truestdata[0];
const historyPrior = truestdata.slice(1);

const predPrior = predictBestGridCenters(historyPrior, 5);
const actualBest = findOptimalGridCenters(actualCurrent.numbers || actualCurrent.value || actualCurrent, 1)[0];

console.log(`\nBacktest Analysis:`);
console.log(`Actual Best Center for Draw #0: ${actualBest.center} (Coverage: ${actualBest.coverage})`);
console.log(`Predictions made using Draw #1+:`);
predPrior.forEach((p, i) => {
    const hit = p.center === actualBest.center ? "MATCH!" : "";
    console.log(`${i + 1}. Center ${p.center} (Score ${p.score.toFixed(1)}) ${hit}`);
});
