import { prisma } from "../config/db";

async function main() {
  console.log("Connecting to the database via Prisma...");

  try {
    // 1. Create a test record
    console.log("1. Creating a test TaskExecution record...");
    const created = await prisma.taskExecution.create({
      data: {
        issueKey: "TEST-123",
        assignedTo: "AI_AGENT",
        status: "RUNNING",
      },
    });
    console.log("Created successfully:", created);

    // 2. Read the record back
    console.log("2. Reading the record back...");
    const found = await prisma.taskExecution.findUnique({
      where: { issueKey: "TEST-123" },
    });
    console.log("Found successfully:", found);

    // 3. Delete the test record
    console.log("3. Cleaning up test record...");
    await prisma.taskExecution.delete({
      where: { issueKey: "TEST-123" },
    });
    console.log("Cleaned up successfully!");

    console.log("🎉 Prisma is working perfectly!");
  } catch (error) {
    console.error("❌ Prisma test failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
