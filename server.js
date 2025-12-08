const next = require("next");
const http = require("http");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  let onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("user_connected", (userId) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("typing", ({ from, conversationId }) => {
      socket.to(conversationId).emit("typing", { from });
    });

    socket.on("stop_typing", ({ from, conversationId }) => {
      socket.to(conversationId).emit("stop_typing", { from });
    });

    socket.on("send_message", ({ roomId, message }) => {
      io.to(roomId).emit("receive_message", message);
    });

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      for (let [userId, sockets] of onlineUsers.entries()) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }

      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Next.js + Socket.IO running on port ${PORT}`);
  });
});
