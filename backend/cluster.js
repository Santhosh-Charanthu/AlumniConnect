const cluster = require("cluster");
const os = require("os");

cluster.schedulingPolicy = cluster.SCHED_RR;

const numCPUs = Math.min(os.cpus().length, 4);
if (cluster.isPrimary) {
  console.log(`🚀 Master ${process.pid} is running`);
  // Create workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Restart dead workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died`);
    console.log("🔁 Restarting worker...");
    cluster.fork();
  });
} else {
  // Workers run your existing app
  const startServer = require("./app");

  const PORT = process.env.PORT || 5000;

  startServer().then((server) => {
    server.listen(PORT, () => {
      console.log(`✅ Worker ${process.pid} running on port ${PORT}`);
    });
  });
}
