import { ImageResponse } from "next/og";
import { getShareableRequest } from "@/lib/request-share";
import {
  buildShareCardElement,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "@/lib/share-card-element";

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

    return new ImageResponse(buildShareCardElement(req), {
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("share-card generation failed", err);
    return new Response("Failed to generate share image", { status: 500 });
  }
}
