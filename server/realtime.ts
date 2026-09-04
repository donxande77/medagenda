import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  role?: string;
}

class RealtimeManager {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, res: Response, userId?: string, role?: string) {
    this.clients.set(id, { id, res, userId, role });

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    // Clean up on disconnect
    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  broadcast(eventType: string, payload: any) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(message);
      } catch (err) {
        this.clients.delete(id);
      }
    }
  }

  sendToUser(userId: string, eventType: string, payload: any) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const [id, client] of this.clients.entries()) {
      if (client.userId === userId) {
        try {
          client.res.write(message);
        } catch (err) {
          this.clients.delete(id);
        }
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const realtimeManager = new RealtimeManager();
