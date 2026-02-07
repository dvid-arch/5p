/**
 * Optimize a portfolio of top N grids to maximize combined unique coverage
 * Uses a greedy approach:
 * 1. Pick best single grid
 * 2. Pick next grid that adds most unique coverage to the existing set
 * 3. Repeat
 */
export function findOptimalGridPortfolio(history, topN = 3, recentWeeks = 13) {
    // Get weighted individual scores first to find candidate pool
    // We want to pick high-scoring candidates but optimize for coverage combination
    // Pool size: top 15 candidates to choose from (optimization space)
    const initialCandidates = predictBestGridCenters(history, 20, recentWeeks);

    // Sort candidates by raw score
    const candidates = initialCandidates.sort((a, b) => b.score - a.score);

    const dataToAnalyze = history.slice(0, recentWeeks);
    const portfolio = [];
    const coverageSet = new Set();

    // Helper: Calculate marginal gain of adding a candidate to current coverage
    const calculateMarginalGain = (candidate) => {
        const uniqueHits = dataToAnalyze.reduce((acc, draw) => {
            const numbers = Array.isArray(draw) ? draw : (draw.numbers || draw.value || []);
            // Hits by this candidate that are NOT yet covered
            const newHits = numbers.filter(n =>
                candidate.cells.includes(n) && !coverageSet.has(`${draw.id || draw.date}-${n}`) // Draw-specific number tracking?
                // Wait, coverage is "Unique Numbers Covered" or "Total Hit Instances"?
                // User wants "include most of the numbers that occur next week"
                // So we want to maximize HIT COUNT over the test period.
            );
            return acc;
            // Correct Logic:
            // We want to maximize: Count of Winning Numbers in History that are in (Grid A U Grid B U Grid C)
        }, 0);
        return 0;
    };

    /**
     * Correct Greedy Algorithm for Maximum Coverage Set Problem
     * Universe: All winning numbers in history (flattened with Draw IDs if possible, or just raw sum of hits)
     * Let's simplify: We want to maximize the set of winning numbers caught.
     * Universe U = { (DrawIndex, Number) | Number in Draw[DrawIndex] }
     * Each Grid Center C covers a subset of U: S_C = { (d, n) | n in C }
     * We want to pick k Centers to maximize |Union(S_Ci)|
     */

    // 1. Build Universe and Candidates Subsets
    const flattenedHistory = [];
    dataToAnalyze.forEach((draw, dIdx) => {
        const numbers = Array.isArray(draw) ? draw : (draw.numbers || draw.value || []);
        numbers.forEach(n => {
            flattenedHistory.push({ dIdx, n, id: `${dIdx}-${n}` }); // Unique item ID
        });
    });

    // 2. Greedy Selection
    let coveredItems = new Set(); // Set of IDs

    for (let step = 0; step < topN; step++) {
        let bestCandidate = null;
        let bestGain = -1;
        let bestGainItems = [];

        // Iterate through all 49 centers (or top candidates)
        for (let i = 0; i < candidates.length; i++) {
            const cand = candidates[i];

            // Should skipping already selected?
            if (portfolio.find(p => p.center === cand.center)) continue;

            // Calculate gain
            let gain = 0;
            let gainItems = [];

            flattenedHistory.forEach(item => {
                if (!coveredItems.has(item.id)) {
                    if (cand.cells.includes(item.n)) {
                        gain++;
                        gainItems.push(item.id);
                    }
                }
            });

            // Weight gain? We could weight recent draws higher here too with dIdx.
            // For now, raw coverage count.
            if (gain > bestGain) {
                bestGain = gain;
                bestCandidate = cand;
                bestGainItems = gainItems;
            }
        }

        if (bestCandidate) {
            portfolio.push({
                ...bestCandidate,
                marginalGain: bestGain,
                cumulativeCoverage: coveredItems.size + bestGain,
                totalPossible: flattenedHistory.length,
                percentCovered: ((coveredItems.size + bestGain) / flattenedHistory.length * 100).toFixed(1)
            });
            bestGainItems.forEach(id => coveredItems.add(id));
        }
    }

    return portfolio;
}
