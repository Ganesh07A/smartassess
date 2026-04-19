const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'backend/.env' });

async function debug() {
  const prisma = new PrismaClient();

  try {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({
       select: { id: true, email: true, name: true, role: true, clerkId: true }
    });
    console.table(users);

    console.log('\n--- EXAMS ---');
    const exams = await prisma.exam.findMany({
      select: { id: true, title: true, status: true }
    });
    console.table(exams);

    console.log('\n--- ALL ASSIGNMENTS ---');
    const assignments = await prisma.examAssignment.findMany({
      include: {
        student: { select: { email: true } },
        exam: { select: { title: true } }
      }
    });
    console.table(assignments.map(a => ({
      exam: a.exam.title,
      student: a.student.email,
      studentId: a.studentId
    })));

  } catch (err) {
    console.error('Debug failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
