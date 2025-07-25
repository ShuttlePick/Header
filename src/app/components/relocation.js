'use client';

import { shuttlepickFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { sortByLFU } from "./LFU";
import checkBlankSpace from "./checkStorageBlank";


function comparePriority(a, b, selectedLine) {
    const idA = typeof a === "string" ? a : a.id;
    const idB = typeof b === "string" ? b : b.id;

    const [floorA, locA] = idA.split('-');
    const [floorB, locB] = idB.split('-');

    const numA = parseInt(locA.slice(1), 10);
    const numB = parseInt(locB.slice(1), 10);

    if(numA !== numB) return numA - numB; // 1️⃣ 숫자 우선
    if(floorA !== floorB) return floorA === "1층" ? -1 : 1; //2️⃣1층 우선
    const lineA = locA[0];
    const lineB = locB[0];

    if(lineA !== lineB) {
        return lineA === selectedLine ? -1 : 1;
    }

    return 0;
    // return locA[0].localeCompare(locB[0]); // 알파벳 비교
}

export default async function Relocation(selectedItem) {
    const selectedLine = selectedItem.id.split('-')[1][0];
    
    /*우선순위 :
    1. 숫자가 작을수록 우선
    2. 층 (1층이 2층보다 우선)
    3. 알파벳 (A가 B보다 우선)
    */

    console.log("파라미터로 받은 selectedItem : ", selectedItem);
    // {id: '1층-A1', name: '딸기바나나', quantity: 40}

   const blankspaces = await checkBlankSpace(); // 빈 공간 찾기
   // ['1층-B1', '2층-A1', '1층-A2', '2층-A2', '1층-A3', '2층-B3']
   
   // 출고 데이터 가져와서 많은 순대로 정렬 ************************************************
    const docRef = doc(shuttlepickFirestore, "outboundData", "outboundData");
    const outboundSnap = await getDoc(docRef);

    if(!outboundSnap.exists()) {
        console.log("⚠️outboundData 문서가 없습니다.");
        return [];
    }
    
    const outboundArray = outboundSnap.data().outboundData || [];
    console.log("🎯🎯🎯outboundData 실시간 데이터:", outboundArray);
    
    // LFU 알고리즘 정렬
    const sorted = sortByLFU(outboundArray);
    console.log("🎯🎯정렬된 sortedItems : ", sorted);
    
    // 필요한 데이터만 뽑아서 새 배열 생성
    const minimalArray = sorted.map(item => ({
        // id: `${item.floor}-${item.location}`,
        name: item.name
    }));
    
    // storageData에서 최신 위치 매핑
    const floors = ["1층", "2층"];
    const latestPositions = {}; // { name: { id : "1층-A1", quantity: 10} }

    for (const floor of floors) {
        const floorDoc = doc(shuttlepickFirestore, "storageData", floor);
        const floorSnap = await getDoc(floorDoc);

        if (floorSnap.exists()) {
            const data = floorSnap.data();
            Object.keys(data).forEach(space => {
                const item = data[space];
                if (item && item.name) {
                    latestPositions[item.name] = {
                        id: `${floor}-${space}`,
                        quantity: item.quantity   
                    }
                }
            });
        }
    }

    const uniqueArray = Array.from(
        new Map(minimalArray.map(item => [
            item.name, // key = name
            {
                id: latestPositions[item.name] || "알수없음", // 최신 위치
                name: item.name, 
                quantity: latestPositions[item.name]?.quantity || 0
            }
        ])).values()
    );
    console.log("🎯최종 uniqueArray:", uniqueArray);

    // 중복 제거 (floor + location + name 조합이 같으면 한 번만)
    // const uniqueArray = Array.from(
    //     new Map(minimalArray.map(item => [
    //         `${item.id}-${item.name}`, // key
    //         item                                          // value
    //     ])).values()
    // );

    /*
    [
        { id: "2층-B1", name: "목공풀" },
        { id: "1층-B2", name: "마우스패드" },
        { id: "1층-B3", name: "우산" },
        { id: "2층-B2", name: "스티커" },
        { id: "2층-A3", name: "키링" },
        { id: "1층-A1", name: "딸기바나나" }
    ]
    */
    // ***************************************************************************************
    // ✅ 재배치 로직 시작

    let newId = selectedItem.id;

    const currentIndex = uniqueArray.findIndex(item => item.name === selectedItem.name);

    if (currentIndex === 0) {
        // name이 uniqueArray의 첫 번째라면 blankspaces 맨 앞 사용

        if(blankspaces.length > 0) {
            newId = blankspaces[0];
        }
        
    } else if (currentIndex > 0) {
        const prevItemId = uniqueArray[currentIndex - 1].id;

        // prevItem보다 selectedItem이 우선순위 낮은지 확인
        if (comparePriority(selectedItem.id, prevItemId, selectedLine) > 0) {
            // blankspaces 중 prevItem보다 우선순위 낮고 selectedItem보다 높은 첫 공간 찾기
            const replacement = blankspaces.find(blankId =>
                comparePriority(blankId, prevItemId, selectedLine) > 0 &&
                comparePriority(blankId, selectedItem.id, selectedLine) < 0
            );

            if (replacement) {
                newId = replacement;
            }
        }
    }

    console.log(`📦 재배치 결과: ${selectedItem.id} → ${newId}`);

    return {
        ...selectedItem,
        id: newId,
        quantity: uniqueArray.find(item => item.name === selectedItem.name)?.quantity || selectedItem.quantity,
    };


}