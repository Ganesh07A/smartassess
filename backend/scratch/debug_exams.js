const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- USERS ---')
  const users = await prisma.user.findMany()
  console.table(users.map(u => ({ id: u.id, clerkId: u.clerkId, email: u.email, role: u.role })))

  console.log('\n--- EXAMS ---')
  const exams = await prisma.exam.findMany()
  console.table(exams.map(e => ({ id: e.id, title: e.title, status: e.status })))

  console.log('\n--- ASSIGNMENTS ---')
  const assignments = await prisma.examAssignment.findMany({
    include: {
      student: { select: { email: true } },
      exam: { select: { title: true } }
    }
  })
  console.table(assignments.map(a => ({ 
    id: a.id, 
    examId: a.examId, 
    studentId: a.studentId, 
    studentEmail: a.student?.email,
    examTitle: a.exam?.title
  })))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
