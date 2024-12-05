import React, { useState, useEffect } from 'react';
import { Minus, X } from 'lucide-react';

function App() {
  const [serverStatus, setServerStatus] = useState('checking');
  const [processStatus, setProcessStatus] = useState('idle'); // 'idle', 'processing', 'completed', 'error'

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:58000/status');
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 3000);

    // SSE 연결 설정
    const eventSource = new EventSource('http://localhost:58000/status-events');
    
    eventSource.onmessage = (event) => {
      const { status } = JSON.parse(event.data);
      setProcessStatus(status);
      
      if (status === 'completed' || status === 'error') {
        // 3초 후 상태 초기화
        setTimeout(() => setProcessStatus('idle'), 3000);
      }
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const handleMinimize = () => {
    window.electron.minimize();
  };

  const handleClose = () => {
    window.electron.close();
  };

  const getStatusText = () => {
    if (serverStatus === 'offline') return '서버 오프라인';
    switch (processStatus) {
      case 'processing':
        return '처리중...';
      case 'completed':
        return '처리완료';
      case 'error':
        return '처리실패';
      default:
        return '대기중';
    }
  };

  const getStatusColor = () => {
    if (serverStatus === 'offline') return 'bg-red-600';
    switch (processStatus) {
      case 'processing':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-green-600';
    }
  };

  return (
    <div className="border-t border-gray-200 overflow-hidden h-[40px]" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2 text-gray-600 p-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm font-semibold">{getStatusText()}</span>
        </div>
        <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' }}>
          <button 
            onClick={handleMinimize}
            className="px-4 h-full hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Minus size={18} />
          </button>
          <button 
            onClick={handleClose}
            className="px-4 h-full hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
