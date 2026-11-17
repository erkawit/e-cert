# e-Certificate (e-Cert) System

ระบบจัดทำและพิมพ์หนังสือรับรองการอบรมอิเล็กทรอนิกส์ (Next.js + Supabase + Vercel)

## การตั้งค่าฐานข้อมูล Supabase

1. เปิด **SQL Editor** ในโปรเจกต์ Supabase (`https://vvzbsfvigsllnoktknve.supabase.co`)
2. รันไฟล์ `supabase/schema.sql` เพื่อสร้างตารางทั้ง 10 ตาราง, RLS Policies และ Storage Buckets (`cert`, `sign`)
3. รันไฟล์ `supabase/seed.sql` เพื่อนำเข้าข้อมูลตั้งต้นทั้งหมดจากระบบเดิม

## Environment Variables (สำหรับ Local และ Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=https://vvzbsfvigsllnoktknve.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xlKVojG1MyalCDSV5kU_qA_BLQdzTTX
```

## การรันในเครื่อง (Local Development)

```bash
npm install
npm run dev
```

## การ Deploy บน Vercel

1. Push โค้ดขึ้น GitHub (`https://github.com/erkawit/e-cert.git`)
2. Import Repository ใน Vercel
3. เพิ่ม Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. กด **Deploy**
