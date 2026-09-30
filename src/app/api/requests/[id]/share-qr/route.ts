import { getShareableRequest } from "@/lib/request-share";
import { renderShareQrPng } from "@/lib/share-card-render";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const req = await getShareableRequest(id);
    if (!req) {
      return new Response("Not found", { status: 404 });
    }
    const png = await renderShareQrPng(req);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("share-qr failed", err);
    return new Response("Failed to generate QR", { status: 500 });
  }
}
