"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Play, Pause, ChevronLeft, ShieldCheck, Activity, Trash2, LayoutDashboard, History, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type FaceApiLib = Awaited<typeof import("@vladmandic/face-api")>;

type SessionOption = {
  id: string;
  label: string;
};

type SampleStudentAttendance = {
  id: number;
  name: string;
  rollNumber: string;
  status: "attended" | "left";
};

type Detection = {
  score: number;
  box: { x: number; y: number; width: number; height: number };
};

type WebhookResult = {
  success?: boolean;
  presentCount?: number;
  analysis?: string;
  error?: string;
  emailDispatch?: {
    configuredForwardEmail: string | null;
    attempted: number;
    sent: number;
    details: Array<{
      studentName: string;
      studentEmail: string;
      attendancePercentage: number;
      targetEmail: string;
      sent: boolean;
      reason?: string;
    }>;
  };
};

export default function UnifiedCameraAgent() {
  const sampleAttendance: SampleStudentAttendance[] = [
    { id: 1, name: "Aarav Sharma", rollNumber: "DS-001", status: "attended" },
    { id: 2, name: "Ishita Verma", rollNumber: "DS-002", status: "attended" },
    { id: 3, name: "Rohan Singh", rollNumber: "DS-003", status: "attended" },
    { id: 4, name: "Sneha Patel", rollNumber: "DS-004", status: "attended" },
    { id: 5, name: "Aditya Kumar", rollNumber: "DS-005", status: "attended" },
    { id: 6, name: "Priya Nair", rollNumber: "DS-006", status: "attended" },
    { id: 7, name: "Karan Mehta", rollNumber: "DS-007", status: "attended" },
    { id: 8, name: "Ananya Gupta", rollNumber: "DS-008", status: "attended" },
    { id: 9, name: "Rahul Das", rollNumber: "DS-009", status: "attended" },
    { id: 10, name: "Neha Joshi", rollNumber: "DS-010", status: "attended" },
    { id: 11, name: "Vikram Yadav", rollNumber: "DS-011", status: "attended" },
    { id: 12, name: "Pooja Roy", rollNumber: "DS-012", status: "attended" },
    { id: 13, name: "Manav Rao", rollNumber: "DS-013", status: "attended" },
    { id: 14, name: "Ritika Sen", rollNumber: "DS-014", status: "attended" },
    { id: 15, name: "Aman Khan", rollNumber: "DS-015", status: "left" },
    { id: 16, name: "Nidhi Iyer", rollNumber: "DS-016", status: "left" },
    { id: 17, name: "Sahil Arora", rollNumber: "DS-017", status: "left" },
    { id: 18, name: "Tanya Bhat", rollNumber: "DS-018", status: "left" },
    { id: 19, name: "Harsh Jain", rollNumber: "DS-019", status: "left" },
    { id: 20, name: "Meera Sinha", rollNumber: "DS-020", status: "left" },
    { id: 21, name: "Arjun Malhotra", rollNumber: "DS-021", status: "attended" },
    { id: 22, name: "Diya Kulkarni", rollNumber: "DS-022", status: "attended" },
    { id: 23, name: "Kabir Chopra", rollNumber: "DS-023", status: "left" },
    { id: 24, name: "Sanya Reddy", rollNumber: "DS-024", status: "attended" },
    { id: 25, name: "Yash Tiwari", rollNumber: "DS-025", status: "left" },
  ];

  const attendedCount = sampleAttendance.filter((s) => s.status === "attended").length;
  const leftCount = sampleAttendance.filter((s) => s.status === "left").length;
  const totalCount = sampleAttendance.length;

  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [interval, setCaptureInterval] = useState("first_10_min");
  const [loading, setLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<WebhookResult | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const [mediaSrc, setMediaSrc] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceapiLib, setFaceapiLib] = useState<FaceApiLib | null>(null);
  const [faceCount, setFaceCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // ── Load face-api dynamically (client only) ──────────────────────────────
  useEffect(() => {
    const initAI = async () => {
      try {
        const lib = await import("@vladmandic/face-api");
        await lib.nets.tinyFaceDetector.loadFromUri("/models");
        setFaceapiLib(lib);
        setModelsLoaded(true);
        console.log("AI Vision Engine Ready ✓");
      } catch (err) {
        console.error("AI Init failed:", err);
      }
    };
    initAI();
  }, []);

  // ── Fetch sessions for sidebar ────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/dashboard/live?role=ADMIN")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Unable to load sessions (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data: { dashboardData?: Array<{ name?: string; subjects?: Array<{ name?: string; classes?: Array<{ id: string }> }> }> }) => {
        // Flatten courses -> subjects -> classes into a flat list for the selector
        const allSessions: SessionOption[] = [];
        if (data.dashboardData) {
          for (const course of data.dashboardData) {
            for (const subject of course.subjects || []) {
              for (const cls of subject.classes || []) {
                allSessions.push({ id: cls.id, label: `${course.name || "Course"} — ${subject.name || "Subject"}` });
              }
            }
          }
        }
        setSessions(allSessions);
        if (allSessions.length > 0) setSelectedSessionId(allSessions[0].id);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load sessions";
        setSessionError(message);
      })
      .finally(() => setLoadingSessions(false));
  }, []);

  // ── Core detection loop ───────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    if (!faceapiLib || !videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
    
    const video = videoRef.current;
    if (video.readyState < 2) return; // not ready

    const options = new faceapiLib.TinyFaceDetectorOptions({
      inputSize: 512,       // larger = more faces found (224, 320, 416, 512, 608)
      scoreThreshold: 0.3   // lower = detects more faces (default is 0.5)
    });

    const result = await faceapiLib.detectAllFaces(video, options);
    setDetections(result);
    setFaceCount(result.length);
  }, [faceapiLib]);

  // ── Start / stop the animation loop ──────────────────────────────────────
  const startLoop = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const loop = async () => {
      if (!isRunningRef.current) return;
      await runDetection();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [runDetection]);

  const stopLoop = useCallback(() => {
    isRunningRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ── Start loop when models become available and video already playing ──────
  useEffect(() => {
    if (modelsLoaded && isPlaying) {
      startLoop();
    }
    return () => stopLoop();
  }, [modelsLoaded]);

  useEffect(() => {
    return () => {
      if (mediaSrc) {
        URL.revokeObjectURL(mediaSrc);
      }
    };
  }, [mediaSrc]);

  useEffect(() => {
    const runImageDetection = async () => {
      if (!faceapiLib || !modelsLoaded || mediaType !== "image" || !mediaSrc) return;

      const img = new window.Image();
      img.src = mediaSrc;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const options = new faceapiLib.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
      const result = await faceapiLib.detectAllFaces(img, options);
      setDetections(result);
      setFaceCount(result.length);
    };

    runImageDetection().catch((err) => {
      console.error("Image detection failed:", err);
      setDetections([]);
      setFaceCount(0);
    });
  }, [faceapiLib, mediaSrc, mediaType, modelsLoaded]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stopLoop(), [stopLoop]);

  // ── File upload handler ───────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (mediaSrc) {
        URL.revokeObjectURL(mediaSrc);
      }
      stopLoop();
      setDetections([]);
      setFaceCount(0);
      setIsPlaying(false);
      const url = URL.createObjectURL(file);
      setMediaSrc(url);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    }
  };

  // ── Play/Pause toggle ─────────────────────────────────────────────────────
  const togglePlay = () => {
    if (mediaType !== "video" || !videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      startLoop();
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      stopLoop();
    }
  };

  // ── Webhook trigger ───────────────────────────────────────────────────────
  const simulateWebhook = async () => {
    if (!mediaSrc) return alert("Please upload a classroom feed first.");
    if (!selectedSessionId) return alert("No class session available. Seed the database first.");
    setLoading(true);
    setWebhookResult(null);

    try {
      let base64Image = "";
      if (mediaType === "video" && videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
      } else if (mediaType === "image") {
        const imageBlob = await fetch(mediaSrc).then((r) => r.blob());
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            const encoded = result.includes(",") ? result.split(",")[1] : "";
            resolve(encoded);
          };
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(imageBlob);
        });
      }

      if (!base64Image) {
        throw new Error("Unable to generate snapshot payload from media");
      }

      const res = await fetch("/api/attendance/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSessionId, base64Image, intervalString: interval, mimeType: "image/jpeg" }),
      });
      setWebhookResult(await res.json());
    } catch {
      setWebhookResult({ error: "Analysis failed." });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
              <ChevronLeft className="w-5 h-5 text-white/50" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Unified Camera Agent</h1>
              <p className="text-white/50 text-sm italic">AI Powered Real-time Attendance & Tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {faceCount > 0 && (
              <div className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" />
                {faceCount} Face{faceCount > 1 ? 's' : ''} Detected
              </div>
            )}
            <div className={`px-4 py-2 rounded-full border border-white/10 text-xs flex items-center gap-2 ${modelsLoaded ? 'border-emerald-500/30' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${modelsLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              {modelsLoaded ? 'Vision Engine Active' : 'Loading Models...'}
            </div>
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
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
            <p className="text-[10px] uppercase tracking-widest text-indigo-300">Feature</p>
            <p className="text-sm font-semibold">Live Face Detection + Webhook</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Video Feed */}
          <div className="lg:col-span-8 space-y-4">
            {!mediaSrc ? (
              <label className="flex flex-col items-center justify-center w-full h-[500px] border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition group">
                <Upload className="w-12 h-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-xl font-bold">Upload Classroom Feed</span>
                <p className="text-white/30 text-sm mt-2">Video or Image — Auto-detect starts immediately</p>
                <input type="file" className="hidden" accept="video/*,image/*" onChange={handleFileUpload} />
              </label>
            ) : (
              <div className="relative rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl group">
                {/* Video */}
                {mediaType === "video" ? (
                  <video
                    ref={videoRef}
                    src={mediaSrc}
                    className="w-full h-auto block"
                    muted
                    loop
                    playsInline
                    autoPlay
                    onLoadedData={() => {
                      setIsPlaying(true);
                      if (modelsLoaded) startLoop();
                    }}
                    onPlay={() => { setIsPlaying(true); startLoop(); }}
                    onPause={() => { setIsPlaying(false); stopLoop(); }}
                  />
                ) : (
                  <Image
                    src={mediaSrc}
                    alt="Uploaded classroom feed"
                    width={1280}
                    height={720}
                    unoptimized
                    className="w-full h-auto block"
                  />
                )}

                {/* Face Detection Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  <AnimatePresence>
                    {detections.map((det, i) => {
                      const { x, y, width, height } = det.box;
                      const vw = videoRef.current?.clientWidth || 1;
                      const vh = videoRef.current?.clientHeight || 1;
                      const nw = videoRef.current?.videoWidth || 1;
                      const nh = videoRef.current?.videoHeight || 1;
                      const sx = vw / nw;
                      const sy = vh / nh;
                      return (
                        <motion.div
                          key={`face-${i}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="absolute border-2 border-indigo-500 rounded-md"
                          style={{
                            left: x * sx,
                            top: y * sy,
                            width: width * sx,
                            height: height * sy,
                            boxShadow: '0 0 12px rgba(99,102,241,0.6)'
                          }}
                        >
                          <div className="absolute -top-6 left-0 bg-indigo-600 text-[10px] px-2 py-0.5 rounded-t text-white font-bold whitespace-nowrap">
                            STU-{String(i + 1).padStart(2, '0')} • {(det.score * 100).toFixed(1)}%
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  {mediaType === "video" && (
                    <button
                      onClick={togglePlay}
                      className="w-11 h-11 rounded-xl bg-black/70 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => { stopLoop(); setMediaSrc(null); setDetections([]); setFaceCount(0); }}
                    className="w-11 h-11 rounded-xl bg-black/70 backdrop-blur border border-white/20 flex items-center justify-center text-rose-400 hover:bg-black/90 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {/* Live Badge */}
                  {isPlaying && mediaType === "video" && (
                    <div className="px-3 py-1.5 rounded-lg bg-red-600/80 backdrop-blur text-xs font-bold flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE AI
                    </div>
                  )}
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 shadow-xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-indigo-400">
                <ShieldCheck className="w-5 h-5" /> AI Webhook Server
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-white/40 tracking-widest">Active Session</label>
                  <select
                    value={selectedSessionId}
                    onChange={e => setSelectedSessionId(e.target.value)}
                    disabled={sessions.length === 0 || loadingSessions}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
                  >
                    {loadingSessions && <option value="" className="bg-black">Loading sessions...</option>}
                    {!loadingSessions && sessions.length === 0 && <option value="" className="bg-black">No sessions available</option>}
                    {sessions.map(s => <option key={s.id} value={s.id} className="bg-black">{s.label}</option>)}
                  </select>
                  {sessionError && <p className="text-xs text-rose-400">{sessionError}</p>}
                  {!loadingSessions && sessions.length === 0 && !sessionError && (
                    <p className="text-xs text-amber-300">No classes found. Run seed and refresh.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-white/40 tracking-widest">Capture Interval</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['first_10_min', 'last_10_min'].map(pt => (
                      <button
                        key={pt}
                        onClick={() => setCaptureInterval(pt)}
                        className={`py-2 px-4 rounded-xl text-xs font-bold border transition ${interval === pt ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                      >
                        {pt === 'first_10_min' ? '▶ Start' : '⏹ End'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={simulateWebhook}
                  disabled={loading || !mediaSrc || sessions.length === 0}
                  className="w-full py-4 mt-2 bg-white text-black rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? <Activity className="w-5 h-5 animate-spin" /> : '⚡ Deploy Agent Logic'}
                </button>
              </div>

              {webhookResult && (
                <div className="mt-6 p-4 bg-black/40 rounded-xl border border-emerald-500/20 overflow-hidden">
                  <p className="text-[10px] font-bold text-emerald-400 mb-2 uppercase tracking-widest">Server Response</p>
                  <pre className="text-[9px] text-emerald-400/80 overflow-auto max-h-40">{JSON.stringify(webhookResult, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Detected Faces List */}
            {detections.length > 0 && (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
                <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-widest">Detected Faces</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {detections.map((det, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400">{i + 1}</div>
                        <span className="text-xs font-mono text-white/70">STU-{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <div className={`text-xs font-bold ${det.score > 0.85 ? 'text-emerald-400' : det.score > 0.6 ? 'text-amber-400' : 'text-white/40'}`}>
                        {(det.score * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance List */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">Attendance List</h3>
                <span className="text-[10px] text-white/40">{totalCount} Students Detected</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-300">Attended</p>
                  <p className="text-lg font-bold text-emerald-400">{attendedCount}</p>
                </div>
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-rose-300">Left</p>
                  <p className="text-lg font-bold text-rose-400">{leftCount}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {sampleAttendance.map((student) => (
                  <div key={student.id} className="flex items-center justify-between rounded-xl bg-black/30 border border-white/5 p-2.5">
                    <div>
                      <p className="text-xs font-semibold text-white/85">{student.name}</p>
                      <p className="text-[10px] font-mono text-white/40">{student.rollNumber}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                      student.status === "attended"
                        ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                        : "text-rose-300 border-rose-500/30 bg-rose-500/10"
                    }`}>
                      {student.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
