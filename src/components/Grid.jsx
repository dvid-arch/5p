
function Grid({ col, data, numbToColor = [], length, ringedNums = [] }) {
    const arr = Array.from({ length }, (_, i) => i + 1)

    return (
        <div className={`grid gap-[2px] bg-green-950 rounded-sm text-black p-2`} style={{ gridTemplateColumns: `repeat(${col}, 1fr)` }}>
            {arr.map((n, i) => {
                const ring = ringedNums.find(r => r.n === n);
                const ringColor = ring ? (ring.color || 'cyan-400') : null;

                return (
                    <div key={i} className={`aspect-square rounded-sm text-[12px] font-bold p-1 border grid items-center justify-center transition-all duration-300 ${!numbToColor.includes(n) && data.includes(n)
                        ? 'bg-green-700 text-white shadow-inner' // Draw Only
                        : (numbToColor.includes(n) && data.includes(n))
                            ? 'bg-yellow-500 text-yellow-950 border-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.4)] z-10 scale-105' // Hit
                            : numbToColor.includes(n)
                                ? 'bg-purple-400/40 text-purple-100 border-purple-400/30' // Prediction Only
                                : 'text-green-200/30 border-green-800/50' // Empty
                        } ${ring ? `ring-2 ring-${ringColor} ring-offset-1 ring-offset-green-950 z-20` : ''}`}>
                        {n}
                    </div>
                );
            })}
        </div>
    )
}

export default Grid