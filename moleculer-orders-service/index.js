const { ServiceBroker } = require("moleculer");
const fs = require("fs");
const path = require("path");

const ordersFile = path.join(__dirname, './orders.json');

const broker = new ServiceBroker({
  nodeID: "orders-service",
  transporter: "NATS",
});

broker.createService({
  name: "orders",
  actions: {
    async list() {
      const orders = await this.readOrders();
      return orders;
    },

    async create(ctx) {
      const { id, product, status } = ctx.params;
      const orders = await this.readOrders();
      orders.push({ id, product, status });
      await this.writeOrders(orders);
      return { message: 'Order created', id };
    },

    async update(ctx) {
      const { id, status } = ctx.params;
      const orders = await this.readOrders();
      const order = orders.find((o) => o.id === id);
      if (order) {
        order.status = status;
        await this.writeOrders(orders);
        return { message: 'Order updated', id };
      } else {
        throw new Error('Order not found');
      }
    },
  },

  methods: {
    async readOrders() {
      try {
        const data = await fs.readFile(ordersFile, 'utf-8');
        return JSON.parse(data);
      } catch (err) {
        if (err.code === 'ENOENT') {
          await this.writeOrders([]); // Инициализация файла
          return [];
        }
        throw err;
      }
    },
    async writeOrders(orders) {
      await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2), 'utf-8');
    },
    async logRequest(service, level, message) {
      this.broker.call("logging.record", {
        service,
        level,
        message,
        timestamp: new Date().toISOString(),
      });
    },
  },
  
  hooks: {
    async before(ctx) {
      const startTime = Date.now();
      ctx.meta.startTime = startTime;
      await broker.call("logging.record", {
        service: "Order Service",
        level: "info",
        message: `Incoming request: ${ctx.action.name} ${ctx.params ? JSON.stringify(ctx.params) : ""}`,
        timestamp: new Date().toISOString(),
      });
    },
    async after(ctx) {
      const responseTime = Date.now() - ctx.meta.startTime;
      await broker.call("logging.record", {
        service: "Order Service",
        level: "info",
        message: `Response sent. Processing time: ${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
    },
  },
});

broker.start().then(() => {
  console.log("Orders Service started!");
  broker.repl();
});

/*const fs = require('fs').promises;
const path = require('path');
const { ServiceBroker } = require('moleculer');

const ordersFile = path.join(__dirname, '../data/orders.json');

const OrderService = {
  name: 'orders',

  actions: {
    async list() {
      const orders = await this.readOrders();
      return orders;
    },

    async create(ctx) {
      const { id, product, status } = ctx.params;
      const orders = await this.readOrders();
      orders.push({ id, product, status });
      await this.writeOrders(orders);
      return { message: 'Order created', id };
    },

    async update(ctx) {
      const { id, status } = ctx.params;
      const orders = await this.readOrders();
      const order = orders.find((o) => o.id === id);
      if (order) {
        order.status = status;
        await this.writeOrders(orders);
        return { message: 'Order updated', id };
      } else {
        throw new Error('Order not found');
      }
    },
  },

  methods: {
    async readOrders() {
      try {
        const data = await fs.readFile(ordersFile, 'utf-8');
        return JSON.parse(data);
      } catch (err) {
        if (err.code === 'ENOENT') {
          await this.writeOrders([]); // Инициализация файла
          return [];
        }
        throw err;
      }
    },
    async writeOrders(orders) {
      await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2), 'utf-8');
    },
    async logRequest(service, level, message) {
      this.broker.call("logging.record", {
        service,
        level,
        message,
        timestamp: new Date().toISOString(),
      });
    },
  },
  hooks: {
    async before(ctx) {
      // Логирование входящего запроса перед его выполнением
      const { method, params } = ctx;
      const startTime = Date.now(); // Запоминаем время начала запроса
      ctx.meta.startTime = startTime;
      console.log(`Incoming request: ${method} ${ctx.action.name}`, params);
      
      await this.logRequest("Orders Service", "info", `Incoming request: ${method} ${ctx.path}`);
    },
    async after(ctx) {
      // Логирование времени отклика после выполнения запроса
      console.log(`Response sent. Processing time: ${Date.now() - ctx.meta.startTime}ms`);
      const responseTime = Date.now() - ctx.meta.startTime;
      await this.logRequest("Orders Service", "info", `Response sent. Processing time: ${responseTime}ms`);
    },
  }
};

module.exports = OrderService;
*/