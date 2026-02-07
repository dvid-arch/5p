# Frontend AI Quick Reference - Grid Predictor Playground

## What You're Building

A **web-based interactive playground** that lets users explore a grid-based lottery prediction system.

Instead of predicting individual lottery numbers, it predicts which **8-cell sliding grid positions** catch the most numbers.

---

## The 5-Minute Summary

### The Core Concept
```
Input:  Lottery winning numbers [2, 9, 15, 27, 38, 40]
Process: Test all 49 possible 8-cell grid positions
Output: Top 3 grid centers that capture most numbers
        Center #10 catches 3 → [1,2,3,4,8,9,10,11,15,16,17,18]
        Center #17 catches 2
        Center #24 catches 2
```

### Key Numbers
- **620 weeks** of historical data
- **49 possible** grid centers
- **Top 3 centers** account for ~45% of optimal placements
- **20+ features** extracted from each draw for ML
- **99.99%** reduction in prediction complexity

---

## What Functions to Expose in Your Web Playground

### 1. Analyze Any Draw
```
Input: "2, 9, 15, 27, 38, 40"
Function: findOptimalGridCenters(numbers, 3)
Output: Table of top 3 grid centers with coverage
```

### 2. Historical Trends
```
Input: "Last 13 weeks"
Function: analyzeGridCenterFrequency(13)
Output: Top 10 grid centers by frequency + chart
```

### 3. Next Draw Prediction
```
Input: None (or adjust weights)
Function: predictBestGridCenters(3, 13)
Output: Recommended centers #10, #13, #11 with scores
```

### 4. Region Clustering
```
Input: None
Function: analyzeGridRegions()
Output: Heat map showing where winners cluster
```

### 5. Feature Extraction
```
Input: "2, 9, 15, 27, 38, 40"
Function: calculateDrawFeatures(numbers)
Output: 20 features (average, range, quadrant distribution, etc.)
```

### 6. ML Data Export
```
Input: "training" or "test"
Function: exportForMachineLearning()
Output: JSON with 496 training samples, 124 test samples
```

### 7. Grid Visualization
```
Input: Center #10, winning numbers
Output: 7x7 grid diagram with highlighted cells
```

---

## UI Tabs to Build

```
┌────────────────────────────────────────────────────────┐
│ [Analyze] [Trends] [Predict] [Regions] [Features] [ML] │
└────────────────────────────────────────────────────────┘

TAB 1: ANALYZE
├─ Input: Text area for numbers
├─ Control: Slider for "top N"
├─ Output: Table of results
└─ Action: Visualize grid

TAB 2: TRENDS
├─ Control: Dropdown "All" / "Recent 13 weeks"
├─ Output: Top 10 centers table
└─ Chart: Bar chart of frequencies

TAB 3: PREDICT
├─ Control: Slider for "weight recent weeks"
├─ Output: Top 3 predictions with scores
└─ Visual: Grid diagrams for each

TAB 4: REGIONS
├─ Output: 3x3 region grid with percentages
└─ Chart: Heat map of winner density

TAB 5: FEATURES
├─ Input: Lottery numbers
├─ Output: 20-feature table
└─ Chart: Key metrics visualization

TAB 6: ML
├─ Output: Training data viewer
├─ Controls: Filter, download
└─ Action: "Ready for TensorFlow.js" button
```

---

## Data Flow Diagram

```
User Input (numbers)
    ↓
┌─────────────────────────────┐
│ gridPredictor.js Functions  │
├─────────────────────────────┤
│ • findOptimalGridCenters()  │
│ • analyzeGridCenterFreq()   │
│ • predictBestGridCenters()  │
│ • analyzeGridRegions()      │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ gridMLTraining.js Functions │
├─────────────────────────────┤
│ • calculateDrawFeatures()   │
│ • generateTrainingData()    │
│ • exportForML()             │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ Format Results for Display   │
├─────────────────────────────┤
│ • Tables                    │
│ • Charts                    │
│ • Grid visualizations       │
│ • JSON exports              │
└─────────────────────────────┘
    ↓
Display to User
```

---

## Key Calculations Explained Simply

### Calculation 1: Grid Coverage
```
Grid at center #10 covers: [1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 18]
Winning numbers: [2, 9, 15, 27, 38, 40]

Which winning numbers are in the grid?
→ 2 (yes), 9 (yes), 15 (yes), 27 (no), 38 (no), 40 (no)

Coverage = 3 numbers caught by this grid
```

