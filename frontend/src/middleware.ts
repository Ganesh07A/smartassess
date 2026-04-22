// FRONTEND/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isTeacherRoute = createRouteMatcher(["/teacher(.*)"]);
const isStudentRoute = createRouteMatcher(["/student(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {

  // ✅ Safety check
  if (!req?.nextUrl) return NextResponse.next();

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role as string || "student";
  const pathname = req.nextUrl.pathname;

  // 1. NOT LOGGED IN
  if (!userId) {
    // Allow public routes
    if (isPublicRoute(req)) return NextResponse.next();
    // Block everything else → sign in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 2. LOGGED IN - Handle "/" redirect
  if (pathname === "/") {
    if (role === "teacher" || role === "admin") {
      return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  // 3. LOGGED IN - trying sign-in or sign-up → redirect to dashboard
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    if (role === "teacher" || role === "admin") {
      return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  // 4. PROTECT TEACHER ROUTES
  if (isTeacherRoute(req) && role !== "teacher" && role !== "admin") {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  // 5. PROTECT STUDENT ROUTES
  if (isStudentRoute(req) && (role === "teacher" || role === "admin")) {
    return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};