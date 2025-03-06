"use client"; // ✅ Next.js에서 클라이언트 측에서 실행되는 컴포넌트임을 명시

import React, { useState } from "react"; // ✅ React 및 useState 훅 불러오기 (상태 관리)
import Image from "next/image"; // ✅ Next.js 최적화된 이미지 컴포넌트 사용
import BluetoothService from "./bluetoothService"; // ✅ Bluetooth 통신을 담당하는 서비스 모듈 불러오기

export default function BluetoothConnect() {
  // ✅ 블루투스 모달창 열림/닫힘 상태
  const [isOpen, setIsOpen] = useState(false);

  // ✅ 블루투스 연결 시도 중 여부
  const [isConnecting, setIsConnecting] = useState(false);

  // ✅ 블루투스 연결 여부
  const [isConnected, setIsConnected] = useState(false);

  // ✅ 연결된 블루투스 장치 이름
  const [deviceName, setDeviceName] = useState("");

  // ✅ 블루투스로부터 받은 데이터
  const [receivedData, setReceivedData] = useState("");

  /**
   * ✅ 블루투스 연결 함수
   * - 사용자가 블루투스 장치를 선택하면 연결을 시도함.
   * - GATT 서버와 서비스를 설정하고, characteristic을 BluetoothService에 저장함.
   */
  async function connectBluetooth() {
    setIsConnecting(true); // ⏳ 연결 중 상태로 변경
    try {
      // ✅ 사용자가 블루투스 장치를 선택할 수 있도록 요청
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, // ⚠️ 모든 블루투스 장치를 검색할 수 있도록 설정
        optionalServices: ["0000ffe0-0000-1000-8000-00805f9b34fb"], // ✅ 원하는 서비스 UUID 추가 (블루투스 장치에서 특정 서비스 사용)
      });

      // ✅ 블루투스 장치와 GATT 서버 연결
      const server = await device.gatt.connect();

      // ✅ 블루투스 장치의 특정 서비스 가져오기
      const service = await server.getPrimaryService("0000ffe0-0000-1000-8000-00805f9b34fb");

      // ✅ 해당 서비스에서 데이터 송수신을 담당하는 characteristic 가져오기
      const characteristic = await service.getCharacteristic("0000ffe1-0000-1000-8000-00805f9b34fb");

      // ✅ BluetoothService에 블루투스 characteristic 저장 (데이터 송수신 가능)
      BluetoothService.setCharacteristic(characteristic);

      // ✅ 연결된 장치의 이름을 저장 (이름이 없을 경우 "알 수 없는 장치" 표시)
      setDeviceName(device.name || "알 수 없는 장치");

      // ✅ 연결 상태를 true로 변경하여 UI 업데이트
      setIsConnected(true);

      console.log("✅ Bluetooth 연결 성공:", device.name); // 🎉 성공 로그 출력
    } catch (error) {
      console.error("❌ Bluetooth 연결 실패:", error); // ⚠️ 에러 발생 시 콘솔에 출력
    }
    setIsConnecting(false); // ⏳ 연결 시도 완료 (성공/실패 여부 관계없이 상태 초기화)
  }

  /**
   * ✅ 블루투스 연결 해제 함수
   * - 블루투스 연결을 끊고 상태를 초기화함.
   */
  function disconnectBluetooth() {
    setIsConnected(false); // ❌ 연결 상태 해제
    setDeviceName(""); // 📡 장치 이름 초기화
    setReceivedData(""); // 📡 수신 데이터 초기화
  }

  /**
   * ✅ 모달창 외부를 클릭하면 닫는 함수
   */
  function closeModalOutsideClick(event) {
    if (event.target.id === "modalOverlay") {
      setIsOpen(false); // 🛑 모달 닫기
    }
  }

  return (
    <>
      {/* ✅ 블루투스 아이콘 버튼 (화면 왼쪽 아래에 위치) */}
      <button
        className={`p-2 rounded-full fixed left-4 bottom-4 ${
          isConnected ? "bg-yellow-500" : "bg-white" // ✅ 연결 상태에 따라 버튼 색상 변경 (연결됨: 노란색, 연결 안 됨: 흰색)
        }`}
        onClick={() => setIsOpen(true)} // ✅ 클릭 시 모달 열기
      >
        <Image src="/bluetooth.svg" alt="Bluetooth Icon" width={24} height={24} /> {/* ✅ 블루투스 아이콘 표시 */}
      </button>

      {/* ✅ 블루투스 연결 모달창 (Next.js 기본 방식) */}
      {isOpen && ( // ✅ 모달창이 열려 있을 때만 렌더링
        <div
          id="modalOverlay"
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" // ✅ 반투명 배경 설정
          onClick={closeModalOutsideClick} // ✅ 배경 클릭 시 모달 닫기
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-80" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg text-black font-bold mb-4">Bluetooth 연결</h2>

            {isConnecting ? ( // ✅ 연결 중일 때 로딩 화면 표시
              <div className="flex justify-center items-center">
                <Image src="/기어로딩.gif" alt="Loading..." width={100} height={100} /> {/* ✅ 로딩 GIF 표시 */}
              </div>
            ) : isConnected ? ( // ✅ 연결 성공 후 UI 표시
              <>
                {/* ✅ 블루투스 연결 해제 버튼 */}
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg" onClick={disconnectBluetooth}>
                  Bluetooth 연결 해제
                </button>

                {/* ✅ 연결된 장치 이름 및 수신 데이터 표시 */}
                <p className="mt-2">연결된 장치: {deviceName}</p>
                <p>수신 데이터: {receivedData || "데이터 없음"}</p> {/* ✅ 데이터 없을 경우 "데이터 없음" 표시 */}
              </>
            ) : ( // ✅ 연결되지 않은 상태일 때 UI 표시
              <button className="w-full bg-blue-500 text-white py-2 rounded-lg" onClick={connectBluetooth}>
                Bluetooth 연결
              </button>
            )}

            {/* ✅ 닫기 버튼 */}
            <button className="w-full mt-4 bg-gray-500 py-2 rounded-lg" onClick={() => setIsOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
