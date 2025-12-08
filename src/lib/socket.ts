import { io } from "socket.io-client";

const socket = io(process.env.NEXTAUTH_URL, {
  withCredentials: true,
});

export default socket;
