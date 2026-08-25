import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  TransferRequestPayload,
  TransferResponsePayload,
  WebRTCSignalPayload,
  FileChunkPayload,
} from '../types/index.js';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  public connect(serverUrl?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket) {
      return this.socket;
    }

    // If running Vite dev server (port 5173), connect to localhost:3000.
    // Otherwise (Production/Render), connect directly to the active window origin.
    const isViteDev = window.location.port === '5173';
    const defaultUrl = isViteDev
      ? `http://${window.location.hostname}:3000`
      : window.location.origin;

    const url = serverUrl || defaultUrl;

    this.socket = io(url, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    return this.socket;
  }

  public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  public sendTransferRequest(payload: TransferRequestPayload): void {
    this.socket?.emit('transfer-request', payload);
  }

  public sendTransferResponse(payload: TransferResponsePayload): void {
    this.socket?.emit('transfer-response', payload);
  }

  public sendWebRTCOffer(payload: WebRTCSignalPayload): void {
    this.socket?.emit('webrtc-offer', payload);
  }

  public sendWebRTCAnswer(payload: WebRTCSignalPayload): void {
    this.socket?.emit('webrtc-answer', payload);
  }

  public sendIceCandidate(payload: WebRTCSignalPayload): void {
    this.socket?.emit('webrtc-ice-candidate', payload);
  }

  public sendFileChunk(payload: FileChunkPayload): void {
    this.socket?.emit('file-chunk', payload);
  }

  public cancelTransfer(senderId: string, targetId: string): void {
    this.socket?.emit('transfer-cancel', { senderId, targetId });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
