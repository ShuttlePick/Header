"use client";

export default class BluetoothService {
  // ✅ 공간 매핑: 창고의 A1, A2, B1, B2 각 공간의 좌표 정보 저장
  static spaceMapping = {
    "A1": { Line: 1, Floor: 1, Way: 1 },
    "A2": { Line: 2, Floor: 1, Way: 1 },
    "B1": { Line: 1, Floor: 1, Way: 2 },
    "B2": { Line: 2, Floor: 1, Way: 2 },
    "A1_2F": { Line: 1, Floor: 2, Way: 1 },
    "A2_2F": { Line: 2, Floor: 2, Way: 1 },
    "B1_2F": { Line: 1, Floor: 2, Way: 2 },
    "B2_2F": { Line: 2, Floor: 2, Way: 2 }
  };

  // ✅ Bluetooth characteristic 저장 (데이터 전송을 위한 GATT 특성)
  static characteristic = null;

  /**
   * ✅ 블루투스 연결 시 `characteristic`을 저장하는 함수
   * @param {BluetoothRemoteGATTCharacteristic} char - 블루투스 GATT 특성 값
   */
  static setCharacteristic(char) {
    this.characteristic = char;
  }

  /**
   * ✅ JSON 데이터를 블루투스로 전송하는 함수
   * @param {Object} command - JSON 명령 데이터
   */
  static async sendBluetoothData(command) {
    if (!this.characteristic) {
        console.error("❌ Bluetooth가 연결되지 않았습니다. 데이터를 전송할 수 없습니다.");
        return;
    }

    try {
        const encoder = new TextEncoder();
        const message = JSON.stringify(command) + "\n";  // 🔥 개행 추가
        console.log("📡 Bluetooth 송신 중 (개행 포함)...:", JSON.stringify({ message }));
        await this.characteristic.writeValue(encoder.encode(message));
        console.log("✅ Bluetooth 데이터 전송 완료 (개행 포함):", JSON.stringify({ message }));
    } catch (error) {
        console.error("❌ Bluetooth 전송 실패:", error);
    }
  }
  

  /**
   * ✅ STM32로 이동 명령을 전송하는 함수
   * @param {string} action - "Picking" (가져오기) 또는 "Placing" (입고)
   * @param {string} space - "A1", "A2", ..., "B2_2F" (적재 공간)
   */
  static async sendCommand(action, space) {
    if (!this.spaceMapping[space]) {
      console.error("❌ 잘못된 공간 선택:", space);
      return;
    }

    // ✅ 전송할 JSON 데이터 생성
    const command = {
      Type: "Move",
      Action: action,
      ...this.spaceMapping[space] // 선택된 공간의 좌표 정보 포함
    };

    // ✅ 콘솔 로그 + 블루투스 전송
    console.log("📡 전송할 JSON 데이터:", JSON.stringify(command, null, 2));
    await this.sendBluetoothData(command);  // ✅ 블루투스로 데이터 전송
  }

  /**
   * ✅ STM32로 비상정지 명령을 전송하는 함수
   * @param {number} state - 1: 정지, 0: 해제
   */
  static async sendEmergencyCommand(state) {
    const command = {
      Type: "Emergency",
      Emergency: state // 1 (정지) 또는 0 (해제)
    };

    // ✅ 콘솔 로그 + 블루투스 전송
    console.log("🚨 전송할 비상정지 데이터:", JSON.stringify(command, null, 2));
    await this.sendBluetoothData(command);  // ✅ 블루투스로 데이터 전송
  }
}

