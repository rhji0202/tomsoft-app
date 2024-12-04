import React, { useState } from 'react';

function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    language: 'ko',
    autoUpdate: true
  });

  const handleChange = (name) => (event) => {
    setSettings({
      ...settings,
      [name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    });
  };

  return (
    <div className="flex h-full">
      {/* 서브 사이드바 */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">설정</h2>
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              activeTab === 'general' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            일반 설정
          </button>
          <button
            onClick={() => setActiveTab('notification')}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              activeTab === 'notification'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            알림 설정
          </button>
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-8">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">일반 설정</h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={handleChange('darkMode')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>다크 모드</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.autoUpdate}
                    onChange={handleChange('autoUpdate')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>자동 업데이트</span>
                </label>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">언어 설정</label>
                  <select
                    value={settings.language}
                    onChange={handleChange('language')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="jp">日本語</option>
                  </select>
                </div>
              </div>
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              설정 저장
            </button>
          </div>
        )}

        {activeTab === 'notification' && (
          <div>
            <h3 className="text-lg font-medium mb-4">알림 설정</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={handleChange('notifications')}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>알림 사용</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;