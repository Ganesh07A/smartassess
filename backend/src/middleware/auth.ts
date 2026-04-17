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
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      // Determine initial role from Clerk metadata or default to STUDENT
      const role = (clerkUser.publicMetadata?.role as string || 'STUDENT').toUpperCase() as any;
      
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown',
          role: ['STUDENT', 'TEACHER', 'ADMIN'].includes(role) ? role : 'STUDENT'
        },
      });
    }
    
    (req as any).user = user;
    (req as any).userId = user.id;
    next();
  } catch (error) {
    console.error('User resolution failed:', error);
    return res.status(401).json({ error: 'Unauthorized: User record could not be resolved' });
  }
}