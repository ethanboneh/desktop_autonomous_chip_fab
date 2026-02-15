"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Activity, Clock, Gauge, Camera, Target } from "lucide-react";
import { fabricationStatus } from "@/lib/mock-data";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const POLL_INTERVAL = 1000;

type ConnectionState = "disconnected" | "connecting" | "live";

interface AnalysisScores {
  uniformity: number;
  coverage: number;
  defects: number;
  overall_fitness: number;
  timestamp?: number;
}

function StatusMetric({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg border border-border">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted uppercase tracking-wider truncate">
          {label}
        </div>
        <div className="text-sm font-mono font-semibold">
          {value}
          <span className="text-muted text-xs ml-1">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-muted">{label}</span>
        <span style={{ color }}>{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function LiveFabrication() {
  const [elapsed, setElapsed] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [latestScores, setLatestScores] = useState<AnalysisScores | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appliedCandidatesRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcRef.current?.close();
    pcRef.current = null;
    appliedCandidatesRef.current = 0;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const connectToCamera = useCallback(async () => {
    cleanup();
    setConnectionState("connecting");

    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (videoRef.current && e.streams[0]) {
        videoRef.current.srcObject = e.streams[0];
      }
    };

    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await fetch("/api/signal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "candidate", role: "viewer", candidate: e.candidate.toJSON() }),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setConnectionState("live");
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setConnectionState("disconnected");
        cleanup();
      }
    };

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/signal?role=viewer");
        const data = await res.json();

        if (data.offer && !pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await fetch("/api/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "answer", role: "viewer", sdp: pc.localDescription }),
          });
        }

        if (data.candidates && data.candidates.length > appliedCandidatesRef.current) {
          const newCandidates = data.candidates.slice(appliedCandidatesRef.current);
          for (const c of newCandidates) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          appliedCandidatesRef.current = data.candidates.length;
        }
      } catch {
        // Polling errors are non-fatal
      }
    }, POLL_INTERVAL);
  }, [cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState("disconnected");
  }, [cleanup]);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

    try {
      const res = await fetch("/api/signal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: base64 }),
      });
      const data = await res.json();
      if (data.analysis) {
        setLatestScores(data.analysis);
      }
      console.log("Frame capture analysis:", data.analysis);
      return data.analysis;
    } catch (err) {
      console.error("Frame capture failed:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <section id="live-fabrication" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Video size={20} className="text-accent-green" />
            <span className="text-xs font-mono text-accent-green uppercase tracking-wider">
              Real-Time Monitoring
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Live Fabrication Feed
          </h2>
          <p className="text-muted max-w-2xl mb-8 leading-relaxed">
            Monitor the autonomous fabrication chamber in real time. The system
            captures high-resolution imagery for closed-loop quality assessment.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionState === "live"
                        ? "bg-red-500 pulse-dot"
                        : connectionState === "connecting"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-gray-500"
                    }`}
                  />
                  <span className="text-xs font-mono text-muted">
                    {connectionState === "live"
                      ? "LIVE — Fabrication Chamber"
                      : connectionState === "connecting"
                      ? "CONNECTING..."
                      : "OFFLINE — Fabrication Chamber"}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted">
                  {formatTime(elapsed)}
                </span>
              </div>

              <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${
                    connectionState === "live" ? "block" : "hidden"
                  }`}
                />

                {connectionState !== "live" && (
                  <>
                    <div className="absolute inset-0 grid-bg opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />

                    <div className="relative flex flex-col items-center">
                      {connectionState === "connecting" ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 rounded-full border-2 border-accent-blue/50 border-t-accent-blue"
                          />
                          <p className="text-xs text-muted/60 font-mono mt-4">
                            Waiting for broadcaster...
                          </p>
                        </>
                      ) : (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="w-32 h-32 rounded-full border-2 border-accent-blue/30 flex items-center justify-center"
                          >
                            <motion.div
                              animate={{ rotate: -360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              className="w-20 h-20 rounded-full border border-accent-cyan/20 flex items-center justify-center"
                            >
                              <div className="w-8 h-8 rounded-full bg-accent-blue/20 border border-accent-blue/40" />
                            </motion.div>
                          </motion.div>
                          <p className="text-xs text-muted/60 font-mono mt-4">
                            Awaiting camera connection...
                          </p>
                          <p className="text-[10px] text-muted/40 font-mono mt-1">
                            Open /broadcast on iPhone to stream
                          </p>
                        </>
                      )}
                    </div>
                  </>
                )}

                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm px-3 py-1.5 rounded-md">
                  <span className="text-xs font-mono text-accent-green">
                    Inside Autonomous Fabrication Chamber
                  </span>
                </div>
              </div>

              {/* Controls bar */}
              <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-surface-2">
                {connectionState === "disconnected" && (
                  <button
                    onClick={connectToCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue/20 border border-accent-blue/30 text-accent-blue text-xs font-mono rounded-md hover:bg-accent-blue/30 transition-colors"
                  >
                    <Video size={12} />
                    Connect to Camera
                  </button>
                )}
                {connectionState === "connecting" && (
                  <button
                    onClick={disconnect}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-mono rounded-md hover:bg-yellow-500/30 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {connectionState === "live" && (
                  <>
                    <button
                      onClick={disconnect}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono rounded-md hover:bg-red-500/30 transition-colors"
                    >
                      Disconnect
                    </button>
                    <button
                      onClick={captureFrame}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-green/20 border border-accent-green/30 text-accent-green text-xs font-mono rounded-md hover:bg-accent-green/30 transition-colors"
                    >
                      <Camera size={12} />
                      Capture Frame
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Status panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Activity size={14} className="text-accent-green" />
                Chamber Status
              </h3>

              <div className="space-y-3">
                <StatusMetric
                  icon={Gauge}
                  label="Mask Angle"
                  value={fabricationStatus.maskAngle}
                  unit="deg"
                  color="#3b82f6"
                />
                <StatusMetric
                  icon={Clock}
                  label="Exposure Time"
                  value={fabricationStatus.exposureTime}
                  unit="ms"
                  color="#06b6d4"
                />
              </div>
            </div>

            {/* Latest Score card */}
            <AnimatePresence>
              {latestScores && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-surface rounded-xl border border-accent-green/20 p-4"
                >
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent-green">
                    <Target size={14} />
                    Latest Score
                  </h3>
                  <div className="space-y-3">
                    <ScoreBar label="Overall Fitness" value={latestScores.overall_fitness} color="#10b981" />
                    <ScoreBar label="Uniformity" value={latestScores.uniformity} color="#3b82f6" />
                    <ScoreBar label="Coverage" value={latestScores.coverage} color="#06b6d4" />
                    <ScoreBar label="Defects (inv)" value={latestScores.defects} color="#8b5cf6" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="text-[10px] text-muted uppercase tracking-wider mb-2">
                Material
              </div>
              <div className="text-sm font-mono font-semibold text-accent-cyan">
                {fabricationStatus.material}
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="text-[10px] text-muted uppercase tracking-wider mb-2">
                Current Experiment
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold text-accent-blue">
                  #{fabricationStatus.currentExperiment}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-accent-green pulse-dot" />
                  <span className="text-xs font-mono text-accent-green capitalize">
                    {fabricationStatus.status}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
