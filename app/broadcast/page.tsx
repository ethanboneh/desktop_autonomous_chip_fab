"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const POLL_INTERVAL = 1000;

type Status = "idle" | "capturing" | "offering" | "waiting" | "connected";

export default function BroadcastPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appliedCandidatesRef = useRef(0);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  const startBroadcast = useCallback(async () => {
    try {
      setError(null);
      setStatus("capturing");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setStatus("offering");

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Send ICE candidates to signaling server
      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          await fetch("/api/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "candidate", role: "broadcaster", candidate: e.candidate.toJSON() }),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("connected");
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("idle");
          cleanup();
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "offer", role: "broadcaster", sdp: pc.localDescription }),
      });

      setStatus("waiting");

      // Poll for viewer answer
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/signal?role=broadcaster");
          const data = await res.json();

          if (data.answer && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }

          // Apply new ICE candidates from viewer
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access camera");
      setStatus("idle");
    }
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const statusLabel: Record<Status, string> = {
    idle: "Ready to broadcast",
    capturing: "Accessing camera...",
    offering: "Creating connection...",
    waiting: "Waiting for viewer to connect...",
    connected: "Live — Streaming to viewer",
  };

  const statusColor: Record<Status, string> = {
    idle: "bg-gray-500",
    capturing: "bg-yellow-500",
    offering: "bg-yellow-500",
    waiting: "bg-yellow-500 animate-pulse",
    connected: "bg-green-500",
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor[status]}`} />
          <span className="text-sm text-gray-300 font-mono">{statusLabel[status]}</span>
        </div>
        {status === "idle" ? (
          <button
            onClick={startBroadcast}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg active:bg-blue-700"
          >
            Start Camera
          </button>
        ) : (
          <button
            onClick={() => {
              cleanup();
              if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
                videoRef.current.srcObject = null;
              }
              setStatus("idle");
              appliedCandidatesRef.current = 0;
            }}
            className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg active:bg-red-700"
          >
            Stop
          </button>
        )}
      </div>

      {/* Video preview */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-white text-lg font-semibold mb-2">Fabrication Chamber Broadcaster</p>
            <p className="text-gray-400 text-sm">
              Tap &quot;Start Camera&quot; to begin streaming the rear camera to the live fabrication viewer.
            </p>
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-900/90 text-red-200 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
