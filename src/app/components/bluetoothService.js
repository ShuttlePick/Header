"use client";

export default class BluetoothService {
  // ✅ 공간 매핑: 창고의 공간을 박스 번호로 변환
  static spaceMapping = {
    "A1": 1, "A2": 3, "B1": 2, "B2": 4,
    "A1_2F": 5, "A2_2F": 7, "B1_2F": 6, "B2_2F": 8
  };

  // ✅ Bluetooth characteristic 저장
  static characteristic = null;

  /**
   * ✅ 블루투스 연결 시 `characteristic`을 저장하는 함수
   * @param {BluetoothRemoteGATTCharacteristic} char - 블루투스 GATT 특성 값
   */
  static setCharacteristic(char) {
    this.characteristic = char;
  }

  /**
   * ✅ 블루투스로 데이터 전송하는 함수 (JSON 대신 축약된 문자열)
   * @param {string} message - 전송할 명령 (예: "P1", "R8", "E1")
   */
  static async sendBluetoothData(message) {
    if (!this.characteristic) {
        console.error("❌ Bluetooth가 연결되지 않았습니다. 데이터를 전송할 수 없습니다.");
        return;
    }

    try {
        const encoder = new TextEncoder();
        console.log("📡 Bluetooth 송신 중...", message);
        await this.characteristic.writeValue(encoder.encode(message + "\n"));  // 🔥 개행 추가
        console.log("✅ Bluetooth 데이터 전송 완료:", message);
    } catch (error) {
        console.error("❌ Bluetooth 전송 실패:", error);
    }
  }

  /**
   * ✅ STM32로 이동 명령을 전송하는 함수
   * @param {string} action - "Picking" (가져오기) 또는 "Return" (되돌리기)
   * @param {string} space - "A1", "A2", ..., "B2_2F" (적재 공간)
   */
  static async sendCommand(action, space) {
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
    const command = `E${state}`;  // "E0" (해제) 또는 "E1" (정지)

    console.log("🚨 전송할 비상정지 명령:", command);
    await this.sendBluetoothData(command);
  }
   // ✅ 일시중지 명령어 전송
  static async sendPauseCommand() {
    try {
      console.log("⏸️ 일시중지 명령 전송: S");
      await this.sendBluetoothData("S");
      console.log("✅ 일시중지 완료");
    } catch (error) {
      console.error("❌ 일시중지 실패:", error);
    }
  }

  // ✅ 다시출발 명령어 전송
  static async sendResumeCommand() {
    try {
      console.log("▶️ 다시출발 명령 전송: C");
      await this.sendBluetoothData("C");
      console.log("✅ 다시출발 완료");
    } catch (error) {
      console.error("❌ 다시출발 실패:", error);
    }
  }

  // ✅ 복귀 명령어 전송
  static async sendReturnCommand() {
    try {
      console.log("↩️ 복귀 명령 전송: B");
      await this.sendBluetoothData("B");
      console.log("✅ 복귀 완료");
    } catch (error) {
      console.error("❌ 복귀 실패:", error);
    }
  }
}