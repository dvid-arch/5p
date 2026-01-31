import { useState, useMemo, useEffect } from "react";
import Grid from "../components/Grid";
import { truestdata } from "../constant/data";
import { Link } from "react-router-dom";
import { useDebounce } from "use-debounce";
import NumberVisualizer from "../components/Grids";
import { Search, X, Settings, Target, TrendingUp, ShieldCheck } from "lucide-react";

// ✅ Persistent state hook
function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
      console.warn(`Error writing localStorage key "${key}":`, err);
    }
  }, [key, state]);

  return [state, setState];
}

// Copy Button
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function LandingPage() {
  // Ensure all imported data exists and is an array
  const datasets = [
    { name: "truestdata", data: Array.isArray(truestdata) ? truestdata : [] }
  ];

  // ✅ Persistent States
  const [currentSetName, setCurrentSetName] = usePersistentState("currentSetName", "truestdata");
  const [inputValue, setInputValue] = usePersistentState("inputValue", "");
  const [colorOnly, setColorOnly] = usePersistentState("colorOnly", true);
  const [all, setAll] = usePersistentState("all", true);
  const [minMatchCount, setMinMatchCount] = usePersistentState("minMatchCount", 0);
  const [exactMatch, setExactMatch] = usePersistentState("exactMatch", false);
  const [minSum, setMinSum] = usePersistentState("minSum", "");
  const [maxSum, setMaxSum] = usePersistentState("maxSum", "");
  const [minLength, setMinLength] = usePersistentState("minLength", "");
  const [maxLength, setMaxLength] = usePersistentState("maxLength", "");
  const [sortBy, setSortBy] = usePersistentState("sortBy", "index");
  const [sortOrder, setSortOrder] = usePersistentState("sortOrder", "asc");
  const [showFilters, setShowFilters] = usePersistentState("showFilters", true);
  const [includeEmpty, setIncludeEmpty] = usePersistentState("includeEmpty", false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(20);

  const [debouncedInputValue] = useDebounce(inputValue, 300);
  const [numbToColor, setNumbToColor] = useState([]);

  const currentDataset = useMemo(() => {
    const found = datasets.find((d) => d.name === currentSetName);
    return found ? found.data : (datasets[0]?.data || []);
  }, [datasets, currentSetName]);

  // Prepare search numbers separately to avoid infinite loop
  const searchNumbers = useMemo(() => {
    return debouncedInputValue
      .split(",")
      .map(str => str.trim())
      .filter(str => str !== "")
      .map(Number)
      .filter(num => !isNaN(num) && isFinite(num));
  }, [debouncedInputValue]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [
    currentSetName,
    debouncedInputValue,
    colorOnly,
    all,
    minMatchCount,
    exactMatch,
    minSum,
    maxSum,
    minLength,
    maxLength,
    sortBy,
    sortOrder,
    includeEmpty
  ]);

  // Update numbToColor when searchNumbers change
  useMemo(() => {
    setNumbToColor(searchNumbers);
  }, [searchNumbers]);

  const data = useMemo(() => {
    if (!Array.isArray(currentDataset)) return [];

    let base = currentDataset.map((entry, i) => {
      let arr = [];
      try {
        if (Array.isArray(entry)) {
          arr = entry.filter(x => typeof x === "number" && !isNaN(x));
        } else if (entry && typeof entry === 'object' && Array.isArray(entry.value)) {
          arr = entry.value.filter(x => typeof x === "number" && !isNaN(x));
        } else if (typeof entry === 'number' && !isNaN(entry)) {
          arr = [entry];
        }
      } catch (error) {
        console.warn(`Error processing entry at index ${i}:`, error);
        arr = [];
      }
      return {
        index: i,
        value: arr,
        sum: arr.reduce((p, num) => p + num, 0),
        length: arr.length
      };
    });

    if (!includeEmpty) {
      base = base.filter(e => e.value.length > 0);
    }

    if (!colorOnly && searchNumbers.length > 0) {
      base = base.filter(entry => {
        return all
          ? searchNumbers.every(m => entry.value.includes(m))
          : searchNumbers.some(m => entry.value.includes(m));
      });
    }

    if (minMatchCount > 0 && searchNumbers.length > 0) {
      base = base.filter(entry => {
        const matchCount = searchNumbers.filter(m => entry.value.includes(m)).length;
        return matchCount >= minMatchCount;
      });
    }

    if (exactMatch && searchNumbers.length > 0) {
      base = base.filter(entry =>
        searchNumbers.length === entry.value.length &&
        searchNumbers.every(m => entry.value.includes(m))
      );
    }

    const minSumNum = minSum === "" ? null : Number(minSum);
    const maxSumNum = maxSum === "" ? null : Number(maxSum);
    const minLengthNum = minLength === "" ? null : Number(minLength);
    const maxLengthNum = maxLength === "" ? null : Number(maxLength);

    if (minSumNum !== null && !isNaN(minSumNum)) {
      base = base.filter(entry => entry.sum >= minSumNum);
    }
    if (maxSumNum !== null && !isNaN(maxSumNum)) {
      base = base.filter(entry => entry.sum <= maxSumNum);
    }
    if (minLengthNum !== null && !isNaN(minLengthNum)) {
      base = base.filter(entry => entry.length >= minLengthNum);
    }
    if (maxLengthNum !== null && !isNaN(maxLengthNum)) {
      base = base.filter(entry => entry.length <= maxLengthNum);
    }

    base.sort((a, b) => {
      let compare = 0;
      if (sortBy === "index") compare = a.index - b.index;
      else if (sortBy === "sum") compare = a.sum - b.sum;
      else if (sortBy === "length") compare = a.length - b.length;
      return sortOrder === "asc" ? compare : -compare;
    });

    return base;
  }, [
    currentDataset,
    searchNumbers,
    colorOnly,
    all,
    minMatchCount,
    exactMatch,
    minSum,
    maxSum,
    minLength,
    maxLength,
    sortBy,
    sortOrder,
    includeEmpty
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Institutional Hero Section */}
      <div className="bg-slate-900 text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none">
          <Target size={300} />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-xl">
              <ShieldCheck size={32} />
            </div>
            <span className="text-sm font-black tracking-widest uppercase text-blue-400">Institutional Grade Analysis</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight max-w-4xl">
            Managing Capital through <br />
            <span className="text-blue-500 italic">Disciplined Algorithmic Cycles</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            We move beyond the "luck" of gambling. Our platform positions lottery data as a managed asset class, leveraging long-term fund management strategies to deliver consistent ROI while actively mitigating the risks of impulsive play.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/predictions" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-center transition-all shadow-xl shadow-blue-500/20 active:scale-95">
              Access Managed Predictions
            </Link>
            <div className="flex items-center gap-3 px-6 py-4 border border-slate-700 rounded-2xl bg-slate-800/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-300">Strategy Active: 5-Week Recovery Model</span>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-800">
            <div className="flex gap-4">
              <div className="text-blue-500 font-black text-3xl">01</div>
              <div>
                <h4 className="font-bold text-slate-100 mb-1">Risk Mitigation</h4>
                <p className="text-xs text-slate-500">Automated cycle enforcement protects capital from emotional "hot-headed" betting.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-blue-500 font-black text-3xl">02</div>
              <div>
                <h4 className="font-bold text-slate-100 mb-1">Fund Oversight</h4>
                <p className="text-xs text-slate-500">Data patterns are treated as market signals, not random chance.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-blue-500 font-black text-3xl">03</div>
              <div>
                <h4 className="font-bold text-slate-100 mb-1">Long-term Focus</h4>
                <p className="text-xs text-slate-500">Profits are realized over persistence, eliminating the need for high-risk gambling.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* Top Bar - Premium Glossy Header */}
        <div className="p-4 bg-white/90 backdrop-blur-xl sticky top-0 flex flex-col sm:flex-row justify-between items-center z-30 border-b border-gray-100/50 shadow-sm">
          <div className="flex-1 w-full max-w-[500px] relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search numbers (e.g. 1, 2, 3)..."
              className="w-full rounded-2xl border-gray-100 bg-gray-50/50 border-2 p-3.5 pl-12 text-gray-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none font-medium text-sm"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={() => {
                setInputValue("");
                setMinMatchCount(0);
                setMinSum("");
                setMaxSum("");
                setMinLength("");
                setMaxLength("");
                setExactMatch(false);
                setAll(true);
                setColorOnly(true);
                setIncludeEmpty(false);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-gray-500 border border-gray-200 px-5 py-2.5 rounded-2xl hover:bg-gray-50 hover:text-gray-800 transition-all font-bold text-sm active:scale-95"
            >
              Reset
            </button>
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl transition-all shadow-lg active:scale-95 font-bold text-sm ${showFilters
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
                }`}
            >
              {showFilters ? <X size={18} /> : <Settings size={18} />}
              <span>{showFilters ? "Close Filters" : "Filters"}</span>
            </button>
          </div>
        </div>

        {/* Filter Panel - Refined & Organized */}
        {showFilters && (
          <div className="bg-white border-b border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Match Logic */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">
                  <Target size={14} />
                  Match Logic
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={colorOnly}
                        onChange={() => setColorOnly(prev => !prev)}
                        className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Color Only (Ignore Filter)</span>
                  </label>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Matches</label>
                    <input
                      type="number"
                      value={minMatchCount}
                      onChange={(e) => setMinMatchCount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      min="0"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={exactMatch}
                        onChange={() => setExactMatch(prev => !prev)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Exact Match Only</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={all}
                        onChange={() => setAll(prev => !prev)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Must Match All Search</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Range Constraints */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">
                  <TrendingUp size={14} />
                  Range Filters
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Sum</label>
                    <input
                      type="number"
                      value={minSum}
                      onChange={(e) => setMinSum(e.target.value)}
                      placeholder="Min"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Sum</label>
                    <input
                      type="number"
                      value={maxSum}
                      onChange={(e) => setMaxSum(e.target.value)}
                      placeholder="Max"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Len</label>
                    <input
                      type="number"
                      value={minLength}
                      onChange={(e) => setMinLength(e.target.value)}
                      placeholder="Min"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Len</label>
                    <input
                      type="number"
                      value={maxLength}
                      onChange={(e) => setMaxLength(e.target.value)}
                      placeholder="Max"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group pt-1">
                  <input
                    type="checkbox"
                    checked={includeEmpty}
                    onChange={() => setIncludeEmpty(prev => !prev)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">Include Empty Sets</span>
                </label>
              </div>

              {/* Sorting */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">
                  <Settings size={14} />
                  Display & Sort
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                      <option value="index">Historical Order (Index)</option>
                      <option value="sum">Sum of Numbers</option>
                      <option value="length">Sequence Length</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Direction</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                      <option value="asc">Ascending (Oldest First)</option>
                      <option value="desc">Descending (Newest First)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dataset Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">
                  <Search size={14} />
                  Active Source
                </div>
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                  <label className="block text-xs font-black text-blue-500 uppercase mb-2">Select Dataset</label>
                  <select
                    value={currentSetName}
                    onChange={(e) => setCurrentSetName(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  >
                    {datasets.map(d => (
                      <option key={d.name} value={d.name}>
                        {d.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 text-[10px] text-blue-600 leading-relaxed font-medium">
                    Switch between different historical sources or simulated environments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Grid */}
        <div className="grid bg-gray-50 text-gray-800 justify-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {data.length > 0 ? (
            data.slice(0, visibleCount).map(n => (
              <Link
                to={`/one/${currentSetName}/${n.index}/${n.value.join("-")}`}
                key={n.index}
                className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings size={16} className="text-blue-500" />
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Draw #{n.index + 1}</div>
                    <div className="flex gap-3 text-xs font-bold text-gray-700">
                      <span className="flex items-center gap-1"><TrendingUp size={12} className="text-green-500" /> {n.sum}</span>
                      <span className="flex items-center gap-1 text-gray-400">|</span>
                      <span>{n.length} Items</span>
                    </div>
                  </div>
                  <CopyButton text={n.value.join(", ")} />
                </div>

                <div className="relative z-10">
                  <Grid
                    col={7}
                    data={n.value}
                    numbToColor={numbToColor}
                    length={49}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">View Details</span>
                  <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                    <Target size={12} className="text-blue-600" />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-8">
              No data matches the current filters
            </div>
          )}
        </div>

        {/* Load More Button */}
        {data.length > visibleCount && (
          <div className="flex justify-center p-8 bg-gray-50">
            <button
              onClick={() => setVisibleCount(prev => prev + 20)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <span>Load More</span>
              <span className="text-sm font-normal opacity-80">({data.length - visibleCount} remaining)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LandingPage;
