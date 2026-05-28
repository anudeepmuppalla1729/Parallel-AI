import { taskQueue } from "../queues/taskQueue";

async function checkQueue() {
  console.log("Fetching jobs from taskQueue...");
  
  // You can also check getActive(), getCompleted(), getFailed(), getDelayed()
  const waiting = await taskQueue.getWaiting();
  const active = await taskQueue.getActive();
  
  console.log(`\n============================`);
  console.log(`⏳ WAITING JOBS: ${waiting.length}`);
  console.log(`============================`);
  waiting.forEach(job => {
    console.log(`- Job ID: ${job.id}`);
    console.log(`  Event Type: ${job.data?.eventType}`);
    console.log(`  Issue Key: ${job.data?.issue?.key}`);
    console.log(`  Issue Title: ${job.data?.issue?.title}`);
  });

  console.log(`\n============================`);
  console.log(`🚀 ACTIVE JOBS: ${active.length}`);
  console.log(`============================`);
  active.forEach(job => {
    console.log(`- Job ID: ${job.id}`);
    console.log(`  Event Type: ${job.data?.eventType}`);
    console.log(`  Issue Key: ${job.data?.issue?.key}`);
  });
  
  // Exit gracefully after printing
  process.exit(0);
}

checkQueue();
