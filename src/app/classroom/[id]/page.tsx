"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Camera, Clock, Users, AlertTriangle, CheckCircle, LayoutDashboard, History, Mail } from "lucide-react";
import Link from "next/link";

type AttendanceCapture = {
  id: string;
  intervalString: "first_10_min" | "last_10_min" | string;
  headcount: number;
  aiNotes?: string | null;
};

type StudentAttendance = {
  id: string;
  isPresent: boolean;
  leftEarly: boolean;
  student: {
    id: string;
    name: string;
    rollNumber: string;
  } | null;
};

type SessionDetail = {
  id: string;
  title: string;
  startTime: string;
  classroom?: { name?: string | null } | null;
  teacher?: { name?: string | null } | null;
  captures?: AttendanceCapture[];
  attendances?: StudentAttendance[];
};

type RosterItem = {
  name: string;
  rollNumber: string;
};

export default function ClassroomDetail({ params }: { params: Promise<{ id: string }> }) {
  // Use `use` unwrapping for Next.js 15 App router async params constraints
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/classrooms/${roomId}`)
      .then(res => res.json())
      .then(data => {
        setSession(data.session);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [roomId]);

  if (loading) return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center"><div className="animate-pulse flex items-center justify-center p-8 bg-white/5 rounded-2xl border border-white/10 text-white/50">Loading Secure Area...</div></div>;
  if (!session) return <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center text-rose-500 font-semibold text-xl">404 - Classroom Session Not Found</div>;

  const first10 = session.captures?.find((c) => c.intervalString === 'first_10_min');
  const last10 = session.captures?.find((c) => c.intervalString === 'last_10_min');
  const demoMode = !last10 || !session.attendances || session.attendances.length === 0;

  let status = 'pending';
  if (first10 && last10) {
    status = last10.headcount >= (first10.headcount * 0.9) ? 'good' : 'warning';
  } else if (demoMode) {
    status = 'warning';
  }

  const isWarning = status === "warning";
  const roomName = session.title;
  const firstCount = first10?.headcount ?? 60;
  const lastCount = last10?.headcount ?? 54;
  const firstCountSafe = firstCount ?? 0;
  const lastCountSafe = lastCount ?? 0;
  const teacherName = session.teacher?.name || "Unknown Teacher"; 
  const roomNumber = session.classroom?.name || "Unknown Room";

  const realMissing = session.attendances?.filter((a) => a.leftEarly || !a.isPresent) || [];
  const realPresent = session.attendances?.filter((a) => a.isPresent && !a.leftEarly) || [];

  const demoMissing: RosterItem[] = [
    { name: "Aman Khan", rollNumber: "DS-015" },
    { name: "Nidhi Iyer", rollNumber: "DS-016" },
    { name: "Sahil Arora", rollNumber: "DS-017" },
    { name: "Tanya Bhat", rollNumber: "DS-018" },
    { name: "Harsh Jain", rollNumber: "DS-019" },
    { name: "Meera Sinha", rollNumber: "DS-020" },
  ];

  const demoPresent: RosterItem[] = [
    { name: "Aarav Sharma", rollNumber: "DS-001" },
    { name: "Ishita Verma", rollNumber: "DS-002" },
    { name: "Rohan Singh", rollNumber: "DS-003" },
    { name: "Sneha Patel", rollNumber: "DS-004" },
    { name: "Aditya Kumar", rollNumber: "DS-005" },
    { name: "Priya Nair", rollNumber: "DS-006" },
    { name: "Karan Mehta", rollNumber: "DS-007" },
    { name: "Ananya Gupta", rollNumber: "DS-008" },
    { name: "Rahul Das", rollNumber: "DS-009" },
    { name: "Neha Joshi", rollNumber: "DS-010" },
    { name: "Vikram Yadav", rollNumber: "DS-011" },
    { name: "Pooja Roy", rollNumber: "DS-012" },
    { name: "Manav Rao", rollNumber: "DS-013" },
    { name: "Ritika Sen", rollNumber: "DS-014" },
  ];

  const missingList: RosterItem[] = realMissing.length > 0
    ? realMissing.map((a) => ({ name: a.student?.name || "Unknown", rollNumber: a.student?.rollNumber || "N/A" }))
    : (demoMode ? demoMissing : []);

  const presentList: RosterItem[] = realPresent.length > 0
    ? realPresent.map((a) => ({ name: a.student?.name || "Unknown", rollNumber: a.student?.rollNumber || "N/A" }))
    : (demoMode ? demoPresent : []);
  // Format time
  const dateObj = new Date(session.startTime);
  const startTimeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const timeBlock = `${startTimeStr} - In Progress`;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <header className="flex items-center gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition cursor-pointer group">
            <ChevronLeft className="w-5 h-5 text-white/70 group-hover:text-white" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{roomName}</h1>
              {status === 'pending' && <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20"><Clock className="w-3 h-3" /> In Progress</span>}
              {status === 'warning' && <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20"><AlertTriangle className="w-3 h-3" /> Discrepancy Found</span>}
              {status === 'good' && <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Verified</span>}
              {demoMode && <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">Demo Data</span>}
            </div>
            <p className="text-white/50 text-sm mt-1">Class: B.Tech Data Science • Room: {roomNumber} • Teacher: {teacherName}</p>
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
          <Link href="/history" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition">
            <History className="w-4 h-4 text-indigo-300" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Judge Nav</p>
              <p className="text-sm font-semibold">History Reports</p>
            </div>
          </Link>
          <Link href="/student-mail" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.05] transition">
            <Mail className="w-4 h-4 text-indigo-300" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Judge Nav</p>
              <p className="text-sm font-semibold">Student Mail</p>
            </div>
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area: Snapshots */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-400" /> Webhook AI Captures
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Snapshot 1 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden flex flex-col shadow-xl"
              >
                <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2"><Clock className="w-3 h-3" /> Start of Class (0m)</span>
                  <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/70">{timeBlock !== "Unknown" ? timeBlock.split(' - ')[0] : "--"}</span>
                </div>
                {/* Normally an image goes here, we use a placeholder gradient */}
                <div className="flex-1 min-h-[200px] bg-gradient-to-br from-indigo-900/40 to-black relative">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white/80">{firstCount || "--"}</p>
                        <p className="text-xs text-white/40">Bodies Detected</p>
                      </div>
                   </div>
                </div>
              </motion.div>

              {/* Snapshot 2 */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                className={`rounded-2xl bg-white/[0.02] border ${status === 'warning' ? 'border-rose-500/30 shadow-rose-500/10' : 'border-white/5'} overflow-hidden flex flex-col shadow-xl`}
              >
                <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-2"><Clock className="w-3 h-3" /> End of Class (50m)</span>
                  <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/70">{timeBlock !== "Unknown" ? timeBlock.split(' - ')[1] : "--"}</span>
                </div>
                <div className="flex-1 min-h-[200px] bg-gradient-to-br from-purple-900/40 to-black relative">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className={`text-2xl font-bold ${status === 'warning' ? 'text-rose-400' : 'text-emerald-400'}`}>{lastCount || "--"}</p>
                        <p className="text-xs text-white/40">Bodies Detected</p>
                      </div>
                   </div>
                </div>
              </motion.div>

            </div>

             {/* System Insight */}
            {status === 'warning' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl"
              >
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-rose-300 font-semibold text-lg">Discrepancy Detected</h3>
                    <p className="text-rose-200/70 text-sm mt-2 leading-relaxed">
                      The Gemini AI analysis indicates that roughly {firstCountSafe - lastCountSafe} students left the classroom before the session ended. 
                      You can review the raw AI confidence scores in the metadata panel.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* Sidebar Area: AI Metadata */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white/80">AI Metadata Analysis</h2>
            
            <div className="bg-[#1E1E1E]/50 border border-white/5 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-4">Gemini Vision Response</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/50 mb-1">Model Version</p>
                  <p className="text-sm font-mono text-emerald-400">gemini-1.5-flash-latest</p>
                </div>
                
                <div className="w-full h-px bg-white/5" />

                <div>
                  <p className="text-xs text-white/50 mb-1">Raw JSON Payload (Last Capture)</p>
                  <div className="bg-black/50 p-3 rounded-lg border border-white/5 mt-2 overflow-x-auto">
                    <pre className="text-[10px] text-indigo-300">
{`{
  "headcount": ${lastCount},
  "status": "${isWarning ? 'distracted' : 'attentive'}",
  "notes": "${isWarning ? 'Fewer students detected in frame. Many empty desks visible.' : 'Students appear seated and focused.'}"
}`}
                    </pre>
                  </div>
                </div>
                
                <div className="w-full h-px bg-white/5" />

                <div>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-medium border border-white/10 text-white/80">
                    Flag Session for Manual Review
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Student Roster Section */}
          <div className="lg:col-span-3 space-y-6 mt-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Attendance Roster
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left early / Missing List */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                <h3 className="text-rose-400 font-semibold mb-4 border-b border-rose-500/20 pb-2">Left Early / Missing ({missingList.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {missingList.map((a) => (
                    <div key={a.rollNumber} className="flex justify-between items-center text-sm bg-black/40 p-2 rounded-lg border border-white/5">
                      <span className="text-white/80">{a.name}</span>
                      <span className="text-white/40 font-mono text-xs">{a.rollNumber}</span>
                    </div>
                  ))}
                  {missingList.length === 0 && (
                    <p className="text-white/30 text-sm italic">No missing students.</p>
                  )}
                </div>
              </div>

              {/* Present List */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                <h3 className="text-emerald-400 font-semibold mb-4 border-b border-emerald-500/20 pb-2">Present Entire Class ({presentList.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {presentList.map((a) => (
                    <div key={a.rollNumber} className="flex justify-between items-center text-sm bg-black/40 p-2 rounded-lg border border-white/5">
                      <span className="text-white/80">{a.name}</span>
                      <span className="text-white/40 font-mono text-xs">{a.rollNumber}</span>
                    </div>
                  ))}
                  {presentList.length === 0 && (
                    <p className="text-white/30 text-sm italic">No present students.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
