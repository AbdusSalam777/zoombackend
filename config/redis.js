const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,  // ✅ Required for BullMQ v5+
  enableReadyCheck: true
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

module.exports = redisClient;