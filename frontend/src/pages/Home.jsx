import React, { useState } from 'react';

function Home() {
  const [imageUrl, setImageUrl] = useState('https://ae01.alicdn.com/kf/Sf8041f9212334343a154631980023bfey/-.jpg');
  const [resultImage, setResultImage] = useState(null);

  const removeImageBackground = async () => {
    if (!imageUrl) {
      alert('이미지 URL을 입력해주세요');
      return;
    }

    try {
      const response = await fetch(`http://localhost:58000/remove-bg/?imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success === 200) {
          setResultImage(data.image);
        } else {
          alert('이미지 배경 제거에 실패했습니다');
        }
      } else {
        alert('이미지 배경 제거에 실패했습니다');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('오류가 발생했습니다');
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">이미지 배경 제거</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://ae01.alicdn.com/kf/Sf8041f9212334343a154631980023bfey/-.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <button 
            className={`px-4 py-2 rounded-md text-white ${!imageUrl ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={removeImageBackground}
            disabled={!imageUrl}
          >
            배경 제거하기
          </button>
          <div className="mt-4 grid grid-cols-2 gap-4 justify-between">
            {imageUrl && (
              <div className="flex-1">
                <p className="text-lg font-medium mb-2">원본 이미지</p>
                <img src={imageUrl} alt="원본 이미지" className="max-w-full h-auto" />
              </div>
            )}
            {resultImage && (
              <div className="flex-1">
                <p className="text-lg font-medium mb-2">결과 이미지</p>
                <img src={resultImage} alt="결과 이미지" className="max-w-full h-auto" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;