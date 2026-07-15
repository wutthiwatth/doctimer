# CPR Cycle Timer

Progressive Web App ภาษาไทยสำหรับจับเวลาหลายรายการพร้อมกันระหว่าง CPR แจ้งเตือนเมื่อใกล้ครบ/ครบเวลา เริ่มรอบใหม่อัตโนมัติ และเก็บ timeline บนอุปกรณ์โดยไม่บันทึกข้อมูลระบุตัวผู้ป่วย

> แอปนี้เป็นเครื่องมือช่วยจับเวลาและแจ้งเตือน ไม่ใช่อุปกรณ์ทางการแพทย์ และไม่ใช้แทนแนวทางการรักษา

## ความสามารถหลัก

- Timestamp-based Timer Engine ไม่ใช้ `setInterval` เป็นแหล่งความจริง
- หลาย Timer เริ่มพร้อมกัน แต่มีรอบและจำนวน cycle แยกกัน
- Pause/Resume, กู้คืน session หลัง reload และชดเชยรอบที่ผ่านไประหว่างอยู่เบื้องหลัง
- เสียง, Speech Synthesis, Vibration, Notification, Wake Lock และ full-screen alert พร้อม graceful fallback
- Group editor, session summary, timeline, history และ export JSON
- IndexedDB สำหรับข้อมูลหลัก; localStorage เฉพาะค่าตั้งค่าเล็ก ๆ
- Offline/PWA, dark mode, reduced motion และหน้าจอสัมผัสขนาดใหญ่

## Tech Stack

Vue 3, TypeScript strict, Composition API, Vite, Pinia, Vue Router, Tailwind CSS, vite-plugin-pwa, IndexedDB (`idb`), Lucide, Vitest และ Playwright

## เริ่มพัฒนา

```bash
npm install
npm run dev
```

ตรวจคุณภาพและ build:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Docker และ CapRover

```bash
docker build -t cpr-cycle-timer .
docker run --rm -p 8080:80 cpr-cycle-timer
```

Repository มี `captain-definition` พร้อม deploy แบบ Dockerfile บน CapRover เชื่อม repository หรืออัปโหลด tarball แล้วกำหนด HTTPS ให้โดเมนแอป

## ติดตั้ง PWA

- Android/Chrome: เปิดเมนู แล้วเลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอหลัก”
- iOS/Safari: กด Share แล้วเลือก “Add to Home Screen”

Notification, Wake Lock, vibration และการทำงานเบื้องหลังขึ้นกับ browser/OS; iOS อาจพัก JavaScript เมื่อปิดหน้าจอ ระบบจึงคำนวณเวลาจาก timestamp เมื่อกลับเข้าแอป ไม่สามารถรับประกันการแจ้งเตือนเมื่อระบบปิด PWA โดยสมบูรณ์ได้โดยไม่มี Web Push

## โครงสร้าง Timer Engine

`src/services/timer-engine` เป็น pure service รับ `Clock` abstraction จึงทดสอบเวลาได้โดยไม่ผูกกับ DOM ทุกครั้งที่ refresh UI จะเทียบเวลาปัจจุบันกับ `nextTriggerAt` และหากพลาดหลายรอบจะสร้าง event ครบทุก scheduled cycle พร้อมแจ้งผู้ใช้เฉพาะเหตุการณ์ล่าสุด

เพิ่ม Timer ใหม่ผ่าน Group Editor หรือเพิ่ม `TimerDefinition` ใน `src/constants/defaults.ts` สำหรับค่าเริ่มต้น การเพิ่มภาษาใหม่ให้แยกข้อความ UI ไปยัง `src/i18n/<locale>.ts` แล้วผูก locale setting (รุ่นนี้เตรียมโครงสร้างชนิดข้อมูลไว้ แต่ UI ใช้ไทยเป็นค่าเริ่มต้น)

## Roadmap

Backend/API adapter, ระบบสมาชิก, sync หลายอุปกรณ์, Web Push และ i18n ภาษาอังกฤษ โดยต้องไม่ทำให้ Timer Engine หยุดเมื่อ API ภายนอกล้มเหลว
