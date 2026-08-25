import { Device, RegisterDevicePayload } from '../types/index.js';

class DeviceManager {
  private devices: Map<string, Device & { roomCode: string }> = new Map();

  public registerDevice(
    socketId: string,
    clientIp: string,
    payload: RegisterDevicePayload & { roomCode?: string }
  ): Device {
    const device = {
      id: socketId,
      name: payload.name,
      type: payload.type,
      os: payload.os,
      browser: payload.browser,
      ip: clientIp,
      joinedAt: Date.now(),
      roomCode: (payload.roomCode || 'DEFAULT').toUpperCase(),
    };
    this.devices.set(socketId, device);
    return device;
  }

  public updateDeviceName(socketId: string, name: string): Device | null {
    const device = this.devices.get(socketId);
    if (!device) return null;
    device.name = name;
    this.devices.set(socketId, device);
    return device;
  }

  public removeDevice(socketId: string): Device | null {
    const device = this.devices.get(socketId) || null;
    this.devices.delete(socketId);
    return device;
  }

  public getDevice(socketId: string): (Device & { roomCode: string }) | undefined {
    return this.devices.get(socketId);
  }

  public getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  /** Return devices in same room, excluding the requester */
  public getOtherDevices(excludeSocketId: string): Device[] {
    const requester = this.devices.get(excludeSocketId);
    if (!requester) return [];
    const room = requester.roomCode;
    return Array.from(this.devices.values()).filter(
      (d) => d.id !== excludeSocketId && d.roomCode === room
    );
  }

  /** All socket IDs in the same room as the given socket */
  public getRoomSocketIds(socketId: string): string[] {
    const requester = this.devices.get(socketId);
    if (!requester) return [];
    const room = requester.roomCode;
    return Array.from(this.devices.entries())
      .filter(([, d]) => d.roomCode === room)
      .map(([id]) => id);
  }

  public getCount(): number {
    return this.devices.size;
  }
}

export const deviceManager = new DeviceManager();
