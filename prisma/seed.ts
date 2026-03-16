import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing old data...')
  await prisma.studentAttendance.deleteMany()
  await prisma.attendanceCapture.deleteMany()
  await prisma.student.deleteMany()
  await prisma.classSession.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.course.deleteMany()
  await prisma.classroom.deleteMany()
  await prisma.user.deleteMany()

  console.log('Creating Admin & Teachers...')
  const admin = await prisma.user.create({
    data: { name: 'Principal Admin', email: 'admin@university.edu', role: 'ADMIN' }
  })

  const teachers = [
    { name: 'Amit Kumar Pandey', email: 'amit@university.edu' },
    { name: 'Ankita Srivastava', email: 'ankita@university.edu' },
    { name: 'Ratnesh Shukla', email: 'ratnesh@university.edu' },
    { name: 'Mandeep Kumar', email: 'mandeep@university.edu' },
    { name: 'Amrindra Pal', email: 'amrindra@university.edu' }
  ]
  const createdTeachers = []
  for (const t of teachers) {
    createdTeachers.push(await prisma.user.create({ data: { ...t, role: 'TEACHER' } }))
  }

  console.log('Creating Classrooms...')
  const rooms = [
    { name: 'Block-E-529', capacity: 70 },
    { name: 'Block-E-513', capacity: 60 },
    { name: 'Block-E-210', capacity: 65 },
    { name: 'Lab 1', capacity: 30 },
    { name: 'Lab 2', capacity: 30 }
  ]
  const createdRooms = []
  for (const r of rooms) {
    createdRooms.push(await prisma.classroom.create({ data: r }))
  }

  console.log('Creating Courses & Subjects...')
  const coursesData = [
    {
      name: 'B.Tech Data Science',
      subjects: [
        'Artificial Intelligence',
        'Database Management',
        'Operating Systems',
        'Machine Learning',
        'Data Visualization',
        'Cloud Computing',
        'Natural Language Processing'
      ]
    },
    {
      name: 'B.Tech CSE',
      subjects: [
        'Data Structures',
        'Algorithms',
        'Software Engineering',
        'Computer Networks',
        'Web Development',
        'Cyber Security'
      ]
    }
  ]

  let sessionCount = 0
  for (const cData of coursesData) {
    const course = await prisma.course.create({ data: { name: cData.name } })
    console.log(`Created Course: ${cData.name}`)

    for (const sName of cData.subjects) {
      const subject = await prisma.subject.create({
        data: { name: sName, courseId: course.id }
      })

      // Create a class session for each subject
      const teacher = createdTeachers[sessionCount % createdTeachers.length]
      const room = createdRooms[sessionCount % createdRooms.length]
      
      const session = await prisma.classSession.create({
        data: {
          title: `Section ${Math.random() > 0.5 ? 'A' : 'B'}`,
          subjectId: subject.id,
          teacherId: teacher.id,
          classroomId: room.id
        }
      })

      // Add dummy captures
      await prisma.attendanceCapture.create({
        data: {
          sessionId: session.id,
          intervalString: 'first_10_min',
          headcount: 55 + Math.floor(Math.random() * 10),
          status: 'attentive',
          aiNotes: 'Class started smoothly.'
        }
      })

      sessionCount++
    }
  }

  console.log(`Created ${sessionCount} total sessions across 2 courses.`)
  console.log('Seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
