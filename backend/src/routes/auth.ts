import { Router } from 'express';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/express';
import prisma from '../lib/prisma';

const router = Router();

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

router.post('/webhook', async (req, res) => {
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
    const payload = JSON.stringify(req.body);
    const headers = {
      'svix-id': webhookId,
      'svix-timestamp': webhookTimestamp,
      'svix-signature': webhookSignature,
    };

    try {
      wh.verify(payload, headers);
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }
  }

  const { type, data } = req.body;

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

router.post('/set-role', async (req, res) => {
  const { userId, role } = req.body;
  
  if (!userId || !role) {
    return res.status(400).json({ error: 'Missing userId or role' });
  }

  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (dbUser) {
      await prisma.user.update({
        where: { clerkId: userId },
        data: { role: role.toUpperCase() as any },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error setting role:', err);
    res.status(500).json({ error: 'Failed to set role' });
  }
});

export default router;