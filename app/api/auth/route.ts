import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, findUserByEnrollmentId } from "@/lib/db";
import { createSessionToken, hashPassword, sessionCookie, verifyPassword } from "@/lib/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = text(body.action);
    const email = text(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!emailPattern.test(email) || password.length < 8) {
      return NextResponse.json({ error: "Enter a valid email and a password of at least 8 characters." }, { status: 400 });
    }

    if (action === "signup") {
      const enrollmentId = text(body.enrollmentId);
      const name = text(body.name);
      if (!enrollmentId || !name) {
        return NextResponse.json({ error: "Name and enrollment ID are required." }, { status: 400 });
      }
      if (await findUserByEmail(email)) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      if (await findUserByEnrollmentId(enrollmentId)) {
        return NextResponse.json({ error: "An account with this enrollment ID already exists. Please log in with its registered email." }, { status: 409 });
      }
      let user;
      try {
        user = await createUser({
          enrollmentId, name, email, phone: text(body.phone), branch: text(body.branch),
          graduationYear: Number.isInteger(body.graduationYear) ? Number(body.graduationYear) : undefined,
          cgpa: typeof body.cgpa === "number" ? body.cgpa : undefined,
          passwordHash: await hashPassword(password),
        });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
          return NextResponse.json({ error: "An account with this email or enrollment ID already exists. Please log in instead." }, { status: 409 });
        }
        throw error;
      }
      const response = NextResponse.json({ user });
      response.cookies.set(sessionCookie(createSessionToken(user.userId)));
      return response;
    }

    if (action === "login") {
      const user = await findUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
      }
      const response = NextResponse.json({
        user: { userId: user.userId, enrollmentId: user.enrollmentId, name: user.name, email: user.email },
      });
      response.cookies.set(sessionCookie(createSessionToken(user.userId)));
      return response;
    }

    return NextResponse.json({ error: "Unsupported authentication action." }, { status: 400 });
  } catch (error) {
    console.error("Authentication error:", error);
    if (error instanceof Error && error.message.includes("AUTH_SECRET")) {
      return NextResponse.json(
        { error: "Authentication is not configured. Add AUTH_SECRET to .env.local and restart the Next.js server." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Unable to complete authentication." }, { status: 500 });
  }
}
