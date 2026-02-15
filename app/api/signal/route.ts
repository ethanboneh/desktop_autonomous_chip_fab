import { NextRequest, NextResponse } from "next/server";
import { getStore, resetStore } from "@/lib/webrtc-signal-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  const store = getStore();

  if (role === "viewer") {
    // Viewer polls for broadcaster's offer and ICE candidates
    return NextResponse.json({
      offer: store.broadcasterOffer,
      candidates: store.broadcasterCandidates,
    });
  }

  if (role === "broadcaster") {
    // Broadcaster polls for viewer's answer and ICE candidates
    return NextResponse.json({
      answer: store.viewerAnswer,
      candidates: store.viewerCandidates,
    });
  }

  return NextResponse.json({ error: "role query param required (broadcaster|viewer)" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, role } = body;
  const store = getStore();

  if (type === "offer" && role === "broadcaster") {
    // New broadcast session — reset everything
    resetStore();
    const freshStore = getStore();
    freshStore.broadcasterOffer = body.sdp;
    return NextResponse.json({ ok: true });
  }

  if (type === "answer" && role === "viewer") {
    store.viewerAnswer = body.sdp;
    return NextResponse.json({ ok: true });
  }

  if (type === "candidate") {
    const candidate: RTCIceCandidateInit = body.candidate;
    if (role === "broadcaster") {
      store.broadcasterCandidates.push(candidate);
    } else if (role === "viewer") {
      store.viewerCandidates.push(candidate);
    } else {
      return NextResponse.json({ error: "invalid role" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid type" }, { status: 400 });
}
