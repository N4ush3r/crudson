// app/api/auth
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  console.log(`[Auth] GET request: ${request.url}`);
  try {
    return await authGET(request);
  } catch (error) {
    console.error("[Auth] GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log(`[Auth] POST request: ${request.url}`);
  try {
    return await authPOST(request);
  } catch (error) {
    console.error("[Auth] POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}