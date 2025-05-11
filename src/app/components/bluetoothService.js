"use client";

export default class BluetoothService {
  // ✅ 공간 매핑 (자동 번호 할당)
  static spaceMapping = {
    "A1": 1, "A2": 2, "B1": 3, "B2": 4,
    "A1_2F": 5, "A2_2F": 6, "B1_2F": 7, "B2_2F": 8
  };

  // ✅ 최대 공간 번호 (기존 공간 포함)
  static maxSpaceNumber = Object.keys(this.spaceMapping).length;

  // ✅ Bluetooth characteristic 저장
  static characteristic = null;

  /**
   * ✅ Bluetooth characteristic 설정
   * @param {BluetoothRemoteGATTCharacteristic} char - 블루투스 GATT 특성 값
   */
  static setCharacteristic(char) {
    this.characteristic = char;
  }

  /**
   * ✅ 새로운 공간을 등록하는 함수
   * @param {string} space - 새로운 공간 (예: "A1", "B2", "A3_2F")
   */
  static addSpace(space) {
    // 이미 등록된 공간이면 추가하지 않음
    if (!this.spaceMapping[space]) {
      this.maxSpaceNumber += 1;
      this.spaceMapping[space] = this.maxSpaceNumber;
      console.log(`✅ 새로운 공간 추가됨: ${space} → ${this.maxSpaceNumber}`);
    }
  }

  /**
   * ✅ STM32로 이동 명령을 전송하는 함수
   * @param {string} action - "Picking" (가져오기) 또는 "Return" (되돌리기)
   * @param {string} space - "A1", "B1", ..., "B2_2F" (적재 공간)
   */
  static async sendCommand(action, space) {
    // ✅ 새로운 공간 자동 등록
    this.addSpace(space);

    if (!this.spaceMapping[space]) {
      console.error("❌ 잘못된 공간 선택:", space);
      return;
    }

    // ✅ P (가져오기) 또는 R (되돌리기) + 공간 번호
    const command = `${action === "Picking" ? "P" : "R"}${this.spaceMapping[space]}`;
    console.log("📡 전송할 명령:", command);
    await this.sendBluetoothData(command);
  }

  /**
   * ✅ STM32로 비상정지 명령을 전송하는 함수
   * @param {number} state - 1: 정지, 0: 해제
   */
  static async sendEmergencyCommand(state) {
    const command = `E${state}`;
    console.log("🚨 전송할 비상정지 명령:", command);
    await this.sendBluetoothData(command);
  }

  /**
   * ✅ Bluetooth로 데이터 전송하는 함수
   * @param {string} message - 전송할 명령
   */
  static async sendBluetoothData(message) {
    if (!this.characteristic) {
      console.error("❌ Bluetooth가 연결되지 않았습니다.");
      return;
    }

    try {
      const encoder = new TextEncoder();
      await this.characteristic.writeValue(encoder.encode(message + "\n"));
      console.log("✅ Bluetooth 데이터 전송 완료:", message);
    } catch (error) {
      console.error("❌ Bluetooth 전송 실패:", error);
    }
  }
}
