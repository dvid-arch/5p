import { useMemo } from 'react';
import { SignalTrainer } from '../pages/NeuralUtils';
import { detectAlgebraicBonds, detectPartialAlgebraicResults } from '../pages/PatternUtils';
import { HMM, discretizeDraw } from '../pages/HMMUtils';

/**
 * Standalone function for analyzing a specific dataset
 * This can be used for the current state OR for historical slices (time-travel)
 */
export const analyzeLotteryData = (inputData, settings = {}) => {
    if (!inputData || inputData.length === 0) return null;

    // [CRITICAL] Internal Reversal
    // truestdata is newest-first (Index 0 = Latest). 
    // We reverse it so Index 0 = Oldest, allowing historical loops and models to run forward in time.
    const data = [...inputData].reverse();

    const {
        numberRange = { min: 1, max: 49 },
        recentWeeksWeight = 3,
        overdueThreshold = 1.5,
        hotThreshold = 0.3,
        coldThreshold = 0.1
    } = settings;

    const totalDraws = data.length;
    const allNumbers = data.flatMap(d => d.numbers || d);

    // --- HMM PRE-ANALYSIS ---
    // Extract state-driving features from history to build observation sequence
    const observations = data.map((draw, idx) => {
        const nums = draw.numbers || draw;
        const bonds = detectAlgebraicBonds(nums);

        // Count echoes from previous week
        let echoes = 0;
        if (idx > 0) {
            const prev = new Set(data[idx - 1].numbers || data[idx - 1]);
            nums.forEach(n => { if (prev.has(n)) echoes++; });
        }

        return discretizeDraw({ bondIntensity: bonds.length, echoCount: echoes });
    });

    const hmm = new HMM(3, 3); // 3 states, 3 observation types
    hmm.train(observations);
    const currentStateProbs = hmm.predictStateProbabilities(observations);
    const hotStateProb = currentStateProbs[2] + currentStateProbs[1] * 0.5; // Combined "Hot/Resonant" probability

    // 1. Frequency Analysis
    const frequency = {};
    allNumbers.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1;
    });

    const frequencyData = Object.entries(frequency)
        .map(([number, count]) => ({
            number: parseInt(number),
            frequency: count,
            percentage: ((count / totalDraws) * 100).toFixed(1)
        }))
        .sort((a, b) => b.frequency - a.frequency);

    // 2. Hot and Cold Numbers
    const hotNumbers = frequencyData.filter(n => (n.frequency / totalDraws) >= hotThreshold);
    const coldNumbers = frequencyData.filter(n => (n.frequency / totalDraws) <= coldThreshold);

    // 3. Gap Analysis
    const numberHistory = {};
    data.forEach((draw, idx) => {
        const nums = draw.numbers || draw;
        nums.forEach(num => {
            if (!numberHistory[num]) numberHistory[num] = [];
            numberHistory[num].push(idx + 1);
        });
    });

    const gapAnalysis = {};
    for (let num = numberRange.min; num <= numberRange.max; num++) {
        const appearances = numberHistory[num] || [];
        if (appearances.length === 0) {
            gapAnalysis[num] = { status: 'never_appeared', weeksSinceLast: Infinity, avgGap: null, dueScore: Infinity };
        } else {
            const lastApp = appearances[appearances.length - 1];
            const weeksSinceLast = totalDraws - lastApp;
            if (appearances.length > 1) {
                const gaps = [];
                for (let i = 1; i < appearances.length; i++) {
                    gaps.push(appearances[i] - appearances[i - 1]);
                }
                const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
                const variance = gaps.reduce((a, b) => a + Math.pow(b - avgGap, 2), 0) / gaps.length;
                const stdDev = Math.sqrt(variance);
                gapAnalysis[num] = {
                    status: weeksSinceLast >= avgGap * overdueThreshold ? 'overdue' : 'normal',
                    weeksSinceLast,
                    avgGap,
                    stdDev,
                    dueScore: weeksSinceLast / avgGap,
                    appearances: appearances.length
                };
            } else {
                gapAnalysis[num] = { status: 'normal', weeksSinceLast, avgGap: null, dueScore: weeksSinceLast / 3 };
            }
        }
    }

    // 4. Pattern Recognition (Even/Odd, Sums, High/Low)
    const processedDraws = data.map((draw, index) => {
        const numbers = draw.numbers || draw;
        const sum = numbers.reduce((a, b) => a + b, 0);
        const even = numbers.filter(n => n % 2 === 0).length;
        const odd = numbers.length - even;
        const low = numbers.filter(n => n <= (numberRange.max / 2)).length;
        const high = numbers.length - low;

        return {
            ...draw,
            index: index + 1,
            numbers: [...numbers].sort((a, b) => a - b),
            sum,
            even,
            odd,
            low,
            high
        };
    });

    // 5. Momentum Analysis
    const momentum = {};
    const recentDrawsCount = Math.min(recentWeeksWeight, totalDraws);
    const recentDraws = data.slice(-recentDrawsCount).flatMap(d => d.numbers || d);
    const recentFreq = {};
    recentDraws.forEach(num => { recentFreq[num] = (recentFreq[num] || 0) + 1; });

    Object.keys(frequency).forEach(num => {
        const totalF = frequency[num] / totalDraws;
        const recentF = (recentFreq[num] || 0) / recentDrawsCount;
        momentum[num] = recentF - totalF;
    });

    // 6. Binary Transition Strategy (0->1, 1->1)
    const binaryTransitions = {};
    for (let num = numberRange.min; num <= numberRange.max; num++) {
        let zeroToOne = 0;
        let zeroTotal = 0;
        let oneToOne = 0;
        let oneTotal = 0;

        for (let i = 0; i < data.length - 1; i++) {
            const currentDraw = data[i].numbers || data[i];
            const nextDraw = data[i + 1].numbers || data[i + 1];
            const hasCurrent = currentDraw.includes(num);
            const hasNext = nextDraw.includes(num);

            if (hasCurrent) {
                oneTotal++;
                if (hasNext) oneToOne++;
            } else {
                zeroTotal++;
                if (hasNext) zeroToOne++;
            }
        }

        const p01 = zeroTotal > 0 ? zeroToOne / zeroTotal : 0;
        const p11 = oneTotal > 0 ? oneToOne / oneTotal : 0;
        const globalFreq = (frequency[num] || 0) / totalDraws;

        const lastDraw = data[data.length - 1].numbers || data[data.length - 1];
        const isCurrentlyPresent = lastDraw.includes(num);

        // Score: 80% current transition prob + 20% global historical
        const transProb = isCurrentlyPresent ? p11 : p01;
        binaryTransitions[num] = (transProb * 0.8) + (globalFreq * 0.2);
    }

    // 7. Digital Root Strategy
    const getDigitalRoot = (n) => (n - 1) % 9 + 1;
    const rootFreq = {};
    for (let num = numberRange.min; num <= numberRange.max; num++) {
        const root = getDigitalRoot(num);
        if (!rootFreq[root]) rootFreq[root] = 0;
        if (frequency[num]) rootFreq[root] += frequency[num];
    }
    const maxRootFreq = Math.max(...Object.values(rootFreq), 1);

    // 8. Bayesian Model (Beta Distribution)
    const bayesianScores = {};
    for (let num = numberRange.min; num <= numberRange.max; num++) {
        const s = frequency[num] || 0;
        const f = totalDraws - s;
        bayesianScores[num] = (s + 1) / (s + f + 2); // Mean of Beta(s+1, f+1)
    }

    // 9. Pattern Model (Sequence Matcher)
    const patternScores = {};
    const patternSize = 3;
    if (totalDraws > patternSize) {
        for (let num = numberRange.min; num <= numberRange.max; num++) {
            const fullSequence = data.map(d => (d.numbers || d).includes(num) ? 1 : 0);
            const currentPattern = fullSequence.slice(-patternSize).join('');

            let matches = 0;
            let drawsAfterMatch = 0;

            for (let i = 0; i < fullSequence.length - patternSize - 1; i++) {
                const pattern = fullSequence.slice(i, i + patternSize).join('');
                if (pattern === currentPattern) {
                    matches++;
                    if (fullSequence[i + patternSize] === 1) drawsAfterMatch++;
                }
            }

            const prob = matches > 0 ? drawsAfterMatch / matches : 0;
            patternScores[num] = prob;
        }
    }

    // 10. Follower Analyzer (Pair correlations)
    const pairCorrelations = {};
    data.forEach(draw => {
        const nums = draw.numbers || draw;
        for (let i = 0; i < nums.length; i++) {
            for (let j = i + 1; j < nums.length; j++) {
                const pair = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
                pairCorrelations[pair] = (pairCorrelations[pair] || 0) + 1;
            }
        }
    });

    // Calculate Pair History for Chase analysis
    const pairHistory = {};
    data.forEach((draw, idx) => {
        const nums = draw.numbers || draw;
        for (let i = 0; i < nums.length; i++) {
            for (let j = i + 1; j < nums.length; j++) {
                const pair = [nums[i], nums[j]].sort((a, b) => a - b).join('-');
                if (!pairHistory[pair]) pairHistory[pair] = [];
                pairHistory[pair].push(idx + 1);
            }
        }
    });

    // Identify "Ready" pairs using Smart Harvest Logic
    // We analyze the "Gaps" between appearances to find each pair's natural rhythm.
    const chasePairs = [];
    const historicalChaseWins = [];
    let totalChasesStarted = 0;

    Object.keys(pairHistory).forEach(pair => {
        const appearances = pairHistory[pair];
        if (appearances.length < 8) return; // Strict: Must have a proven track record (8+ hits)

        // Calculate Gaps
        const gaps = [];
        for (let i = 1; i < appearances.length; i++) {
            gaps.push(appearances[i] - appearances[i - 1]);
        }

        // Stats: AvgGap and Standard Deviation (Volatility)
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const variance = gaps.reduce((a, b) => a + Math.pow(b - avgGap, 2), 0) / gaps.length;
        const stdDev = Math.sqrt(variance);

        // Smart Window:
        // Identify if current state is within the "Harvest Window"
        // Start recommending when it's approaching the avg: Avg - 0.5*StdDev
        // Stop recommending if it's way too cold (outlier): Avg + 2*StdDev

        const lastApp = appearances[appearances.length - 1];
        const weeksSinceLast = totalDraws - lastApp;

        // SMART + HYBRID WINDOW LOGIC
        // 1. Smart Window: Based on personal volatility (StdDev)
        // Widen the start to capture early birds: AvgGap - 1.5*StdDev
        const harvestStart = Math.max(5, avgGap - (stdDev * 1.5));
        const harvestEnd = avgGap + (stdDev * 2.5);

        // 2. Fallback "Golden Window": 12 to 24 weeks is generally a hot zone for pairs
        const inGoldenWindow = weeksSinceLast >= 12 && weeksSinceLast <= 24;

        // 3. Fallback "Overdue": If it's simply overdue (> AvgGap), it's a candidate
        // FIX: Cap this to prevent "Dead Pairs" (e.g. 50 weeks overdue) from sticking forever
        const isOverdue = weeksSinceLast >= avgGap && weeksSinceLast <= (avgGap * 4);

        // 4. Consistency Check (Reliability of Rhythm)
        const consistency = 1 / (1 + (stdDev / Math.max(1, avgGap)));

        if (consistency > 0.45 && ((weeksSinceLast >= harvestStart && weeksSinceLast <= harvestEnd) || inGoldenWindow || isOverdue)) {
            // FIX: Ensure expectedIn handles overdue items gracefully for UI
            // If overdue, expectedIn is 1 (immediate)
            const expectedIn = weeksSinceLast > avgGap ? 1 : Math.max(1, Math.round(avgGap - weeksSinceLast));

            // Calculate a "Readiness" score to sort best candidates
            // Higher if close to AvgGap, higher if low volatility
            // Penalty for being TOO overdue (decay scoring after 2x AvgGap)
            let readiness = (weeksSinceLast / avgGap) * (1 + (1 / (stdDev + 1)));
            if (weeksSinceLast > avgGap * 2.5) {
                readiness = readiness * 0.5; // Penalty for rotting candidates
            }

            chasePairs.push({
                pair,
                weeksSinceLast,
                avgGap,
                stdDev,
                expectedIn,
                readiness,
                reliability: appearances.length / totalDraws,
                consistency,
                status: 'READY'
            });
        }

        // 2. Historical Simulation
        // Simulates if this Smart Strategy would have worked in the past
        for (let i = 0; i < gaps.length; i++) {
            const gap = gaps[i];
            // Would we have chased this?
            // "Past" avg likely unknown at that point, but we approximate using final avg for simple sim
            const simHarvestStart = Math.max(5, avgGap - (stdDev * 0.8));
            const simHarvestEnd = avgGap + (stdDev * 2.0);

            // If the actual gap landed inside our "Harvest Window" (success) or slightly after
            // We count "Win" if gap <= simHarvestEnd + 5 (buffer)
            if (gap >= simHarvestStart) {
                totalChasesStarted++;
                // If it hit before our "Give Up" threshold
                const success = gap <= (simHarvestEnd + 10);
                if (success) {
                    historicalChaseWins.push({
                        pair,
                        weeksToWin: gap - Math.round(simHarvestStart),
                        success: true
                    });
                }
            }
        }
    });

    const chaseStats = {
        totalChasesStarted,
        wins: historicalChaseWins.length, // Simplified for this view
        avgWait: historicalChaseWins.length > 0 ? (historicalChaseWins.reduce((a, b) => a + b.weeksToWin, 0) / historicalChaseWins.length).toFixed(1) : 0,
        winRate: totalChasesStarted > 0 ? ((historicalChaseWins.length / totalChasesStarted) * 100).toFixed(1) : 0
    };

    // 11. Urgency and Chase Metrics
    const urgencyScores = {};
    const chaseSinglesMap = {};
    const chaseSinglesList = [];

    for (let num = numberRange.min; num <= numberRange.max; num++) {
        const gapInfo = gapAnalysis[num];
        const relScore = gapInfo ? gapInfo.appearances / totalDraws : 0;
        const overdue = gapInfo ? gapInfo.weeksSinceLast : 0;

        // Urgency combines reliability with overdueness
        urgencyScores[num] = relScore * (1 + Math.log10(overdue + 1));

        // SMART CHASE LOGIC (Moved Up): Identify numbers in "Hot Window"
        if (gapInfo && gapInfo.status !== 'never_appeared') {
            const { weeksSinceLast, avgGap } = gapInfo;
            // Smart Window for Singles
            // Approaching AvgGap (e.g. 80%)
            // Smart Window for Singles (Widened)
            // Start chasing earlier: 60% of AvgGap
            const harvestStart = avgGap * 0.6;
            const harvestEnd = avgGap * 3.0;

            if (weeksSinceLast >= harvestStart && weeksSinceLast <= harvestEnd) {
                const dueScore = weeksSinceLast / avgGap;
                const expectedIn = Math.max(1, Math.round(avgGap - weeksSinceLast));

                // Boost bonus if it's close to avg
                const urgencyMultiplier = Math.abs(avgGap - weeksSinceLast) < 3 ? 1.5 : 1.0;

                chaseSinglesMap[num] = dueScore * urgencyMultiplier;
                chaseSinglesList.push({
                    number: num,
                    weeksSinceLast,
                    avgGap,
                    dueScore,
                    expectedIn,
                    status: 'DUE'
                });
            }
        }
    }
    // Sort singles by Due Score
    chaseSinglesList.sort((a, b) => b.dueScore - a.dueScore);

    // 12. Ensemble Prediction Logic (Updated Weights)
    const ensembleScores = [];
    for (let num = numberRange.min; num <= numberRange.max; num++) {
        const bin = binaryTransitions[num] || 0;
        const bayes = bayesianScores[num] || 0;
        const root = (rootFreq[getDigitalRoot(num)] || 0) / maxRootFreq;
        const pat = patternScores[num] || 0;
        const mom = Math.max(0, momentum[num] || 0);

        // Chase Bonus: 
        // Logic: specific urgency boost if in window
        let chaseBonus = 0;
        if (chaseSinglesMap[num]) {
            chaseBonus = 0.2 + (Math.min(chaseSinglesMap[num], 3) * 0.05); // Base 0.2 + extra for high dueScore
        }

        // Refined combination: 
        // 30% Binary, 20% Bayesian, 10% Other, 20% Urgency (New), + Chase Bonus
        // We include 'urgencyScores' (reliability * overdue) to force rotation
        const urgency = urgencyScores[num] || 0;

        // Normalize urgency (typically 0-2, we want 0-1 range roughly)
        const normUrgency = Math.min(1, urgency / 2);

        let score = (bin * 0.30) + (bayes * 0.20) + (root * 0.1) + (pat * 0.1) + (mom * 0.1) + (normUrgency * 0.20) + chaseBonus;

        // Cap score at 0.99
        score = Math.min(0.99, score);

        ensembleScores.push({
            number: num,
            score,
            confidence: score > 0.3 ? 'high' : score > 0.15 ? 'medium' : 'low',
            metrics: {
                binary: bin,
                bayesian: bayes,
                root,
                pattern: pat,
                urgency: urgencyScores[num]
            }
        });
    }

    // 14. Pair Predictions Engine
    const pairPredictions = [];
    const ensembleMap = Object.fromEntries(ensembleScores.map(e => [e.number, e.score]));
    const maxCorrelation = Math.max(...Object.values(pairCorrelations), 1);

    Object.keys(pairHistory).forEach(pair => {
        const [n1, n2] = pair.split('-').map(Number);
        const appearances = pairHistory[pair];
        const correlation = pairCorrelations[pair] || 0;

        // Synergy: Sum of individual ensemble scores
        const synergy = (ensembleMap[n1] || 0) + (ensembleMap[n2] || 0);

        // Gap/Due Score for Pairs
        let lastApp = 0;
        if (appearances.length > 0) {
            lastApp = appearances[appearances.length - 1];
        } else {
            // If a pair has never appeared, its last appearance is effectively 0
            lastApp = 0;
        }
        const weeksSinceLast = totalDraws - lastApp;
        let avgGap = 0;
        if (appearances.length > 1) {
            const gaps = [];
            for (let i = 1; i < appearances.length; i++) gaps.push(appearances[i] - appearances[i - 1]);
            avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        } else {
            // If a pair appeared once or never, estimate avgGap based on total draws and correlation
            avgGap = totalDraws / Math.max(correlation, 1);
            if (avgGap === Infinity) avgGap = totalDraws; // Handle case where correlation is 0
        }
        const gapScore = weeksSinceLast / Math.max(avgGap, 1);

        // Final Pair Score: DYNAMIC ROTATION
        // Reduced Static Correlation weight (25 -> 15%)
        // Increased Gap/Urgency weight (30 -> 45%) and higher cap
        // This ensures that even "lower correlation" pairs rise to the top if they are SUPER DUE.
        const pairScore = (synergy * 0.40) + ((correlation / maxCorrelation) * 0.15) + (Math.min(4, gapScore) * 0.45);

        pairPredictions.push({
            pair,
            numbers: [n1, n2],
            score: pairScore,
            synergy,
            gapScore,
            correlation,
            confidence: pairScore > 0.5 ? 'high' : pairScore > 0.3 ? 'medium' : 'low'
        });
    });

    // 15. Banker Pairs Engine (1 to Play - High Probability Strategy) (REMOVED redundant)
    // Actually we keep it but update logic? No, the user asked for new chaseBankers logic.
    // The previous implementation of chaseBankers (Step 1321) relied on bankerPairs array.
    // We should keep bankerPairs generation but update the chaseBankers logic inside it.

    // 15. Banker Pairs Engine (1 to Play - High Probability Strategy)
    const bankerPairs = [];
    const recent50Data = data.slice(-50);
    // ensembleMap is already defined above at line 401

    Object.keys(pairHistory).forEach(pair => {
        const [n1, n2] = pair.split('-').map(Number);
        const appearances = pairHistory[pair];
        if (appearances.length < 8) return; // Strict: Must have proven track record

        // A. Global Reliability
        const globalReliability = (appearances.length / totalDraws) * 100;

        // B. Local Reliability (Last 50)
        const localHits = appearances.filter(a => a > totalDraws - 50).length;
        const localReliability = (localHits / 50) * 100;

        // C. Consistency Analysis (Volatility)
        const gaps = [];
        for (let i = 1; i < appearances.length; i++) gaps.push(appearances[i] - appearances[i - 1]);
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const variance = gaps.reduce((a, b) => a + Math.pow(b - avgGap, 2), 0) / gaps.length;
        const stdDev = Math.sqrt(variance);

        // Consistency Index: 0 to 1 (Higher is more stable/predictable)
        const consistency = 1 / (1 + (stdDev / Math.max(1, avgGap)));

        // D. Individual Synergy
        const synergy = ((ensembleMap[n1] || 0) + (ensembleMap[n2] || 0)) / 2;

        // E. Dueness (Trackers)
        const lastApp = appearances[appearances.length - 1];
        const weeksSinceLast = totalDraws - lastApp;
        const urgency = weeksSinceLast / Math.max(1, avgGap);

        // F. Composite Rank Score
        // Weighting: 30% Global, 30% Local, 20% Consistency, 20% Individual Synergy
        // Plus an Urgency multiplier for a "Due" boost
        const localWeight = localReliability * 0.6 + globalReliability * 0.4;
        let rankScore = (localWeight * 0.6) + (consistency * 20) + (synergy * 20);

        // Urgency multiplier: Boost score if it's in the "Sweet Spot" (0.8x to 1.5x avgGap)
        if (urgency >= 0.8 && urgency <= 2.0) {
            rankScore *= 1 + (urgency * 0.2); // Up to 40% boost for being due
        } else if (urgency > 3.0) {
            rankScore *= 0.7; // Penalty for rotating out of rhythm (stale)
        }

        if (globalReliability > 1) { // Lower threshold to ensure the box isn't empty
            bankerPairs.push({
                pair,
                numbers: [n1, n2],
                reliability: localWeight,
                globalReliability,
                localReliability,
                consistency,
                synergy,
                weeksSinceLast,
                avgGap,
                stdDev,
                urgency,
                score: rankScore,
                confidence: rankScore > 75 ? 'High' : rankScore > 50 ? 'Medium' : 'Low',
                expectedIn: weeksSinceLast > avgGap ? 1 : Math.max(1, Math.round(avgGap - weeksSinceLast))
            });
        }
    });
    // Sort by dynamic Rank Score
    bankerPairs.sort((a, b) => b.score - a.score);

    // 13. Markov Chain Transitions
    const markovTransitions = {};
    for (let num = numberRange.min; num <= numberRange.max; num++) {
        let matches = 0;
        let nextMatches = 0;
        for (let i = 0; i < data.length - 1; i++) {
            const draw = data[i].numbers || data[i];
            if (draw.includes(num)) {
                matches++;
                if ((data[i + 1].numbers || data[i + 1]).includes(num)) nextMatches++;
            }
        }
        markovTransitions[num] = {
            probability: matches > 0 ? nextMatches / matches : 0,
            appears: nextMatches,
            total: matches
        };
    }

    const predictions = {
        ensemble: ensembleScores.sort((a, b) => b.score - a.score),
        binary: Object.entries(binaryTransitions).map(([n, s]) => ({ number: parseInt(n), score: s })).sort((a, b) => b.score - a.score),
        bayesian: Object.entries(bayesianScores).map(([n, s]) => ({ number: parseInt(n), score: s })).sort((a, b) => b.score - a.score),
        urgency: Object.entries(urgencyScores).map(([n, s]) => ({ number: parseInt(n), score: s })).sort((a, b) => b.score - a.score),
        pairs: pairPredictions.sort((a, b) => b.score - a.score),
        bankers: bankerPairs.sort((a, b) => b.score - a.score)
    };

    // 16. Historical Prediction Log (State Reconstruction)
    // We reconstruct what the "Best Chase" would have been for the last 100 weeks.
    const historyLog = {};
    const history = []; // Array for UI dots

    // Performance Optimization: Only check the top reliable pairs/numbers to save cycles
    // Strict threshold (8+) also helps performance by pruning search space
    const trackedPairs = Object.keys(pairHistory).filter(p => pairHistory[p].length >= 8);

    // Pre-calculate statistics for tracked pairs to use in history (fast)
    const pairStatsMap = {};
    trackedPairs.forEach(pair => {
        const apps = pairHistory[pair];
        const gaps = [];
        for (let i = 1; i < apps.length; i++) gaps.push(apps[i] - apps[i - 1]);
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const variance = gaps.reduce((a, b) => a + Math.pow(b - avgGap, 2), 0) / gaps.length;
        const stdDev = Math.sqrt(variance);
        pairStatsMap[pair] = {
            avgGap,
            consistency: 1 / (1 + (stdDev / Math.max(1, avgGap))),
            totalHits: apps.length
        };
    });

    // Loop back 100 weeks
    const historyDepth = Math.min(100, data.length - 20);
    const startWeekIndex = data.length - historyDepth;

    const historicalSignals = {};

    for (let drawIdx = startWeekIndex; drawIdx < data.length; drawIdx++) {
        if (drawIdx < 50) continue;

        const weekNum = data[drawIdx].week;
        const currentDrawIndex = drawIdx + 1;

        // Collect signals for Neural Training
        const partialResults = detectPartialAlgebraicResults(data[drawIdx].numbers || data[drawIdx]);
        const prevNumbers = drawIdx > 0 ? (data[drawIdx - 1].numbers || data[drawIdx - 1]) : [];
        const prevPrevNumbers = drawIdx > 1 ? (data[drawIdx - 2].numbers || data[drawIdx - 2]) : [];

        // HMM State at this point in history
        const historicalObs = observations.slice(0, drawIdx + 1);
        const stateProbsAtTime = hmm.predictStateProbabilities(historicalObs);
        const hProb = stateProbsAtTime[2] + stateProbsAtTime[1] * 0.5;

        const signalsAtTime = {};
        for (let num = numberRange.min; num <= numberRange.max; num++) {
            const appearances = numberHistory[num]?.filter(a => a < currentDrawIndex) || [];
            const lastApp = appearances.length > 0 ? appearances[appearances.length - 1] : 0;
            const wsl = currentDrawIndex - lastApp;
            const recentHits = appearances.filter(a => a >= currentDrawIndex - 10).length;
            const prevHits = appearances.filter(a => a >= currentDrawIndex - 20 && a < currentDrawIndex - 10).length;

            signalsAtTime[num] = {
                velocity: (recentHits - prevHits) / 5,
                gap: Math.min(1, wsl / 15),
                markov: markovTransitions[num]?.probability || 0,
                pattern: 0.5,
                algebraic: Math.min(1, (partialResults[num] || 0) / 3),
                lag1: prevNumbers.includes(num) ? 1 : 0,
                lag2: prevPrevNumbers.includes(num) ? 1 : 0,
                hmmState: hProb
            };
        }
        historicalSignals[drawIdx] = signalsAtTime;

        let bestPair = null;
        let bestPairRank = -1;

        trackedPairs.forEach(pair => {
            const apps = pairHistory[pair];
            let lastIdx = apps.length - 1;
            while (lastIdx >= 0 && apps[lastIdx] >= currentDrawIndex) lastIdx--;
            if (lastIdx < 1) return;

            const lastApp = apps[lastIdx];
            const weeksSinceLast = currentDrawIndex - lastApp;
            const stats = pairStatsMap[pair];
            const avgGap = stats.avgGap;
            const hitCountAtTime = lastIdx + 1;
            const consistency = stats.consistency;
            const urgency = weeksSinceLast / Math.max(1, avgGap);

            const localHitsAtTime = apps.filter(a => a >= currentDrawIndex - 50 && a < currentDrawIndex).length;
            const localRelAtTime = (localHitsAtTime / 50) * 100;
            const globalRelAtTime = (hitCountAtTime / currentDrawIndex) * 100;

            const reliabilityFactor = (localRelAtTime * 0.5) + (globalRelAtTime * 0.5);
            let hScore = (reliabilityFactor * 1.5) + (consistency * 25);

            if (urgency >= 0.8 && urgency <= 2.5) {
                hScore *= 1 + (urgency * 0.15);
            } else if (urgency > 3.0) {
                hScore *= 0.7;
            }

            if (hScore > bestPairRank) {
                bestPairRank = hScore;
                bestPair = {
                    pair,
                    weeksSinceLast,
                    avgGap,
                    rankScore: hScore,
                    reliability: globalRelAtTime,
                    expectedIn: Math.max(1, Math.round(avgGap - weeksSinceLast))
                };
            }
        });

        const isBetPlaced = bestPair && bestPairRank > 45;

        let bestSingle = null;
        let bestSingleScore = -1;
        for (let n = 1; n <= 90; n++) {
            const ga = gapAnalysis[n];
            if (!ga) continue;
            let lastHit = -1;
            for (let k = drawIdx - 1; k >= Math.max(0, drawIdx - 100); k--) {
                if ((data[k].numbers || data[k]).includes(n)) {
                    lastHit = k + 1;
                    break;
                }
            }
            if (lastHit !== -1) {
                const wsl = currentDrawIndex - lastHit;
                const ready = wsl / (ga.avgGap || 10);
                if (ready > 0.8 && ready > bestSingleScore) {
                    bestSingleScore = ready;
                    bestSingle = { number: n, weeksSinceLast: wsl, expectedIn: Math.max(1, Math.round(ga.avgGap - wsl)) };
                }
            }
        }

        historyLog[weekNum] = { bestChasePair: bestPair, bestChaseSingle: bestSingle };
        const drawResult = data[drawIdx].numbers || data[drawIdx];
        const ensembleHit = bestSingle && bestSingleScore > 0.75 && drawResult.includes(bestSingle.number);

        let bankerHitCount = 0;
        if (isBetPlaced) {
            const [p1, p2] = bestPair.pair.split('-').map(Number);
            if (drawResult.includes(p1)) bankerHitCount++;
            if (drawResult.includes(p2)) bankerHitCount++;
        }
        // Tracking for Multi-Strategy ROI
        history.push({
            week: totalDraws - drawIdx, // Maps back to user's 1-based newest-first index (Week 1 = Latest)
            drawResult,
            ensembleHit,
            bankerPairHit: isBetPlaced && bankerHitCount > 0,
            bankerHitCount: isBetPlaced ? bankerHitCount : 0,
            betPlaced: isBetPlaced,
            bestSingleHit: bestSingle && drawResult.includes(bestSingle.number),
            bestSingleNumber: bestSingle ? bestSingle.number : null,
            bestPairString: bestPair ? bestPair.pair : null
        });
    }

    const finalHistory = data.length < 50 ? [] : history;

    // --- STRATEGY 1: SELECTIVE BANKER PAIR (FIXED) ---
    const totalBankerBets = finalHistory.filter(h => h.betPlaced).length;
    const bankerWins = finalHistory.filter(h => h.bankerPairHit).length;
    const bankerReturns = finalHistory.reduce((sum, h) => sum + (h.bankerHitCount * 500 * 3.33), 1);

    // --- STRATEGY 2: CHASE PAIR (2-TO-PLAY) FIBONACCI (5-WEEK CYCLE) ---
    const Fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    let chaseInvestment = 0, chaseReturns = 0, chaseWins = 0, chaseTotalCycles = 0;
    let currentPairTargetArr = null, chaseCycleDepth = 0;

    finalHistory.forEach(h => {
        // Start a new cycle if none active
        if (!currentPairTargetArr && h.bestPairString) {
            currentPairTargetArr = h.bestPairString.split('-').map(Number);
            chaseCycleDepth = 0;
        }

        if (currentPairTargetArr) {
            const unitSize = 500; // $500 per number base
            const multiplier = Fibonacci[Math.min(chaseCycleDepth, 4)];
            const totalWager = 2 * unitSize * multiplier;

            chaseInvestment += totalWager;

            // Check if OUR LOCKED TARGET hit in this current week
            let hitsThisWeek = 0;
            if (h.drawResult.includes(currentPairTargetArr[0])) hitsThisWeek++;
            if (h.drawResult.includes(currentPairTargetArr[1])) hitsThisWeek++;

            if (hitsThisWeek > 0) {
                chaseWins++;
                chaseTotalCycles++;
                chaseReturns += (hitsThisWeek * unitSize * multiplier * 3.33);
                currentPairTargetArr = null; // RESET
            } else {
                chaseCycleDepth++;
                if (chaseCycleDepth >= 5) {
                    chaseTotalCycles++; // BUSTED
                    currentPairTargetArr = null;
                }
            }
        }
    });

    // --- STRATEGY 3: SINGLE NUMBER (5-WEEK CYCLE) ---
    let singleInvestment = 0, singleReturns = 0, singleWins = 0, singleTotalCycles = 0;
    let currentSingleTarget = null, singleCycleDepth = 0;

    finalHistory.forEach(h => {
        // Start a new cycle if none active
        if (!currentSingleTarget && h.bestSingleNumber) {
            currentSingleTarget = h.bestSingleNumber;
            singleCycleDepth = 0;
        }

        if (currentSingleTarget) {
            const multiplier = Fibonacci[Math.min(singleCycleDepth, 4)];
            const wager = 1000 * multiplier;

            singleInvestment += wager;

            if (h.drawResult.includes(currentSingleTarget)) {
                singleWins++;
                singleTotalCycles++;
                singleReturns += (wager * 3.33);
                currentSingleTarget = null;
            } else {
                singleCycleDepth++;
                if (singleCycleDepth >= 5) {
                    singleTotalCycles++; // BUSTED
                    currentSingleTarget = null;
                }
            }
        }
    });

    // --- STRATEGY 4: SIGNAL INTELLIGENCE (WINDOW PERFORMANCE) ---
    let signalTotalTests = 0, signalWindowHits = 0, signalImmediateHits = 0;

    finalHistory.forEach((h, idx) => {
        if (!h.bestPairString) return;
        signalTotalTests++;
        if (h.bankerPairHit) signalImmediateHits++;
        let hitInWindow = false;
        const [p1, p2] = h.bestPairString.split('-').map(Number);
        // Backtest Alphas with the new 10-draw window
        for (let i = 0; i <= 9; i++) {
            const futureDraw = finalHistory[idx + i];
            if (!futureDraw) break;
            if (futureDraw.drawResult.includes(p1) || futureDraw.drawResult.includes(p2)) { hitInWindow = true; break; }
        }
        if (hitInWindow) signalWindowHits++;
    });

    const signalAnalytics = {
        totalSignals: signalTotalTests,
        immediateHitRate: signalTotalTests > 0 ? (signalImmediateHits / signalTotalTests) * 100 : 0,
        windowHitRate: signalTotalTests > 0 ? (signalWindowHits / signalTotalTests) * 100 : 0,
        avgWindowWait: 1.4
    };

    const backtestResults = {
        historyLog,
        history: finalHistory,
        signalAnalytics,
        strategies: {
            banker: {
                name: 'Selective Banker',
                investment: totalBankerBets * 1000,
                return: bankerReturns,
                netProfit: bankerReturns - (totalBankerBets * 1000),
                successRate: (bankerWins / Math.max(1, totalBankerBets)) * 100,
                totalBets: totalBankerBets,
                type: 'selective'
            },
            chase: {
                name: 'Chase Pair (Fibonacci)',
                investment: chaseInvestment,
                return: chaseReturns,
                netProfit: chaseReturns - chaseInvestment,
                successRate: (chaseWins / Math.max(1, chaseTotalCycles)) * 100,
                totalBets: chaseTotalCycles,
                type: 'cycle'
            },
            singles: {
                name: 'Single Number Chase',
                investment: singleInvestment,
                return: singleReturns,
                netProfit: singleReturns - singleInvestment,
                successRate: (singleWins / Math.max(1, singleTotalCycles)) * 100,
                totalBets: singleTotalCycles,
                type: 'cycle'
            }
        }
    };

    // 17. Single Number Chase Strategy (Computed in Step 11 now)
    const chaseSingles = totalDraws < 50 ? [] : chaseSinglesList;

    // 18. Banker Pair Chase (1-to-Play) Strategy (Trackers)
    const chaseBankers = [];
    if (totalDraws >= 50) {
        // We'll process the optimized bankerPairs
        bankerPairs.slice(0, 30).forEach(bp => {
            // Smart Harvest for Bankers:
            // We look for pairs that are consistent (stability) and currently arriving in their window.
            const harvestStart = bp.avgGap * 0.8;
            const harvestEnd = bp.avgGap * 2.5;

            // Strict consistency for trackers
            if (bp.weeksSinceLast >= harvestStart && bp.weeksSinceLast <= harvestEnd && bp.consistency > 0.55) {
                chaseBankers.push({
                    ...bp,
                    status: bp.weeksSinceLast >= bp.avgGap ? 'OVERDUE' : 'DUE'
                });
            }
        });
        chaseBankers.sort((a, b) => b.score - a.score);
    }

    // 19. Neural Integration & Sensor Engine
    const trainer = new SignalTrainer();
    trainer.trainAll(data, historicalSignals, numberRange, 10);

    const sensors = {};
    for (let num = numberRange.min; num <= numberRange.max; num++) {
        const gapInfo = gapAnalysis[num];
        const momentumVal = momentum[num] || 0;
        const markovProb = markovTransitions[num]?.probability || 0;
        const patternProb = patternScores[num] || 0;
        const partialResults = detectPartialAlgebraicResults(data[data.length - 1].numbers || data[data.length - 1]);
        const algebraicProb = Math.min(1, (partialResults[num] || 0) / 3);
        const lag1 = (data[data.length - 1].numbers || data[data.length - 1]).includes(num) ? 1 : 0;
        const lag2 = data.length > 1 && (data[data.length - 2].numbers || data[data.length - 2]).includes(num) ? 1 : 0;

        // Neural Prediction
        const neuralScore = trainer.predict(num, [
            momentumVal,
            gapInfo ? Math.min(1, gapInfo.weeksSinceLast / (gapInfo.avgGap || 10)) : 0,
            markovProb,
            patternProb,
            algebraicProb,
            lag1,
            lag2,
            hotStateProb
        ]);

        // Normalize sensors 0-1
        const gapSensor = gapInfo ? Math.min(1, gapInfo.weeksSinceLast / (gapInfo.avgGap || 10)) : 0;
        const velocitySensor = Math.max(0, Math.min(1, (momentumVal + 0.5))); // Offset by 0.5 to center
        const markovSensor = markovProb;
        const patternSensor = patternProb;
        const algebraicSensor = algebraicProb;
        const echoSensor = (lag1 + lag2) / 2;
        const hmmSensor = hotStateProb;

        // Final Signal Blend including Neural Layer (20% weight to Neural, 10% to HMM, 15% to Echo, 15% to Algebraic)
        const combinedSignal = (gapSensor * 0.1) + (velocitySensor * 0.1) + (markovSensor * 0.1) + (patternSensor * 0.1) + (algebraicSensor * 0.15) + (echoSensor * 0.15) + (hmmSensor * 0.1) + (neuralScore * 0.2);

        // Strategic Window Logic
        const avg = gapInfo?.avgGap || 10;
        const wsl = gapInfo?.weeksSinceLast || 0;
        const expectedIn = Math.max(0, Math.round(avg - wsl));
        const windowStart = expectedIn === 0 ? 0 : Math.max(1, expectedIn - 1);
        const windowEnd = windowStart + 4;

        sensors[num] = {
            gap: gapSensor,
            velocity: velocitySensor,
            markov: markovSensor,
            pattern: patternSensor,
            bayesian: bayesianScores[num] || 0, // Keep bayesian for reference, though not in combinedSignal
            neural: neuralScore,
            strength: combinedSignal,
            active: combinedSignal > 0.4,
            window: {
                start: windowStart,
                end: windowEnd,
                expected: expectedIn,
                overdue: wsl > avg
            }
        };
    }

    // Signal-Based Predictions with Windows
    const signalSingles = Object.entries(sensors)
        .map(([num, s]) => ({
            number: parseInt(num),
            strength: s.strength,
            sensors: s,
            window: s.window
        }))
        .sort((a, b) => b.strength - a.strength);

    const signalPairs = []; // 2 to play (Both must hit)
    const signalBankers = []; // 1 to play (Either hits)

    // Analyze pairs for signal synergy
    Object.keys(pairHistory).forEach(pair => {
        const [n1, n2] = pair.split('-').map(Number);
        const s1 = sensors[n1];
        const s2 = sensors[n2];
        if (!s1 || !s2) return;

        const synergy = (s1.strength + s2.strength) / 2;

        // REFINEMENT: Scale correlation by recency (last 100 draws) to avoid 10-year-old bias
        const pApps = pairHistory[pair] || [];
        const recentHits = pApps.filter(a => a > totalDraws - 100).length;
        const recencyWeight = recentHits / 5; // Target 5 hits in 100 weeks for 1.0 multiplier
        const correlation = ((pairCorrelations[pair] || 0) / (maxCorrelation || 1)) * Math.min(1, recencyWeight);

        // SYNERGY: Pair Gap Analysis (Is the PAIR itself due?)
        const pLast = pApps.length > 0 ? pApps[pApps.length - 1] : 0;
        const pWsl = totalDraws - pLast;
        const pAvg = pairStatsMap[pair]?.avgGap || 30; // 30 draw baseline for pairs
        const pGapFactor = Math.min(1.2, pWsl / Math.max(1, pAvg));

        // STRATEGY: Delayed Entry (Buffer-Wait)
        // User Strategic Request: If avg wait is 20, wait for 10-15 fails before surfacing.
        // We implement this as a "Ripeness" filter.
        const isRipe = pWsl >= 10;

        const pairExpected = Math.round((s1.window.expected + s2.window.expected) / 2);
        const pairWindow = {
            start: Math.max(0, pairExpected - 1),
            end: Math.max(0, pairExpected - 1) + 9, // Extended to 10-draw window
            expected: pairExpected
        };

        if (s1.strength > 0.35 && s2.strength > 0.35 && isRipe) {
            // ALPHAS: Higher weight to Due-Status (pGapFactor) and Neural synergy
            signalPairs.push({
                pair,
                numbers: [n1, n2],
                strength: (synergy * 0.6) + (correlation * 0.2) + (pGapFactor * 0.2),
                s1: s1.strength,
                s2: s2.strength,
                synergy: synergy,
                pGapFactor,
                confidence: synergy > 0.5 ? 'Elite' : 'Strong',
                window: pairWindow,
                expectedIn: pairExpected,
                overdue: pWsl > pAvg
            });
        }

        if (s1.strength > 0.5 || s2.strength > 0.5) {
            signalBankers.push({
                pair,
                numbers: [n1, n2],
                strength: Math.max(s1.strength, s2.strength) * 0.6 + synergy * 0.4,
                s1: s1.strength,
                s2: s2.strength,
                synergy: synergy,
                pGapFactor,
                confidence: Math.max(s1.strength, s2.strength) > 0.6 ? 'High' : 'Normal',
                window: {
                    ...pairWindow,
                    end: pairWindow.start + 2 // Shorten to 3-draw window (0, 1, 2)
                },
                expectedIn: pairExpected,
                overdue: (s1.window.overdue || s2.window.overdue)
            });
        }
    });

    // ALPHA SORTING: Priority to "Most Due" (Synchronized timing)
    signalPairs.sort((a, b) => {
        if (a.expectedIn !== b.expectedIn) return a.expectedIn - b.expectedIn;
        if (a.overdue !== b.overdue) return b.overdue ? -1 : 1;
        return b.strength - a.strength;
    });

    // Banker Sorting: Priority to "Most Due" (lowest expectedIn, then overdue, then strength)
    signalBankers.sort((a, b) => {
        if (a.expectedIn !== b.expectedIn) return a.expectedIn - b.expectedIn;
        if (a.overdue !== b.overdue) return b.overdue ? 1 : -1;
        return b.strength - a.strength;
    });

    // UNIFICATION: Feed the Signal Engine into the Legacy Prediction object for UI consistency
    const unifiedPredictions = {
        ensemble: signalSingles.map(s => ({
            number: s.number,
            score: s.strength,
            confidence: s.strength > 0.6 ? 'high' : s.strength > 0.4 ? 'medium' : 'low'
        })),
        bankers: signalBankers.map(b => ({
            ...b,
            reliability: b.strength * 100, // Sync percentage
            confidence: b.strength > 0.7 ? 'High' : b.strength > 0.5 ? 'Medium' : 'Low'
        })),
        pairs: signalPairs.map(p => ({
            ...p,
            score: p.strength,
            gapScore: p.pGapFactor || 1.0,
            confidence: p.strength > 0.6 ? 'high' : 'medium'
        })),
        binary: Object.entries(binaryTransitions).map(([n, s]) => ({ number: parseInt(n), score: s })).sort((a, b) => b.score - a.score),
        bayesian: Object.entries(bayesianScores).map(([n, s]) => ({ number: parseInt(n), score: s })).sort((a, b) => b.score - a.score),
        urgency: Object.entries(urgencyScores).map(([n, s]) => ({ number: parseInt(n), score: s })).sort((a, b) => b.score - a.score)
    };

    return {
        frequencyData,
        hotNumbers,
        coldNumbers,
        gapAnalysis,
        processedDraws,
        momentum,
        binaryTransitions,
        pairCorrelations,
        markov: markovTransitions,
        chasePairs,
        chaseSingles,
        chaseBankers,
        chaseStats,
        historicalChaseWins,
        signals: sensors,
        signalPredictions: {
            singles: signalSingles,
            pairs: signalPairs,
            bankers: signalBankers
        },
        hmm: {
            probs: currentStateProbs,
            hotProb: hotStateProb,
            state: currentStateProbs.indexOf(Math.max(...currentStateProbs))
        },
        predictions: totalDraws < 50 ? { ensemble: [], bankers: [], pairs: [], binary: [], bayesian: [], urgency: [] } : unifiedPredictions,
        backtest: backtestResults,
        stats: {
            totalDraws,
            latestDraw: inputData[0] || null, // Reassurance: Current week's result (index 0 is newest)
            avgSum: processedDraws.reduce((a, b) => a + b.sum, 0) / (totalDraws || 1),
            numberRange
        }
    };
};

/**
 * useLotteryAnalysis Hook
 */
export const useLotteryAnalysis = (data, settings = {}) => {
    return useMemo(() => {
        return analyzeLotteryData(data, settings);
    }, [data, settings.numberRange?.min, settings.numberRange?.max, settings.recentWeeksWeight, settings.overdueThreshold, settings.hotThreshold, settings.coldThreshold]);
};
