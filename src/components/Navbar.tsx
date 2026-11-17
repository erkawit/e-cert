"use client";

import Link from "next/link";
import { Award, FileText, Search, Home, PlusCircle, Users, Settings, UserCog, LogOut } from "lucide-react";
import { UserRow } from "@/lib/supabase";

interface PublicNavbarProps {
  mode: "public";
}

interface AuthNavbarProps {
  mode: "auth";
  user: UserRow;
  activeTab: string;
  onSelectTab: (tab: "home" | "my-projects" | "users" | "settings" | "profile") => void;
  onLogout: () => void;
}

export function Navbar(props: PublicNavbarProps | AuthNavbarProps) {
  if (props.mode === "public") {
    return (
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:text-sky-300 transition">
            <Award className="w-6 h-6 text-sky-400" />
            <span>e-Certificate</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/request-assign"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              <Search className="w-4 h-4 text-sky-400" />
              <span>เข้าร่วมอบรม</span>
            </Link>
            <Link
              href="/print-certificate"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>พิมพ์ใบประกาศ</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const { user, activeTab, onSelectTab, onLogout } = props;
  const isAdmin = String(user._authentication_level) === "1";

  return (
    <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => onSelectTab("home")}
          className="flex items-center gap-2 font-bold text-lg tracking-tight hover:text-sky-300 transition"
        >
          <Award className="w-6 h-6 text-sky-400" />
          <span>e-Cert Management</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => onSelectTab("home")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              activeTab === "home" ? "bg-sky-600 text-white" : "hover:bg-slate-800 text-slate-200"
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            onClick={() => onSelectTab("my-projects")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              activeTab === "my-projects" ? "bg-sky-600 text-white" : "hover:bg-slate-800 text-slate-200"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">โครงการของฉัน</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onSelectTab("users")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeTab === "users" ? "bg-sky-600 text-white" : "hover:bg-slate-800 text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">ผู้ใช้งาน</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onSelectTab("settings")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeTab === "settings" ? "bg-sky-600 text-white" : "hover:bg-slate-800 text-slate-200"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">ตั้งค่า</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab("profile")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
              activeTab === "profile" ? "bg-sky-600 text-white" : "hover:bg-slate-800 text-slate-200"
            }`}
          >
            <UserCog className="w-4 h-4" />
            <span className="hidden md:inline">
              {user._fname} {user._lname}
            </span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white transition ml-1"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">ออก</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
