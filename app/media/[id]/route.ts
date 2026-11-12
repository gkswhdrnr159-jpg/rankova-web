import { currentAdmin } from "../../admin/auth";
import { configured, supabaseResponse, table } from "../../database";
import { uuidPattern, type Asset } from "../../cms-model";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!configured() || !uuidPattern.test(id)) return new Response(null, { status: 404 });
  try {
    const preview = new URL(request.url).searchParams.has("preview");
    const admin = preview ? await currentAdmin() : null;
    if (preview && !admin) return new Response(null, { status: 404 });
    const [asset] = await table<Asset[]>("rankova_assets", { id: "eq." + id, deleting: "eq.false" }, undefined, admin ?? {});
    if (!asset || !/^[0-9a-f-]+\.(png|jpeg|webp)$/.test(asset.path)) return new Response(null, { status: 404 });
    const upstream = await supabaseResponse("/storage/v1/object/authenticated/rankova-media/" + asset.path);
    if (!upstream.ok) return new Response(null, { status: 404 });
    return new Response(upstream.body, { headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch { return new Response(null, { status: 404 }); }
}
