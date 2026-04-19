const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function debug() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- SYSTEM STATUS ---');
    const userCount = await prisma.user.count();
    const examCount = await prisma.exam.count();
    const assignmentCount = await prisma.examAssignment.count();
    console.log(`Users: ${userCount}, Exams: ${examCount}, Assignments: ${assignmentCount}`);

    console.log('\n--- ACTIVE/PUBLISHED EXAMS ---');
    const activeExams = await prisma.exam.findMany({
      where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
      select: { id: true, title: true, status: true }
    });
    console.table(activeExams);

    console.log('\n--- RECENT USERS ---');
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, email: true, name: true, clerkId: true }
    });
    console.table(recentUsers);

    console.log('\n--- ASSIGNMENTS BY USER ---');
    const assignmentsByUser = await prisma.examAssignment.groupBy({
      by: ['studentId'],
      _count: { studentId: true }
    });
    
    for (const group of assignmentsByUser) {
      const user = await prisma.user.findUnique({ where: { id: group.studentId }, select: { email: true } });
      console.log(`User ${user?.email || group.studentId}: ${group._count.studentId} assignments`);
    }

  } catch (err) {
    console.error('Debug failed:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

debug();
