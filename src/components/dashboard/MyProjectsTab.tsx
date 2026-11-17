"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Loader2, Upload } from "lucide-react";
import {
  supabase,
  ProjectRow,
  UserRow,
  CertTemplateRow,
  SignatureRow,
  UserAssignProjectRow,
} from "@/lib/supabase";
import { formatThaiDate } from "@/lib/thai";

interface Props {
  user: UserRow;
}

export function MyProjectsTab({ user }: Props) {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [templates, setTemplates] = useState<CertTemplateRow[]>([]);
  const [signatures, setSignatures] = useState<SignatureRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // New project form
  const [projectName, setProjectName] = useState("");
  const [details, setDetails] = useState("");
  const [idpHours, setIdpHours] = useState("6");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [timeStart, setTimeStart] = useState("08:30");
  const [timeEnd, setTimeEnd] = useState("16:30");
  const [templateId, setTemplateId] = useState("");
  const [signatureId, setSignatureId] = useState("");
  const [statusPublish, setStatusPublish] = useState("1");
  const [newTplFile, setNewTplFile] = useState<File | null>(null);
  const [newTplName, setNewTplName] = useState("");

  // Participants modal
  const [viewingProject, setViewingProject] = useState<ProjectRow | null>(null);
  const [participants, setParticipants] = useState<UserAssignProjectRow[]>([]);

  const isAdmin = String(user._authentication_level) === "1";

  const loadData = async () => {
    setLoading(true);
    try {
      let projQuery = supabase.from("_project").select("*").order("id", { ascending: false });
      if (!isAdmin) {
        projQuery = projQuery.eq("_user_create", String(user.id));
      }

      const [projRes, tplRes, sigRes] = await Promise.all([
        projQuery,
        supabase.from("_cert_template").select("*").eq("_use", "1").order("id", { ascending: false }),
        supabase.from("_signature").select("*").eq("_signature_self_select", "1"),
      ]);

      setProjects((projRes.data as ProjectRow[]) || []);
      const tpls = (tplRes.data as CertTemplateRow[]) || [];
      setTemplates(tpls);
      if (tpls.length > 0 && !templateId) setTemplateId(String(tpls[0].id));

      const sigs = (sigRes.data as SignatureRow[]) || [];
      setSignatures(sigs);
      if (sigs.length > 0 && !signatureId) setSignatureId(String(sigs[0].id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setSaving(true);
    try {
      let finalTemplateId = templateId;

      // Upload new template to Supabase Storage if selected
      if (newTplFile) {
        const ext = newTplFile.name.split(".").pop() || "jpg";
        const fileName = `cert-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("cert")
          .upload(fileName, newTplFile, { upsert: true });

        if (upErr) {
          alert("อัปโหลดเทมเพลตไม่สำเร็จ: " + upErr.message);
          return;
        }
        const { data: pubUrl } = supabase.storage.from("cert").getPublicUrl(fileName);

        const { data: tplInserted, error: tplErr } = await supabase
          .from("_cert_template")
          .insert({
            _cert_template_name: newTplName.trim() || newTplFile.name,
            _cert_template_real_name: pubUrl.publicUrl,
            _cert_template_path_file: "",
            _cert_template_lname_file: `.${ext}`,
            _user_upload: String(user.id),
            _use: "1",
          })
          .select()
          .single();

        if (tplErr) {
          alert("บันทึกข้อมูลเทมเพลตไม่สำเร็จ: " + tplErr.message);
          return;
        }
        finalTemplateId = String(tplInserted.id);
      }

      const { error } = await supabase.from("_project").insert({
        _project_name: projectName.trim(),
        _details_project: details.trim(),
        _idp_count_hours: idpHours,
        _training_location: location.trim(),
        _user_create: String(user.id),
        _date_start_training: dateStart || null,
        _date_end_training: dateEnd || null,
        _time_start: timeStart,
        _time_end: timeEnd,
        _cert_template: finalTemplateId || null,
        _signature_id: signatureId || null,
        _status_publish: statusPublish,
      });

      if (error) {
        alert("สร้างโครงการไม่สำเร็จ: " + error.message);
        return;
      }

      setShowCreate(false);
      setProjectName("");
      setDetails("");
      setLocation("");
      setNewTplFile(null);
      setNewTplName("");
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleViewParticipants = async (p: ProjectRow) => {
    setViewingProject(p);
    const { data } = await supabase
      .from("_user_assign_project")
      .select("*")
      .eq("_project_id", p.id)
      .order("id", { ascending: true });
    setParticipants((data as UserAssignProjectRow[]) || []);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดโครงการของฉัน...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">โครงการของฉัน</h2>
          <p className="text-xs text-slate-500">สร้างโครงการอบรมใหม่และตรวจสอบรายชื่อผู้เข้าร่วม</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" /> สร้างโครงการใหม่
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ชื่อโครงการ</th>
                <th className="px-4 py-3">วันที่อบรม</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">ผู้เข้าร่วม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p._project_name}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatThaiDate(p._date_start_training)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p._status_publish === "1"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p._status_publish === "1" ? "เผยแพร่" : "ไม่เผยแพร่"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleViewParticipants(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                    >
                      <Users className="w-3.5 h-3.5" /> ดูรายชื่อ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">สร้างโครงการอบรมใหม่</h3>
            <form onSubmit={handleCreateProject} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อโครงการ *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">รายละเอียด</label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">สถานที่อบรม</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">จำนวนชั่วโมง IDP</label>
                  <input
                    type="number"
                    value={idpHours}
                    onChange={(e) => setIdpHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">การเผยแพร่</label>
                  <select
                    value={statusPublish}
                    onChange={(e) => setStatusPublish(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="1">เผยแพร่ (เข้าร่วมได้ทั่วไป)</option>
                    <option value="2">ไม่เผยแพร่</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">วันที่เริ่ม</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">วันที่สิ้นสุด (ถ้ามี)</label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">เวลาเริ่ม</label>
                  <input
                    type="time"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">แบบใบประกาศ</label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t._cert_template_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">ลายเซ็นผู้รับรอง</label>
                  <select
                    value={signatureId}
                    onChange={(e) => setSignatureId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    {signatures.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s._signature_self_sign_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="block text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> หรืออัปโหลดรูปเทมเพลตใบประกาศใหม่ (JPG/PNG)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="ชื่อแบบใบประกาศใหม่"
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => setNewTplFile(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกโครงการ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Participants Modal */}
      {viewingProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">รายชื่อผู้เข้าร่วมอบรม ({participants.length} คน)</h3>
                <p className="text-xs text-slate-500">{viewingProject._project_name}</p>
              </div>
              <button
                onClick={() => setViewingProject(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
            <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-2.5">ตำแหน่ง</th>
                    <th className="px-4 py-2.5">ฝ่าย/กลุ่มงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participants.map((pt, i) => (
                    <tr key={pt.id}>
                      <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {pt._front_name}{pt._fname} {pt._lname}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{pt._position} {pt._lposition}</td>
                      <td className="px-4 py-2 text-slate-600">{pt._part}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
