const { ServiceBroker } = require("moleculer");
const fs = require("fs");
const path = require("path");

const productsFile = path.join(__dirname, './products.json');

const broker = new ServiceBroker({
  nodeID: "products-service",
  transporter: "NATS",
});

broker.createService({
  name: "products",
  actions: {
    async list() {
      const products = await this.readProducts();
      return products;
    },

    async create(ctx) {
      const { id, name, price } = ctx.params;
      const products = await this.readProducts();
      products.push({ id, name, price });
      await this.writeProducts(products);
      return { message: 'Product added', id };
    },

    async update(ctx) {
      const { id, name, price } = ctx.params;
      const products = await this.readProducts();
      const product = products.find((p) => p.id === id);
      if (product) {
        if (name) product.name = name;
        if (price) product.price = price;
        await this.writeProducts(products);
        return { message: 'Product updated', id };
      } else {
        throw new Error('Product not found');
      }
    },
  },

  methods: {
    async readProducts() {
      try {
        const data = await fs.readFile(productsFile, 'utf-8');
        return JSON.parse(data);
      } catch (err) {
        if (err.code === 'ENOENT') {
          await this.writeProducts([]); // Инициализация файла
          return [];
        }
        throw err;
      }
    },

    async writeProducts(products) {
      await fs.writeFile(productsFile, JSON.stringify(products, null, 2), 'utf-8');
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
        service: "Product Service",
        level: "info",
        message: `Incoming request: ${ctx.action.name} ${ctx.params ? JSON.stringify(ctx.params) : ""}`,
        timestamp: new Date().toISOString(),
      });
    },
    async after(ctx) {
      const responseTime = Date.now() - ctx.meta.startTime;
      await broker.call("logging.record", {
        service: "Product Service",
        level: "info",
        message: `Response sent. Processing time: ${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
    },
  },
});

broker.start().then(() => {
  console.log("Products Service started!");
  broker.repl();
});
/*const fs = require('fs').promises;
const path = require('path');
const { ServiceBroker } = require('moleculer');

const productsFile = path.join(__dirname, '../data/products.json');

const ProductService = {
  name: 'products',

  actions: {
    async list() {
      const products = await this.readProducts();
      return products;
    },

    async create(ctx) {
      const { id, name, price } = ctx.params;
      const products = await this.readProducts();
      products.push({ id, name, price });
      await this.writeProducts(products);
      return { message: 'Product added', id };
    },

    async update(ctx) {
      const { id, name, price } = ctx.params;
      const products = await this.readProducts();
      const product = products.find((p) => p.id === id);
      if (product) {
        if (name) product.name = name;
        if (price) product.price = price;
        await this.writeProducts(products);
        return { message: 'Product updated', id };
      } else {
        throw new Error('Product not found');
      }
    },
  },

  methods: {
    async readProducts() {
      try {
        const data = await fs.readFile(productsFile, 'utf-8');
        return JSON.parse(data);
      } catch (err) {
        if (err.code === 'ENOENT') {
          await this.writeProducts([]); // Инициализация файла
          return [];
        }
        throw err;
      }
    },

    async writeProducts(products) {
      await fs.writeFile(productsFile, JSON.stringify(products, null, 2), 'utf-8');
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

module.exports = ProductService;*/
