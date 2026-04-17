const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, email: true }
  });
  console.log('Students:', JSON.stringify(students, null, 2));
  
  const allUsers = await prisma.user.findMany({
    take: 5,
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('Sample Users:', JSON.stringify(allUsers, null, 2));
  
  await prisma.$disconnect();
}

check();
