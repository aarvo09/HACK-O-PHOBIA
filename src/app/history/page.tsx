"use client";

import { motion } from "framer-motion";
import { History, TrendingUp, TrendingDown, ChevronLeft, LayoutDashboard, Camera, Mail } from "lucide-react";
import Link from "next/link";

type HistoryItem = {
  id: number;
  date: string;
  title: string;
  teacher: string;
  startCount: number;
  endCount: number;
  margin: string;
  warning: boolean;
  aiNotes?: string;
};

const mockHistory: HistoryItem[] = [
  { id: 1, date: "Monday, 09:30 AM", title: "25MTT-108", teacher: "Amit Kumar Pandey", startCount: 65, endCount: 65, margin: "0%", warning: false },
  { id: 2, date: "Monday, 10:25 AM", title: "25CSH-102", teacher: "Ankita Srivastava", startCount: 62, endCount: 60, margin: "-3%", warning: false },
  { id: 3, date: "Monday, 11:20 AM", title: "25CSH-117", teacher: "Ratnesh Shukla", startCount: 64, endCount: 45, margin: "-29%", warning: true, aiNotes: "Significant drop in attendance towards the end." },
  { id: 4, date: "Monday, 01:55 PM", title: "25CSH-117 (Lab)", teacher: "Mandeep Kumar", startCount: 60, endCount: 61, margin: "+1%", warning: false, aiNotes: "Class is attentive." },
  { id: 5, date: "Monday, 03:45 PM", title: "25EET-102", teacher: "Amrindra Pal", startCount: 58, endCount: 40, margin: "-31%", warning: true, aiNotes: "Students left early." },
];

export default function HistoryDashboard() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Historical Reports</h1>
              <p className="text-white/50 text-sm mt-1">Review past class attendance for B.Tech Data Science</p>
            </div>
          </div>

          <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
            <History className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">Last 30 Days</span>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Link href="/" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition">
            <LayoutDashboard className="w-4 h-4 text-indigo-300" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Judge Nav</p>
              <p className="text-sm font-semibold">Dashboard</p>
            </div>
          </Link>
          <Link href="/camera" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition">
            <Camera className="w-4 h-4 text-indigo-300" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Judge Nav</p>
              <p className="text-sm font-semibold">Camera Demo</p>
            </div>
          </Link>
          <Link href="/student-mail" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition">
            <Mail className="w-4 h-4 text-indigo-300" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Judge Nav</p>
              <p className="text-sm font-semibold">Student Mail</p>
            </div>
          </Link>
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
            <p className="text-[10px] uppercase tracking-widest text-indigo-300">Feature</p>
            <p className="text-sm font-semibold">Attendance Trend Report</p>
          </div>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                  <th className="p-4 font-medium">Date / Class</th>
                  <th className="p-4 font-medium text-center">Start (0-10m)</th>
                  <th className="p-4 font-medium text-center">End (Last 10m)</th>
                  <th className="p-4 font-medium text-right">Disparity</th>
                  <th className="p-4 font-medium">Status / AI Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockHistory.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.01] transition-colors group"
                  >
                    <td className="p-4">
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-xs text-white/40 mt-1">{item.date} • {item.teacher}</div>
                    </td>

                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 font-mono text-sm">
                        {item.startCount}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono text-sm ${item.warning ? "bg-rose-500/20 text-rose-300" : "bg-white/5"}`}>
                        {item.endCount}
                      </span>
                    </td>

                    <td className="p-4 text-right font-mono text-sm">
                      <span className={`flex items-center justify-end gap-1 ${item.warning ? "text-rose-400" : "text-emerald-400"}`}>
                        {item.warning ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        {item.margin}
                      </span>
                    </td>

                    <td className="p-4 max-w-[200px]">
                      {item.warning ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 text-xs border border-rose-500/20">
                          Flagged
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                          Verified
                        </div>
                      )}

                      {item.aiNotes && (
                        <p className="text-[10px] text-white/40 mt-2 truncate group-hover:whitespace-normal group-hover:text-white/70 transition-colors">
                          Note: {item.aiNotes}
                        </p>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
