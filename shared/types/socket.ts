import { Device, DeviceType } from './device.js';

export interface RegisterDevicePayload {
  name: string;
  type: DeviceType;
  os: string;
  browser: string;
  roomCode?: string;
}

export interface UpdateDeviceNamePayload {
  name: string;
}

export interface TransferRequestPayload {
  senderId: string;
  senderName: string;
  targetId: string;
  files: {
    name: string;
    size: number;
    type: string;
  }[];
}

export interface TransferResponsePayload {
  senderId: string;
  targetId: string;
  accepted: boolean;
  reason?: string;
}

export interface WebRTCSignalPayload {
  senderId: string;
  targetId: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface FileChunkPayload {
  senderId: string;
  targetId: string;
  data: string | ArrayBuffer;
}

export interface ServerToClientEvents {
  'device-registered': (device: Device) => void;
  'device-list': (devices: Device[]) => void;
  'device-joined': (device: Device) => void;
  'device-updated': (device: Device) => void;
  'device-left': (data: { id: string }) => void;
  'transfer-request': (payload: TransferRequestPayload) => void;
  'transfer-response': (payload: TransferResponsePayload) => void;
  'webrtc-offer': (payload: WebRTCSignalPayload) => void;
  'webrtc-answer': (payload: WebRTCSignalPayload) => void;
  'webrtc-ice-candidate': (payload: WebRTCSignalPayload) => void;
  'transfer-cancel': (payload: { senderId: string; targetId: string }) => void;
  'file-chunk': (payload: FileChunkPayload) => void;
}

export interface ClientToServerEvents {
  'register-device': (data: RegisterDevicePayload) => void;
  'update-device-name': (data: UpdateDeviceNamePayload) => void;
  'transfer-request': (payload: TransferRequestPayload) => void;
  'transfer-response': (payload: TransferResponsePayload) => void;
  'webrtc-offer': (payload: WebRTCSignalPayload) => void;
  'webrtc-answer': (payload: WebRTCSignalPayload) => void;
  'webrtc-ice-candidate': (payload: WebRTCSignalPayload) => void;
  'transfer-cancel': (payload: { senderId: string; targetId: string }) => void;
  'file-chunk': (payload: FileChunkPayload) => void;
}
