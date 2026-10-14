import { NextRequest, NextResponse } from "next/server";
import {
  getApplicationCount,
  getApplicationStatuses,
  getHistoricalPlacements,
  getPlacementOpportunities,
} from "@/lib/db";
import { cookieName, readSessionUserId } from "@/lib/auth";

function integer(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 2000 && parsed < 2200 ? parsed : null;
}

function positiveInteger(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> },
) {
  const { year: rawYear } = await params;
  const year = integer(rawYear);
  if (!year) return NextResponse.json({ error: "Invalid placement year." }, { status: 400 });

  try {
    const query = request.nextUrl.searchParams;
    const action = query.get("action");
    const companyId = positiveInteger(query.get("companyId"));

    if (action === "history") {
      if (!companyId) return NextResponse.json({ error: "A valid company is required." }, { status: 400 });
      return NextResponse.json({ history: await getHistoricalPlacements(companyId, year) });
    }

    if (action === "status") {
      if (!companyId) return NextResponse.json({ error: "A valid company is required." }, { status: 400 });
      const userId = readSessionUserId(request.cookies.get(cookieName)?.value);
      if (!userId) {
        return NextResponse.json({
          available: false,
          message: "Please log in or create an account to view your application status.",
          statuses: [],
        });
      }
      return NextResponse.json({
        available: true,
        statuses: await getApplicationStatuses(userId, companyId, year),
        applicationCount: await getApplicationCount(userId, year),
      });
    }

    const opportunities = await getPlacementOpportunities(year, {
      search: query.get("search")?.trim() || undefined,
      status: query.get("status")?.trim() || undefined,
      role: query.get("role")?.trim() || undefined,
      eligibility: query.get("eligibility")?.trim() || undefined,
    });
    return NextResponse.json({
      year,
      opportunities,
      companyCount: new Set(opportunities.map((item) => item.companyId)).size,
    });
  } catch (error) {
    console.error("Placement API error:", error);
    return NextResponse.json({ error: "Unable to load placement data." }, { status: 500 });
  }
}
