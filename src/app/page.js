"use client"; // Next.js 클라이언트 컴포넌트

import { shuttlepickFirestore } from "@/firebase";
import { doc, getDoc } from "@firebase/firestore";
import { useState, useEffect } from "react";

export default function Monitoring() {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [storageData, setStorageData] = useState({
    1: { A1: null, A2: null, B1: null, B2: null }, // 1층
    2: { A1: null, A2: null, B1: null, B2: null }  // 2층
  });
  // const [boxData, setBoxData] = useState({ "A열": [], "B열": [] });
  // 사용자가 선택한 공간 (예: A1, A2, B1, B2)
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [inboundData, setInboundData] = useState([]);
  const [outboundData, setOutboundData] = useState([]);

  const [filterType, setFilterType] = useState("전체"); // 🔥 필터 상태
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 검색어 상태
  const [dropdownOpen, setDropdownOpen] = useState(false); // 🔻 드롭다운 상태


  // 페이지 로드할 때, firesotre에서 데이터 가져오기
    useEffect(() => {
      const fetchStorageData = async () => {
        try {
          const docRef = doc(shuttlepickFirestore, "storageData", `${selectedFloor}층`);
          const docSnap = await getDoc(docRef);
  
          if(docSnap.exists()) {
            setStorageData((prev) => ({
              ...prev,
              [selectedFloor]: {...prev[selectedFloor], ...docSnap.data()} //Firestore 데이터 적용
            }));
          } else {
            console.log("데이터가 없습니다.");
          }
        } catch (error) {
          console.error("데이터 불러오기 실패!", error);
        }
      };

      const fetchInboundData = async () => {
        try {
          const docRef = doc(shuttlepickFirestore, "inboundData", "inboundData");
          const docSnap = await getDoc(docRef);
  
          if(docSnap.exists()) {
            const data = docSnap.data().inboundData;
            console.log("입입고 데이텅 : ", data);
            
            const inboundDataWithType = data.map((item) => ({
              ...item,
              type: "입고",
            }));

            setInboundData(inboundDataWithType);
          }
        } catch (error) {
          console.error("outbound 데이터 불러오기 실패!", error);
        }
      };

      const fetchOutboundData = async () => {
        try {
          const docRef = doc(shuttlepickFirestore, "outboundData", "outboundData");
          const docSnap = await getDoc(docRef);
  
          if(docSnap.exists()) {
            const data = docSnap.data().outboundData;
            console.log("출고 데이텅 : ", data);

            const outboundDataWithType = data.map((item) => ({
              ...item,
              type : "출고"
            }));

            setOutboundData(outboundDataWithType);
          }
        } catch (error) {
          console.error("outbound 데이터 불러오기 실패!", error);
        }
      };

      fetchStorageData();
      fetchInboundData();
      fetchOutboundData();
    }, [selectedFloor]); // 층 변경될 때마다 실행


  // 🔥 필터링된 입출고 내역
  const filteredData = [...inboundData, ...outboundData]
  .filter((item) => {
    if (filterType === "전체") return true; // 전체 보기
    return item.type === filterType; // "입고" or "출고" 필터링
  })
  .filter((item) => item.name.includes(searchQuery)); // 검색 필터 적용

  return (
    <div className="ml-[140px] p-6 flex space-x-6 justify-center items-center h-screen">
      {/* ✅ 층 선택 버튼 */}
      <div className="flex flex-col space-y-4">
        <button
          className={`px-6 py-3 rounded-lg text-lg font-bold shadow-md ${
            selectedFloor === "1층" ? "bg-blue-600 text-white" : "bg-gray-300 text-black"
          }`}
          onClick={() => setSelectedFloor(1)}
        >
          1층
        </button>
        <button
          className={`px-6 py-3 rounded-lg text-lg font-bold shadow-md ${
            selectedFloor === "2층" ? "bg-blue-600 text-white" : "bg-gray-300 text-black"
          }`}
          onClick={() => setSelectedFloor(2)}
        >
          2층
        </button>
      </div>

      {/* ✅ A/B열 공간 */}
      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {["A1", "A2", "B1", "B2"].map((space) =>
            (
              <div
                key={space}
                className="border p-6 rounded-lg text-center text-lg font-semibold bg-gray-200 text-black"
              >
                <h2>{space} 공간</h2>
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
      </div>

      {/* ✅ 입출고 내역 */}
      <div className="w-[300px]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">입출고 내역</h3>
          {/* 🔥 필터 드롭다운 */}
          <div className="relative">
            <button
              className="px-4 py-2 text-black bg-gray-200 rounded-lg flex items-center space-x-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span>{filterType}</span>
              <span className="text-lg">▼</span>
            </button>
            {dropdownOpen && (
              <div className="absolute top-12 right-0 bg-white shadow-md rounded-lg w-24 text-center text-black">
                <button
                  className="block w-full px-4 py-2 hover:bg-gray-200"
                  onClick={() => {
                    setFilterType("전체");
                    setDropdownOpen(false);
                  }}
                >
                  전체
                </button>
                <button
                  className="block w-full px-4 py-2 hover:bg-gray-200"
                  onClick={() => {
                    setFilterType("입고");
                    setDropdownOpen(false);
                  }}
                >
                  입고
                </button>
                <button
                  className="block w-full px-4 py-2 hover:bg-gray-200"
                  onClick={() => {
                    setFilterType("출고");
                    setDropdownOpen(false);
                  }}
                >
                  출고
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 🔍 검색창 */}
        <input
          type="text"
          placeholder="물품 이름 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full text-black"
        />

        {/* ✅ 필터링된 입출고 내역 */}
        <div className="mt-4 space-y-2">
          {filteredData
            // .filter((item) => item.name.includes(searchQuery)) // 🔍 검색 필터
            .map((item, index) => (
              <div
                key={index}
                className={`flex items-center border p-3 rounded-lg ${
                  item.type === "입고" ? "border-green-500" : "border-red-500"
                }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center text-white rounded-full ${
                    item.type === "입고" ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {item.type === "입고" ? "+" : "-"}
                </div>
                <span className="ml-2 flex-grow">{item.name}</span>
                <span>{item.quantity}개</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
