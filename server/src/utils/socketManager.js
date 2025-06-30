const connections = new Map();

export const handleWebSocketConnection = (ws, eventId) => {
  if (!connections.has(eventId)) {
    connections.set(eventId, new Set());
  }
  connections.get(eventId).add(ws);

  ws.on("close", () => {
    connections.get(eventId)?.delete(ws);
    if (connections.get(eventId)?.size === 0) {
      connections.delete(eventId);
    }
  });
};

export const broadcastToEvent = (eventId, data) => {
  const eventConnections = connections.get(eventId);
  if (eventConnections) {
    const message = JSON.stringify(data);
    eventConnections.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};
