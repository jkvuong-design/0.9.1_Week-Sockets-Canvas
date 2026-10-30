// Initialize the express 'app' object
let express = require("express");
let app = express();

// Initialize HTTP server
let http = require("http");
let server = http.createServer(app);

// Initialize Socket.IO
let io = require("socket.io");
io = new io.Server(server);

// Serve static client files from the 'public' folder
app.use("/", express.static("public"));

// Listen for a client to connect and disconnect
io.on("connection", (socket) => {
  console.log("We have a new client: " + socket.id);

  // Listen for an event named 'message' from client
  socket.on("message", (data) => {
    console.log("Received 'message' with the following data:", data);

    // Send data to ALL clients, including the sender
    io.emit("message-share", data);
  });

  // Listen for this client to disconnect
  socket.on("disconnect", () => {
    console.log("A client has disconnected: " + socket.id);
  });
});

// Use environment port for deployment (Render) or default to 3000 locally
let port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("App listening at port: " + port);
});