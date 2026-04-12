import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  // Get founder
  const founderResult = await client.execute("SELECT id, name, points FROM User WHERE email = 'founder@collabra.io'");
  const founder = founderResult.rows[0];
  if (!founder) {
    console.error("Founder not found!");
    return;
  }
  console.log("Found founder:", founder.name);

  const problems = [
    {
      id: randomUUID(),
      title: "Community Health Dashboard for Rural Clinics",
      description: "Rural clinics lack a unified way to track patient trends, medicine stock, and outbreak alerts. Build a lightweight dashboard that health workers can use on low-bandwidth connections to monitor community health metrics and coordinate responses.",
      category: "health",
    },
    {
      id: randomUUID(),
      title: "Micro-Farm Yield Tracker for Smallholder Farmers",
      description: "Smallholder farmers need a simple tool to log crop yields, soil conditions, and weather patterns so they can make better planting decisions. The tool should work offline and sync when connectivity is available.",
      category: "agriculture",
    },
    {
      id: randomUUID(),
      title: "Skill-Swap Marketplace for Youth Employment",
      description: "Young people in underserved communities have skills but lack access to job markets. Create a peer-to-peer platform where youth can offer and exchange skills — from coding to carpentry — building portfolios and earning reputation along the way.",
      category: "employment",
    },
  ];

  const taskSets: Record<string, string[]> = {
    health: [
      "Design dashboard wireframes",
      "Build patient trend API",
      "Create medicine stock tracker",
      "Add outbreak alert system",
      "Optimize for low-bandwidth",
    ],
    agriculture: [
      "Design mobile-first UI",
      "Build offline data storage",
      "Create yield logging form",
      "Add weather data integration",
      "Implement sync engine",
    ],
    employment: [
      "Design user profiles",
      "Build skill listing system",
      "Create matching algorithm",
      "Add reputation & reviews",
      "Launch beta marketplace",
    ],
  };

  for (const prob of problems) {
    // Check if problem exists
    const existing = await client.execute({
      sql: "SELECT id FROM Problem WHERE title = ?",
      args: [prob.title],
    });
    if (existing.rows.length > 0) {
      console.log("Already exists:", prob.title);
      continue;
    }

    // Create problem (solved)
    await client.execute({
      sql: 'INSERT INTO Problem (id, title, description, category, status, creatorId) VALUES (?, ?, ?, ?, ?, ?)',
      args: [prob.id, prob.title, prob.description, prob.category, "solved", founder.id as string],
    });
    console.log("Created problem:", prob.title);

    // Create project (completed)
    const projectId = randomUUID();
    const projectName = prob.title.split(" ").slice(0, 4).join(" ");
    await client.execute({
      sql: 'INSERT INTO Project (id, name, status, isPublic, problemId) VALUES (?, ?, ?, 1, ?)',
      args: [projectId, projectName, "completed", prob.id],
    });
    console.log("  Project:", projectName);

    // Add founder as team lead
    await client.execute({
      sql: 'INSERT INTO TeamMember (id, role, userId, projectId) VALUES (?, ?, ?, ?)',
      args: [randomUUID(), "lead", founder.id as string, projectId],
    });

    // Add tasks (all done)
    const tasks = taskSets[prob.category] || [];
    for (const taskTitle of tasks) {
      await client.execute({
        sql: 'INSERT INTO Task (id, title, status, projectId, assigneeId) VALUES (?, ?, ?, ?, ?)',
        args: [randomUUID(), taskTitle, "done", projectId, founder.id as string],
      });
    }
    console.log("  Added", tasks.length, "completed tasks");

    // Add milestones (all completed)
    for (const title of ["MVP Design Complete", "Core Features Built", "Beta Testing Done"]) {
      await client.execute({
        sql: 'INSERT INTO Milestone (id, title, completed, projectId) VALUES (?, ?, 1, ?)',
        args: [randomUUID(), title, projectId],
      });
    }
    console.log("  Added 3 milestones");
  }

  // Update founder points (3 projects x 100 + 15 tasks x 10 + 9 milestones x 30 + join 5 = 575)
  await client.execute({
    sql: 'UPDATE User SET points = 575 WHERE id = ?',
    args: [founder.id as string],
  });
  console.log("Updated founder to 575 points (Architect level)");

  // Verify
  const allProblems = await client.execute("SELECT title, status FROM Problem");
  console.log("\nAll problems:");
  for (const row of allProblems.rows) {
    console.log("  -", row.title, "(" + row.status + ")");
  }

  console.log("\nDone! Refresh the site to see the changes.");
}

main().catch(console.error);
