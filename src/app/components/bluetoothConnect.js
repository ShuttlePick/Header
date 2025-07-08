"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import BluetoothService from "./bluetoothService";

export default function BluetoothConnect() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [receivedData, setReceivedData] = useState("");
  const receiveBufferRef = useRef(""); 


  useEffect(() => {
    async function reconnectIfPossible() {
      if (!navigator.bluetooth.getDevices) return;

      setIsConnecting(true);

      const devices = await navigator.bluetooth.getDevices();
      if (devices.length === 0) {
        setIsConnecting(false);
        return;
      }

      const device = devices[0];
      setDeviceName(device.name || "알 수 없는 장치");

      if (device.gatt?.connected) {
        console.log("🔁 자동 재연결 시작");

        try {
          const server = await device.gatt.connect(); 
          const service = await server.getPrimaryService("0000ffe0-0000-1000-8000-00805f9b34fb");
          const characteristic = await service.getCharacteristic("0000ffe1-0000-1000-8000-00805f9b34fb");

          characteristic.removeEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);
          characteristic.addEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);

          await characteristic.startNotifications();

          BluetoothService.setCharacteristic(characteristic);
          setIsConnected(true);
          console.log("✅ 자동 재연결 완료");
        } catch (err) {
          console.warn("❌ 자동 재연결 실패", err);
        }
      }

      setIsConnecting(false); // 
    }

    reconnectIfPossible();
  }, []);




  /**
   * ✅ Bluetooth 데이터 수신 핸들러
   */
  function handleCharacteristicValueChanged(event) {
    //console.log("🛠 데이터 수신 이벤트 실행됨");

    const target = event.target || this;
    if (!target || !target.value) {
        console.warn("⚠ Bluetooth 데이터 없음");
        return;
    }

    const rawValue = target.value;
    //console.log("📩 수신된 원본 데이터:", new Uint8Array(rawValue.buffer));  // 바이트 데이터 확인
    //const value = new TextDecoder().decode(rawValue);
    //console.log("📩 Bluetooth 데이터 수신:", value);
    //setReceivedData(value);

    const chunk = new TextDecoder().decode(rawValue); // 조각 문자열
    console.log("📩 조각 수신:", chunk);

    receiveBufferRef.current += chunk;

    // 메시지 끝이 개행 문자 '\n'이라면 메시지 완성으로 간주
    let lines = receiveBufferRef.current.split("\n");
    while (lines.length > 1) {
      const completeMessage = lines.shift(); // 첫 번째 줄 완성
      if (completeMessage.trim()) {
        console.log("전체 수신 메시지:", completeMessage);
        setReceivedData(completeMessage); // 혹은 메시지 처리
      }
    }

    receiveBufferRef.current = lines[0];

  }

  /**
   * ✅ Bluetooth 연결 함수
   */
  async function connectBluetooth() {
    setIsConnecting(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["0000ffe0-0000-1000-8000-00805f9b34fb"],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService("0000ffe0-0000-1000-8000-00805f9b34fb");
      const characteristic = await service.getCharacteristic("0000ffe1-0000-1000-8000-00805f9b34fb");

      characteristic.removeEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);
      characteristic.addEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);
      await characteristic.startNotifications();

      BluetoothService.setCharacteristic(characteristic);
      setDeviceName(device.name || "알 수 없는 장치");
      setIsConnected(true);
      console.log("✅ Bluetooth 연결 성공:", device.name);
    } catch (error) {
      console.error("❌ Bluetooth 연결 실패:", error);
    }
    setIsConnecting(false);
  }

  /**
   * ✅ Bluetooth 연결 해제 함수
   */
  async function disconnectBluetooth() {
    if (BluetoothService.characteristic) {
      try {
        const characteristic = BluetoothService.characteristic;
        await characteristic.stopNotifications();
        characteristic.removeEventListener("characteristicvaluechanged", handleCharacteristicValueChanged);

        const device = characteristic.service.device;
        if (device.gatt.connected) {
          await device.gatt.disconnect();
          console.log("✅ Bluetooth 연결이 해제되었습니다.");
        } else {
          console.log("⚠️ Bluetooth 장치가 이미 해제된 상태입니다.");
        }
      } catch (error) {
        console.error("❌ Bluetooth 연결 해제 실패:", error);
      } finally {
        BluetoothService.characteristic = null;
      }
    }

    setIsConnected(false);
    setDeviceName("");
    setReceivedData("");
  }

  /**
   * ✅ 모달창 외부 클릭 시 닫기
   */
  function closeModalOutsideClick(event) {
    if (event.target.id === "modalOverlay") {
      setIsOpen(false);
    }
  }

  return (
    <>
      {/* ✅ 블루투스 아이콘 버튼 */}
      <button
        className={`p-2 rounded-full fixed left-4 bottom-4 ${
          isConnected ? "bg-yellow-500" : "bg-white"
        }`}
        onClick={() => setIsOpen(true)}
      >
        <Image src="/bluetooth.svg" alt="Bluetooth Icon" width={24} height={24} />
      </button>

      {/* ✅ 블루투스 연결 모달창 */}
      {isOpen && (
        <div
          id="modalOverlay"
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModalOutsideClick} // ✅ 배경 클릭하면 닫힘
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-80" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg text-black font-bold mb-4">Bluetooth 연결</h2>

            {/* ✅ 연결 시도 중일 때 로딩 GIF 표시 */}
            {isConnecting ? (
              <div className="flex justify-center items-center">
                <Image src="/기어로딩1.gif" alt="Loading..." width={100} height={100} />
              </div>
            ) : isConnected ? (
              <>
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg" onClick={disconnectBluetooth}>
                  Bluetooth 연결 해제
                </button>
                <p>연결된 장치: {deviceName}</p>
                <p>수신 데이터: {receivedData || "데이터 없음"}</p>
              </>
            ) : (
              <button className="w-full bg-blue-500 text-white py-2 rounded-lg" onClick={connectBluetooth}>
                Bluetooth 연결
              </button>
            )}

            {/* ✅ 닫기 버튼 추가 */}
            <button className="w-full mt-4 bg-gray-500 text-white py-2 rounded-lg" onClick={() => setIsOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}

