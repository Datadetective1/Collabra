import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("collabra2024", 10);

  const founder = await prisma.user.upsert({
    where: { email: "founder@collabra.io" },
    update: {},
    create: {
      email: "founder@collabra.io",
      name: "Collabra Founder",
      passwordHash,
      role: "builder",
      points: 0,
      bio: "Founder of Collabra - turning meaningful problems into coordinated action.",
    },
  });

  // Generate 20 invite codes for the first wave
  const codes = Array.from({ length: 20 }, (_, i) =>
    `COLLABRA-SEED-${String(i + 1).padStart(3, "0")}`
  );

  for (const code of codes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: { code, ownerId: founder.id },
    });
  }

  // Seed the 4 launch problems
  const seedProblems = [
    {
      title: "Homework Planner Tool for Students",
      description:
        "Students need a collaborative tool to plan, organize, and track homework assignments across different subjects. The tool should support group assignments, deadline reminders, and progress tracking.",
    },
    {
      title: "Reading Practice Assistant",
      description:
        "Build an assistant that helps students improve their reading skills through structured practice sessions, vocabulary building, and comprehension tracking.",
    },
    {
      title: "Teacher Resource Organizer",
      description:
        "Teachers need a way to organize, share, and collaborate on teaching resources including lesson plans, worksheets, and educational materials across departments.",
    },
    {
      title: "Student Collaboration Platform",
      description:
        "Create a space where students from different schools and backgrounds can collaborate on educational projects, share knowledge, and learn from each other.",
    },
  ];

  for (const problem of seedProblems) {
    const existing = await prisma.problem.findFirst({ where: { title: problem.title } });
    if (!existing) {
      await prisma.problem.create({
        data: { ...problem, category: "education", creatorId: founder.id },
      });
    }
  }

  console.log("Seed complete!");
  console.log("Founder login: founder@collabra.io / collabra2024");
  console.log("Invite codes: COLLABRA-SEED-001 through COLLABRA-SEED-020");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
