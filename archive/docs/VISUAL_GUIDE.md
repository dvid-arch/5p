# Grid Predictor - Visual Guide & Architecture

## Page Architecture

```
GridPredictor.jsx (Main Page)
│
├─ Tab Navigation (6 tabs)
│
└─ Content Area (changes per tab)
    ├─ GridAnalyzeTab
    ├─ GridTrendsTab
    ├─ GridPredictTab
    ├─ GridRegionsTab
    ├─ GridFeaturesTab
    └─ GridMLTab
```

---

## Tab UI Layout Examples

### Analyze Tab
```
┌─────────────────────────────────────────────┐
│ Input Section (blue gradient)              │
│ ├─ Textarea: Enter numbers                 │
│ ├─ Slider: Top N (1-10)                    │
│ └─ Button: Analyze                         │
├─────────────────────────────────────────────┤
│ Results Table                              │
│ ├─ Rank | Center | Coverage | Efficiency  │
│ ├─ 1    | #10    | 3/6      | 25.0%      │
│ ├─ 2    | #17    | 2/6      | 16.7%      │
│ └─ 3    | #24    | 2/6      | 16.7%      │
├─────────────────────────────────────────────┤
│ Grid Visualization (when center selected) │
│ ┌─────────────────────────────────────────┐ │
│ │ 1  2  3  4  5  6  7                     │ │
│ │ 8  9 10 11 12 13 14  ← Color coded     │ │
│ │...                                     │ │
│ └─────────────────────────────────────────┘ │
│ Green = winner in grid, Yellow = outside   │
└─────────────────────────────────────────────┘
```

### Trends Tab
```
┌─────────────────────────────────────────────┐
│ Filter Section (amber gradient)            │
│ ├─ [All 620 Weeks] [Recent 13] [26] [52]  │
└─────────────────────────────────────────────┤
│ Stats Cards                                 │
│ ├─ [Unique Centers] [Top Frequency]        │
│ ├─ [Top 3 Combined] [Top 3 %]              │
│ └─ (4 metric cards)                        │
├─────────────────────────────────────────────┤
│ Bar Chart (Top 10 Centers)                 │
│ ├─ X-axis: Center numbers                  │
│ └─ Y-axis: Frequency count                 │
├─────────────────────────────────────────────┤
│ Frequency Table                            │
│ ├─ Rank | Center | Frequency | Percentage │
│ └─ (scrollable)                            │
└─────────────────────────────────────────────┘
```

### Predict Tab
```
┌─────────────────────────────────────────────┐
│ Config Section (purple gradient)           │
│ ├─ Slider: Weight recent weeks (1-52)     │
│ └─ Info: Scoring formula explanation      │
├─────────────────────────────────────────────┤
│ Prediction Cards (3 columns)               │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ #10 ⭐   │ │ #13 ✨   │ │ #11 ✓    │   │
│ │ Score: 100.0          Score: 98.0   │   │
│ │ All-time: 98x        98x            │   │
│ │ Recent: 1x           0x             │   │
│ │ Avg Cov: 5.06        5.10           │   │
│ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────┤
│ Grid Visualization (selected center)      │
│ Grid Visualization Component              │
├─────────────────────────────────────────────┤
│ Scoring Explanation Box (yellow)          │
└─────────────────────────────────────────────┘
```

### Regions Tab
```
┌─────────────────────────────────────────────┐
│ Header (cyan gradient)                     │
│ "3x3 Region Clustering Analysis"          │
├─────────────────────────────────────────────┤
│ 3x3 Region Heatmap                        │
│ ┌───┬───┬───┐                             │
│ │98 │135│ 87│  (frequency in each)       │
│ │15.8%│...│...│                          │
│ ├───┼───┼───┤                             │
│ │...                                      │
│ └───┴───┴───┘                             │
│ Color intensity: Red (hot) → Gray (cold) │
├─────────────────────────────────────────────┤
│ Legend with color codes                   │
├─────────────────────────────────────────────┤
│ Statistics Cards (3 metrics)              │
├─────────────────────────────────────────────┤
│ Region Details Table                      │
│ Region | Frequency | % | Intensity Bar   │
└─────────────────────────────────────────────┘
```

### Features Tab
```
┌─────────────────────────────────────────────┐
│ Input Section (emerald gradient)          │
│ ├─ Textarea: Enter numbers                │
│ └─ Button: Extract Features               │
├─────────────────────────────────────────────┤
│ Feature Chart (if data)                   │
│ Bar chart showing top 10 features         │
├─────────────────────────────────────────────┤
│ Complete Features Table                   │
│ Feature | Value | Description             │
│ count   | 6     | Total count             │
│ sum     | 131   | Sum of all              │
│ ...                                       │
├─────────────────────────────────────────────┤
│ Summary Cards                              │
│ [Total] [Sum] [Average] [Range]           │
└─────────────────────────────────────────────┘
```

