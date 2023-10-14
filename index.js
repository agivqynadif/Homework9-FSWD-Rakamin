const express = require("express");
const app = express();
const morgan = require("morgan");
const port = 3000;
const fs = require("fs");
const path = require("path");
const router = require("./src/routes.js");
const bodyParser = require("body-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

let logStream = fs.createWriteStream(path.join(__dirname, "log/application.log"), { flags: "a" });
app.use(morgan("combined", { stream: logStream }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(router);
app.use(express.json());

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Homework Restful API and Middleware",
      version: "1.0.0",
      description: "This is a simple API application for homework week 9 with Express and documanted with Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/*.js"],
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
