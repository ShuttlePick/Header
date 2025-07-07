// components/StorageArea.js

"use client";

import { shuttlepickFirestore } from "@/firebase";
import { deleteField, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { useState, useEffect } from "react";

function StorageArea({ selectedFloor, selectedSpace, setSelectedSpace, storageData, setStorageData }) {
  const [storageSpaces, setStorageSpaces] = useState({
    1: ["A1", "B1", "A2", "B2"],
    2: ["A1", "B1", "A2", "B2"]
  });


  // '공간추가' 새로 생긴 공간 불러오기
  useEffect(() => {
  const fetchSpaces = async () => {
    const floorDocRef = doc(shuttlepickFirestore, "spaceMeta", `${selectedFloor}층`);
    const docSnap = await getDoc(floorDocRef);

    if (docSnap.exists()) {
      // .data() : Firestore 문서 데이터를 JS 객체로 변환
      // spaces 필드에 해당하는 데이터 꺼냄. (내가 배열 필드 이름 spaces로 함)

      docSnap.data().spaces;
      const spaceList = docSnap.data().spaces; 
      setStorageSpaces((prev) => ({
        ...prev,
        // storageSpaces 변수에 해당 층에 추가된 데이터 추가
        [selectedFloor]: spaceList
      }));
    }
  };

  fetchSpaces();
  }, [selectedFloor]); // 층 바뀔때마다 fetch


  // '공간추가' 버튼 클릭시
  const handleAddSpace = async () => {
    // ex) 현재 1층이고, 렉 3개면 이면 ["A1", "B1", "A2", "B2", "A3", "B3"]
    const currentSpaces = storageSpaces[selectedFloor];
    // ex) 6/2 + 1 = 4 -> 다음렉은 4번임을 뜻함함
    const nextIndex = Math.floor(currentSpaces.length / 2) + 1;
    // ex) "A4", "B4" 추가
    const newSpaces = [`A${nextIndex}`, `B${nextIndex}`];
    // ["A1", "B1", "A2", "B2", "A3", "B3", "A4", "B4"]
    const updatedSpaces = [...currentSpaces, ...newSpaces];

    setStorageSpaces((prev) => ({
      ...prev,
      // storageSpaces 변수에 해당 층에 추가된 공간까지 업데이트
      // ["A1", "B1", "A2", "B2", "A3", "B3", "A4", "B4"] 저장
      [selectedFloor]: updatedSpaces
    }));

    // DB 추가
    const floorDocRef = doc(shuttlepickFirestore, "spaceMeta", `${selectedFloor}층`);
    // DB에 ["A1", "B1", "A2", "B2", "A3", "B3", "A4", "B4"] 저장
    await setDoc(floorDocRef, { spaces: updatedSpaces });

    setStorageData((prev) => ({
      ...prev, // 기존 층별 데이터 복사
      [selectedFloor]: {
        ...prev[selectedFloor], // 선택된 층 기존 데이터 유지
        // 새 공간 "A4", "B4" 에 각각 space: null 형태로 초기 데이터 넣어줌줌
        // {A3: null, B3: null}
        ...newSpaces.reduce((acc, space) => {
          acc[space] = null;
          return acc;
        }, {})
      }
    }));

    alert(`✅ ${newSpaces.join(", ")} 공간이 추가되었습니다.`);
  };

  // 렉 삭제 함수
  const deleteSpace = async (spaceToDelete) => {
    const currentSpaces = storageSpaces[selectedFloor];

    // A4 또는 B4가 눌렸을 때, 둘 다 제거하기 위해 index를 맞춤
    const index = currentSpaces.indexOf(spaceToDelete);
    const isA = spaceToDelete.startsWith("A");
    const pairIndex = isA ? index + 1 : index - 1;

    const spacePair = [spaceToDelete, currentSpaces[pairIndex]];

    const updatedSpaces = currentSpaces.filter(space => !spacePair.includes(space));

    // 1) 상태 업데이트: storageSpaces
    setStorageSpaces((prev) => ({
      ...prev,
      [selectedFloor]: updatedSpaces
    }));

    // 2) DB 업데이트: spaceMeta
    const floorDocRef = doc(shuttlepickFirestore, "spaceMeta", `${selectedFloor}층`);
    await setDoc(floorDocRef, { spaces: updatedSpaces });

    // 3) Firestore: storageData에서 공간 필드 삭제
    const dataDocRef = doc(shuttlepickFirestore, "storageData", `${selectedFloor}층`);
    const deleteOps = {};
    spacePair.forEach((space) => {
      deleteOps[space] = deleteField(); // 필드를 삭제하는 명령
    });
    await updateDoc(dataDocRef, deleteOps);

    // 4) 상태 업데이트: storageData
    setStorageData((prev) => {
      const updatedData = { ...prev[selectedFloor] };
      spacePair.forEach(space => {
        delete updatedData[space];
      });

      return {
        ...prev,
        [selectedFloor]: updatedData
      };
    });

    alert(`🗑️ ${spacePair.join(", ")} 공간이 삭제되었습니다.`);
  };


  return (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-auto">
        {storageSpaces[selectedFloor].map((space) => (
          <div
            key={space}
            className={`relative border p-6 cursor-pointer rounded-lg flex flex-col justify-center items-center text-center text-base sm:text-lg md:text-xl font-semibold 
              w-[100px] sm:w-[150px] md:w-[180px] lg:w-[350px] 
              h-[80px] sm:h-[100px] md:h-[120px] lg:h-[200px]
              ${selectedSpace === (selectedFloor === 2 ? `${space}` : space) ? "bg-green-400 text-white" : "bg-gray-200 text-black"
            }`}
            onClick={() => setSelectedSpace(selectedFloor === 2 ? `${space}` : space)}
          >
            <h2>{selectedFloor === 2 ? `${space}` : space} 공간</h2>
            {storageData[selectedFloor][space] ? (
              <p className="mt-2">
                {storageData[selectedFloor][space].name} - {storageData[selectedFloor][space].quantity}개
              </p>
            ) : (
              <p className="text-gray-500">비어 있음</p>
            )}
            <p className="absolute top-0 right-0 z-15 p-4"
              onClick={(e) => {
                e.stopPropagation(); //부모 div 클릭 막기
                deleteSpace(space);
              }}
            >&#10005;</p>	

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
