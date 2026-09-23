import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Logo and brand name */}
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            🐾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg lg:text-xl text-warmgray-900 tracking-tight leading-none">
                Paws &amp; Home SG
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 tracking-wide">
                STUDENT PROJECT
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-warmgray-600 font-medium mt-0.5 sm:mt-1">
              Singapore Stray Adoption &amp; Aftercare
            </p>
          </div>
        </div>

        {/* Center/Right Meta Pills */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E1DA] text-xs text-warmgray-700 shadow-xs">
            <span className="text-terracotta-500 text-sm">📍</span>
            <span>Pasir Ris Farmway 1, Singapore</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>SMU MGMT 6110</span>
          </div>
        </div>
      </div>
    </header>
  );
};
