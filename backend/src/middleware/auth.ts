import { clerkClient, getAuth } from '@clerk/express';
import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {

  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }

  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  (req as any).auth = auth;
  next();
};


export async function requireTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.auth;
    const user = await clerkClient.users.getUser(userId);

    const role = (user.publicMetadata?.role as string || 'student').toLowerCase();
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Teacher access required' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function requireStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.auth;
    const user = await clerkClient.users.getUser(userId);

    const role = (user.publicMetadata?.role as string || 'student').toLowerCase();

    // Allow admins and teachers to also access student views for testing/preview 
    const isAllowed = role === 'student' || role === 'teacher' || role === 'admin';

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function resolveUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = (req as any).auth;

    // 1. Try to find user by clerkId
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });

    if (!user) {
      // 2. Fetch user details from Clerk
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      
      // Smart Name Logic: Full Name > First+Last > Email Prefix > Student
      let name = '';
      if (clerkUser.firstName || clerkUser.lastName) {
        name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
      } else if (email) {
        name = email.split('@')[0];
      } else {
        name = 'Student';
      }

      const role = (clerkUser.publicMetadata?.role as string || 'STUDENT').toUpperCase() as any;

      // 3. Check if a user with this email already exists but lacks a clerkId (or has a different one)
      const existingUserByEmail = await prisma.user.findUnique({ where: { email } });

      if (existingUserByEmail) {
        // 4. Link existing record to this Clerk account
        user = await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            clerkId: userId,
            // Only update name if it was 'Unknown' or empty
            name: (!existingUserByEmail.name || existingUserByEmail.name === 'Unknown') ? name : existingUserByEmail.name,
          }
        });
      } else {
        // 5. Create new user record
        user = await prisma.user.create({
          data: {
            clerkId: userId,
            email,
            name,
            role: ['STUDENT', 'TEACHER', 'ADMIN'].includes(role) ? role : 'STUDENT'
          },
        });
      }
    }

    (req as any).user = user;
    (req as any).userId = user.id;
    console.log(`[AUTH] Resolved User: ${user.email} (ID: ${user.id}) with Role: ${user.role}`);
    next();
  } catch (error) {
    console.error('User resolution failed:', error);
    return res.status(401).json({ error: 'Unauthorized: User record could not be resolved' });
  }
}