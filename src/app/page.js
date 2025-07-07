"use client"; // Next.js 클라이언트 컴포넌트

import { shuttlepickFirestore } from "@/firebase";
import { deleteDoc, deleteField, doc, getDoc } from "@firebase/firestore";
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
  const [storageSpaces, setStorageSpaces] = useState([]);


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

      const fetchSpaces = async () => {
          const floorDocRef = doc(shuttlepickFirestore, "spaceMeta", `${selectedFloor}층`);
          const docSnap = await getDoc(floorDocRef);
      
          if (docSnap.exists()) {
            const spaceList = docSnap.data().spaces;
            // setStorageSpaces((prev) => ({
            //   ...prev,
            //   [selectedFloor]: spaceList
            // }));
            setStorageSpaces(spaceList);
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
          console.error("inbound 데이터 불러오기 실패!", error);
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
      fetchSpaces();
      fetchInboundData();
      fetchOutboundData();
    }, [selectedFloor]); // 층 변경될 때마다 실행


  // 🔥 필터링된 입출고 내역
  const filteredData = [...inboundData, ...outboundData]
  .filter((item) => {
    if (filterType === "전체") return true;
    return item.type === filterType;
  })
  .filter((item) => item.name.includes(searchQuery))
  .sort((a, b) => new Date(b.timestamp ?? 0) - new Date(a.timestamp ?? 0));


  const convertToKST = (isoString) => {
    if (!isoString) return "";
  
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return ""; // ← 날짜가 잘못된 경우 빈 문자열로 처리
  
    date.setHours(date.getHours() + 9);
    return date.toISOString().replace("T", " ").substring(0, 19);
  };
  
  const handleResetStorage = async () => {
  
    try {
      const floors = ["1층", "2층"];
      for(const floor of floors) {
        const docRef = doc(shuttlepickFirestore, "storageData", floor);
        
        await deleteDoc(docRef);
      }
  
      alert("✅ 창고가 초기화되었습니다!");
      // 상태도 초기화
      setStorageData({
        1: { A1: null, A2: null, B1: null, B2: null },
        2: { A1: null, A2: null, B1: null, B2: null }
      });
    } catch (error) {
      console.error("❌ 창고 초기화 실패:", error);
      alert("⚠️ 창고 초기화 중 오류가 발생했습니다.");
    }
  };

  const handleResetReceipt = async () => {
  
    try {
        const inboundDocRef = doc(shuttlepickFirestore, "inboundData", "inboundData");
        const outboundDocRef = doc(shuttlepickFirestore, "outboundData", "outboundData");
        
        await deleteDoc(inboundDocRef);
        await deleteDoc(outboundDocRef);

        setInboundData([]);
        setOutboundData([]);
  
      alert("✅ 내역이 초기화되었습니다!");
      // 상태도 초기화
    } catch (error) {
      console.error("❌ 내역 초기화 실패:", error);
      alert("⚠️ 내역 초기화 중 오류가 발생했습니다.");
    }
  };
  

  return (
    <div className="ml-[140px] p-6 flex flex-col space-y-6 justify-center items-center h-screen md:flex-row md:space-x-6">
      {/* ✅ 층 선택 버튼 */}
      <div className="flex flex-col space-y-4 mb-4">
        <button
          className={`px-6 py-3 rounded-lg text-lg font-bold shadow-md ${
            selectedFloor === 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-black"
          }`}
          onClick={() => setSelectedFloor(1)}
        >
          1층
        </button>
        <button
          className={`px-6 py-3 rounded-lg text-lg font-bold shadow-md ${
            selectedFloor === 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-black"
          }`}
          onClick={() => setSelectedFloor(2)}
        >
          2층
        </button>
      </div>

      {/* ✅ A/B열 공간 */}
      <div className="flex flex-col space-y-4 items-end">
        <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
          {storageSpaces.map((space) =>
            (
              <div
                key={space}
                className="border p-6 rounded-lg
                flex flex-col justify-center items-center  
                text-lg sm:text-lg md:text-xl font-semibold bg-gray-200 text-black
                w-[100px] sm:w-[150px] md:w-[180px] lg:w-[350px] 
                h-[80px] sm:h-[100px] md:h-[120px] lg:h-[200px]"
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
        <button className="w-[150px] mt-4 px-4 py-3 bg-gray-200 text-gray-500 rounded-lg font-bold hover:bg-red-500 hover:text-white"
        onClick={handleResetStorage}>창고 초기화</button>
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
              <div className="absolute top-12 right-0 bg-white shadow-md rounded-lg w-24 text-center text-black z-50">
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
        <div className="mt-4 space-y-2 max-h-[300px] md:max-h-[500px] overflow-auto">
          {filteredData
            // .filter((item) => item.name.includes(searchQuery)) // 🔍 검색 필터
            .map((item, index) => (
              <div
                key={index}
                className={`relative group flex items-center border p-3 rounded-lg ${
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
                {item.timestamp && (
                  <div className="absolute left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded bg-gray-700 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                  {convertToKST(item.timestamp)}
                  </div>
                )}
              </div>
            ))}
        </div>

        <div className="flex justify-end">
          <button className="mt-6 px-3 py-3 bg-gray-200 text-gray-500 text-sm rounded-lg font-bold hover:bg-gray-400 hover:text-white"
          onClick={handleResetReceipt}>내역 초기화</button>
        </div>

      </div>
    </div>
  );
}
