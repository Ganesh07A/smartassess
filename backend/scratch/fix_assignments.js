const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'backend/.env' });

async function fix() {
  const prisma = new PrismaClient();

  try {
    const studentEmail = 'suvarnkarganesh2@gmail.com';
    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    
    if (!student) {
      console.error(`Student ${studentEmail} not found!`);
      return;
    }

    const publishedExams = await prisma.exam.findMany({
      where: { status: { in: ['PUBLISHED', 'ACTIVE'] } }
    });

    console.log(`Assigning student ${student.email} (ID: ${student.id}) to ${publishedExams.length} exams...`);

    for (const exam of publishedExams) {
      await prisma.examAssignment.upsert({
        where: { examId_studentId: { examId: exam.id, studentId: student.id } },
        create: { examId: exam.id, studentId: student.id },
        update: {}
      });
      console.log(`- Assigned to: ${exam.title}`);
    }

    console.log('\nSuccess! Exams should now be visible on the student dashboard.');

  } catch (err) {
    console.error('Fix failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
