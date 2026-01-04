import { useState, useMemo, useEffect } from "react";
import Grid from "../components/Grid";
import {
  testdata,
  bata,
  bata1,
  datamod,
  truestdata,
  simdata
} from "../constant/data";
import { Link } from "react-router-dom";
import { useDebounce } from "use-debounce";
import NumberVisualizer from "../components/Grids";

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
    { name: "testdata", data: Array.isArray(testdata) ? testdata : [] },
    { name: "bestdata", data: Array.isArray(truestdata) ? [...truestdata].reverse() : [] },
    { name: "bata", data: Array.isArray(bata) ? bata : [] },
    { name: "bata1", data: Array.isArray(bata1) ? bata1 : [] },
    { name: "datamod", data: Array.isArray(datamod) ? datamod : [] },
    { name: "simdata", data: Array.isArray(simdata) ? simdata : [] }
  ];

  // ✅ Persistent States
  const [currentSetName, setCurrentSetName] = usePersistentState("currentSetName", "datamod");
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

  const [debouncedInputValue] = useDebounce(inputValue, 300);
  const [numbToColor, setNumbToColor] = useState([]);

  const currentDataset =
    datasets.find((d) => d.name === currentSetName)?.data || [];

  // Prepare search numbers separately to avoid infinite loop
  const searchNumbers = useMemo(() => {
    return debouncedInputValue
      .split(",")
      .map(str => str.trim())
      .filter(str => str !== "")
      .map(Number)
      .filter(num => !isNaN(num) && isFinite(num));
  }, [debouncedInputValue]);

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
    <div>
      {/* Top Bar */}
      <div className="p-4 bg-black sticky top-0 flex justify-between items-center z-10">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter numbers (e.g. 1,2,3)"
          className="w-full max-w-[400px] rounded-full p-3 text-black"
        />
        <button
          onClick={() => setShowFilters(prev => !prev)}
          className="ml-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-900 text-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-700">
          {/* Match */}
          <div>
            <h3 className="font-bold mb-2">Match</h3>
            <label className="block">
              <input
                type="checkbox"
                checked={colorOnly}
                onChange={() => setColorOnly(prev => !prev)}
                className="mr-2"
              />
              Color Only
            </label>
            <label className="block mt-2">
              Min Matches
              <input
                type="number"
                value={minMatchCount}
                onChange={(e) => setMinMatchCount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full p-1 mt-1 rounded text-black"
                min="0"
              />
            </label>
            <label className="block mt-2">
              <input
                type="checkbox"
                checked={exactMatch}
                onChange={() => setExactMatch(prev => !prev)}
                className="mr-2"
              />
              Exact Match
            </label>
            <label className="block mt-2">
              <input
                type="checkbox"
                checked={all}
                onChange={() => setAll(prev => !prev)}
                className="mr-2"
              />
              Match All Numbers
            </label>
          </div>

          {/* Sum */}
          <div>
            <h3 className="font-bold mb-2">Sum</h3>
            <label className="block">
              Min Sum
              <input
                type="number"
                value={minSum}
                onChange={(e) => setMinSum(e.target.value)}
                className="w-full p-1 mt-1 rounded text-black"
              />
            </label>
            <label className="block mt-2">
              Max Sum
              <input
                type="number"
                value={maxSum}
                onChange={(e) => setMaxSum(e.target.value)}
                className="w-full p-1 mt-1 rounded text-black"
              />
            </label>
          </div>

          {/* Length */}
          <div>
            <h3 className="font-bold mb-2">Length</h3>
            <label className="block">
              Min Length
              <input
                type="number"
                value={minLength}
                onChange={(e) => setMinLength(e.target.value)}
                className="w-full p-1 mt-1 rounded text-black"
                min="0"
              />
            </label>
            <label className="block mt-2">
              Max Length
              <input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value)}
                className="w-full p-1 mt-1 rounded text-black"
                min="0"
              />
            </label>
            <label className="block mt-2">
              <input
                type="checkbox"
                checked={includeEmpty}
                onChange={() => setIncludeEmpty(prev => !prev)}
                className="mr-2"
              />
              Include Empty Arrays
            </label>
          </div>

          {/* Sorting & Dataset */}
          <div>
            <h3 className="font-bold mb-2">Sorting & Dataset</h3>
            <label className="block">
              Sort By
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-1 mt-1 rounded text-black"
              >
                <option value="index">Index</option>
                <option value="sum">Sum</option>
                <option value="length">Length</option>
              </select>
            </label>
            <label className="block mt-2">
              Order
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full p-1 mt-1 rounded text-black"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
            <label className="block mt-2">
              Dataset
              <select
                value={currentSetName}
                onChange={(e) => setCurrentSetName(e.target.value)}
                className="w-full p-1 mt-1 rounded text-black"
              >
                {datasets.map(d => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Data Grid */}
      <div className="grid bg-black text-green-50 justify-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {data.length > 0 ? (
          data.map(n => (
            <Link
              to={`/one/${n.value.join("-")}`}
              key={n.index}
              className="max-w-[500px] block hover:opacity-80 transition-opacity"
            >
              <div className="flex gap-2 mb-1 items-center flex-wrap">
                <span>No: {n.index + 1}</span>
                <span className="font-bold">Sum: {n.sum}</span>
                <span>Length: {n.length}</span>
                <CopyButton text={JSON.stringify(n.value.join())} />
              </div>
              <Grid
                col={7}
                data={n.value}
                numbToColor={numbToColor}
                length={49}
              />
              {/* <NumberVisualizer numbers={n.value} shape={'right-angled-triangle'} /> */}
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-400 py-8">
            No data matches the current filters
          </div>
        )}
      </div>
    </div>
  );
}

export default LandingPage;
