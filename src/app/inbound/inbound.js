"use client"; // Next.js 클라이언트 컴포넌트

import { useState } from "react";

export default function InboundPage() {
  // 현재 선택된 층 (1층 기본)
  const [selectedFloor, setSelectedFloor] = useState(1);

  // 층별 데이터 상태 (각 층의 A열 & B열 데이터)
  const [floorData, setFloorData] = useState({
    1: {
      A: [{ name: "사탕", quantity: 10 }, { name: "과자", quantity: 6 }],
      B: [{ name: "음료", quantity: 5 }, { name: "빵", quantity: 8 }]
    },
    2: {
      A: [{ name: "라면", quantity: 7 }, { name: "쌀", quantity: 3 }],
      B: [{ name: "커피", quantity: 2 }, { name: "초콜릿", quantity: 9 }]
    }
  });

  // 수정 가능 여부 상태 (기본적으로 수정 불가능)
  const [isEditable, setIsEditable] = useState(false);

  // 비상정지 버튼 상태 (초기: 회색)
  const [isEmergency, setIsEmergency] = useState(false);

  return (
    <div className="ml-[180px] p-6">
      {/* 수정 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          className="border px-4 py-2 rounded"
          onClick={() => setIsEditable(!isEditable)}
        >
          {isEditable ? "완료" : "수정"}
        </button>
      </div>

      {/* 1층 / 2층 선택 버튼 */}
      <div className="flex space-x-4 mb-4">
        <button
          className={`p-4 border rounded ${selectedFloor === 1 ? "bg-blue-500 text-white" : "bg-white"}`}
          onClick={() => setSelectedFloor(1)}
        >
          1층
        </button>
        <button
          className={`p-4 border rounded ${selectedFloor === 2 ? "bg-blue-500 text-white" : "bg-white"}`}
          onClick={() => setSelectedFloor(2)}
        >
          2층
        </button>
      </div>

      {/* A열 & B열 표시 */}
      <div className="grid grid-cols-3 gap-4">
        {/* A열 */}
        <div className="border p-4">
          <h2 className="font-bold">A열</h2>
          {floorData[selectedFloor].A.map((item, index) => (
            <div key={index} className="border p-4 mt-2">
              <input
                type="text"
                defaultValue={item.name}
                disabled={!isEditable}
                className={`border p-2 rounded w-full text-black ${
                  !isEditable ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
              <input
                type="text"
                defaultValue={item.quantity}
                disabled={!isEditable}
                className={`border p-2 rounded w-full mt-2 text-black ${
                  !isEditable ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>
          ))}
        </div>

        {/* B열 */}
        <div className="border p-4">
          <h2 className="font-bold">B열</h2>
          {floorData[selectedFloor].B.map((item, index) => (
            <div key={index} className="border p-4 mt-2">
              <input
                type="text"
                defaultValue={item.name}
                disabled={!isEditable}
                className={`border p-2 rounded w-full text-black ${
                  !isEditable ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
              <input
                type="text"
                defaultValue={item.quantity}
                disabled={!isEditable}
                className={`border p-2 rounded w-full mt-2 text-black ${
                  !isEditable ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>
          ))}
        </div>

        {/*오른쪽 버튼 영역 (버튼 크기 줄이고, 2열로 정렬) */}
        <div className="grid grid-cols-2 gap-x-1 gap-y-3">
          <button className="w-20 h-20 bg-blue-600 text-white rounded-full">입고</button>
          <button className="w-20 h-20 bg-blue-600 text-white rounded-full">복귀</button>
          <button className="w-20 h-20 bg-gray-500 text-white rounded-full">일시중지</button>
          <button className="w-20 h-20 bg-gray-500 text-white rounded-full">다시출발</button>
          <button className="w-20 h-20 bg-gray-500 text-white rounded-full ">복귀</button>

          {/* 비상정지 버튼 (클릭 시 빨간색으로 변경) */}
          <button
            className={`w-20 h-20 rounded-full ${
              isEmergency ? "bg-red-600 text-white" : "bg-gray-300 text-gray-500"
            }`}
            onClick={() => setIsEmergency(!isEmergency)}
          >
            비상정지
          </button>
        </div>
      </div>
    </div>
  );
}

