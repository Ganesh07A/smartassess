import { Router } from 'express';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

router.post('/webhook', async (req, res) => {
  let rawPayload: Buffer | string;

  if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
    rawPayload = req.body;
  } else {
    rawPayload = JSON.stringify(req.body ?? {});
  }

  if (!webhookSecret) {
    console.warn('CLERK_WEBHOOK_SECRET not set - skipping webhook verification');
  } else {
    const webhookId = req.headers['svix-id'] as string;
    const webhookTimestamp = req.headers['svix-timestamp'] as string;
    const webhookSignature = req.headers['svix-signature'] as string;

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    const wh = new Webhook(webhookSecret);
    const headers = {
      'svix-id': webhookId,
      'svix-timestamp': webhookTimestamp,
      'svix-signature': webhookSignature,
    };

    try {
      wh.verify(rawPayload, headers);
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  const payloadText = Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : rawPayload;
  let parsedPayload: any;

  try {
    parsedPayload = JSON.parse(payloadText);
  } catch (err) {
    console.error('Webhook payload JSON parsing failed:', err);
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  const { type, data } = parsedPayload;

  if (type === 'user.created') {
    const email = data.email_addresses?.[0]?.email_address;
    const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown';
    const role = (data.public_metadata?.role as string) || 'student';

    try {
      await prisma.user.create({
        data: {
          clerkId: data.id,
          email: email || '',
          name,
          role: role.toUpperCase() as any,
        },
      });
    } catch (err) {
      console.error('Error creating user:', err);
    }
  }

  if (type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address;
    const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown';
    const role = (data.public_metadata?.role as string) || 'student';

    try {
      await prisma.user.update({
        where: { clerkId: data.id },
        data: {
          email: email || undefined,
          name,
          role: role.toUpperCase() as any,
        },
      });
    } catch (err) {
      console.error('Error updating user:', err);
    }
  }

  if (type === 'user.deleted') {
    try {
      await prisma.user.delete({ where: { clerkId: data.id } });
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }

  res.json({ success: true });
});

router.post('/set-role', requireAuth, async (req, res) => {
  const { role } = req.body;
  const targetUserId = req.auth.userId;

  if (!targetUserId || !role) {
    return res.status(400).json({ error: 'Missing role' });
  }

  if (role !== 'student' && role !== 'teacher') {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const authUser = await clerkClient.users.getUser(targetUserId);
    const currentRole = (authUser.publicMetadata?.role as string) || 'student';

    if (currentRole === 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin role changes are not supported here' });
    }

    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role },
    });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: targetUserId } });
    if (dbUser) {
      await prisma.user.update({
        where: { clerkId: targetUserId },
        data: { role: role.toUpperCase() as any },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error setting role:', err);
    res.status(500).json({ error: 'Failed to set role' });
  }
});

router.put('/onboarding', requireAuth, async (req, res) => {
  const { name, prn, year, department } = req.body;
  const { userId } = (req as any).auth;

  if (!name || !prn || !year || !department) {
    return res.status(400).json({ error: 'All fields (name, prn, year, department) are required' });
  }

  try {
    // 1. Update DB
    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        name,
        prn,
        year,
        department,
      },
    });

    // 2. Sync name back to Clerk if needed
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    await clerkClient.users.updateUser(userId, {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error during onboarding:', err);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

export default router;
