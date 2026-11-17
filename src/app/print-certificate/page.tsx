"use client";

import { useState } from "react";
import { Search, FileDown, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase, ProjectRow, UserAssignProjectRow } from "@/lib/supabase";
import { buildCertificateDataForAssignment } from "@/lib/certHelper";
import { generateCertificatePdfBytes, openPdfInNewTab } from "@/lib/pdf";
import { formatThaiDate } from "@/lib/thai";

interface SearchResultItem {
  assignment: UserAssignProjectRow;
  project: ProjectRow;
}

export default function PrintCertificatePage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setSearched(true);
    try {
      const { data: assignments } = await supabase
        .from("_user_assign_project")
        .select("*")
        .or(`_fname.ilike.%${q}%,_lname.ilike.%${q}%`)
        .order("id", { ascending: false })
        .limit(100);

      if (!assignments || assignments.length === 0) {
        setResults([]);
        return;
      }

      const projectIds = Array.from(
        new Set(assignments.map((a) => a._project_id))
      );
      const { data: projects } = await supabase
        .from("_project")
        .select("*")
        .in("id", projectIds);

      const projMap = new Map<number, ProjectRow>();
      (projects || []).forEach((p) => projMap.set(p.id, p as ProjectRow));

      const merged: SearchResultItem[] = [];
      for (const a of assignments as UserAssignProjectRow[]) {
        const p = projMap.get(a._project_id);
        if (p) merged.push({ assignment: a, project: p });
      }
      setResults(merged);
    } finally {
      setSearching(false);
    }
  };

  const handlePrint = async (item: SearchResultItem) => {
    setPrintingId(item.assignment.id);
    try {
      const certData = await buildCertificateDataForAssignment(
        item.assignment,
        item.project
      );
      const bytes = await generateCertificatePdfBytes([certData]);
      openPdfInNewTab(bytes, `certificate-${item.assignment.id}.pdf`);
    } catch (err) {
      alert("ไม่สามารถสร้างไฟล์ PDF ได้: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar mode="public" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            พิมพ์หนังสือรับรองการอบรม (e-Certificate)
          </h1>
          <p className="text-sm text-slate-500 mb-5">
            ค้นหาด้วยชื่อ หรือ นามสกุล ของผู้เข้าอบรม เพื่อดาวน์โหลดใบประกาศนียบัตร
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="กรอกชื่อ หรือ นามสกุล..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              ค้นหา
            </button>
          </form>
        </div>

        {searched && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                ไม่พบข้อมูลการอบรมสำหรับคำค้นหา &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-3">โครงการอบรม</th>
                      <th className="px-4 py-3">วันที่อบรม</th>
                      <th className="px-4 py-3 text-right">พิมพ์ใบประกาศ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map(({ assignment, project }) => (
                      <tr key={assignment.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {assignment._front_name}
                          {assignment._fname} {assignment._lname}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{project._project_name}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatThaiDate(project._date_start_training)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handlePrint({ assignment, project })}
                            disabled={printingId === assignment.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-60"
                          >
                            {printingId === assignment.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5" />
                            )}
                            พิมพ์ PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
