// 'use client'
// client component원하면 쓰기

import Link from "next/link"
import Image from "next/image"
import styles from "./header.module.css"

// (헤더 컴포넌트)
export default function Header() {
    return(
        <div className={styles.headerContainer}>
            <Link href='/'>
                <Image src="/images/ShuttlePickLogo_1_pngver.png" width={140} height={100} alt="ShuttlePick 로고"
                className={styles.logo}/>
            </Link>

            <nav>
                <ul>
                        <Link href='/'>
                            <li>모니터링</li>
                        </Link>
                    
                        <Link href='/inbound'>
                            <li>입고</li>
                        </Link>
                    
                        <Link href='/outbound'>
                            <li>출고</li>
                        </Link>
                </ul>
            </nav>
        </div>
    )
}