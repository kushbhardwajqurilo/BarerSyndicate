require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./src/database/MongoDBConnect");

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDB(); // connect once before starting server

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