### ML Tab
```
┌─────────────────────────────────────────────┐
│ Header (indigo gradient)                  │
│ "Machine Learning Data Export"            │
├─────────────────────────────────────────────┤
│ Statistics Cards (4)                      │
│ [Training: 496] [Test: 124] [Features: 20] │
│ [Split: 80/20]                            │
├─────────────────────────────────────────────┤
│ Download Section                          │
│ [Download JSON] [Download CSV]            │
├─────────────────────────────────────────────┤
│ View Controls                              │
│ [Summary] [Training] [Test] [Show: 10 rows]
│                                            │
│ Data depending on selected view:           │
│ - Summary: Overview & instructions        │
│ - Training: Table of 496 samples         │
│ - Test: Table of 124 samples             │
├─────────────────────────────────────────────┤
│ Info Box (yellow)                         │
│ "Ready for ML: This dataset is normalized" │
└─────────────────────────────────────────────┘
```

---

## Grid Visualization Component

```
┌─────────────────────────────────────────────┐
│ 7x7 Grid Display                           │
│ ┌─────────────────────────────────────────┐ │
│ │  1   2   3   4   5   6   7             │ │
│ │                                        │ │
│ │  8  [9] [10] [11] 12 [13] 14         │ │
│ │     ← Blue = in grid                  │ │
│ │ 15 [16] [17] [18] 19 [20] 21         │ │
│ │     ← Green = winner in grid          │ │
│ │ ... ... ... ... ... ... ...          │ │
│ │                                        │ │
│ │ Legend:                                │ │
│ │ ■ Green = Winner in grid              │ │
│ │ ■ Yellow = Winner outside             │ │
│ │ ■ Blue = Grid cell (not winner)      │ │
│ │ ■ White = Outside grid                │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Coverage Stats                             │
│ In Grid: 3 | Outside: 3 | Coverage: 50%   │
├─────────────────────────────────────────────┤
│ Grid Info                                  │
│ Center: #10                                │
│ Cells: 2, 3, 4, 9, 10, 11, 16, 17, 18... │
│ Total Cells: 12                            │
└─────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Interaction
    ↓
Input Validation
    ├─ Check if numbers 1-49
    ├─ Check if empty
    └─ Show error if invalid
    ↓
Grid Calculation
    ├─ Load historical data (truestdata)
    ├─ Calculate coverage for each center
    └─ Generate results
    ↓
Visualization
    ├─ Render table with results
    ├─ Highlight winning numbers
    └─ Color-code grid cells
    ↓
User Sees Results
    ├─ Table of top centers
    ├─ Interactive grid
    └─ Coverage statistics
```

---

## Color Scheme

```
Tab Navigation:
  Active Tab: bg-blue-50, text-blue-600, border-blue-600
  Inactive Tab: text-gray-600, hover:text-gray-900

Section Headers (Gradients):
  Analyze: from-blue-50 to-indigo-50 (blue theme)
  Trends: from-amber-50 to-orange-50 (amber theme)
  Predict: from-purple-50 to-pink-50 (purple theme)
  Regions: from-cyan-50 to-blue-50 (cyan theme)
  Features: from-emerald-50 to-green-50 (green theme)
  ML: from-indigo-50 to-purple-50 (indigo theme)

Grid Visualization:
  Winner in Grid: bg-green-400, border-green-600
  Winner Outside: bg-yellow-300, border-yellow-500
  Grid Cell: bg-blue-100, border-blue-400
  Outside: bg-white, border-gray-300

Heatmap (Regions):
  Hot (>80%): bg-red-500
  Warm (60-80%): bg-orange-500
  Medium (40-60%): bg-yellow-500
  Cool (20-40%): bg-blue-200
  Cold (<20%): bg-gray-100

Status Cards:
  Blue: bg-blue-50, text-blue-600
  Green: bg-green-50, text-green-600
  Purple: bg-purple-50, text-purple-600
  Orange: bg-orange-50, text-orange-600
```

---

## Responsive Breakpoints

```
Mobile (< 768px):
  ├─ Stack cards vertically
  ├─ Full-width inputs/buttons
  ├─ Horizontal grid scrolls
  └─ Single column tables

Tablet (768px - 1024px):
  ├─ 2-column layouts
  ├─ Side-by-side cards
  └─ Wider tables with scroll

Desktop (> 1024px):
  ├─ 3-4 column layouts
  ├─ Full-width displays
  └─ Multi-series charts
```

---

## Typography

```
Page Title: text-4xl font-bold text-gray-900
Section Title: text-xl font-semibold text-gray-900
Card Title: text-lg font-semibold text-gray-900
Label: text-sm font-medium text-gray-700
Body: text-sm text-gray-600
Metric: text-2xl font-bold (various colors)
Code/Tech: font-mono (if any)
```

---

## Interaction Patterns

```
Button Hover:
  bg-color → slightly darker
  transition-colors (smooth)

Card Hover:
  bg-color → slightly lighter
  transform: scale(1.05) optional
  cursor-pointer

Table Row Hover:
  bg-white → bg-gray-50
  cursor-pointer (if clickable)

Slider:
  Thumb color: matches section theme
  Track: bg-gray-200
  Range: 0-100% filled

Input Focus:
  border → focus:ring-2 focus:ring-{color}-500
  transition smooth
```

---

This visual structure provides:
✅ Clear information hierarchy
✅ Consistent design patterns
✅ Intuitive navigation
✅ Responsive across devices
✅ Professional appearance
