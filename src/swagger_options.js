const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const PORT = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation using Swagger",
    },
    tags: [
      {
        name: "Daycare",
        description: "All endpoints related to daycare",
      },
      {
        name: "Classroom",
        description: "All endpoints related to classroom",
      },
      {
        name: "Enrollment",
        description: "All endpoints related to enrollments",
      },
      {
        name: "Child",
        description: "All endpoints related to children",
      },
      {
        name: "Parent",
        description: "All endpoints related to parents",
      },
    ],
    servers: [
      {
        url: `http://localhost:${PORT}`, // server base URL
      },
    ],
  },
  // 👇 Point to files where you have Swagger annotations
  apis: ["src/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerUi, swaggerSpec, PORT };
