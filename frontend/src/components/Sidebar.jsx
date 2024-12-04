import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Settings as SettingsIcon, Server as ServerIcon } from 'lucide-react';

function Sidebar() {
  const location = useLocation();
  const [serverStatus, setServerStatus] = useState('확인 중...');
  
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:58000/');
        if (response.ok) {
          setServerStatus('온라인');
        } else {
          setServerStatus('오프라인');
        }
      } catch (error) {
        setServerStatus('오프라인');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 3000); // 1초마다 상태 체크

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-64 bg-white h-screen p-4 flex flex-col sticky top-0 shadow-lg">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-800 font-semibold">THE ONE MIND</h1>
        <p className="text-gray-500 text-sm">Software Studio</p>
      </div>
      <nav className="space-y-2 flex-1">
        <Link 
          to="/"
          className={`flex items-center gap-2 p-2 rounded-lg ${
            isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <HomeIcon size={20} />
          <span>홈</span>
        </Link>
        
        <Link 
          to="/settings"
          className={`flex items-center gap-2 p-2 rounded-lg ${
            isActive('/settings') ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <SettingsIcon size={20} />
          <span>설정</span>
        </Link>
      </nav>
      
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center gap-2 text-gray-600 p-2">
          <ServerIcon size={20} />
          <span>서버 상태:</span>
          <span className={`${
            serverStatus === '온라인' ? 'text-green-600' : 
            serverStatus === '오프라인' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {serverStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;