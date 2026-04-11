const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Zero App API Documentation",
      version: "1.0.0",
      description: "API documentation for your backend",
    },
    servers: [{ url: "http://localhost:9000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [__dirname + "/../Routes/Routes.js"], // ✅ Chính xác
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
