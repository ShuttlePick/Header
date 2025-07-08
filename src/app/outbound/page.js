"use client"; // Next.js 클라이언트 컴포넌트

import { shuttlepickFirestore } from "@/firebase";
import { arrayUnion, collection, deleteField, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from "@firebase/firestore";
import { useEffect, useState } from "react";
import BluetoothService from "../components/bluetoothService"; // ✅ Bluetooth 모듈 불러오기

export default function OutboundPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // 사용자가 선택한 아이템
  const [selectedItem, setSelectedItem] = useState(null);
  // 사용자가 정한 수량
  const [itemQuantity, setItemQuantity] = useState(1);
  // 사용자가 선택한 복수 아이템
  const [selectedItems, setSelectedItems] = useState([]);

  const [emergencyStop, setEmergencyStop] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [boxReturnVisible, setBoxReturnVisible] = useState(false); // ✅ "상자 복귀" 버튼 표시 여부 상태
  // ✅ 비상정지 상태 추가
  const [isEmergency, setIsEmergency] = useState(false);

  // ✅ 페이지 로드할 때, storageData에서 데이터 가져오기----------------
  const fetchAllItems = () => {
      const collectionRef = collection(shuttlepickFirestore, "storageData"); // storageData / 1층(문서),2층(문서) 정보 가져오기

      // firestore의 실시간 리스너 등록
      // onSnapshot : 컬렉션의 데이터에 변화가 생기면 자동으로 콜백
      const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
        let items = [];

        querySnapshot.forEach((doc) => { // storageData 컬렉션의 모든 문서 스냅샷들 =  "1층", "2층", 데이터들을 말함.
          const floor = doc.id; // 문서 ID("1층", "2층") 가져오기
          const data = doc.data(); // 문서 데이터 객체 가져오기
    
          // 각 필드(A1, A2, B1, B2)를 하나씩 변환
          Object.keys(data).forEach((space) => {
            // item 배열 변수에 각 장소에 있는 데이터(이름, 수량) 저장
            const item = data[space];
    
            // 그 item 배열들을 items 배열 변수에 저장
            if (item && item.name && item.quantity !== undefined) { // 데이터 있으면
              items.push({
                id: `${floor}-${space}`, // 예: "1층-A1"
                name: item.name,
                quantity: item.quantity
              });
            }
          });
        });
    
        setAllItems(items); // 전체 데이터 상태 업데이트
        console.log("✅ 실시간 Firestore 데이터 업데이트!", items);
      });

    return unsubscribe; // 컴포넌트 어마운트 시 Firestore 리스너 해제 (메모리 누수 방지)
  };

  useEffect(()=> {
    const unsubscribe = fetchAllItems();
    return () => unsubscribe();
  }, []);//-------------------------------------------------------------
  

  const filteredItems = (allItems || []).filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  

  // ✅ 아이템 선택 핸들러
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemQuantity(1); // 선택시 기본 수량 1
  };

  // const handleQuantityChange = (e) => {
  //   setItemQuantity(Number(e.target.value));
  // };

  // ✅ 아이템 추가 핸들러
  const handleAddItem = () => {
    if (selectedItem && itemQuantity > 0 && itemQuantity <= selectedItem.quantity) {
      setSelectedItems([...selectedItems, { ...selectedItem, quantity: itemQuantity }]);
      setSelectedItem(null);
      setItemQuantity(1);
      console.log("선택된 아이템들 : ", selectedItems); // 다음꺼 추가하고 나서야 배열에 추가가됨.. 흠..
    }
  };

  // ✅ 아이템 제거 핸들러
  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // ✅ 아이템 출고 핸들러(?)
  const handleDeleteBox = async () => {
    var itemId = 1;

    if(selectedItems.length === 0) {
      alert("출고할 물품이 없습니다.");
      return;
    }

    try {
      for (const item of selectedItems) {
        
        const [floor, space] = item.id.split("-");

        const formattedSpace = floor === "2층" ? `${space}_2F` : space; // 2층이면 "A1" → "A1_2F" 변환

        // ✅ 블루투스 출고 명령 전송 (Bluetooth가 실패하면 Firestore 업데이트 중단)
        try {
          await BluetoothService.sendCommand("Picking", formattedSpace);
          console.log(`📡 Bluetooth 출고 명령 전송 완료: ${formattedSpace}`);
        } catch (bluetoothError) {
          console.error("❌ Bluetooth 출고 실패!", bluetoothError);
          alert("⚠️ Bluetooth 출고 명령 전송 중 오류가 발생했습니다.");
          return; // Bluetooth 전송 실패 시 Firestore 업데이트 중단
        }

        // ✅ Bluetooth 전송이 성공하면 "상자 복귀" 버튼을 표시
        setBoxReturnVisible(true);


        const docRef = doc(shuttlepickFirestore, "storageData", floor);
        // Firestore의 현재 데이터 가져오기기
        const docSnap = await getDoc(docRef);

        const washingtonRef = doc(shuttlepickFirestore, "outboundData", "outboundData");

        const outboundSnap = await getDoc(washingtonRef);

        if(outboundSnap.exists()) {
          await updateDoc(washingtonRef, {
            outboundData: arrayUnion({id: itemId++, name: item.name, quantity: item.quantity, timestamp: new Date().toISOString()})  // 저장할 데이터
          }, { merge: true });
        } else {
          await setDoc(washingtonRef, {
            outboundData: [{id: itemId++, name: item.name, quantity: item.quantity, timestamp: new Date().toISOString()}]
          })
        }

        // 🔥 문서가 존재하는지 확인
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentItem = data[space];
  
          if (currentItem && currentItem.quantity >= item.quantity) {
            const newQuantity = currentItem.quantity - item.quantity;
  
            if (newQuantity > 0) {
              // ✅ 출고 후 개수가 남아 있으면 개수만 업데이트
              await updateDoc(docRef, {
                [`${space}.quantity`]: newQuantity,
              });
              console.log(`🚀 출고 완료: ${item.name} ${item.quantity}개 (${floor}-${space})`);
            } else {
              // ✅ 개수가 0이면 필드 삭제
              await updateDoc(docRef, {
                [space]: deleteField(),
              });
              console.log(`🚀 출고 완료 & 공간 삭제: ${item.name} (${floor}-${space})`);
            }
          } else {
            console.warn(`⚠️ ${item.name} (${floor}-${space}) 출고 실패: 재고 부족`);
          }
        } else {
          console.warn(`⚠️ ${item.name} (${floor}-${space}) 출고 실패: 해당 데이터 없음`);
        }
      }
      alert("✅ 출고가 완료되었습니다!");
      
      // 출고 후 상태 초기화
      setAllItems((prev) => prev.filter((item) => !selectedItems.includes(item)));
      setSelectedItems([]);
    } catch(error) {
      console.log("출고 실패!", error);
      alert("출고 중 오류가 발생했습니다.");
    }
  };

  const handleReturnBox = async () => {
    if (!selectedItems.length) {
      console.log("⚠️ 복귀할 물품이 없습니다.");
      return;
    }
  
    try {
      for (const item of selectedItems) {
        const [floor, space] = item.id.split("-");
  
        const formattedSpace = floor === "2층" ? `${space}_2F` : space; // ✅ 2층이면 "A1" → "A1_2F" 변환
  
        // ✅ Bluetooth로 복귀 명령 전송
        try {
          await BluetoothService.sendCommand("Returning", formattedSpace);
          console.log(`📦 Bluetooth 복귀 명령 전송 완료: ${formattedSpace}`);
        } catch (bluetoothError) {
          console.error("❌ Bluetooth 복귀 실패!", bluetoothError);
          alert("⚠️ Bluetooth 복귀 명령 전송 중 오류가 발생했습니다.");
          return;
        }
      }
  
      alert("✅ 상자 복귀가 완료되었습니다!");
      setBoxReturnVisible(false); // ✅ 복귀 후 버튼 숨김
    } catch (error) {
      console.error("❌ 상자 복귀 실패!", error);
      alert("⚠️ 상자 복귀 중 오류가 발생했습니다.");
    }
  };
  
  /**
     * ✅ 비상정지 핸들러
     * - 버튼을 누르면 비상정지 명령을 STM32로 전송
     */
    const handleEmergency = async () => {
      const emergencyState = isEmergency ? 0 : 1; // 1: 정지, 0: 해제
      console.log(`🚨 비상정지 요청 - Emergency: ${emergencyState}`);
  
      try {
        await BluetoothService.sendEmergencyCommand(emergencyState);
        
        // ✅ 여기서 바로 상태를 업데이트
        setIsEmergency((prevState) => !prevState);
        
      } catch (error) {
        console.error("❌ 비상정지 실패:", error);
        alert("⚠️ 비상정지를 수행하지 못했습니다.");
      }
    };
  
    /**
     * ✅ 일시중지 핸들러
     * - 일시중지 버튼을 누르면 Bluetooth로 "S" 명령어를 전송
     */
    const handlePause = async () => {
      try {
        await BluetoothService.sendPauseCommand();
        alert("✅ 일시중지 명령이 전송되었습니다.");
      } catch (error) {
        console.error("❌ 일시중지 명령 전송 실패:", error);
        alert("⚠️ 일시중지 명령을 전송하지 못했습니다.");
      }
    };
  
    /**
     * ✅ 다시출발 핸들러
     * - 다시출발 버튼을 누르면 Bluetooth로 "C" 명령어를 전송
     */
    const handleResume = async () => {
      try {
        await BluetoothService.sendResumeCommand();
        alert("✅ 다시출발 명령이 전송되었습니다.");
      } catch (error) {
        console.error("❌ 다시출발 명령 전송 실패:", error);
        alert("⚠️ 다시출발 명령을 전송하지 못했습니다.");
      }
    };
  
  
    /**
     * ✅ 복귀 핸들러
     * - 복귀 버튼을 누르면 Bluetooth로 "B" 명령어를 전송
     */
    const handleReturn = async () => {
      try {
        await BluetoothService.sendReturnCommand();
        alert("✅ 복귀 명령이 전송되었습니다.");
      } catch (error) {
        console.error("❌ 복귀 명령 전송 실패:", error);
        alert("⚠️ 복귀 명령을 전송하지 못했습니다.");
      }
    };

  return (
    <div className="ml-[140px] p-6 flex space-x-6 justify-center h-screen items-center">
      {/* 왼쪽: 검색 및 물품 목록 */}
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded sm:w-[250px] md:w-[300px] lg:w-[400px] text-black text-base sm:text-lg md:text-xl"
        />

        {/* 출고 가능 물품 목록 (h-[300px] 고정) */}
        <div className="border p-4 w-full sm:w-[250px] md:w-[300px] lg:w-[400px] h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-auto">
          <h2 className="font-bold mb-2 text-base sm:text-lg md:text-xl">출고 가능 물품</h2>
          <div className="grid grid-cols-3 text-center font-semibold text-base sm:text-lg md:text-xl">
            <span>물품이름</span>
            <span>개수</span>
            <span>선택</span>
          </div>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div key={index} className="grid grid-cols-3 text-center mt-2 text-base sm:text-lg md:text-xl">
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
            <p className="text-gray-400 text-center mt-2 text-base sm:text-lg md:text-xl">검색 결과 없음</p>
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
      <div className="border p-4 text-base sm:text-lg md:text-xl sm:w-[250px] md:w-[300px] lg:w-[400px] h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-auto">
        <h2 className="font-bold mb-2 text-base sm:text-lg md:text-xl">선택된 물품</h2>
        {selectedItems.length > 0 ? (
          selectedItems.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>
                {item.name} ({item.quantity})
              </span>
              <button
                className="text-red-500 text-base sm:text-lg md:text-xl"
                onClick={() => handleRemoveItem(index)}
              >
                제거
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-base sm:text-lg md:text-xl">선택된 물품이 없습니다.</p>
        )}
      </div>

      {/* 버튼 그룹 */}
      <div className="flex flex-col justify-end space-y-3">
        <button className="px-6 py-3 bg-gray-600 text-white font-bold text-lg rounded-lg shadow-md"
        onClick={handleDeleteBox}>
          출고
        </button>
        {/* ✅ 출고 후에만 "상자 복귀" 버튼이 표시됨 */}
        {boxReturnVisible && (
          <button
            className="px-6 py-3 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-md"
            onClick={() => {
              onClick={handleReturnBox};
              console.log("📦 상자 복귀 실행!");
              setBoxReturnVisible(false); // ✅ 복귀 후 버튼 숨기기
            }}
          >
            상자복귀
          </button>
        )}
                <button
          className="px-6 py-3 bg-yellow-500 text-white font-bold text-lg rounded-lg shadow-md"
          onClick={handlePause}
        >
          일시중지
        </button>
        <button
          className="px-6 py-3 bg-green-500 text-white font-bold text-lg rounded-lg shadow-md"
          onClick={handleResume}
        >
          다시출발
        </button>

        <button
          className="px-6 py-3 bg-gray-500 text-white font-bold text-lg rounded-lg shadow-md"
          onClick={handleReturn}
        >
          복귀
        </button>


        {/* ✅ 비상정지 버튼 */}
        <button
          className={`px-6 py-3 text-white font-bold text-lg rounded-lg shadow-md ${
            isEmergency ? "bg-red-600" : "bg-gray-400"
          }`}
          onClick={handleEmergency}
        >
          {isEmergency ? "비상정지 해제" : "비상정지"}
        </button>
      </div>
    </div>
  );
}

