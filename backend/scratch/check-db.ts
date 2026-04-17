import prisma from '../src/lib/prisma';

async function main() {
  try {
    const users = await prisma.user.count();
    const exams = await prisma.exam.count();
    const assignments = await prisma.examAssignment.count();
    const results = await prisma.result.count();
    const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    
    console.log('--- DB SUMMARY ---');
    console.log('Users:', users);
    console.log('Exams:', exams);
    console.log('Assignments:', assignments);
    console.log('Results:', results);
    console.log('Latest Student:', student);
    console.log('-----------------');
  } catch (e) {
    console.error('Prisma query failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
