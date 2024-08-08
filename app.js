const express = require("express");
const app = express();
const morgan = require("morgan");

const HOST = "localhost";
const PORT = 3000;

app.set("views", "/views");
app.set("view engine", "pug");

app.use(morgan("common"));

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.listen(PORT, HOST, () => {
  console.log(`Server is now listening on ${HOST} port ${PORT}`);
});
