import { socketService } from './socket.js';
import { TransferState } from '../types/index.js';

const CHUNK_SIZE = 256 * 1024; // 256 KB Chunks
const MAX_BUFFERED_AMOUNT = 8 * 1024 * 1024; // 8 MB threshold

export interface TransferProgressCallback {
  (state: Partial<TransferState>): void;
}

interface FileHeader {
  type: 'header';
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private isInitiator: boolean = false;
  private remotePeerId: string = '';
  private localPeerId: string = '';

  private pendingCandidates: RTCIceCandidateInit[] = [];

  // Receiver State
  private currentHeader: FileHeader | null = null;
  private receivedChunks: ArrayBuffer[] = [];
  private receivedBytes: number = 0;

  // Speed Tracking
  private startTime: number = 0;
  private lastBytesCount: number = 0;
  private lastSpeedCheckTime: number = 0;

  private onProgressCallback: TransferProgressCallback | null = null;
  private onChannelOpenCallback: (() => void) | null = null;
  private channelOpened: boolean = false;

  constructor(localPeerId: string, remotePeerId: string, isInitiator: boolean) {
    this.localPeerId = localPeerId;
    this.remotePeerId = remotePeerId;
    this.isInitiator = isInitiator;
  }

  public setProgressCallback(callback: TransferProgressCallback): void {
    this.onProgressCallback = callback;
  }

  public onChannelOpen(callback: () => void): void {
    if (this.channelOpened) {
      callback();
    } else {
      this.onChannelOpenCallback = callback;
    }
  }

  public isChannelOpen(): boolean {
    return this.channelOpened;
  }

  public initialize(): RTCPeerConnection {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };

    this.peerConnection = new RTCPeerConnection(config);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate({
          senderId: this.localPeerId,
          targetId: this.remotePeerId,
          signal: event.candidate.toJSON(),
        });
      }
    };

    if (this.isInitiator) {
      this.dataChannel = this.peerConnection.createDataChannel('fileTransfer', {
        ordered: true,
      });
      this.setupDataChannel(this.dataChannel);
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }

    return this.peerConnection;
  }

  public async createOffer(): Promise<void> {
    if (!this.peerConnection) return;
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    socketService.sendWebRTCOffer({
      senderId: this.localPeerId,
      targetId: this.remotePeerId,
      signal: offer,
    });
  }

  public async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.processPendingCandidates();

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    socketService.sendWebRTCAnswer({
      senderId: this.localPeerId,
      targetId: this.remotePeerId,
      signal: answer,
    });
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    await this.processPendingCandidates();
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    if (!this.peerConnection.remoteDescription) {
      this.pendingCandidates.push(candidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('[WebRTC Candidate Error]', err);
    }
  }

  private async processPendingCandidates(): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) return;

    while (this.pendingCandidates.length > 0) {
      const candidate = this.pendingCandidates.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC Queued Candidate Error]', err);
        }
      }
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      console.log('⚡ [WebRTC Direct P2P Channel Opened]');
      this.channelOpened = true;
      this.onProgressCallback?.({ status: 'transferring' });
      if (this.onChannelOpenCallback) {
        this.onChannelOpenCallback();
      }
    };

    channel.onmessage = (event) => {
      this.handleIncomingData(event.data);
    };

    channel.onerror = (err) => {
      console.error('[WebRTC DataChannel Error]', err);
    };
  }

  // Sender File Streaming Engine
  public async sendFiles(files: File[], forceSocketFallback = false): Promise<void> {
    this.startTime = Date.now();
    this.lastSpeedCheckTime = Date.now();
    this.lastBytesCount = 0;

    const useSocket = forceSocketFallback || !this.dataChannel || this.dataChannel.readyState !== 'open';

    if (useSocket) {
      console.log('🔄 [NearFlux] Streaming file chunks via Socket.IO Fallback channel');
    }

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      const header: FileHeader = {
        type: 'header',
        fileId: `${file.name}-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        totalChunks,
      };

      const headerStr = JSON.stringify(header);
      if (useSocket) {
        socketService.sendFileChunk({
          senderId: this.localPeerId,
          targetId: this.remotePeerId,
          data: headerStr,
        });
      } else {
        this.dataChannel!.send(headerStr);
      }

      let offset = 0;

      while (offset < file.size) {
        if (!useSocket && this.dataChannel!.bufferedAmount > MAX_BUFFERED_AMOUNT) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          continue;
        }

        const slice = file.slice(offset, offset + CHUNK_SIZE);
        const buffer = await slice.arrayBuffer();

        if (useSocket) {
          socketService.sendFileChunk({
            senderId: this.localPeerId,
            targetId: this.remotePeerId,
            data: buffer,
          });
          // Small pacing delay for socket streaming
          await new Promise((resolve) => setTimeout(resolve, 5));
        } else {
          this.dataChannel!.send(buffer);
        }

        offset += buffer.byteLength;

        this.updateStats(
          offset,
          file.size,
          file.name,
          fileIndex + 1,
          files.length
        );
      }
    }

    this.onProgressCallback?.({
      status: 'completed',
      progress: 100,
      timeRemaining: 0,
    });
  }

  // Incoming Data Handler (WebRTC + Socket Fallback)
  public handleIncomingData(data: string | ArrayBuffer): void {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data) as FileHeader;
        if (parsed.type === 'header') {
          this.currentHeader = parsed;
          this.receivedChunks = [];
          this.receivedBytes = 0;
          this.startTime = Date.now();
          this.lastSpeedCheckTime = Date.now();
          this.lastBytesCount = 0;

          this.onProgressCallback?.({
            status: 'transferring',
            currentFileName: parsed.fileName,
            fileSize: parsed.fileSize,
            transferredBytes: 0,
            progress: 0,
          });
        }
      } catch (e) {
        console.error('[Header Parse Error]', e);
      }
      return;
    }

    if (data instanceof ArrayBuffer && this.currentHeader) {
      this.receivedChunks.push(data);
      this.receivedBytes += data.byteLength;

      this.updateStats(
        this.receivedBytes,
        this.currentHeader.fileSize,
        this.currentHeader.fileName
      );

      if (this.receivedBytes >= this.currentHeader.fileSize) {
        this.downloadFile(this.receivedChunks, this.currentHeader.fileName, this.currentHeader.fileType);
        this.currentHeader = null;
        this.receivedChunks = [];

        this.onProgressCallback?.({
          status: 'completed',
          progress: 100,
          timeRemaining: 0,
        });
      }
    }
  }

  private updateStats(
    currentTransferred: number,
    totalSize: number,
    fileName: string,
    currentFileIndex = 1,
    totalFiles = 1
  ): void {
    const now = Date.now();
    const timeDelta = (now - this.lastSpeedCheckTime) / 1000;

    let speed = 0;
    if (timeDelta > 0.3) {
      const bytesDelta = currentTransferred - this.lastBytesCount;
      speed = bytesDelta / timeDelta;
      this.lastSpeedCheckTime = now;
      this.lastBytesCount = currentTransferred;
    }

    const remainingBytes = totalSize - currentTransferred;
    const timeRemaining = speed > 0 ? remainingBytes / speed : 0;
    const progress = Math.min(100, (currentTransferred / totalSize) * 100);

    this.onProgressCallback?.({
      currentFileName: fileName,
      currentFileIndex,
      totalFiles,
      fileSize: totalSize,
      transferredBytes: currentTransferred,
      progress,
      speed,
      timeRemaining,
    });
  }

  private downloadFile(chunks: ArrayBuffer[], fileName: string, fileType: string): void {
    const blob = new Blob(chunks, { type: fileType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}