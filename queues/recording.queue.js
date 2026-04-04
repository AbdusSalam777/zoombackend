// /queues/recording.queue.js
const { Queue } = require("bullmq");
const redisClient = require("../config/redis");

// Create a BullMQ queue using ioredis client
const recordingQueue = new Queue("recordingQueue", {
  connection: redisClient
});

module.exports = recordingQueue;