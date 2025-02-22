import Image from "next/image";
import Header from "./components/header";

export default function Home() {
  return (
    <div>
      {/* Header width:100px임 */}
      <Header></Header>
      <div className="monitoring-page">
        왼쪽에서 100px margin주고 시작
        모니터링페이지 home이자 모니터링페이지모니터링페이지
      </div>
    </div>
  );
}
