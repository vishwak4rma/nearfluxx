import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socket';
import { Device, RegisterDevicePayload } from '../types';
import { detectBrowser, detectDeviceType, detectOS } from '../utils/device';

export function useSocket(deviceName: string, roomCode?: string) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [nearbyDevices, setNearbyDevices] = useState<Device[]>([]);
  const roomCodeRef = useRef<string | undefined>(roomCode);

  // Keep ref updated
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      const payload: RegisterDevicePayload & { roomCode?: string } = {
        name: deviceName,
        type: detectDeviceType(),
        os: detectOS(),
        browser: detectBrowser(),
        roomCode: roomCodeRef.current,
      };
      socket.emit('register-device', payload);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setNearbyDevices([]);
    };

    const handleDeviceRegistered = (device: Device) => setCurrentDevice(device);

    const handleDeviceList = (devices: Device[]) => setNearbyDevices(devices);

    const handleDeviceJoined = (device: Device) => {
      setNearbyDevices((prev) => {
        const exists = prev.some((d) => d.id === device.id);
        if (exists) return prev.map((d) => (d.id === device.id ? device : d));
        return [...prev, device];
      });
    };

    const handleDeviceUpdated = (device: Device) => {
      setNearbyDevices((prev) => prev.map((d) => (d.id === device.id ? device : d)));
    };

    const handleDeviceLeft = ({ id }: { id: string }) => {
      setNearbyDevices((prev) => prev.filter((d) => d.id !== id));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('device-registered', handleDeviceRegistered);
    socket.on('device-list', handleDeviceList);
    socket.on('device-joined', handleDeviceJoined);
    socket.on('device-updated', handleDeviceUpdated);
    socket.on('device-left', handleDeviceLeft);

    if (socket.connected) handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('device-registered', handleDeviceRegistered);
      socket.off('device-list', handleDeviceList);
      socket.off('device-joined', handleDeviceJoined);
      socket.off('device-updated', handleDeviceUpdated);
      socket.off('device-left', handleDeviceLeft);
    };
  }, [deviceName, roomCode]); // re-register when room changes

  const updateRemoteName = useCallback((newName: string) => {
    const socket = socketService.getSocket();
    if (socket?.connected) socket.emit('update-device-name', { name: newName });
  }, []);

  return { isConnected, currentDevice, nearbyDevices, updateRemoteName };
}
