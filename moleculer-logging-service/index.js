const { ServiceBroker } = require("moleculer");
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "./logs.json");

const broker = new ServiceBroker({
  nodeID: "logging-service",
  transporter: "NATS",
});

broker.createService({
  name: "logging",
  actions: {
    async record(ctx) {
      const { service, level, message, timestamp } = ctx.params;
      const logs = await this.readLogs();
      logs.push({ service, level, message, timestamp: timestamp || new Date().toISOString() });
      await this.writeLogs(logs);
      return { message: "Log recorded" };
    },
    async list() {
      const logs = await this.readLogs();
      return logs;
    },
  },

  methods: {
    async readLogs() {
      try {
        const data = await fs.readFile(logFile, 'utf-8');
        return JSON.parse(data);
      } catch (err) {
        if (err.code === 'ENOENT') {
          await this.writeLogs([]); // Инициализация файла
          return [];
        }
        throw err;
      }
    },

    async writeLogs(logs) {
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8');
    },
  },
});

broker.start().then(() => {
  console.log("Logging Service started!");
  broker.repl();
});

/*const fs = require('fs').promises;
const path = require("path");
const { ServiceBroker } = require('moleculer');

const logFile = path.join(__dirname, "../data/logs.json");

const LoggingService = {
  name: "logging",
  
  actions: {
    async record(ctx) {
      const { service, level, message, timestamp } = ctx.params;
      const logs = await this.readLogs();
      logs.push({ service, level, message, timestamp: timestamp || new Date().toISOString() });
      await this.writeLogs(logs);
      return { message: "Log recorded" };
    },
    async list() {
      const logs = await this.readLogs();
      return logs;
    },
  },

  methods: {
    async readLogs() {
      try {
        const data = await fs.readFile(logFile, 'utf-8');
        return JSON.parse(data);
      } catch (err) {
        if (err.code === 'ENOENT') {
          await this.writeLogs([]); // Инициализация файла
          return [];
        }
        throw err;
      }
    },

    async writeLogs(logs) {
      await fs.writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8');
    },
  },
};

module.exports = LoggingService;*/
