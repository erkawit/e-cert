"use client";

import { useEffect, useState } from "react";
import { UserPlus, Pencil, Loader2 } from "lucide-react";
import { supabase, UserRow, LookupRow } from "@/lib/supabase";

export function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [frontNames, setFrontNames] = useState<LookupRow[]>([]);
  const [positions, setPositions] = useState<LookupRow[]>([]);
  const [lpositions, setLpositions] = useState<LookupRow[]>([]);
  const [parts, setParts] = useState<LookupRow[]>([]);
  const [authLevels, setAuthLevels] = useState<LookupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUser, setEditingUser] = useState<Partial<UserRow> | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, fnRes, posRes, lposRes, prtRes, alRes] = await Promise.all([
        supabase.from("_user").select("*").order("id", { ascending: true }),
        supabase.from("_front_name").select("*"),
        supabase.from("_position").select("*"),
        supabase.from("_lposition").select("*"),
        supabase.from("_part").select("*"),
        supabase.from("_authentication_level").select("*"),
      ]);
      setUsers((uRes.data as UserRow[]) || []);
      setFrontNames((fnRes.data as LookupRow[]) || []);
      setPositions((posRes.data as LookupRow[]) || []);
      setLpositions((lposRes.data as LookupRow[]) || []);
      setParts((prtRes.data as LookupRow[]) || []);
      setAuthLevels((alRes.data as LookupRow[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lookup = (list: LookupRow[], id: string | null | undefined, field: keyof LookupRow) => {
    const found = list.find((item) => String(item.id) === String(id));
    return found ? String(found[field] || "") : "-";
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const payload = {
        _user: editingUser._user?.trim() || "",
        _pass: editingUser._pass || "",
        _front_name: editingUser._front_name || "1",
        _fname: editingUser._fname?.trim() || "",
        _lname: editingUser._lname?.trim() || "",
        _position: editingUser._position || "1",
        _lposition: editingUser._lposition || "1",
        _part: editingUser._part || null,
        _authentication_level: editingUser._authentication_level || "2",
      };

      const { error } = editingUser.id
        ? await supabase.from("_user").update(payload).eq("id", editingUser.id)
        : await supabase.from("_user").insert(payload);

      if (error) {
        alert("บันทึกผู้ใช้งานไม่สำเร็จ: " + error.message);
        return;
      }
      setEditingUser(null);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดรายชื่อผู้ใช้งาน...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">จัดการผู้ใช้งาน ({users.length} คน)</h2>
          <p className="text-xs text-slate-500">เพิ่มและแก้ไขข้อมูลผู้ใช้งานในระบบ</p>
        </div>
        <button
          onClick={() =>
            setEditingUser({
              _user: "",
              _pass: "",
              _front_name: String(frontNames[0]?.id || "1"),
              _fname: "",
              _lname: "",
              _position: String(positions[0]?.id || "1"),
              _lposition: String(lpositions[0]?.id || "1"),
              _part: String(parts[0]?.id || ""),
              _authentication_level: "2",
            })
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold"
        >
          <UserPlus className="w-4 h-4" /> เพิ่มผู้ใช้งาน
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                <th className="px-4 py-3">ตำแหน่ง</th>
                <th className="px-4 py-3">ฝ่าย/กลุ่มงาน</th>
                <th className="px-4 py-3">สิทธิ์</th>
                <th className="px-4 py-3 text-right">แก้ไข</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{u._user}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {lookup(frontNames, u._front_name, "_front_name")}
                    {u._fname} {u._lname}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {lookup(positions, u._position, "_position")}{" "}
                    {lookup(lpositions, u._lposition, "_lposition")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lookup(parts, u._part, "_part")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        String(u._authentication_level) === "1"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {lookup(authLevels, u._authentication_level, "_authentication_level")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5" /> แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingUser.id ? "แก้ไขข้อมูลผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={editingUser._user || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, _user: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={editingUser._pass || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, _pass: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">คำนำหน้า</label>
                  <select
                    value={editingUser._front_name || "1"}
                    onChange={(e) => setEditingUser({ ...editingUser, _front_name: e.target.value })}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อ *</label>
                  <input
                    type="text"
                    required
                    value={editingUser._fname || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, _fname: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    required
                    value={editingUser._lname || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, _lname: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ตำแหน่ง</label>
                  <select
                    value={editingUser._position || "1"}
                    onChange={(e) => setEditingUser({ ...editingUser, _position: e.target.value })}
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
                    value={editingUser._lposition || "1"}
                    onChange={(e) => setEditingUser({ ...editingUser, _lposition: e.target.value })}
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">ฝ่าย</label>
                  <select
                    value={editingUser._part || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, _part: e.target.value })}
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
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">สิทธิ์</label>
                  <select
                    value={editingUser._authentication_level || "2"}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, _authentication_level: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {authLevels.map((al) => (
                      <option key={al.id} value={String(al.id)}>
                        {al._authentication_level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
