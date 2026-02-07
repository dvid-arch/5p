const { analyzeLotteryData } = require('./src/hooks/useLotteryAnalysis.js');
const { truestdata } = require('./src/constant/data.js');

// Mock a minimal dataset if truestdata is too large for simple test
const mockData = [
    [1, 2, 3, 4, 5],
    [10, 11, 12, 13, 14],
    [20, 21, 22, 23, 24],
    [30, 31, 32, 33, 34],
    [40, 41, 42, 43, 44],
    [1, 10, 20, 30, 40]
];

// We need 50+ weeks for full engine features, but we can test the mapping logic with less if we bypass the 50-week check or mock more data.
// Since the code has `totalDraws < 50` checks, let's mock 60 draws for a robust test.
const robustMockData = Array.from({ length: 60 }, (_, i) =>
    Array.from({ length: 5 }, (_, j) => ((i + j) % 49) + 1)
);

try {
    console.log("Running Analysis on Robust Mock Data...");
    const analysis = analyzeLotteryData(robustMockData);

    if (!analysis) {
        console.error("FAILED: Analysis returned null");
        process.exit(1);
    }

    // Check 1: Metrics in ensemble
    const ensemble = analysis.predictions.ensemble;
    if (!ensemble || ensemble.length === 0) {
        console.error("FAILED: No ensemble predictions found");
    } else {
        const first = ensemble[0];
        console.log(`Checking metrics for number #${first.number}:`, JSON.stringify(first.metrics));

        const requiredMetrics = ['binary', 'bayesian', 'root', 'pattern', 'urgency'];
        const missing = requiredMetrics.filter(m => first.metrics[m] === undefined);

        if (missing.length > 0) {
            console.error(`FAILED: Missing metrics: ${missing.join(', ')}`);
        } else {
            console.log("SUCCESS: All required metrics found in ensemble.");
        }
    }

    // Check 2: Backtest Returns initialization
    const bankerStats = analysis.backtest.strategies.banker;
    console.log(`Checking Banker Returns: ${bankerStats.return}`);

    // If we have no hits in the mock data simulation, return should be 0, not 1.
    // In our simple mock, hits are unlikely to produce exactly 1 if the bug is fixed.
    // The bug was initializing the sum to 1.

    if (bankerStats.return === 1 && bankerStats.totalBets === 0) {
        console.error("FAILED: Banker returns still incorrectly initialized to 1.");
    } else if (bankerStats.return === 0 && bankerStats.totalBets === 0) {
        console.log("SUCCESS: Banker returns correctly initialized to 0.");
    } else {
        console.log(`INFO: Banker returns is ${bankerStats.return} for ${bankerStats.totalBets} bets.`);
    }

    console.log("Verification checks completed.");

} catch (err) {
    console.error("ERROR during verification:", err);
    process.exit(1);
}
