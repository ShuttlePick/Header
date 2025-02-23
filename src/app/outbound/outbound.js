"use client"; // Next.js 클라이언트 컴포넌트

import { useState } from "react";

export default function OutboundPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [emergencyStop, setEmergencyStop] = useState(false);

  const floorData = {
    1: {
      A: [{ name: "사탕", quantity: 10 }, { name: "과자", quantity: 6 }],
      B: [{ name: "음료", quantity: 5 }, { name: "빵", quantity: 8 }],
    },
    2: {
      A: [{ name: "라면", quantity: 7 }, { name: "쌀", quantity: 3 }],
      B: [{ name: "커피", quantity: 2 }, { name: "초콜릿", quantity: 9 }],
    },
  };

  const allItems = [
    ...floorData[1].A,
    ...floorData[1].B,
    ...floorData[2].A,
    ...floorData[2].B,
  ];

  const filteredItems = allItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemQuantity(1);
  };

  const handleQuantityChange = (e) => {
    setItemQuantity(Number(e.target.value));
  };

  const handleAddItem = () => {
    if (selectedItem && itemQuantity > 0 && itemQuantity <= selectedItem.quantity) {
      setSelectedItems([...selectedItems, { ...selectedItem, quantity: itemQuantity }]);
      setSelectedItem(null);
      setItemQuantity(1);
    }
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  return (
    <div className="ml-[180px] p-6 bg-black min-h-screen text-white flex space-x-6">
      {/* 왼쪽: 검색 및 물품 목록 */}
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-[250px] text-black mt-8"
        />

        {/* 출고 가능 물품 목록 (h-[300px] 고정) */}
        <div className="border p-4 w-[250px] h-[400px] overflow-auto">
          <h2 className="font-bold mb-2">출고 가능 물품</h2>
          <div className="grid grid-cols-3 text-center font-semibold">
            <span>물품이름</span>
            <span>개수</span>
            <span>선택</span>
          </div>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div key={index} className="grid grid-cols-3 text-center mt-2">
                <span>{item.name}</span>
                <span>{item.quantity}</span>
                <button
                  className="border px-2 py-1 rounded bg-blue-500 text-white text-sm"
                  onClick={() => handleSelectItem(item)}
                >
                  선택
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center mt-2">검색 결과 없음</p>
          )}
        </div>

        <div className="flex space-x-2">
          <input
            type="number"
            min="1"
            value={itemQuantity}
            onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setItemQuantity(isNaN(value) ? "" : value); // NaN 방지
            }}
            className="border p-2 rounded w-[100px] text-black"
            disabled={!selectedItem}
          />

          <button
            className={`border px-4 py-2 rounded ${
              selectedItem &&
              itemQuantity > 0 &&
              itemQuantity <= selectedItem.quantity
                ? "bg-green-500 text-white"
                : "bg-gray-500 text-gray-300 cursor-not-allowed"
            }`}
            onClick={handleAddItem}
            disabled={!selectedItem || itemQuantity <= 0 || itemQuantity > selectedItem.quantity}
          >
            추가
          </button>
        </div>
      </div>

      {/* 선택된 물품 목록 (높이를 출고 가능 물품과 동일하게 맞춤) */}
      <div className="border p-4 w-[250px] h-[400px] overflow-auto mt-24">
        <h2 className="font-bold mb-2">선택된 물품</h2>
        {selectedItems.length > 0 ? (
          selectedItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>
                {item.name} ({item.quantity})
              </span>
              <button
                className="text-red-500 text-sm"
                onClick={() => handleRemoveItem(index)}
              >
                제거
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400">선택된 물품이 없습니다.</p>
        )}
      </div>

      {/* 버튼 그룹 */}
      <div className="grid grid-cols-2 gap-x-1 gap-y-2 justify-items-center mt-24">
        <button className="w-20 h-20 bg-blue-600 text-white rounded-full">
          출고
        </button>
        <button className="w-20 h-20 bg-blue-600 text-white rounded-full">
          복귀
        </button>
        <button className="w-20 h-20 bg-gray-500 text-white rounded-full">
          일시중지
        </button>
        <button className="w-20 h-20 bg-gray-500 text-white rounded-full">
          다시출발
        </button>
        <button className="w-20 h-20 bg-gray-500 text-white rounded-full">
          복귀
        </button>

        {/* 비상정지 버튼 (클릭 시 빨간색으로 변경) */}
        <button
          className={`w-20 h-20 rounded-full ${
            emergencyStop ? "bg-red-600 text-white" : "bg-gray-300 text-gray-500"
          }`}
          onClick={() => setEmergencyStop(!emergencyStop)}
        >
          비상정지
        </button>
      </div>
    </div>
  );
}

