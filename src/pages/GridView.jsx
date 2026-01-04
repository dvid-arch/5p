import React from "react";
import { GRID_SIZE } from "./PatternUtils";

function Cell({ num, selected, intensity, onClick }) {
  const base = selected ? `bg-gradient-to-br from-green-400 to-green-600` : `bg-slate-800`;
  const style = selected
    ? { boxShadow: `0 6px 18px rgba(16,185,129,${0.18 + intensity * 0.4})` }
    : {};
  return (
    <div
      onClick={() => onClick(num)}
      className={`grid-cell ${selected ? "highlight" : ""} cursor-pointer w-8 h-8 flex items-center justify-center text-xs font-semibold`}
      style={style}
    >
      <div className={base + " w-full h-full flex items-center justify-center"}>{num}</div>
    </div>
  );
}

export default function GridView({ subset, freqMap, maxFreq, onCellClick }) {
  // freqMap uses 0..49 (index), freqMap[1]..freqMap[49]
  return (
    <div className="p-2 rounded-md bg-slate-900 border border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-sm font-bold">No: {subset.id}</div>
          <div className="text-xs text-slate-300">Sum: {subset.sum} • Len: {subset.length}</div>
        </div>
        <div className="text-xs text-slate-400">
          {subset.matching ? <span>Matches: {subset.matching.join(", ")}</span> : "Unique"}
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 32px)` }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          const num = i + 1;
          const selected = subset.numbers.includes(num);
          const freq = freqMap[num] || 0;
          const intensity = maxFreq ? freq / maxFreq : 0;
          return (
            <Cell
              key={num}
              num={num}
              selected={selected}
              intensity={intensity}
              onClick={onCellClick}
            />
          );
        })}
      </div>
    </div>
  );
}
