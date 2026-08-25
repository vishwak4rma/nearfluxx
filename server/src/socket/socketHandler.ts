import { Server, Socket } from 'socket.io';
import { deviceManager } from '../services/deviceManager.js';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RegisterDevicePayload,
  UpdateDeviceNamePayload,
  TransferRequestPayload,
  TransferResponsePayload,
  WebRTCSignalPayload,
  FileChunkPayload,
} from '../types/index.js';

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const clientIp = socket.handshake.address.replace(/^.*:/, '') || '127.0.0.1';

    socket.on('register-device', (payload: RegisterDevicePayload & { roomCode?: string }) => {
      if (!payload || !payload.name) return;

      const roomCode = (payload.roomCode || 'DEFAULT').toUpperCase();
      const registeredDevice = deviceManager.registerDevice(socket.id, clientIp, {
        ...payload,
        roomCode,
      });

      // Join a socket.io room keyed by the room code
      socket.join(`room:${roomCode}`);

      socket.emit('device-registered', registeredDevice);
      socket.emit('device-list', deviceManager.getOtherDevices(socket.id));

      // Notify only others in same room
      socket.to(`room:${roomCode}`).emit('device-joined', registeredDevice);
    });

    socket.on('update-device-name', (payload: UpdateDeviceNamePayload) => {
      if (!payload || !payload.name) return;

      const updatedDevice = deviceManager.updateDeviceName(socket.id, payload.name);
      if (updatedDevice) {
        const deviceWithRoom = deviceManager.getDevice(socket.id);
        const roomCode = deviceWithRoom?.roomCode || 'DEFAULT';
        socket.emit('device-registered', updatedDevice);
        socket.to(`room:${roomCode}`).emit('device-updated', updatedDevice);
      }
    });

    socket.on('transfer-request', (payload: TransferRequestPayload) => {
      io.to(payload.targetId).emit('transfer-request', payload);
    });

    socket.on('transfer-response', (payload: TransferResponsePayload) => {
      io.to(payload.senderId).emit('transfer-response', payload);
    });

    socket.on('webrtc-offer', (payload: WebRTCSignalPayload) => {
      io.to(payload.targetId).emit('webrtc-offer', payload);
    });

    socket.on('webrtc-answer', (payload: WebRTCSignalPayload) => {
      io.to(payload.senderId).emit('webrtc-answer', payload);
    });

    socket.on('webrtc-ice-candidate', (payload: WebRTCSignalPayload) => {
      io.to(payload.targetId).emit('webrtc-ice-candidate', payload);
    });

    socket.on('transfer-cancel', (payload: { senderId: string; targetId: string }) => {
      io.to(payload.targetId).emit('transfer-cancel', payload);
      io.to(payload.senderId).emit('transfer-cancel', payload);
    });

    socket.on('file-chunk', (payload: FileChunkPayload) => {
      io.to(payload.targetId).emit('file-chunk', payload);
    });

    socket.on('disconnect', () => {
      const removedDevice = deviceManager.removeDevice(socket.id);
      if (removedDevice) {
        const deviceWithRoom = deviceManager.getDevice(socket.id);
        // removedDevice is already gone from map, broadcast to all remaining in same room
        // We stored roomCode on the device before removal — use it from socket rooms
        const rooms = Array.from(socket.rooms).filter((r) => r.startsWith('room:'));
        rooms.forEach((room) => {
          socket.to(room).emit('device-left', { id: socket.id });
        });
      }
    });
  });
}
