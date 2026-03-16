"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Users, Activity, ChevronRight, BookOpen, GraduationCap, Layers, Mail } from "lucide-react";
import Link from "next/link";

type ClassStatus = "good" | "warning" | "pending";

type ClassItem = {
  id: string;
  title: string;
  teacher: string;
  room: string;
  status: ClassStatus;
  firstCapture: number;
  lastCapture: number;
};

type SubjectItem = {
  id: string;
  name: string;
  classes: ClassItem[];
};

type CourseItem = {
  id: string;
  name: string;
  subjects: SubjectItem[];
};

type DashboardResponse = {
  dashboardData?: CourseItem[];
};

export default function Dashboard() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/live?role=ADMIN")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DashboardResponse) => {
        const list = data.dashboardData || [];
        setCourses(list);
        if (list.length > 0) setExpandedCourseId(list[0].id);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex-col p-6 hidden md:flex shrink-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">AI Monitor</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white font-medium">
            <Activity className="w-4 h-4" /> Live Feed
          </Link>
          <Link href="/camera" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition">
            <Camera className="w-4 h-4" /> Camera Agent
          </Link>
          <Link href="/history" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition">
            <BookOpen className="w-4 h-4" /> History Reports
          </Link>
          <Link href="/student-mail" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition">
            <Mail className="w-4 h-4" /> Student Mail Preview
          </Link>
        </nav>
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-2">System Status</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> AI Nodes Online
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5 p-6">
          <h2 className="text-2xl font-bold">Academic Overview</h2>
          <p className="text-white/50 text-sm">Hierarchical Course &amp; Subject Monitoring</p>
        </header>

        <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/camera" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Judge Demo</p>
              <p className="font-bold text-lg">Camera + AI Detection</p>
              <p className="text-xs text-white/50 mt-1">Upload media and trigger webhook analysis.</p>
            </Link>
            <Link href="/history" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Judge Demo</p>
              <p className="font-bold text-lg">Historical Reports</p>
              <p className="text-xs text-white/50 mt-1">Show attendance trends and flagged sessions.</p>
            </Link>
            <Link href="/student-mail" className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Judge Demo</p>
              <p className="font-bold text-lg">Forwarded AI Mail</p>
              <p className="text-xs text-white/50 mt-1">Show student-specific forwarded warning mail preview.</p>
            </Link>
            <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
              <p className="text-[10px] uppercase tracking-widest text-indigo-300 mb-1">Judge Tip</p>
              <p className="font-bold text-lg">Click Any Class Card</p>
              <p className="text-xs text-indigo-100/80 mt-1">Open full discrepancy analysis and roster details.</p>
            </div>
          </section>

          {loading && (
            <div className="flex items-center justify-center h-64 gap-3 text-white/40">
              <Activity className="w-5 h-5 animate-spin" /> Loading dashboard...
            </div>
          )}
          {error && (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              Error: {error}
            </div>
          )}
          {!loading && !error && courses.length === 0 && (
            <div className="p-6 text-white/40 text-center">No data found. Check if the database is seeded.</div>
          )}

          {!loading && courses.map((course) => (
            <div key={course.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <button
                onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                className="w-full bg-white/[0.03] p-6 flex items-center justify-between hover:bg-white/[0.05] transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <GraduationCap className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold">{course.name}</h3>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
                      {course.subjects?.length || 0} Subjects
                    </p>
                  </div>
                </div>
                <ChevronRight className={`transition-transform duration-300 text-white/40 ${expandedCourseId === course.id ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {expandedCourseId === course.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-6 border-t border-white/5 space-y-8"
                  >
                    {(course.subjects || []).map((subject) => (
                      <div key={subject.id}>
                        <h4 className="flex items-center gap-2 text-indigo-400 font-bold border-l-2 border-indigo-500 pl-3 mb-4">
                          <BookOpen className="w-4 h-4" /> {subject.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(subject.classes || []).map((cls) => (
                            <Link href={`/classroom/${cls.id}`} key={cls.id}>
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition group"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                    cls.status === 'good' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : cls.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-white/5 text-white/40 border border-white/10'
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      cls.status === 'good' ? 'bg-emerald-500' : cls.status === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-white/40'
                                    }`} />
                                    {cls.status}
                                  </div>
                                </div>
                                <h5 className="font-bold text-lg mb-2">{cls.title}</h5>
                                <p className="text-xs text-white/40 flex items-center gap-1.5 mb-1">
                                  <Users className="w-3 h-3" /> {cls.teacher}
                                </p>
                                <p className="text-xs text-white/40 flex items-center gap-1.5">
                                  <Layers className="w-3 h-3" /> {cls.room}
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                  <span className="text-[10px] font-mono text-white/30">
                                    {cls.firstCapture} → {cls.lastCapture} students
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition" />
                                </div>
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
