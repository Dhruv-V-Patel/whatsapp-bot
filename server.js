require("dotenv").config();

// const https = require('https');
const https = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const app = require("./src/app");


// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/sgardencity.in/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/sgardencity.in/cert.pem')
// };

const server = https.createServer(/*options,*/ app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});
server.listen(process.env.PORT, () => {
  console.log(`server is running ${process.env.PORT}`);
});
