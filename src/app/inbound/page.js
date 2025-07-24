"use client";

import { useEffect, useState } from "react";
import BluetoothService from "../components/bluetoothService"; // ✅ BluetoothService 불러오기 (Bluetooth 통신 처리)
import { shuttlepickFirestore } from "@/firebase"; // firebase db 연결
import StorageArea from "../components/StorageArea";
import { addDoc, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from "firebase/firestore";

// ✅ 입고 페이지 컴포넌트
export default function InboundPage() {

  // 현재 선택된 층 (기본값: 1층)
  const [selectedFloor, setSelectedFloor] = useState(1);
  // 사용자가 선택한 공간 (예: A1, A2, B1, B2)
  const [selectedSpace, setSelectedSpace] = useState(null);

  // 창고 데이터 상태 (층별 A열, B열 공간 상태 저장)
  const [storageData, setStorageData] = useState({
    1: { A1: null, A2: null, B1: null, B2: null }, // 1층
    2: { A1: null, A2: null, B1: null, B2: null }  // 2층
  });
  // 사용자가 입력한 상품명과 개수
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");

  // 비상정지 상태 (true : 1 : 정지, false: 0 : 정상)
  const [isEmergency, setIsEmergency] = useState(0);

  // 상자 도착 여부 (true: 상자가 도착하여 입고 가능)
  const [boxArrived, setBoxArrived] = useState(false);

  
   // ✅ 적재 공간 선택 핸들러
   // 사용자가 특정 공간을 클릭하면 해당 공간이 선택됨.
  const handleSelectSpace = (space) => {
    setSelectedSpace(space); // 선택한 공간으로 setSelectedSpace
    setBoxArrived(true); // 새로운 공간 선택 시 상자 도착 여부 초기화
  };

  // ✅ 페이지 로드할 때, firesotre에서 데이터 가져오기
  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        const docRef = doc(shuttlepickFirestore, "storageData", `${selectedFloor}층`);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()) {
          setStorageData((prev) => ({
            ...prev,
            [selectedFloor]: docSnap.data() //Firestore 데이터 적용
          }));
        } else {
          console.log("데이터가 없습니다.");
        }
      } catch (error) {
        console.error("데이터 불러오기 실패!", error);
      }
    };
    fetchStorageData(); // storageData 가져오기
  }, [selectedFloor]); // 층 변경될 때마다 실행

   // ✅ 상자 가져오기 핸들러
   // - 사용자가 선택한 공간에 상자를 가져오도록 STM32에 명령을 전송
  const handleRetrieveBox = async () => {

    if (!selectedSpace) { // 선택된 공간이 없으면
      alert("❌ 적재 공간을 먼저 선택하세요.");
      return;
    }

    // formattedSpace = 1,2층 반영한 공간 = STM에 보낼 공간정보
    // 2층이면 "A1" → "A1_2F" 변환(하여 STM32에 전송)
    const formattedSpace = selectedFloor === 2 ? `${selectedSpace}_2F` : selectedSpace; 

    console.log(`📦 상자 가져오기 요청 - ${selectedFloor}층, ${formattedSpace}공간`);

    try { // Bluetooth로 상자 가져오기 명령 보내기
      await BluetoothService.sendCommand("Picking", formattedSpace); 
      setBoxArrived(true); // ✅ 상자 도착 상태 변경
      alert("✅ 상자를 가져왔습니다.");
    } catch (error) {
      console.error("❌ 상자 가져오기 실패:", error);
      alert("⚠️ 상자를 가져오지 못했습니다.");
    }
  };

   // ✅ 입고 핸들러
   // - 사용자가 입력한 상품명과 개수를 STM32에 전송
  const handleStoreBox = async () => {
    
    if (!selectedSpace) { // 선택된 공간이 없으면
      alert("❌ 적재 공간을 먼저 선택하세요.");
      return;
    }
    if (!itemName || quantity <= 0) { // 물품이름, 수량 입력 안됐으면
      alert("❌ 상품명과 수량을 올바르게 입력하세요.");
      return;
    }

    // formattedSpace = 1,2층 반영한 공간 = STM에 보낼 공간정보
    // 2층이면 "A1" → "A1_2F" 변환(하여 STM32에 전송)
    const formattedSpace = selectedFloor === 2 ? `${selectedSpace}_2F` : selectedSpace; 

    console.log(`📦 입고 요청 - ${selectedFloor}층, ${formattedSpace}공간 / 상품: ${itemName}, 개수: ${quantity}`);

    try { // Bluetooth로 상자 가져다놓기 명령 보내기
      await BluetoothService.sendCommand("Placing", formattedSpace);

        // storageData, inboundData DB 접근---------------------------
      const docRef = doc(shuttlepickFirestore, "storageData", `${selectedFloor}층`);
      const washingtonRef = doc(shuttlepickFirestore, "inboundData", "inboundData");

      await setDoc(docRef, { // ✅ storageData에 공간, 이름, 수량 데이터 저장
        [selectedSpace]: { name: itemName, quantity: Number(quantity) }
      }, { merge: true }); // 기존 데이터 유지하면서 덮어쓰기
      
      // inboundData 가져와서 ----------------------------------------
      const inboundSnap = await getDoc(washingtonRef); 
      let itemId = 1;

      if (inboundSnap.exists()) {
        const existingData = inboundSnap.data().inboundData || [];
        /*
        inboundData : [
          { id: 1, name: "상품A", quantity: 10 },
          { id: 2, name: "상품B", quantity: 5 }
        ] 여기서 
        .inboundData 해서
        [
          { id: 1, name: "상품A", quantity: 10 },
          { id: 2, name: "상품B", quantity: 5 }
        ] 이거 가져옴
        inboundData 필드가 없거나 undefined이면 빈 배열 [] 사용
        */

        if (existingData.length > 0) {
          // 가장 큰 id 값을 찾아서 +1
          const maxId = Math.max(...existingData.map((item) => item.id));
          itemId = maxId + 1; // id 증가
        }
      }

      if (inboundSnap.exists()) {
        await updateDoc(washingtonRef, { // ✅ 입고 정보 inboundData에 저장
          inboundData: arrayUnion({ id: itemId, name: itemName, quantity: Number(quantity), timestamp: new Date().toISOString() })
        }, {merge:true});
      } else {
        await setDoc(washingtonRef, { // inboundData에 아직 데이터 없을 때
          inboundData: [{ id: itemId, name: itemName, quantity: Number(quantity), timestamp: new Date().toISOString() }]
        });
      }

      // 창고 데이터 업데이트 (local 변수?)
      setStorageData((prev) => ({
        ...prev,
        [selectedFloor]: {
          ...prev[selectedFloor],
          [selectedSpace]: { name: itemName, quantity: quantity }
        }
      }));

      // ✅ 상태 초기화
      setItemName("");
      setQuantity("");
      setSelectedSpace(null);
      setBoxArrived(false);
      alert("✅ 입고를 완료했습니다.");
    } catch (error) {
      console.error("❌ 입고 실패:", error);
      alert("⚠️ 입고를 하지 못했습니다.");
    }
  };

   // ✅ 비상정지 핸들러
   // - 버튼을 누르면 비상정지 명령을 STM32로 전송
  const handleEmergency = async () => {
    // 정지 상태면 해제하고, 정상상태면 비상정지
    const emergencyState = isEmergency ? 0 : 1; // 1: 정지, 0: 해제
    console.log(`🚨 비상정지 요청 - Emergency: ${emergencyState ? '비상정지': '비상정지 해제'}`);

    try { // 
      await BluetoothService.sendEmergencyCommand(emergencyState);
      setIsEmergency(!isEmergency); // 비상정지 상태 업데이트
    } catch (error) {
      console.error("❌ 비상정지 실패:", error);
      alert("⚠️ 비상정지를 수행하지 못했습니다.");
    }
  };

  return (
    <div className="ml-[140px] p-6 flex space-x-6 justify-center items-center h-screen">
      {/* ✅ 층 선택 */}
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

      {/* ✅ 적재 공간 UI */}
    {/* ✅ 저장 공간 컴포넌트 (StorageArea) */}
      <StorageArea
        selectedFloor={selectedFloor}
        selectedSpace={selectedSpace}
        setSelectedSpace={handleSelectSpace}
        storageData={storageData}
        setStorageData={setStorageData}
      />


      {/* ✅ 입력 필드 & 입고 버튼 (boxArrived가 true일 때 표시) */}
      {boxArrived && (
        <div className="mt-6 flex flex-col">
          <input type="text" placeholder="상품명 입력" value={itemName} onChange={(e) => setItemName(e.target.value)}
            className="border p-3 rounded-lg text-lg text-center shadow-md mb-3 text-black" />
          <input type="number" placeholder="개수 입력" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className="border p-3 rounded-lg text-lg text-center shadow-md text-black" />
          <button className="mt-3 px-6 py-3 bg-blue-500 text-white font-bold text-lg rounded-lg shadow-md" onClick={handleStoreBox}>
            입고
          </button>
        </div>
      )}
    


      {/* ✅ 버튼 UI */}
        <div className="flex flex-col justify-center space-y-3">


        {/* {boxArrived && (
          <button className="px-6 py-3 bg-blue-500 text-white font-bold text-lg rounded-lg shadow-md" onClick={handleStoreBox}>
            입고
          </button>
        )} */}

        <button
          className="px-6 py-3 bg-yellow-500 text-white font-bold text-lg rounded-lg shadow-md"
          onClick={() => BluetoothService.sendPauseCommand()}
        >
          일시중지
        </button>

        <button
          className="px-6 py-3 bg-green-500 text-white font-bold text-lg rounded-lg shadow-md"
          onClick={() => {
            const formattedSpace = selectedFloor === 2 ? `${selectedSpace}_2F` : selectedSpace;
            BluetoothService.sendResumeCommand(formattedSpace);
          }}
        >
          다시출발
        </button>

        <button
          className="px-6 py-3 bg-gray-500 text-white font-bold text-lg rounded-lg shadow-md"
          onClick={() => BluetoothService.sendReturnCommand()}
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
          비상정지
        </button>

        {/* <button>초기화</button> */}
      </div>
    </div>
  );
}