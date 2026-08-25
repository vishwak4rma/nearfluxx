import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Device,
  SelectedFile,
  TransferState,
  TransferRequestPayload,
  TransferResponsePayload,
  WebRTCSignalPayload,
  FileChunkPayload,
} from '../types/index.js';
import { useTheme } from '../hooks/useTheme';
import { useDeviceName } from '../hooks/useDeviceName';
import { useSocket } from '../hooks/useSocket';
import { useRoom } from '../hooks/useRoom';
import { socketService } from '../services/socket.js';
import { WebRTCService } from '../services/webrtc.js';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  deviceName: string;
  updateDeviceName: (name: string) => void;
  isConnected: boolean;
  currentDevice: Device | null;
  nearbyDevices: Device[];
  selectedFiles: SelectedFile[];
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  selectedTargetDevices: Device[];
  toggleTargetDevice: (device: Device) => void;
  selectAllTargetDevices: () => void;
  clearTargetDevices: () => void;
  transferState: TransferState;
  incomingRequest: TransferRequestPayload | null;
  startTransfer: () => void;
  acceptIncomingRequest: () => void;
  rejectIncomingRequest: () => void;
  cancelTransfer: () => void;
  closeTransfer: () => void;
  // Room
  roomCode: string;
  isInRoom: boolean;
  createRoom: () => string;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  getShareLink: () => string;
}

