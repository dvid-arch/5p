
function Logo({withoutText}) {
  return (
    <div className=" font-bold text-2xl uppercase text-green-950">


        <div className="flex flex-col gap-1 relative w-fit h-fit overflow-hidden">
          <span className="block w-10 h-2 border ml-6 bg-green-800"></span>
          <span className="block w-10 h-2 border ml-3 bg-green-400"></span>
          <span className="block w-10 h-2 border bg-green-300"></span>

          <div className="absolute w-2 h-10 border -z-10 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] border-green-950 ">

          </div>

        </div>
        {!withoutText && "Earn"}
      </div>
  )
}

export default Logo