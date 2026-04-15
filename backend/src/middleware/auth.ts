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
    
    const role = (user.publicMetadata?.role as string) || 'student';
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
    
    const role = (user.publicMetadata?.role as string) || 'student';
    if (role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function getUserFromClerk(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.auth;
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown',
        },
      });
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}