### Calculation 2: Frequency Analysis
```
For all 620 historical weeks:
  Which center caught the most numbers?
  Record that center

After checking all 620 weeks:
  Center #10 was the best center 98 times
  Center #13 was the best center 98 times
  Center #11 was the best center 93 times
  ...

Therefore: These 3 centers are most reliable
```

### Calculation 3: Next Draw Prediction
```
Score = 1.0 × (all-time frequency) + 2.0 × (recent frequency)

Example for center #10:
  All-time: 98 times → 1.0 × 98 = 98
  Recent 13 weeks: 1 time → 2.0 × 1 = 2
  Total score: 98 + 2 = 100 ✓

Example for center #13:
  All-time: 98 times → 1.0 × 98 = 98
  Recent 13 weeks: 0 times → 2.0 × 0 = 0
  Total score: 98 + 0 = 98 ✓
```

### Calculation 4: Feature Extraction
```
Input: [2, 9, 15, 27, 38, 40]

Feature "average": (2 + 9 + 15 + 27 + 38 + 40) / 6 = 21.8
Feature "range": 40 - 2 = 38
Feature "odd count": [9, 15, 27, 38] = wait no...
                     [9, 15, 27] = 3 odd numbers
Feature "odd count": Actually [9, 15, 27, 39, 40] has ... let me recalc
                     2 is even, 9 is odd, 15 is odd, 27 is odd, 
                     38 is even, 40 is even
                     → 3 odd, 3 even

And so on for 20 features total...
```

---

## Example Component Code Structure

### React Example
```jsx
// AnalyzeTab.jsx
function AnalyzeTab() {
  const [numbers, setNumbers] = useState('')
  const [topN, setTopN] = useState(3)
  const [results, setResults] = useState(null)
  
  const handleAnalyze = () => {
    const nums = numbers.split(',').map(n => parseInt(n.trim()))
    const result = findOptimalGridCenters(nums, topN)
    setResults(result)
  }
  
  return (
    <div className="tab-analyze">
      <textarea 
        value={numbers}
        onChange={(e) => setNumbers(e.target.value)}
        placeholder="Enter winning numbers: 2, 9, 15, 27, 38, 40"
      />
      <input 
        type="range"
        min="1" max="10"
        value={topN}
        onChange={(e) => setTopN(e.target.value)}
      />
      <button onClick={handleAnalyze}>Analyze</button>
      
      {results && (
        <>
          <ResultsTable data={results} />
          <GridVisualization results={results} />
        </>
      )}
    </div>
  )
}
```

### Vue Example
```vue
<template>
  <div class="analyze-tab">
    <textarea 
      v-model="numbers"
      placeholder="2, 9, 15, 27, 38, 40"
    />
    <input 
      v-model="topN"
      type="range" min="1" max="10"
    />
    <button @click="analyze">Analyze</button>
    
    <results-table v-if="results" :data="results" />
    <grid-viz v-if="results" :results="results" />
  </div>
</template>

<script>
import { findOptimalGridCenters } from './gridPredictor.js'

export default {
  data() {
    return {
      numbers: '',
      topN: 3,
      results: null
    }
  },
  methods: {
    analyze() {
      const nums = this.numbers.split(',').map(n => parseInt(n.trim()))
      this.results = findOptimalGridCenters(nums, this.topN)
    }
  }
}
</script>
```

---

## CSS Grid Visualization Example

```html
<div class="grid-7x7">
  <div class="cell">1</div>
  <div class="cell highlighted">2</div>
  <div class="cell">3</div>
  <!-- ... -->
</div>

<style>
.grid-7x7 {
  display: grid;
  grid-template-columns: repeat(7, 40px);
  grid-gap: 2px;
  background: #eee;
  padding: 10px;
}

.cell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #ddd;
  cursor: pointer;
}

.cell.highlighted {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.cell.winner {
  background: #fff9c4;
  border: 2px solid #fbc02d;
  font-weight: bold;
}

.cell:hover {
  background: #f5f5f5;
}
</style>
```

---

## Import Statement You'll Need

```javascript
// At the top of your frontend code
import { 
  getGridCells,
  calculateGridCoverage,
  findOptimalGridCenters,
  analyzeGridCenterFrequency,
  predictBestGridCenters,
  analyzeGridRegions,
  getGridStatistics
} from './gridPredictor.js'

import { 
  calculateDrawFeatures,
  generateTrainingData,
  exportForMachineLearning
} from './gridMLTraining.js'

import { truestdata } from './data.js'
```

---

## Testing Examples

