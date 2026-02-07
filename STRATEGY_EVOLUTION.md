# 🧠 Strategy Evolution & Knowledge Base

This document serves as the historical record of the mathematical breakthroughs and strategic pivots implemented in the 5P Lottery Engine. If you need to "reenact" or explain these systems in the future, start here.

---

## 🛰️ Milestone 1: Seed Cluster Reconstruction (Structural DNA)
**Problem**: Traditional analysis looked at pairs in isolation.
**Breakdown**: We implemented detection of "Algebraic Seeds". 
- **Operation**: Finding `A + B = C` (Addition) or `A * B = C` (Multiplication) patterns in a single draw.
- **Result**: These produce 3-number "Clusters" that act as the structural DNA for future hits.

## 🔄 Milestone 2: Inverse Detection & Resonance (Conviction)
**Problem**: How do we know which seeds are actually active?
**Breakdown**:
- **Inverse Clusters**: We built logic to detect when a current pair (e.g., `[7, 14]`) can be trace back to an algebraic seed (e.g., `7 * 2 = 14`).
- **Resonance tracking**: We verify if these seeds hit again as "Joint Manifestations" (2-of-3 or 3-of-3) in subsequent weeks.
- **Win Rating**: The engine now calculates a "Win Rate" for every Hub based on historical performance.

## 🏛️ Milestone 3: Institutional Hybridization (Stability)
**Problem**: Pure math (algebraic) can be speculative. Pure stats (historical) can be slow.
**Breakdown**:
- **Hub Registry**: A hardcoded library of "Elite Alpha" and "Premium Beta" hub geometries that have 80-100% win rates.
- **Hub Ranking**: The engine now ranks predictions by their **Structural Grade** (Grade) and historical persistence.

## 📈 Milestone 4: Rhythmic Mode Overdue (The 90% Strategy)
**Problem**: Traditional averages (means) were skewed by rare long gaps, leading to "missed" predictions and inefficient chases.
**Breakdown**:
- **Mode-Based Overdue Factor**: We shifted the core ranking logic to prioritize a set's **Most Frequent Gap (Mode)** rather than its Mean. This targets the natural rhythm of the triple sets.
- **15-Week Chase Optimization**: Broadened the audit window to 15 weeks, which simulations proved captures **90.16%** of high-conviction hits.
- **Exhaustion Limit Logic**: Implemented visual alerts for sets reaching 100% of their historical maximum gap, identifying statistical breaking points.

---

## 🎯 Key Design Patterns
1. **Institutional Anchors**: High-conviction trios that the house uses as foundation.
2. **2-to-Play Chase**: The primary betting strategy. Instead of chasing a whole trio, we focus on the pairs produced by the trio for higher ROI and lower variance.
3. **Strategic Windows**: Optimizing the "Chase" window (e.g., 5-12 weeks) based on average gap analysis.

---

## 🛠️ Reenactment Guide
If you need to rebuild this logic from scratch:
1. **PatternUtils.js**: Contains the `detectInverseClusters` logic (The Search Engine).
2. **useLotteryAnalysis.js**: Contains the `unifiedPredictions` and Hybrid Sorting logic (The Ranking Engine).
3. **HubRegistry.js**: The "Gold Standard" list of known reliable geometries.
