import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const VALID_TYPES = [
  "sportsPost",
  "workProject",
  "person",
  "pageSettings",
  "skill",
  "workExperience",
  "socialLink",
  "galleryImage",
] as const;

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: "SANITY_REVALIDATE_SECRET not set" },
      { status: 500 }
    );
  }

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  let body: { _type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const type = body._type;

  if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return NextResponse.json(
      { message: `Unknown document type: ${type}` },
      { status: 400 }
    );
  }

  revalidateTag(type);

  return NextResponse.json({ revalidated: true, type });
}