const initialTransferState: TransferState = {
  role: 'none',
  status: 'idle',
  transferredBytes: 0,
  progress: 0,
  speed: 0,
  timeRemaining: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { deviceName, updateName } = useDeviceName();
  const { roomCode, isInRoom, createRoom, joinRoom, leaveRoom, getShareLink } = useRoom();
  const { isConnected, currentDevice, nearbyDevices, updateRemoteName } = useSocket(
    deviceName,
    isInRoom ? roomCode : undefined
  );

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [selectedTargetDevices, setSelectedTargetDevices] = useState<Device[]>([]);
  const [transferState, setTransferState] = useState<TransferState>(initialTransferState);
  const [incomingRequest, setIncomingRequest] = useState<TransferRequestPayload | null>(null);

  const activeWebRTCInstances = useRef<Map<string, WebRTCService>>(new Map());
  const earlyCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const handleUpdateDeviceName = (newName: string) => {
    updateName(newName);
    updateRemoteName(newName);
  };

  const addFiles = (filesToAdd: FileList | File[]) => {
    const fileArray = Array.from(filesToAdd);
    const newSelected: SelectedFile[] = fileArray.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'Unknown format',
    }));
    setSelectedFiles((prev) => [...prev, ...newSelected]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearFiles = () => setSelectedFiles([]);

  const toggleTargetDevice = (device: Device) => {
    setSelectedTargetDevices((prev) => {
      const exists = prev.some((d) => d.id === device.id);
      if (exists) return prev.filter((d) => d.id !== device.id);
      return [...prev, device];
    });
  };

  const selectAllTargetDevices = () => setSelectedTargetDevices([...nearbyDevices]);
  const clearTargetDevices = () => setSelectedTargetDevices([]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleTransferRequest = (payload: TransferRequestPayload) => {
      setIncomingRequest(payload);
    };

    const handleTransferResponse = async (payload: TransferResponsePayload) => {
      if (!payload.accepted) {
        setTransferState({
          ...initialTransferState,
          status: 'failed',
          error: 'Transfer request declined by recipient',
        });
        return;
      }

      if (currentDevice) {
        setTransferState((prev) => ({ ...prev, status: 'connecting' }));

        const targetId = payload.targetId;
        const webrtc = new WebRTCService(currentDevice.id, targetId, true);
        activeWebRTCInstances.current.set(targetId, webrtc);

        webrtc.setProgressCallback((update) => {
          setTransferState((prev) => ({ ...prev, ...update }));
        });

        const early = earlyCandidatesRef.current.get(targetId) || [];
        earlyCandidatesRef.current.delete(targetId);
        for (const cand of early) await webrtc.addIceCandidate(cand);

        let transferStarted = false;
        const filesToTransfer = selectedFiles.map((f) => f.file);

        webrtc.onChannelOpen(async () => {
          if (transferStarted) return;
          transferStarted = true;
          try {
            await webrtc.sendFiles(filesToTransfer, false);
          } catch (err) {
            console.error('[WebRTC Send Error]', err);
          }
        });

        webrtc.initialize();
        await webrtc.createOffer();

        setTimeout(async () => {
          if (!transferStarted && !webrtc.isChannelOpen()) {
            console.warn('[NearFlux] WebRTC timeout. Switching to Socket.IO fallback.');
            transferStarted = true;
            try {
              await webrtc.sendFiles(filesToTransfer, true);
            } catch (err) {
              console.error('[Socket Fallback Error]', err);
            }
          }
        }, 3500);
      }
    };

    const handleWebRTCOffer = async (payload: WebRTCSignalPayload) => {
      if (!currentDevice) return;
      const senderId = payload.senderId;
      const webrtc = new WebRTCService(currentDevice.id, senderId, false);
      activeWebRTCInstances.current.set(senderId, webrtc);

      webrtc.setProgressCallback((update) => {
        setTransferState((prev) => ({ ...prev, ...update }));
      });

      webrtc.initialize();
      await webrtc.handleOffer(payload.signal as RTCSessionDescriptionInit);

      const early = earlyCandidatesRef.current.get(senderId) || [];
      earlyCandidatesRef.current.delete(senderId);
      for (const cand of early) await webrtc.addIceCandidate(cand);
    };

    const handleWebRTCAnswer = async (payload: WebRTCSignalPayload) => {
      const instance = activeWebRTCInstances.current.get(payload.senderId);
      if (instance) await instance.handleAnswer(payload.signal as RTCSessionDescriptionInit);
    };

    const handleIceCandidate = async (payload: WebRTCSignalPayload) => {
      const instance = activeWebRTCInstances.current.get(payload.senderId);
      if (instance) {
        await instance.addIceCandidate(payload.signal as RTCIceCandidateInit);
      } else {
        const peerId = payload.senderId;
        const existing = earlyCandidatesRef.current.get(peerId) || [];
        earlyCandidatesRef.current.set(peerId, [...existing, payload.signal as RTCIceCandidateInit]);
      }
    };

    const handleFileChunk = (payload: FileChunkPayload) => {
      const instance = activeWebRTCInstances.current.get(payload.senderId);
      if (instance) instance.handleIncomingData(payload.data);
    };

    const handleTransferCancel = () => {
      activeWebRTCInstances.current.forEach((instance) => instance.close());
      activeWebRTCInstances.current.clear();
      setTransferState((prev) => {
        if (prev.status === 'idle') return prev;
        return { ...initialTransferState, status: 'cancelled', error: 'Transfer was cancelled' };
      });
    };

    socket.on('transfer-request', handleTransferRequest);
    socket.on('transfer-response', handleTransferResponse);
    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('file-chunk', handleFileChunk);
    socket.on('transfer-cancel', handleTransferCancel);

    return () => {
      socket.off('transfer-request', handleTransferRequest);
      socket.off('transfer-response', handleTransferResponse);
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('file-chunk', handleFileChunk);
      socket.off('transfer-cancel', handleTransferCancel);
    };
  }, [currentDevice, selectedTargetDevices, selectedFiles]);

  const startTransfer = () => {
    if (!currentDevice || selectedTargetDevices.length === 0 || selectedFiles.length === 0) return;

    const recipientNames = selectedTargetDevices.map((d) => d.name).join(', ');
    setTransferState({
      ...initialTransferState,
      role: 'sender',
      status: 'pending_approval',
      peerDeviceName: recipientNames,
      totalFiles: selectedFiles.length,
      fileSize: selectedFiles.reduce((acc, curr) => acc + curr.size, 0),
    });

    selectedTargetDevices.forEach((targetDevice) => {
      socketService.sendTransferRequest({
        senderId: currentDevice.id,
        senderName: currentDevice.name,
        targetId: targetDevice.id,
        files: selectedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      });
    });
  };

  const acceptIncomingRequest = () => {
    if (!incomingRequest || !currentDevice) return;
    setTransferState({
      ...initialTransferState,
      role: 'receiver',
      status: 'connecting',
      peerDeviceName: incomingRequest.senderName,
      totalFiles: incomingRequest.files.length,
      fileSize: incomingRequest.files.reduce((acc, curr) => acc + curr.size, 0),
    });
    socketService.sendTransferResponse({
      senderId: incomingRequest.senderId,
      targetId: currentDevice.id,
      accepted: true,
    });
    setIncomingRequest(null);
  };

  const rejectIncomingRequest = () => {
    if (!incomingRequest || !currentDevice) return;
    socketService.sendTransferResponse({
      senderId: incomingRequest.senderId,
      targetId: currentDevice.id,
      accepted: false,
      reason: 'User declined request',
    });
    setIncomingRequest(null);
  };

  const closeTransfer = () => {
    activeWebRTCInstances.current.forEach((instance) => instance.close());
    activeWebRTCInstances.current.clear();
    setTransferState(initialTransferState);
  };

  const cancelTransfer = () => {
    if (currentDevice) {
      selectedTargetDevices.forEach((targetDevice) => {
        socketService.cancelTransfer(currentDevice.id, targetDevice.id);
      });
    }
    closeTransfer();
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        deviceName,
        updateDeviceName: handleUpdateDeviceName,
        isConnected,
        currentDevice,
        nearbyDevices,
        selectedFiles,
        addFiles,
        removeFile,
        clearFiles,
        selectedTargetDevices,
        toggleTargetDevice,
        selectAllTargetDevices,
        clearTargetDevices,
        transferState,
        incomingRequest,
        startTransfer,
        acceptIncomingRequest,
        rejectIncomingRequest,
        cancelTransfer,
        closeTransfer,
        roomCode,
        isInRoom,
        createRoom,
        joinRoom,
        leaveRoom,
        getShareLink,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
