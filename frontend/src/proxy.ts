import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isTeacherRoute = createRouteMatcher(["/teacher(.*)"]);
const isStudentRoute = createRouteMatcher(["/student(.*)"]);
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const isLandingPage = req.nextUrl.pathname === "/";

  // 1. If at landing page and authenticated, redirect to dashboard based on role
  if (userId && isLandingPage) {
    const role = (sessionClaims?.metadata as any)?.role || "student";
    const dashboard = (role === "teacher" || role === "admin") ? "/teacher/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(dashboard, req.url));
  }

  // 2. Otherwise, if it's a public route, let them through
  const isPublic = isPublicRoute(req);
  if (isPublic && !userId) return NextResponse.next();
  if (isPublic && userId && !isLandingPage) return NextResponse.next();

  
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }


  const role = sessionClaims?.metadata?.role as string || "student";

  if (isTeacherRoute(req) && role !== "teacher" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isStudentRoute(req) && role !== "student") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};