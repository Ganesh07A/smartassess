const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
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
}
main().catch(console.error).finally(() => prisma.$disconnect());
