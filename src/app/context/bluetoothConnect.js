"use client";
import React, { createContext, useContext, useState } from "react";

const BluetoothContext = createContext(null);

export function BluetoothProvider({ children }) {
  const [deviceName, setDeviceName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);

  async function connectBluetooth() {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["0000ffe0-0000-1000-8000-00805f9b34fb"],
      });

      setDeviceName(device.name || "알 수 없는 장치");
      setBluetoothDevice(device);

      await device.gatt?.connect();
      setIsConnected(true);
    } catch (error) {
      console.error("Bluetooth 연결 실패", error);
    }
  }

  function disconnectBluetooth() {
    bluetoothDevice?.gatt?.disconnect();
    setIsConnected(false);
    setDeviceName("");
    setBluetoothDevice(null);
  }

  return (
    <BluetoothContext.Provider value={{ deviceName, isConnected, connectBluetooth, disconnectBluetooth }}>
      {children}
    </BluetoothContext.Provider>
  );
}

export function useBluetooth() {
  return useContext(BluetoothContext);
}
