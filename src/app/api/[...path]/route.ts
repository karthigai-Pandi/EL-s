import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function apiBaseUrl() {
  const base = process.env.API_BASE_URL
    || process.env.NEXT_PUBLIC_API_BASE_URL
    || "https://el-s.onrender.com";
  return base.replace(/\/$/, "");
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${apiBaseUrl()}/api/${path.join("/")}${request.nextUrl.search}`;

  try {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    const authorization = request.headers.get("authorization");
    if (authorization) headers.set("authorization", authorization);

    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.text();

    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    console.error("API proxy request failed:", target, error);
    return NextResponse.json(
      { error: "The checkout service is temporarily unreachable. Please try again." },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}
