'use client'

import { useState, useEffect } from "react";

import Image from "next/image";
import styles from "./page.module.css"

export default function Monitoring() {

  const [selectedFloor, setSelectedFloor] = useState("1층");
  const [boxData, setBoxData] = useState({"A열" : [], "B열" : []})

  const productData = {
    "1층" : {
      "A열" : [
        {name : "물품1",count : 10},
        {name : "물품2",count : 20},
      ],
      "B열" : [
        {name : "물품3",count : 15},
        {name : "물품4",count : 30},
      ]
    },
    "2층" : {
      "A열" : [
        {name : "물품5",count : 22},
        {name : "물품6",count : 30},
      ],
      "B열" : [
        {name : "물품7",count : 13},
        {name : "물품8",count : 20},
      ]
    }
  };

  const inboundData = [
    {name : "물품1",count : 10},
    {name : "물품2",count : 20},
    {name : "물품3",count : 15},
    {name : "물품4",count : 30},
    {name : "물품5",count : 22},
    {name : "물품6",count : 30},
    {name : "물품7",count : 13},
    {name : "물품8",count : 20}];

  const outboundData = [{name: "물품3", count: 3}, {name: "물품4", count: 2}, {name: "물품6", count: 5},];

  useEffect(()=> {
    setBoxData(productData[selectedFloor])
  }, [selectedFloor]);

  return (
    <div className={styles.monitoringPage}>
      <div className={styles.divContainer}>

        {/* 층 선택 버튼 ========================= */}
        <div className={styles.floorBtnContainer}>
          <button onClick={()=>{
            setSelectedFloor("1층")
          }} className={selectedFloor==="1층" ? styles.floorBtnClick : ""}>1층입니당</button>
          <button onClick={()=>{
            setSelectedFloor("2층")
          }} className={selectedFloor==="2층" ? styles.floorBtnClick : ""}>2층</button>
        </div>

        {/* A/B열 컨테이너 ====================== */}
        <div className={styles.boxContainer}>
          {/* A열 */}
          <div>
            <h3>A열</h3><br/>
            {boxData.A열.map((item, index) => {
              return (
              <div key={index} className={`${styles.box} ${styles[`box${index+1}`]}`}>
                <p>물품 이름 | {item.name}</p>
                <p>물품 개수 | {item.count}개</p>
              </div>
              )
            })}
          </div>

          {/* B열 */}
          <div>
            <h3>B열</h3><br/>
            {boxData.B열.map((item, index) => {
              return (
              <div key={index} className={`${styles.box} ${styles[`box${index+1}`]}`}>
                <p>물품 이름 | {item.name}</p>
                <p>물품 개수 | {item.count}개</p>
              </div>
              )
            })}
          </div>
        </div>

        {/* 입/출고 내역 ========================= */}
        <div className={styles.receiptContainer}>
          {/* 입고 내역 */}
          <div>
            <h3>입고 내역</h3><br/>
            <div className={styles.receipt}>
              {inboundData.map((item, index) => {
                return (
                  <p key={index}>{item.name} - {item.count}개</p>
                )
              })}
            </div>
          </div>

          {/* 출고 내역 */}
          <div>
            <h3>출고 내역</h3><br/>
            <div className={styles.receipt}>
              {outboundData.map((item, index) => {
                return (
                  <p key={index}>{item.name} - {item.count}개</p>
                )
              })}
            </div>
          </div>
        </div>

      </div> 
    </div>
  );
}
