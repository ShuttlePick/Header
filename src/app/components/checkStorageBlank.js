'use client'

import { shuttlepickFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default async function checkBlankSpace() {
    const floors = ["1층", "2층"];
    const blankSpaces = [];

    for (const floor of floors) {
        const docRef = doc(shuttlepickFirestore, "storageData", floor);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
        console.warn(`⚠️ ${floor} 문서가 없습니다.`);
        continue;
        }

        const data = docSnap.data();
        let spaceList = [];

        const metaRef = doc(shuttlepickFirestore, "spaceMeta", floor);
        const metaSnap = await getDoc(metaRef);

        if (metaSnap.exists()) {
        spaceList = metaSnap.data().spaces; // ex: ["A1", "B1", "A2", "B2", ...]
        } else {
        console.warn(`⚠️ ${floor}의 spaceMeta 문서가 없습니다.`);
        }

        spaceList.forEach((space) => {
        if (!data[space]) {
            blankSpaces.push(`${floor}-${space}`); // "1층-A1" 형태로 추가
        }
        });
    }

    // ✅ 정렬: 숫자 > 층 > 알파벳
    blankSpaces.sort((a, b) => {
        const [floorA, spaceA] = a.split("-");
        const [floorB, spaceB] = b.split("-");

        const numA = parseInt(spaceA.slice(1), 10);
        const numB = parseInt(spaceB.slice(1), 10);

        if (numA !== numB) return numA - numB; // 1️⃣ 숫자 비교
        if (floorA !== floorB) return floorA === "1층" ? -1 : 1; // 2️⃣ 층 비교
        return spaceA[0].localeCompare(spaceB[0]); // 3️⃣ 알파벳 비교 (A < B)
    });

    console.log("📦 정렬된 빈 공간 리스트:", blankSpaces);
    return blankSpaces;
}