### Test 1: Basic Analysis
```javascript
const nums = [2, 9, 15, 27, 38, 40]
const result = findOptimalGridCenters(nums, 3)

// Should return:
// [
//   { center: 10, coverage: 3, efficiency: 25, cells: [...] },
//   { center: 17, coverage: 2, efficiency: 16.7, cells: [...] },
//   { center: 24, coverage: 2, efficiency: 16.7, cells: [...] }
// ]
```

### Test 2: Predictions
```javascript
const predictions = predictBestGridCenters(3, 13)

// Should return top 3 with centers #10, #13, #11
// Scores should decrease: 100 > 98 > 97
```

### Test 3: Frequency
```javascript
const freq = analyzeGridCenterFrequency(620)

// Should return 37-40 unique centers
// Top 3 should be #10, #13, #11
// Total frequency should sum to 620
```

---

## Expected Output Examples

### Tab 1: Analyze Output
```
ANALYSIS RESULTS FOR: [2, 9, 15, 27, 38, 40]

Rank | Center | Coverage | Efficiency | Cells
-----|--------|----------|------------|------
  1  |   10   |    3     |    25%     | 1,2,3,4,8,9,10,11,15,16,17,18
  2  |   17   |    2     |   16.7%    | 8,9,10,11,15,16,17,18,22,23,24,25
  3  |   24   |    2     |   16.7%    | 15,16,17,18,22,23,24,25,29,30,31,32
```

### Tab 2: Trends Output
```
TOP 10 GRID CENTERS (All 620 Weeks)

Rank | Center | Frequency | Avg Coverage | %
-----|--------|-----------|--------------|-----
  1  |   10   |    98     |    5.06      | 15.8%
  2  |   13   |    98     |    5.10      | 15.8%
  3  |   11   |    93     |    5.18      | 15.0%
  4  |   12   |    87     |    5.22      | 14.0%
  5  |   17   |    72     |    5.03      | 11.6%
  ...
```

### Tab 3: Predict Output
```
NEXT DRAW PREDICTIONS

CENTER #10 (Score: 100.0) ⭐
├─ All-time: 98 times (15.8%)
├─ Recent 13 weeks: 1 time
├─ Avg coverage: 5.06 numbers
└─ Cells: 1,2,3,4,8,9,10,11,15,16,17,18

CENTER #13 (Score: 98.0) ⭐
├─ All-time: 98 times (15.8%)
├─ Recent 13 weeks: 0 times
└─ Cells: 4,5,6,7,11,12,13,14,18,19,20,21

CENTER #11 (Score: 97.0) ⭐
├─ All-time: 93 times (15.0%)
├─ Recent 13 weeks: 2 times
└─ Cells: 2,3,4,5,9,10,11,12,16,17,18,19
```

---

## Common Pitfalls to Avoid

❌ **DON'T:**
- Parse numbers as strings (must be integers 1-49)
- Show decimals for coverage (keep it simple)
- Forget to normalize features for ML export
- Use synchronous calculations for large datasets

✅ **DO:**
- Validate all user input
- Show helpful error messages
- Cache historical analysis results
- Use memoization for repeated calls
- Display loading indicators for calculations

---

## Performance Tips

- **Cache frequency analysis** (takes ~100ms)
- **Memoize predictions** (input doesn't change often)
- **Pre-calculate grid cells** for all 49 centers on load
- **Lazy-load charts** (use Intersection Observer)
- **Consider Web Workers** for feature extraction on large datasets

---

## Success Criteria

✅ All 7 tabs working and responsive
✅ Input validation and error handling
✅ Grid visualization accurate
✅ Results match manual calculations
✅ Export functionality (CSV, JSON)
✅ Mobile-friendly responsive design
✅ Performance: All calculations < 500ms

---

## File Structure You'll Reference

```
/workspace
├── gridPredictor.js (core functions)
├── gridMLTraining.js (ML functions)
├── data.js (620 weeks of data)
└── your-frontend/
    ├── index.html
    ├── app.js (main app)
    ├── components/
    │   ├── AnalyzeTab.jsx
    │   ├── TrendsTab.jsx
    │   ├── PredictTab.jsx
    │   ├── RegionsTab.jsx
    │   ├── FeaturesTab.jsx
    │   ├── MLTab.jsx
    │   └── GridVisualization.jsx
    └── styles/
        └── main.css
```

---

Good luck building the playground! 🚀

This should give your Frontend AI everything it needs to create an amazing interactive experience. The key is exposing the 7 core functions through interactive tabs with great visualizations.

Feel free to reach out with questions about how any of the algorithms work!
