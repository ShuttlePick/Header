'use client';

export function sortByLFU(outboundArray) {
  // 1. name별 사용 횟수 계산
  const nameFrequency = {};
  outboundArray.forEach((item) => {
    const name = item.name;
    nameFrequency[name] = (nameFrequency[name] || 0) + 1;
  });

  // 2. 출고 데이터를 name 빈도 기준으로 내림차순 정렬
  const sorted = [...outboundArray].sort((a, b) => {
    const freqA = nameFrequency[a.name];
    const freqB = nameFrequency[b.name];
    return freqB - freqA; // 많이 나온 name이 먼저
  });

  return sorted;
}
