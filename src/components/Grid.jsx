
function Grid({ col, data, numbToColor = [], length }) {
    const arr = Array.from({ length }, (_, i) => i + 1)
   
    return (
        <div className={`grid gap-[2px] bg-green-950 rounded-sm text-black p-2`} style={{ gridTemplateColumns: `repeat(${col}, 1fr)` }}>
            {arr.map((n, i) => (
                <div key={i} className={`aspect-square text-green-200  rounded-sm text-[14px] p-1 border grid items-center border-green-800 justify-center ${!numbToColor.includes(n) && data.includes(n) ? ' bg-green-800 text-green-100' : (numbToColor.includes(n) && data.includes(n)) ? 'bg-yellow-600 text-green-50' : numbToColor.includes(n)?'bg-purple-300': ''}`}>
                    {n}
                </div>
            ))}
        </div>
    )
}

export default Grid