"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { supabase, supabaseResponse, table } from "../database";
import { contentKinds, priceGroups, uuidPattern, type Asset, type ContentKind } from "../cms-model";
import { inquiryStatuses } from "../commerce";
import { requireAdmin } from "./auth";

const read = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const bucket = "rankova-media";
const failure = "저장하지 못했습니다. 입력값과 Supabase 연결을 확인해 주세요.";

export async function manageContent(_: string, form: FormData) {
  const { token } = await requireAdmin();
  const id = read(form, "id");
  const kind = read(form, "kind") as ContentKind;
  const remove = read(form, "intent") === "delete";
  if (!contentKinds.includes(kind) || (id && !uuidPattern.test(id))) return failure;

  try {
    const filter = { id: "eq." + id, kind: "eq." + kind };
    if (remove) {
      if (!id) return failure;
      const rows = await table<unknown[]>("rankova_content", filter, {
        method: "DELETE", headers: { Prefer: "return=representation" },
      }, { token });
      if (!rows.length) return "삭제할 항목이 없습니다.";
    } else {
      const title = read(form, "title");
      const body = read(form, "body");
      const order = read(form, "sort_order");
      const imageId = read(form, "image_id");
      const imageAlt = read(form, "image_alt");
      const group = read(form, "group_key");
      const amount = read(form, "amount");
      const game = read(form, "game");
      const source = read(form, "source");
      if (!title || title.length > 200 || body.length > 8000 || !/^\d{1,6}$/.test(order) ||
          (imageId && (!uuidPattern.test(imageId) || imageAlt.length > 200))) return "제목, 내용, 이미지와 노출 순서를 확인하세요.";
      if (kind === "valorant" || kind === "overwatch-2") {
        if (!priceGroups[kind].some(([key]) => key === group) || (amount && (!/^\d{1,9}$/.test(amount) || Number(amount) > 100000000))) {
          return "서비스 유형과 가격을 확인하세요.";
        }
      }
      if (kind === "review" && (!body || !["valorant", "overwatch-2"].includes(game) || !["customer", "operator"].includes(source))) {
        return "후기 내용, 게임과 작성 구분을 확인하세요.";
      }
      const values = {
        kind, title, body, sort_order: Number(order), published: form.get("published") === "on",
        image_id: imageId || null, image_alt: imageId ? imageAlt : "", group_key: group,
        game, source, amount: amount ? Number(amount) : null,
      };
      const rows = await table<unknown[]>("rankova_content", id ? filter : {}, {
        method: id ? "PATCH" : "POST", body: JSON.stringify(values), headers: { Prefer: "return=representation" },
      }, { token });
      if (!rows.length) return failure;
    }
    revalidatePath("/", "layout");
    return remove ? "삭제했습니다." : "저장했습니다.";
  } catch { return failure; }
}

function imageType(bytes: Uint8Array) {
  const buffer = Buffer.from(bytes);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return "image/jpeg";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function uploadImage(_: string, form: FormData) {
  const { token } = await requireAdmin();
  const file = form.get("image");
  if (!(file instanceof File) || !file.size || file.size > 2097152) return "2MB 이하 JPG, PNG 또는 WebP 파일을 선택하세요.";
  const data = await file.arrayBuffer();
  const mime = imageType(new Uint8Array(data));
  if (!mime || mime !== file.type) return "JPG, PNG 또는 WebP 이미지 형식을 확인하세요.";
  const id = randomUUID();
  const path = id + "." + mime.split("/")[1];
  try {
    const uploaded = await supabaseResponse("/storage/v1/object/" + bucket + "/" + path, {
      method: "POST", headers: { "Content-Type": mime }, body: data,
    }, { token });
    if (!uploaded.ok) return "이미지를 업로드하지 못했습니다.";
    try {
      await table("rankova_assets", {}, { method: "POST", body: JSON.stringify({
        id, name: file.name.slice(0, 160) || path, path, mime, size: file.size,
      }) }, { token });
    } catch {
      // A lost response may mean the asset row exists. Storage policy protects that row's object.
      await supabase("/storage/v1/object/" + bucket, {
        method: "DELETE", body: JSON.stringify({ prefixes: [path] }),
      }, { token }).catch(() => undefined);
      throw new Error("Asset registration failed");
    }
    revalidatePath("/admin");
    return "이미지를 등록했습니다.";
  } catch { return "이미지 등록을 완료하지 못했습니다. 이미지 목록을 확인해 주세요."; }
}

export async function removeImage(_: string, form: FormData) {
  const { token } = await requireAdmin();
  const id = read(form, "id");
  if (!uuidPattern.test(id)) return "이미지를 찾을 수 없습니다.";
  let asset: Asset | undefined;
  try {
    [asset] = await supabase<Asset[]>("/rest/v1/rpc/rankova_mark_asset_for_deletion", {
      method: "POST", body: JSON.stringify({ asset_id: id }),
    }, { token });
  } catch { return "사용 중인 이미지는 삭제할 수 없습니다. 연결 상태와 참조 항목을 확인하세요."; }
  if (!asset) return "이미지를 찾을 수 없습니다.";
  try {
    await supabase("/storage/v1/object/" + bucket, {
      method: "DELETE", body: JSON.stringify({ prefixes: [asset.path] }),
    }, { token });
    await table("rankova_assets", { id: "eq." + id, deleting: "eq.true" }, { method: "DELETE" }, { token });
    revalidatePath("/admin");
    return "이미지를 삭제했습니다.";
  } catch {
    revalidatePath("/admin");
    return "삭제를 완료하지 못했습니다. 목록에서 삭제를 다시 시도하세요.";
  }
}

export async function manageInquiry(_: string, form: FormData) {
  const { token } = await requireAdmin();
  const id = read(form, "id");
  const status = read(form, "status");
  const remove = read(form, "intent") === "delete";
  if (!uuidPattern.test(id) || (!remove && !inquiryStatuses.some((value) => value === status))) return failure;
  try {
    const rows = await table<unknown[]>("rankova_inquiries", { id: "eq." + id }, {
      method: remove ? "DELETE" : "PATCH",
      headers: { Prefer: "return=representation" },
      ...(remove ? {} : { body: JSON.stringify({ status }) }),
    }, { token });
    if (!rows.length) return "문의가 이미 삭제되었습니다.";
    revalidatePath("/admin");
    return remove ? "문의를 삭제했습니다." : "문의 상태를 저장했습니다.";
  } catch { return failure; }
}
