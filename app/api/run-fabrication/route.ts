import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Stub: In production, this would forward to the hardware controller
  // and trigger the OpenEvolve evolutionary loop
  const response = {
    status: "accepted",
    jobId: `fab-${Date.now()}`,
    params: body,
    message: "Fabrication job queued. Evolutionary loop starting...",
    estimatedSteps: 6,
    // In production: WebSocket URL for real-time updates
    wsEndpoint: "/api/ws/fabrication-status",
  };

  return NextResponse.json(response);
}

export async function GET() {
  // Return current fabrication status
  return NextResponse.json({
    status: "idle",
    lastJob: null,
    queueLength: 0,
    hardwareConnected: false,
  });
}
