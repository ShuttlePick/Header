'use client';

import { shuttlepickFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { sortByLFU } from "./LFU";
import checkBlankSpace from "./checkStorageBlank";


export default async function Relocation(selectedItem) {
    
    /*우선순위 :
    1. 숫자가 작을수록 우선
    2. 층 (1층이 2층보다 우선)
    3. 알파벳 (A가 B보다 우선)
    */

    console.log("파라미터로 받은 selectedItem : ", selectedItem);
    // {id: '1층-A1', name: '딸기바나나', quantity: 40}

   
   const blankspaces = checkBlankSpace(); // 빈 공간 찾기
   // ['1층-B1', '2층-A1', '1층-A2', '2층-A2', '1층-A3', '2층-B3']
   
   // 출고 데이터 가져와서 많은 순대로 정렬 *****************************
    const docRef = doc(shuttlepickFirestore, "outboundData", "outboundData");
    const outboundSnap = await getDoc(docRef);
    
    if(outboundSnap.exists()) {
        const outboundArray = outboundSnap.data().outboundData || [];
        console.log("🎯🎯🎯outboundData 실시간 데이터:", outboundArray);
        
        // LFU 알고리즘 정렬
        const sorted = sortByLFU(outboundArray);
        // setSortedItems(sorted);
        console.log("🎯🎯정렬된 sortedItems : ", sorted);
        
        // 필요한 데이터만 뽑아서 새 배열 생성
        const minimalArray = sorted.map(item => ({
            id: `${item.floor}-${item.location}`,
            // floor: item.floor,
            // location: item.location,
            name: item.name
        }));
        
        // 중복 제거 (floor + location + name 조합이 같으면 한 번만)
        const uniqueArray = Array.from(
            new Map(minimalArray.map(item => [
                `${item.id}-${item.name}`, // key
                item                                          // value
            ])).values()
        );
        console.log("🎯최종 uniqueArray:", uniqueArray);
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
       // ***************************************************************
           

        return uniqueArray;

    } else {
        console.log("outboundData 문서가 없습니다.");
        // setSortedItems([]);54 1
        return [];
    }


}