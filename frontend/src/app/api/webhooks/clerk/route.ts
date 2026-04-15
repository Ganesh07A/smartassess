// src/app/api/webhooks/clerk/route.ts
import { clerkClient } from "@clerk/nextjs/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET!);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id!,
      "svix-timestamp": svix_timestamp!,
      "svix-signature": svix_signature!,
    }) as WebhookEvent;
  } catch (err) {
    return Response.json({ error: "Invalid webhook" }, { status: 400 });
  }

  // When new user signs up → assign student role by default
  if (evt.type === "user.created") {
    const { id } = evt.data;

    const client = await clerkClient();
    await client.users.updateUserMetadata(id, {
      publicMetadata: {
        role: "student", // 👈 everyone starts as student
      },
    });

    console.log(`Assigned student role to user: ${id}`);
  }

  return Response.json({ success: true });
}