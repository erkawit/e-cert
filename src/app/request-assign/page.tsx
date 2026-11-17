"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, FileDown, Loader2, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase, ProjectRow, LookupRow, UserAssignProjectRow } from "@/lib/supabase";
import { buildCertificateDataForAssignment } from "@/lib/certHelper";
import { generateCertificatePdfBytes, openPdfInNewTab } from "@/lib/pdf";
import { formatThaiDate } from "@/lib/thai";

export default function RequestAssignPage() {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [frontNames, setFrontNames] = useState<LookupRow[]>([]);
  const [positions, setPositions] = useState<LookupRow[]>([]);
  const [lpositions, setLpositions] = useState<LookupRow[]>([]);
  const [parts, setParts] = useState<LookupRow[]>([]);

  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [frontName, setFrontName] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [position, setPosition] = useState("");
  const [lposition, setLposition] = useState("");
  const [part, setPart] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdAssignment, setCreatedAssignment] = useState<UserAssignProjectRow | null>(null);

  const loadPublishedProjects = async (searchTerm = "") => {
    setLoading(true);
    try {
      let req = supabase
        .from("_project")
        .select("*")
        .eq("_status_publish", "1")
        .order("id", { ascending: false })
        .limit(50);

      if (searchTerm.trim()) {
        req = req.ilike("_project_name", `%${searchTerm.trim()}%`);
      }

      const { data } = await req;
      setProjects((data as ProjectRow[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedProjects();
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

  const handleSubmitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !fname.trim() || !lname.trim()) {
      alert("กรุณากรอกชื่อและนามสกุลให้ครบถ้วน");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("_user_assign_project")
        .insert({
          _project_id: selectedProject.id,
          _user_id: "0",
          _front_name: frontName,
          _fname: fname.trim(),
          _lname: lname.trim(),
          _position: position,
          _lposition: lposition,
          _part: part,
        })
        .select()
        .single();

      if (error) {
        alert("บันทึกไม่สำเร็จ: " + error.message);
        return;
      }
      setCreatedAssignment(data as UserAssignProjectRow);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintNow = async () => {
    if (!createdAssignment || !selectedProject) return;
    const certData = await buildCertificateDataForAssignment(
      createdAssignment,
      selectedProject
    );
    const bytes = await generateCertificatePdfBytes([certData]);
    openPdfInNewTab(bytes, `certificate-${createdAssignment.id}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar mode="public" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            ค้นหาและเข้าร่วมโครงการอบรม
          </h1>
          <p className="text-sm text-slate-500 mb-5">
            เลือกโครงการที่เปิดเผยแพร่ เพื่อลงทะเบียนเข้าร่วมอบรมและรับหนังสือรับรอง
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadPublishedProjects(query);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อโครงการอบรม..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Search className="w-4 h-4" />
              ค้นหาโครงการ
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดรายการโครงการ...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">ไม่พบโครงการอบรมที่เผยแพร่</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">{p._project_name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      สถานที่: {p._training_location || "-"} | วันที่:{" "}
                      {formatThaiDate(p._date_start_training)} | ชั่วโมง IDP:{" "}
                      {p._idp_count_hours || "0"} ชม.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProject(p);
                      setCreatedAssignment(null);
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    เข้าร่วมอบรม
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal for Joining Project */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">ลงทะเบียนเข้าร่วมอบรม</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedProject._project_name}</p>

            {createdAssignment ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-800">ลงทะเบียนเข้าร่วมอบรมเรียบร้อยแล้ว</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handlePrintNow}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
                  >
                    <FileDown className="w-4 h-4" /> พิมพ์ใบประกาศ PDF
                  </button>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm font-medium"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitJoin} className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">คำนำหน้า</label>
                    <select
                      value={frontName}
                      onChange={(e) => setFrontName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    >
                      <option value="">-- เลือก --</option>
                      {frontNames.map((f) => (
                        <option key={f.id} value={f._front_name}>
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
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">นามสกุล *</label>
                    <input
                      type="text"
                      required
                      value={lname}
                      onChange={(e) => setLname(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">ตำแหน่ง</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    >
                      <option value="">-- เลือก --</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p._position}>
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
                      <option value="">-- เลือก --</option>
                      {lpositions.map((lp) => (
                        <option key={lp.id} value={lp._lposition}>
                          {lp._lposition}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">กลุ่มงาน/ฝ่าย</label>
                    <select
                      value={part}
                      onChange={(e) => setPart(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    >
                      <option value="">-- เลือก --</option>
                      {parts.map((pt) => (
                        <option key={pt.id} value={pt._part}>
                          {pt._part}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold disabled:opacity-60"
                  >
                    {submitting ? "กำลังบันทึก..." : "ยืนยันเข้าร่วม"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
