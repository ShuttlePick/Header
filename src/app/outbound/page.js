"use client"; // Next.js 클라이언트 컴포넌트

import { shuttlepickFirestore } from "@/firebase";
import { arrayUnion, collection, deleteField, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from "@firebase/firestore";
import { useEffect, useState } from "react";

export default function OutboundPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [allItems, setAllItems] = useState([]);

  // 페이지 로드할 때, firesotre에서 데이터 가져오기
  const fetchAllItems = () => {
      const collectionRef = collection(shuttlepickFirestore, "storageData");

      const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
        let items = [];

        querySnapshot.forEach((doc) => {
          const floor = doc.id; // "1층", "2층" 같은 문서 ID
          const data = doc.data();
    
          // 각 필드(A1, A2, B1, B2)를 하나씩 변환
          Object.keys(data).forEach((space) => {
            const item = data[space];
    
            if (item && item.name && item.quantity !== undefined) {
              items.push({
                id: `${floor}-${space}`, // 예: "1층-A1"
                name: item.name,
                quantity: item.quantity
              });
            }
          });
        });
    
        setAllItems(items); // 상태 업데이트
        console.log("✅ 실시간 Firestore 데이터 업데이트!", items);
      });

    return unsubscribe;
  };

  useEffect(()=> {
    const unsubscribe = fetchAllItems();
    return () => unsubscribe();
  }, []);

  // {
  //   "1층": {
  //     "A1": { "name": "사탕", "quantity": 10 },
  //     "A2": { "name": "과자", "quantity": 6 },
  //     "B1": null,
  //     "B2": null
  //   },
  //   "2층": {
  //     "A1": { "name": "라면", "quantity": 7 },
  //     "A2": { "name": "쌀", "quantity": 3 },
  //     "B1": null,
  //     "B2": null
  //   }
  // }
  //=====> 데이터 불러오면 이런 형태로 저장됨.
  

  const filteredItems = (allItems || []).filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemQuantity(1);
  };

  // const handleQuantityChange = (e) => {
  //   setItemQuantity(Number(e.target.value));
  // };

  const handleAddItem = () => {
    if (selectedItem && itemQuantity > 0 && itemQuantity <= selectedItem.quantity) {
      setSelectedItems([...selectedItems, { ...selectedItem, quantity: itemQuantity }]);
      setSelectedItem(null);
      setItemQuantity(1);
    }
    console.log("선택된 아이템들 : ", selectedItems); // 다음꺼 추가하고 나서야 배열에 추가가됨.. 흠..
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleDeleteBox = async () => {
    var itemId = 1;

    if(selectedItems.length === 0) {
      alert("출고할 물품이 없습니다.");
      return;
    }

    try {
      for (const item of selectedItems) {
        
        const [floor, space] = item.id.split("-");

        const docRef = doc(shuttlepickFirestore, "storageData", floor);
        // Firestore의 현재 데이터 가져오기기
        const docSnap = await getDoc(docRef);

        const washingtonRef = doc(shuttlepickFirestore, "outboundData", "outboundData");

        const outboundSnap = await getDoc(washingtonRef);

        if(inboundSnap.exists()) {
          await updateDoc(washingtonRef, {
            outboundData: arrayUnion({id: itemId++, name: item.name, quantity: item.quantity})  // 저장할 데이터
          }, { merge: true });
        } else {
          await setDoc(washingtonRef, {
            outboundData: [{id: itemId++, name: item.name, quantity: item.quantity}]
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
        <button className="w-20 h-20 bg-blue-600 text-white rounded-full"
        onClick={handleDeleteBox}>
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

