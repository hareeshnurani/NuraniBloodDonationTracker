import { getShareableRequest } from "@/lib/request-share";
import { renderShareCardPng } from "@/lib/share-card-render";

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

    const png = await renderShareCardPng(req);

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("share-card generation failed", err);
    return new Response("Failed to generate share image", { status: 500 });
  }
}
