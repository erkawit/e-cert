"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { supabase, UserRow, LookupRow } from "@/lib/supabase";

interface Props {
  user: UserRow;
  onUpdated: (u: UserRow) => void;
}

export function ProfileTab({ user, onUpdated }: Props) {
  const [fname, setFname] = useState(user._fname);
  const [lname, setLname] = useState(user._lname);
  const [password, setPassword] = useState(user._pass);
  const [frontName, setFrontName] = useState(user._front_name);
  const [position, setPosition] = useState(user._position);
  const [lposition, setLposition] = useState(user._lposition);
  const [part, setPart] = useState(user._part || "");

  const [frontNames, setFrontNames] = useState<LookupRow[]>([]);
  const [positions, setPositions] = useState<LookupRow[]>([]);
  const [lpositions, setLpositions] = useState<LookupRow[]>([]);
  const [parts, setParts] = useState<LookupRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("_front_name").select("*").eq("_use", "1"),
      supabase.from("_position").select("*").eq("_use", "1"),
      supabase.from("_lposition").select("*").eq("_use", "1"),
      supabase.from("_part").select("*").eq("_use", "1"),
    ]).then(([fn, pos, lpos, prt]) => {
      setFrontNames((fn.data as LookupRow[]) || []);
      setPositions((pos.data as LookupRow[]) || []);
      setLpositions((lpos.data as LookupRow[]) || []);
      setParts((prt.data as LookupRow[]) || []);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("_user")
        .update({
          _fname: fname.trim(),
          _lname: lname.trim(),
          _pass: password,
          _front_name: frontName,
          _position: position,
          _lposition: lposition,
          _part: part || null,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        alert("บันทึกไม่สำเร็จ: " + error.message);
        return;
      }
      sessionStorage.setItem("ecert_user", JSON.stringify(data));
      onUpdated(data as UserRow);
      alert("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">แก้ไขข้อมูลส่วนตัว</h2>
      <form onSubmit={handleSave} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              disabled
              value={user._user}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">คำนำหน้า</label>
            <select
              value={frontName}
              onChange={(e) => setFrontName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              {frontNames.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f._front_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อ</label>
            <input
              type="text"
              required
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">นามสกุล</label>
            <input
              type="text"
              required
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">ตำแหน่ง</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              {positions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p._position}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">ระดับ</label>
            <select
              value={lposition}
              onChange={(e) => setLposition(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              {lpositions.map((lp) => (
                <option key={lp.id} value={String(lp.id)}>
                  {lp._lposition}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">ฝ่าย/กลุ่มงาน</label>
            <select
              value={part}
              onChange={(e) => setPart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="">-- เลือก --</option>
              {parts.map((pt) => (
                <option key={pt.id} value={String(pt.id)}>
                  {pt._part}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </form>
    </div>
  );
}
