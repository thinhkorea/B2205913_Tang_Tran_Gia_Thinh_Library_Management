let io = null;

export const setIO = (socketIO) => {
  io = socketIO;
};

export const getIO = () => {
  return io;
};

// Emit specific event to all connected clients
export const emitEvent = (eventName, data = {}) => {
  if (io) {
    io.emit(eventName, { ...data, timestamp: Date.now() });
    console.log(`Emitted: ${eventName}`);
  }
};

// Emit dataUpdate event (legacy)
export const emitDataUpdate = (eventType, data = {}) => {
  if (io) {
    io.emit("dataUpdate", { type: eventType, data, timestamp: Date.now() });
    console.log(`Emitted: ${eventType}`);
  }
};
