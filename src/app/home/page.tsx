"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { UserRow } from "@/lib/supabase";
import { TrainingListTab } from "@/components/dashboard/TrainingListTab";
import { MyProjectsTab } from "@/components/dashboard/MyProjectsTab";
import { UsersTab } from "@/components/dashboard/UsersTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { ProfileTab } from "@/components/dashboard/ProfileTab";

type TabType = "home" | "my-projects" | "users" | "settings" | "profile";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRow | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("home");

  useEffect(() => {
    const raw = sessionStorage.getItem("ecert_user");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setUser(JSON.parse(raw) as UserRow);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("ecert_user");
    router.replace("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        mode="auth"
        user={user}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "home" && <TrainingListTab user={user} />}
        {activeTab === "my-projects" && <MyProjectsTab user={user} />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "profile" && (
          <ProfileTab user={user} onUpdated={(updated) => setUser(updated)} />
        )}
      </main>
    </div>
  );
}
