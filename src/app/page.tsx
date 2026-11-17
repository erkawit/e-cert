"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase, resolveAssetUrl, CertTemplateRow } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [templates, setTemplates] = useState<CertTemplateRow[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const existing = sessionStorage.getItem("ecert_user");
    if (existing) {
      router.replace("/home");
      return;
    }

    supabase
      .from("_cert_template")
      .select("*")
      .eq("_use", "1")
      .order("id", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTemplates(data as CertTemplateRow[]);
        }
      });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!username.trim() || !password.trim()) {
      setErrorMsg("กรุณากรอก Username และ Password ก่อนเข้าสู่ระบบ");
      return;
    }

    setLoading(true);
    try {
      const { data: user, error } = await supabase
        .from("_user")
        .select("*")
        .eq("_user", username.trim())
        .maybeSingle();

      if (error) {
        setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: " + error.message);
        return;
      }
      if (!user) {
        setErrorMsg("ไม่พบชื่อผู้ใช้งานในระบบ");
        return;
      }
      if (user._pass !== password) {
        setErrorMsg("รหัสผ่านไม่ถูกต้อง");
        return;
      }

      sessionStorage.setItem("ecert_user", JSON.stringify(user));
      router.push("/home");
    } finally {
      setLoading(false);
    }
  };

  const currentTpl = templates[slideIdx];
  const previewUrl = currentTpl
    ? resolveAssetUrl(currentTpl._cert_template_path_file, currentTpl._cert_template_real_name)
    : "/cert/e-cert-cover/e-cert-cover.jpg";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar mode="public" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            โปรแกรมจัดทำหนังสือรับรองการอบรม e-Certificate
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            ระบบบริหารจัดการโครงการอบรมและออกใบประกาศนียบัตรอิเล็กทรอนิกส์
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Certificate Sample Preview */}
          <div className="lg:col-span-8 bg-slate-800 rounded-2xl p-3 shadow-lg relative overflow-hidden">
            <div className="aspect-[297/210] w-full bg-slate-700 rounded-xl overflow-hidden flex items-center justify-center relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={currentTpl?._cert_template_name || "ตัวอย่างใบประกาศ"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-300 flex flex-col items-center gap-2">
                  <Award className="w-12 h-12" />
                  <span>ตัวอย่างใบประกาศนียบัตร</span>
                </div>
              )}

              {templates.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSlideIdx((prev) => (prev - 1 + templates.length) % templates.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition"
                    aria-label="ก่อนหน้า"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlideIdx((prev) => (prev + 1) % templates.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition"
                    aria-label="ถัดไป"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {currentTpl && (
              <div className="text-center text-xs text-slate-300 mt-2">
                แบบใบประกาศ: {currentTpl._cert_template_name} ({slideIdx + 1}/{templates.length})
              </div>
            )}
          </div>

          {/* Login Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-sky-600" />
              เข้าสู่ระบบ
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="USERNAME"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  รหัสผ่าน (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PASSWORD"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              {errorMsg && (
                <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
