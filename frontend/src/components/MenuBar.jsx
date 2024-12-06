import React from 'react';

export function MenuBar() {
  const handleMinimize = () => {
    window.electron.invoke('minimize-window');
  };

  const handleClose = () => {
    window.electron.invoke('close-window');
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-8 bg-[#1A1D21] flex justify-end items-center px-2" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex gap-4 pr-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          className="text-[#9B9DA0] hover:text-white focus:outline-none"
        >
          <svg width="12" height="2" viewBox="0 0 12 2">
            <rect width="12" height="2" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="text-[#9B9DA0] hover:text-white focus:outline-none"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              fill="currentColor"
              d="M7.05 6l4.95-4.95L10.95 0 6 4.95 1.05 0 0 1.05 4.95 6 0 10.95 1.05 12 6 7.05 10.95 12 12 10.95z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
} 