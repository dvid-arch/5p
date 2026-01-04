import { Link } from "react-router-dom"
import DarkModeToggle from "./DarkMode"
import Logo from "./Logo"

function Header() {
  return (
    <div className="sticky z-40 bg-[#fff] top-0 left-0 right-0 flex items-center justify-between  px-8 text-slate-700 border border-slate-700/10 py-4 text-[17px]">
      <Logo />
     
      <nav className="flex md:hidden justify-around  fixed p-4 border border-t-2 border-gray-300 bottom-0 bg-white   left-0 right-0">
        <span className="  block p-4  w-fit border  shadow-lg  rounded-md bg-gray-200 font-bold">home</span>
        <span className="  block p-4  w-fit border  shadow-lg  rounded-md bg-gray-200 font-bold">home</span>
        <span className="  block p-4  w-fit border  shadow-lg  rounded-md bg-gray-200 font-bold">home</span>
        <span className="  block p-4  w-fit border  shadow-lg  rounded-md bg-gray-200 font-bold">home</span>
        
      </nav>
      <div className="flex gap-8 items-center">

     
        <span className="block h-12  w-12 bg-slate-400 rounded-full  border"></span>
      </div>
    </div>
  )
}

export default Header