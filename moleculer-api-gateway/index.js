const { ServiceBroker } = require("moleculer");
const ApiGateway = require("moleculer-web");
const path = require("path");

const broker = new ServiceBroker({
  nodeID: "api-gateway",
  transporter: "NATS",
});

broker.createService(ApiGateway, {
  name: "api",
  settings: {
    routes: [
      {
        aliases: {
          "GET /orders": "orders.list",
          "POST /orders": "orders.create",
          "PUT /orders/:id": "orders.update",
          "GET /products": "products.list",
          "POST /products": "products.create",
          "PUT /products/:id": "products.update",
          "POST /logs": "logging.record",
          "GET /logs": "logging.list",
        },
        async onBeforeCall(ctx) {
          const startTime = Date.now();
          ctx.meta.startTime = startTime;
          await broker.call("logging.record", {
            service: "API Gateway",
            level: "info",
            message: `Incoming request: ${ctx.params.method} ${ctx.params.url}`,
            timestamp: new Date().toISOString(),
          });
        },
        async onAfterCall(ctx) {
          const responseTime = Date.now() - ctx.meta.startTime;
          await broker.call("logging.record", {
            service: "API Gateway",
            level: "info",
            message: `Response sent. Processing time: ${responseTime}ms`,
            timestamp: new Date().toISOString(),
          });
        },
      },
    ],
  },
});

broker.start().then(() => {
  console.log("API Gateway started!");
});

/*
const ApiGateway = require("moleculer-web");

module.exports = {
  name: "api",
  mixins: [ApiGateway],
  settings: {
    port: 3000,
    routes: [
      {
        path: "/api",
        aliases: {
          "GET /orders": "orders.list",
          "POST /orders": "orders.create",
          "PUT /orders/:id": "orders.update",
          "GET /products": "products.list",
          "POST /products": "products.create",
          "PUT /products/:id": "products.update",
          "POST /logs": "logging.record",
          "GET /logs": "logging.list",
        },
        bodyParsers: {
          json: true,
        }
      },
    ],
  },
};
*/