import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("🔌 Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.log("🔌 Socket connection error:", error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Register a callback for a specific event
  on(eventName, callback) {
    if (!this.socket) {
      console.warn("Socket not connected, connecting now...");
      this.connect();
    }
    
    // Store callback reference for cleanup
    this.listeners.set(eventName, callback);
    
    // Register with socket
    this.socket?.on(eventName, callback);
  }

  // Remove listener for a specific event
  off(eventName) {
    const callback = this.listeners.get(eventName);
    if (callback && this.socket) {
      this.socket.off(eventName, callback);
      this.listeners.delete(eventName);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
