"use client";

import React, { useState } from "react";
import Image from "next/image";
import BluetoothService from "./bluetoothService"; // ✅ BluetoothService 불러오기

export default function BluetoothConnect() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [receivedData, setReceivedData] = useState("");

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

      // ✅ BluetoothService에 블루투스 characteristic 저장
      BluetoothService.setCharacteristic(characteristic);

      setDeviceName(device.name || "알 수 없는 장치");
      setIsConnected(true);
      console.log("Bluetooth 연결 성공:", device.name);
    } catch (error) {
      console.error("Bluetooth 연결 실패", error);
    }
    setIsConnecting(false);
  }

  function disconnectBluetooth() {
    setIsConnected(false);
    setDeviceName("");
    setReceivedData("");
  }

  function closeModalOutsideClick(event) {
    if (event.target.id === "modalOverlay") {
      setIsOpen(false);
    }
  }

  return (
    <>
      {/* 블루투스 아이콘 버튼 (화면 왼쪽 아래로 이동) */}
      <button
        className={`p-2 rounded-full fixed left-4 bottom-4 ${
          isConnected ? "bg-yellow-500" : "bg-white"
        }`}
        onClick={() => setIsOpen(true)}
      >
        <Image src="/bluetooth.svg" alt="Bluetooth Icon" width={24} height={24} />
      </button>

      {/* 모달 창 (Next.js 기본 방식) */}
      {isOpen && (
        <div
          id="modalOverlay"
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModalOutsideClick}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-80" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg text-black font-bold mb-4">Bluetooth 연결</h2>

            {isConnecting ? (
              <div className="flex justify-center items-center">
                <Image src="/기어로딩.gif" alt="Loading..." width={100} height={100} />
              </div>
            ) : isConnected ? (
              <>
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg" onClick={disconnectBluetooth}>
                  Bluetooth 연결 해제
                </button>
                <p className="mt-2">연결된 장치: {deviceName}</p>
                <p>수신 데이터: {receivedData || "데이터 없음"}</p>
              </>
            ) : (
              <button className="w-full bg-blue-500 text-white py-2 rounded-lg" onClick={connectBluetooth}>
                Bluetooth 연결
              </button>
            )}

            <button className="w-full mt-4 bg-gray-500 py-2 rounded-lg" onClick={() => setIsOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
