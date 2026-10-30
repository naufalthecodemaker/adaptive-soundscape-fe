import { NextRequest, NextResponse } from "next/server";
import https from "https";

const R2_HOST = "pub-7cdde38dc97d41fa82ec8d4264d26a1f.r2.dev";

/**
 * Proxy audio dari Cloudflare R2 (*.r2.dev) yang diblokir oleh DNS/ISP di jaringan lokal
 * menggunakan DNS-over-HTTPS (Cloudflare 1.1.1.1) sehingga browser (Opera/Chrome) bisa memutarnya.
 */
async function resolveHostViaDoH(hostname: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
      {
        headers: { accept: "application/dns-json" },
      }
    );
    const data = await res.json();
    const record = data?.Answer?.find((a: any) => a.type === 1);
    return record?.data || null;
  } catch {
    return null;
  }
}

function fetchViaDirectIp(urlObj: URL, ip: string, rangeHeader?: string | null): Promise<{
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: ip,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        servername: urlObj.hostname, // SNI tetap menggunakan hostname asli R2
        headers: {
          Host: urlObj.hostname,
          ...(rangeHeader ? { Range: rangeHeader } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on("end", () => {
          const outHeaders: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === "string") outHeaders[k] = v;
          }
          resolve({
            status: res.statusCode || 200,
            headers: outHeaders,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  // Batasi hanya ke domain R2 atau S3
  if (!parsed.hostname.endsWith(".r2.dev") && !parsed.hostname.endsWith(".cloudflarestorage.com")) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const rangeHeader = req.headers.get("range");

  // 1. Coba fetch biasa terlebih dahulu (jika jaringan/DNS tidak memblokir r2.dev)
  try {
    const upstream = await fetch(parsed.toString(), {
      headers: rangeHeader ? { Range: rangeHeader } : undefined,
    });
    if (upstream.ok || upstream.status === 206) {
      const buf = await upstream.arrayBuffer();
      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "audio/wav");
      headers.set("Accept-Ranges", "bytes");
      const contentRange = upstream.headers.get("Content-Range");
      if (contentRange) headers.set("Content-Range", contentRange);
      headers.set("Content-Length", String(buf.byteLength));
      return new NextResponse(buf, { status: upstream.status, headers });
    }
  } catch {
    // Lanjut ke fallback DoH jika diblokir ISP/DNS
  }

  // 2. Fallback: Resolve IP asli Cloudflare via DoH (1.1.1.1) untuk melewati blokir DNS ISP
  try {
    const ip = (await resolveHostViaDoH(parsed.hostname)) || "172.64.66.1";
    const result = await fetchViaDirectIp(parsed, ip, rangeHeader);

    const headers = new Headers();
    headers.set("Content-Type", result.headers["content-type"] || "audio/wav");
    headers.set("Accept-Ranges", "bytes");
    if (result.headers["content-range"]) {
      headers.set("Content-Range", result.headers["content-range"]);
    }
    headers.set("Content-Length", String(result.body.byteLength));

    return new NextResponse(new Uint8Array(result.body), {
      status: result.status,
      headers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to proxy audio" },
      { status: 502 }
    );
  }
}

