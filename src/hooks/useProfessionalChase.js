import { useMemo } from 'react';
import { detectIsolatedClusters } from '../pages/PatternUtils';
import { getHubStats } from '../constant/HubRegistry';

/**
 * useProfessionalChase Hook
 * Implements the "Elite 50%" strategy logic:
 * - Isolated Clusters (2-to-play)
 * - Staggered 27-step Fibonacci
 * - 50% Profit Reset
 */
export const useProfessionalChase = (truestdata) => {
    return useMemo(() => {
        if (!truestdata || truestdata.length === 0) return null;

        // 1. Setup Strategy Parameters
        const odds = 11.5; // Fixed for Pairs
        const profitTrigger = 0.50; // 50% Profit Lock
        const data = [...truestdata].reverse(); // Oldest first for simulation

        // Staggered Stalled Sequence: [2, 2, 3, 5, 5, 8, 13, 13, 21, 34, 34, 55, 89, 89, 144, 233, 233, 377, 610, 610, 987, 1597, 1597, 2584, 4181, 4181, 6765]
        const generateFibo = () => {
            const f = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711];
            let s = [];
            for (let i = 0; i < f.length; i++) {
                s.push(f[i]);
                if (i % 2 === 0) s.push(f[i]);
            }
            return s.slice(0, 27);
        };
        const fibo = generateFibo();

        // 2. Simulation State
        let totalInvestment = 0;
        let totalRevenue = 0;
        let activeChases = [];
        let history = [];
        let maxDrawdown = 0;
        let currentCapital = 0;
        let wins = 0;
        let losses = 0;
        let resets = 0;

        // 3. Process History
        for (let i = 0; i < data.length; i++) {
            const drawResult = data[i].numbers || data[i];
            let drawRevenue = 0;
            let drawInvestment = 0;
            let drawHits = [];

            // Execute Bets on Active Chases
            for (let j = activeChases.length - 1; j >= 0; j--) {
                const chase = activeChases[j];
                const betAmount = fibo[chase.step];
                drawInvestment += betAmount;
                chase.totalSpent += betAmount;

                const hits = chase.pair.filter(n => drawResult.includes(n)).length;
                if (hits === 2) {
                    const payout = betAmount * odds;
                    drawRevenue += payout;
                    wins++;
                    drawHits.push({ pair: chase.pair, payout, step: chase.step });
                    activeChases.splice(j, 1);
                } else {
                    chase.step++;
                    if (chase.step >= 27) {
                        losses++;
                        activeChases.splice(j, 1);
                    }
                }
            }

            // Capital Tracking
            totalInvestment += drawInvestment;
            totalRevenue += drawRevenue;
            currentCapital += (drawRevenue - drawInvestment);
            if (currentCapital < maxDrawdown) maxDrawdown = currentCapital;

            // Global Reset Logic (Profit Lock)
            let currentTotalDebt = 0;
            activeChases.forEach(c => currentTotalDebt += c.totalSpent);

            let resetTriggered = false;
            if (drawRevenue > 0 && activeChases.length > 0) {
                if (drawRevenue >= currentTotalDebt * (1 + profitTrigger)) {
                    activeChases.forEach(c => {
                        c.step = 0;
                        c.totalSpent = 0;
                    });
                    resets++;
                    resetTriggered = true;
                }
            }

            // Record Log
            history.push({
                week: i + 1,
                draw: drawResult,
                investment: drawInvestment,
                revenue: drawRevenue,
                profit: drawRevenue - drawInvestment,
                capital: currentCapital,
                activeCount: activeChases.length,
                hits: drawHits,
                resetTriggered,
                totalDebt: currentTotalDebt
            });

            // Detect New Clusters
            const newClusters = detectIsolatedClusters(drawResult);
            newClusters.forEach(c => {
                const stats = getHubStats(c.type, c.middle);
                const pairKey = c.predictions.join(',');

                if (!activeChases.some(ac => ac.pair.join(',') === pairKey)) {
                    activeChases.push({
                        pair: c.predictions,
                        step: 0,
                        totalSpent: 0,
                        origin: c.numbers,
                        originFullDraw: drawResult,
                        originIndex: truestdata.length - 1 - i,
                        type: c.type,
                        stats: stats
                    });
                }
            });
        }

        return {
            stats: {
                roi: ((totalRevenue - totalInvestment) / totalInvestment * 100),
                netProfit: totalRevenue - totalInvestment,
                drawdown: maxDrawdown,
                wins,
                losses,
                resets,
                totalInvestment,
                totalRevenue,
                currentBankroll: currentCapital,
                winRate: (wins / (wins + losses) * 100 || 0)
            },
            fibo,
            currentChases: activeChases,
            history: history.reverse(), // Newest first for UI
            data: truestdata // Original data
        };
    }, [truestdata]);
};
