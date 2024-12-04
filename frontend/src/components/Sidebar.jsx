import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="bg-[#ffffff] border-x-2 h-screen w-[35rem] justify-between flex flex-col p-8">
      <div className="">
        <h1 className="text-[3.5rem] font-extrabold">TestDRM</h1>

        <div className="flex mt-16 flex-col gap-5">
          <NavLink
            to="/uploadVideo"
            className={({ isActive }) =>
              isActive
                ? 'text-[1.5rem] text-white font-medium flex items-center justify-between px-8 rounded-full bg-[#86a037] h-20 w-full'
                : 'text-[1.5rem] font-medium flex items-center justify-between px-8 rounded-full hover:bg-[#f0f0f0] h-20 w-full'
            }
          >
            <button>Upload</button>
          </NavLink>
          <NavLink
            to="/VideoList"
            className={({ isActive }) =>
              isActive
                ? 'text-[1.5rem] text-white font-medium flex items-center justify-between px-8 rounded-full bg-[#86a037] h-20 w-full'
                : 'text-[1.5rem] font-medium flex items-center justify-between px-8 rounded-full hover:bg-[#f0f0f0] h-20 w-full'
            }
          >
            <button>VideoList</button>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

