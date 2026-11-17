"use client";

import { useEffect, useState } from "react";
import { Plus, Upload, Loader2 } from "lucide-react";
import { supabase, resolveAssetUrl, LookupRow, SignatureRow, CertTemplateRow } from "@/lib/supabase";

type SettingSection = "front_name" | "position" | "lposition" | "part" | "signature" | "template";

export function SettingsTab() {
  const [section, setSection] = useState<SettingSection>("front_name");
  const [items, setItems] = useState<LookupRow[]>([]);
  const [signatures, setSignatures] = useState<SignatureRow[]>([]);
  const [templates, setTemplates] = useState<CertTemplateRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [newText, setNewText] = useState("");
  // Signature form
  const [signName, setSignName] = useState("");
  const [signPos1, setSignPos1] = useState("");
  const [signPos2, setSignPos2] = useState("");
  const [signPos3, setSignPos3] = useState("");
  const [signFile, setSignFile] = useState<File | null>(null);
  // Template form
  const [tplName, setTplName] = useState("");
  const [tplFile, setTplFile] = useState<File | null>(null);

  const loadSection = async (sec: SettingSection) => {
    setLoading(true);
    try {
      if (sec === "signature") {
        const { data } = await supabase.from("_signature").select("*").order("id", { ascending: false });
        setSignatures((data as SignatureRow[]) || []);
      } else if (sec === "template") {
        const { data } = await supabase.from("_cert_template").select("*").order("id", { ascending: false });
        setTemplates((data as CertTemplateRow[]) || []);
      } else {
        const table = `_${sec}`;
        const { data } = await supabase.from(table).select("*").order("id", { ascending: true });
        setItems((data as LookupRow[]) || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSection(section);
  }, [section]);

  const handleAddLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const table = `_${section}`;
    const col = `_${section}`;
    const { error } = await supabase.from(table).insert({ [col]: newText.trim(), _use: "1" });
    if (error) {
      alert("เพิ่มข้อมูลไม่สำเร็จ: " + error.message);
      return;
    }
    setNewText("");
    loadSection(section);
  };

  const handleAddSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signName.trim() || !signFile) {
      alert("กรุณากรอกชื่อผู้ลงนามและเลือกไฟล์รูปลายเซ็น");
      return;
    }
    const ext = signFile.name.split(".").pop() || "png";
    const fileName = `sign-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("sign").upload(fileName, signFile, { upsert: true });
    if (upErr) {
      alert("อัปโหลดรูปลายเซ็นไม่สำเร็จ: " + upErr.message);
      return;
    }
    const { data: pubUrl } = supabase.storage.from("sign").getPublicUrl(fileName);

    const { error } = await supabase.from("_signature").insert({
      _signature_self_sign_name: signName.trim(),
      _signature_self_sign_position: signPos1.trim(),
      _signature_self_sign_position_2: signPos2.trim() || null,
      _signature_self_sign_position_3: signPos3.trim() || null,
      _signature_self_file_name: signFile.name,
      _signature_self_file_real_name: pubUrl.publicUrl,
      _signature_self_file_path: "",
      _signature_self_select: "1",
      _signature_work_now: "1",
    });

    if (error) {
      alert("บันทึกลายเซ็นไม่สำเร็จ: " + error.message);
      return;
    }
    setSignName("");
    setSignPos1("");
    setSignPos2("");
    setSignPos3("");
    setSignFile(null);
    loadSection("signature");
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim() || !tplFile) {
      alert("กรุณากรอกชื่อเทมเพลตและเลือกไฟล์รูปภาพ");
      return;
    }
    const ext = tplFile.name.split(".").pop() || "jpg";
    const fileName = `cert-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("cert").upload(fileName, tplFile, { upsert: true });
    if (upErr) {
      alert("อัปโหลดเทมเพลตไม่สำเร็จ: " + upErr.message);
      return;
    }
    const { data: pubUrl } = supabase.storage.from("cert").getPublicUrl(fileName);

    const { error } = await supabase.from("_cert_template").insert({
      _cert_template_name: tplName.trim(),
      _cert_template_real_name: pubUrl.publicUrl,
      _cert_template_path_file: "",
      _cert_template_lname_file: `.${ext}`,
      _user_upload: "1",
      _use: "1",
    });

    if (error) {
      alert("บันทึกเทมเพลตไม่สำเร็จ: " + error.message);
      return;
    }
    setTplName("");
    setTplFile(null);
    loadSection("template");
  };

  const tabs: { key: SettingSection; label: string }[] = [
    { key: "front_name", label: "คำนำหน้า" },
    { key: "position", label: "ตำแหน่ง" },
    { key: "lposition", label: "ระดับตำแหน่ง" },
    { key: "part", label: "ฝ่าย/กลุ่มงาน" },
    { key: "signature", label: "ลายเซ็น" },
    { key: "template", label: "แบบใบประกาศ" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSection(t.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
              section === t.key
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลด...
          </div>
        ) : section === "signature" ? (
          <div className="space-y-6">
            <form onSubmit={handleAddSignature} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <input
                type="text"
                placeholder="ชื่อ-สกุล ผู้ลงนาม *"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300"
              />
              <input
                type="text"
                placeholder="ตำแหน่งบรรทัดที่ 1 *"
                value={signPos1}
                onChange={(e) => setSignPos1(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300"
              />
              <input
                type="text"
                placeholder="ตำแหน่งบรรทัดที่ 2 (ถ้ามี)"
                value={signPos2}
                onChange={(e) => setSignPos2(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300"
              />
              <input
                type="text"
                placeholder="ตำแหน่งบรรทัดที่ 3 (ถ้ามี)"
                value={signPos3}
                onChange={(e) => setSignPos3(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300"
              />
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setSignFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-xs"
              >
                <Upload className="w-4 h-4" /> เพิ่มลายเซ็น
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {signatures.map((s) => (
                <div key={s.id} className="border border-slate-200 rounded-xl p-4 text-center space-y-2">
                  <img
                    src={resolveAssetUrl(s._signature_self_file_path, s._signature_self_file_real_name)}
                    alt={s._signature_self_sign_name}
                    className="h-16 mx-auto object-contain"
                  />
                  <div className="font-semibold text-sm text-slate-900">{s._signature_self_sign_name}</div>
                  <div className="text-xs text-slate-500">{s._signature_self_sign_position}</div>
                </div>
              ))}
            </div>
          </div>
        ) : section === "template" ? (
          <div className="space-y-6">
            <form onSubmit={handleAddTemplate} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <input
                type="text"
                placeholder="ชื่อแบบใบประกาศ *"
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300"
              />
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setTplFile(e.target.files?.[0] || null)}
                className="text-xs self-center"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-xs"
              >
                <Upload className="w-4 h-4" /> อัปโหลดเทมเพลต
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <img
                    src={resolveAssetUrl(t._cert_template_path_file, t._cert_template_real_name)}
                    alt={t._cert_template_name}
                    className="w-full aspect-[297/210] object-cover bg-slate-100"
                  />
                  <div className="p-3 text-xs font-semibold text-slate-800">{t._cert_template_name}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleAddLookup} className="flex gap-2">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="เพิ่มรายการใหม่..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> เพิ่ม
              </button>
            </form>

            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {items.map((item) => {
                const val =
                  item._front_name || item._position || item._lposition || item._part || "";
                return (
                  <li key={item.id} className="px-4 py-2.5 text-sm text-slate-800 flex justify-between">
                    <span>{val}</span>
                    <span className="text-xs text-slate-400">#{item.id}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
