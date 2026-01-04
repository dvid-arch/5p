import { useLocation } from "react-router-dom";
import Grid from "../components/Grid"
import { useState } from "react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    e.preventDefault(); // Important: prevent the Link click

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2s
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="bg-blue-600 text-white px-3 py-1 rounded"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function ItemOne() {
    const cols = 7;
    const data = useLocation().pathname.split('/')[2].split('-').map(n => Number(n))
    const rows = Array.from({ length: 7 }, (_, n) => n).map(n => Array.from({ length: cols * cols }, (_, i) => i + 1).slice(n * 7, 7 * (n + 1)))


    return (
        <div className="flex h-screen bg-black">
            <div className="flex-1 flex justify-end items-center ">

                <div className="w-full max-w-[450px]">

                    <Grid col={7} data={data} length={49} />
                </div>
            </div>
            <div className="flex-1 p-6">
                <div className="bg-white">
                    array: {JSON.stringify(data)} 
                    <CopyButton text={JSON.stringify(data)}  />
                </div>
                <div className="flex gap-4">

                    <div>
                        <h2>Columns</h2>
                        <div className="flex-1  flex flex-col gap-2    w-fit">
                            {Array.from({ length: cols }, (_, i) => i).slice(1).concat([0]).map((n, i) => (
                                <div key={i} className={`grid grid-cols-7 gap-1  border  min-h-[36px] w-full ${!data.filter(m => m % 7 == n).length ? 'bg-red-200' : 'bg-slate-100'}`}>
                                    {data.filter(m => m % 7 == n).map((k, j) => (
                                        <div className=" bg-white shadow-md  border text-[14px] w-8 h-8 grid justify-center items-center" key={j}>{k}</div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2>Rows</h2>
                        <div className="flex-1  flex flex-col gap-2    w-fit">
                            {rows.map((n, i) => (
                                <div key={i} className={`grid grid-cols-7 items-center p-1 gap-1  border  min-h-[36px] w-full ${!n.filter(n => data.includes(n)).length ? 'bg-red-200' : 'bg-slate-100/50'}`}>
                                    {n.filter(n => data.includes(n)).map((k, j) => (
                                        <div className=" bg-white shadow-md  border text-[14px] w-8 h-8 grid justify-center items-center" key={j}>{k}</div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ItemOne