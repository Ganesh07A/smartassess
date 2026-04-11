import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isTeacherRoute = createRouteMatcher(["/teacher(.*)"]);
const isStudentRoute = createRouteMatcher(["/student(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  
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