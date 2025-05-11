// components/StorageArea.js

"use client";

import React, { useState, useEffect } from "react";

function StorageArea({ selectedFloor, selectedSpace, setSelectedSpace, storageData, setStorageData }) {
  const [storageSpaces, setStorageSpaces] = useState({
    1: ["A1", "B1", "A2", "B2"],
    2: ["A1", "B1", "A2", "B2"]
  });

  useEffect(() => {
    // ✅ 초기화 시 저장공간 업데이트
    setStorageData((prev) => ({
      ...prev,
      [selectedFloor]: storageSpaces[selectedFloor].reduce((acc, space) => {
        if (!acc[space]) {
          acc[space] = null;
        }
        return acc;
      }, prev[selectedFloor] || {})
    }));
  }, [storageSpaces, selectedFloor]);

  const handleAddSpace = () => {
    const currentSpaces = storageSpaces[selectedFloor];
    const nextIndex = Math.floor(currentSpaces.length / 2) + 1;
    const newSpaces = [`A${nextIndex}`, `B${nextIndex}`];

    setStorageSpaces((prev) => ({
      ...prev,
      [selectedFloor]: [...prev[selectedFloor], ...newSpaces]
    }));

    setStorageData((prev) => ({
      ...prev,
      [selectedFloor]: {
        ...prev[selectedFloor],
        ...newSpaces.reduce((acc, space) => {
          acc[space] = null;
          return acc;
        }, {})
      }
    }));

    alert(`✅ ${newSpaces.join(", ")} 공간이 추가되었습니다.`);
  };

  return (
    <div className="flex flex-col space-y-4 max-h-[80vh] overflow-auto">
      <div className="grid grid-cols-2 gap-4">
        {storageSpaces[selectedFloor].map((space) => (
          <div
            key={space}
            className={`border p-6 cursor-pointer rounded-lg flex flex-col justify-center items-center text-center text-base sm:text-lg md:text-xl font-semibold 
              w-[100px] sm:w-[150px] md:w-[180px] lg:w-[350px] 
              h-[80px] sm:h-[100px] md:h-[120px] lg:h-[200px]
              ${selectedSpace === (selectedFloor === 2 ? `${space}_2F` : space) ? "bg-green-400 text-white" : "bg-gray-200 text-black"
            }`}
            onClick={() => setSelectedSpace(selectedFloor === 2 ? `${space}_2F` : space)}
          >
            <h2>{selectedFloor === 2 ? `${space}_2F` : space} 공간</h2>
            {storageData[selectedFloor][space] ? (
              <p className="mt-2">
                {storageData[selectedFloor][space].name} - {storageData[selectedFloor][space].quantity}개
              </p>
            ) : (
              <p className="text-gray-500">비어 있음</p>
            )}
          </div>
        ))}
      </div>

      {/* ➕ 공간 추가 버튼 */}
      <button
        className="mt-4 px-4 py-3 bg-blue-500 text-white font-bold text-lg rounded-lg shadow-md"
        onClick={handleAddSpace}
      >
        ➕ 공간 추가
      </button>
    </div>
  );
}

export default StorageArea;
