const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.PORT || 4000;

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("user_connected", (userId) => {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  socket.on("typing", ({ to, from, conversationId }) => {
    socket.to(conversationId).emit("typing", { from });
  });

  socket.on("stop_typing", ({ to, from, conversationId }) => {
    socket.to(conversationId).emit("stop_typing", { from });
  });

  socket.on("send_message", ({ roomId, message }) => {
    io.to(roomId).emit("receive_message", message);
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);

    for (let [userId, sockets] of onlineUsers.entries()) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
      }
    }

    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});

server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
