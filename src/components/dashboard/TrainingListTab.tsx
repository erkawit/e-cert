"use client";

import { useEffect, useState } from "react";
import { FileDown, UserCheck, Printer, Loader2, Users } from "lucide-react";
import {
  supabase,
  ProjectRow,
  UserRow,
  UserAssignProjectRow,
  LookupRow,
  CertTemplateRow,
  SignatureRow,
} from "@/lib/supabase";
import { buildCertificateDataForAssignment } from "@/lib/certHelper";
import { generateCertificatePdfBytes, openPdfInNewTab } from "@/lib/pdf";
import { formatThaiDate } from "@/lib/thai";

interface Props {
  user: UserRow;
}

export function TrainingListTab({ user }: Props) {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [myAssignments, setMyAssignments] = useState<Map<number, UserAssignProjectRow>>(new Map());
  const [parts, setParts] = useState<LookupRow[]>([]);
  const [frontNames, setFrontNames] = useState<LookupRow[]>([]);
  const [positions, setPositions] = useState<LookupRow[]>([]);
  const [lpositions, setLpositions] = useState<LookupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedPart, setSelectedPart] = useState<string>("all");

  const isAdmin = String(user._authentication_level) === "1";

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, assignRes, partRes, fnRes, posRes, lposRes] = await Promise.all([
        supabase.from("_project").select("*").order("id", { ascending: false }),
        supabase.from("_user_assign_project").select("*").eq("_user_id", String(user.id)),
        supabase.from("_part").select("*").eq("_use", "1"),
        supabase.from("_front_name").select("*"),
        supabase.from("_position").select("*"),
        supabase.from("_lposition").select("*"),
      ]);

      setProjects((projRes.data as ProjectRow[]) || []);
      const map = new Map<number, UserAssignProjectRow>();
      ((assignRes.data as UserAssignProjectRow[]) || []).forEach((a) => {
        map.set(a._project_id, a);
      });
      setMyAssignments(map);
      setParts((partRes.data as LookupRow[]) || []);
      setFrontNames((fnRes.data as LookupRow[]) || []);
      setPositions((posRes.data as LookupRow[]) || []);
      setLpositions((lposRes.data as LookupRow[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleJoin = async (project: ProjectRow) => {
    setBusyId(project.id);
    try {
      const fn = frontNames.find((f) => String(f.id) === String(user._front_name))?._front_name || "";
      const pos = positions.find((p) => String(p.id) === String(user._position))?._position || "";
      const lpos = lpositions.find((l) => String(l.id) === String(user._lposition))?._lposition || "";
      const prt = parts.find((pt) => String(pt.id) === String(user._part))?._part || "";

      const { error } = await supabase.from("_user_assign_project").insert({
        _project_id: project.id,
        _user_id: String(user.id),
        _front_name: fn,
        _fname: user._fname,
        _lname: user._lname,
        _position: pos,
        _lposition: lpos,
        _part: prt,
      });

      if (error) {
        alert("ไม่สามารถเข้าร่วมอบรมได้: " + error.message);
        return;
      }
      await loadData();
    } finally {
      setBusyId(null);
    }
  };

  const handlePrintMine = async (project: ProjectRow) => {
    const assign = myAssignments.get(project.id);
    if (!assign) return;
    setBusyId(project.id);
    try {
      const certData = await buildCertificateDataForAssignment(assign, project);
      const bytes = await generateCertificatePdfBytes([certData]);
      openPdfInNewTab(bytes, `cert-${project.id}-${user.id}.pdf`);
    } catch (err) {
      alert("สร้าง PDF ไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusyId(null);
    }
  };

  const handlePrintAllForProject = async (project: ProjectRow) => {
    setBusyId(project.id);
    try {
      let query = supabase
        .from("_user_assign_project")
        .select("*")
        .eq("_project_id", project.id);

      if (selectedPart !== "all") {
        query = query.eq("_part", selectedPart);
      }

      const { data: assigns } = await query;
      if (!assigns || assigns.length === 0) {
        alert("ไม่พบผู้เข้าร่วมอบรมในเงื่อนไขที่เลือก");
        return;
      }

      const [tplRes, sigRes] = await Promise.all([
        supabase.from("_cert_template").select("*"),
        supabase.from("_signature").select("*"),
      ]);
      const tplMap = new Map<number, CertTemplateRow>();
      (tplRes.data || []).forEach((t) => tplMap.set(t.id, t as CertTemplateRow));
      const sigMap = new Map<number, SignatureRow>();
      (sigRes.data || []).forEach((s) => sigMap.set(s.id, s as SignatureRow));

      const items = await Promise.all(
        (assigns as UserAssignProjectRow[]).map((a) =>
          buildCertificateDataForAssignment(a, project, tplMap, sigMap)
        )
      );

      const bytes = await generateCertificatePdfBytes(items);
      openPdfInNewTab(bytes, `cert-project-${project.id}.pdf`);
    } catch (err) {
      alert("สร้าง PDF ไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดรายการโครงการอบรม...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">รายการโครงการอบรมทั้งหมด</h2>
          <p className="text-xs text-slate-500">เข้าร่วมโครงการและพิมพ์หนังสือรับรองการอบรมของคุณ</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-600">พิมพ์ทั้งโครงการตามฝ่าย:</span>
            <select
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="all">ทุกฝ่าย/กลุ่มงาน</option>
              {parts.map((pt) => (
                <option key={pt.id} value={pt._part}>
                  {pt._part}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">ชื่อโครงการอบรม</th>
                <th className="px-4 py-3">วันที่อบรม</th>
                <th className="px-4 py-3">ชั่วโมง IDP</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p, idx) => {
                const joined = myAssignments.has(p.id);
                const isBusy = busyId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{p._project_name}</div>
                      <div className="text-xs text-slate-500">{p._training_location}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatThaiDate(p._date_start_training)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p._idp_count_hours || "0"} ชม.</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {joined ? (
                        <button
                          onClick={() => handlePrintMine(p)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-60"
                        >
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                          พิมพ์ใบประกาศ
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(p)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-60"
                        >
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                          เข้าร่วมอบรม
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handlePrintAllForProject(p)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-60"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          พิมพ์ทั้งหมด
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
