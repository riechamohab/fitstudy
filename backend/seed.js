const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create motivation messages
  for (const message of [
    "You're doing great! Every step forward is progress.",
    "Believe in yourself! You're capable of amazing things.",
    "Small progress is still progress. Keep going!",
    "Your hard work will pay off. Stay focused!",
    "Take it one task at a time. You've got this!",
    "Success is the sum of small efforts repeated daily.",
    "You're stronger than you think. Keep pushing forward!",
    "Every expert was once a beginner. Keep learning!",
    "Your future self will thank you for the work you're doing today.",
    "Progress, not perfection. You're on the right track!"
  ]) {
    await prisma.motivationMessage.create({
      data: { message }
    });
  }

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: hashedPassword,
      name: 'John Student',
      role: 'STUDENT'
    }
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      password: hashedPassword,
      name: 'Jane Teacher',
      role: 'TEACHER'
    }
  });

// Create admin user
const adminUser = await prisma.user.upsert({
  where: { email: 'admin@fitstudy.com' },
  update: {},
  create: {
    email: 'admin@fitstudy.com',
    password: hashedPassword,
    name: 'Admin FitStudy',
    role: 'ADMIN'
  }
});

  // Create sample tasks for student
  const tasks = [
    {
      title: 'Complete Math Assignment',
      description: 'Finish calculus problems 1-20',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      userId: studentUser.id
    },
    {
      title: 'Study for Biology Test',
      description: 'Review chapters 5-7',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      priority: 'MEDIUM',
      status: 'PENDING',
      userId: studentUser.id
    },
    {
      title: 'Write Essay Draft',
      description: 'First draft of English essay',
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      priority: 'URGENT',
      status: 'PENDING',
      userId: studentUser.id
    }
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: task
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
