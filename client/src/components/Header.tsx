import React, { useState } from 'react';
import { Wifi, Edit2, Laptop, Smartphone, Tablet, Lock, Grid, HelpCircle, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { DeviceNameModal } from './DeviceNameModal';
import { JoinRoomModal } from './JoinRoomModal';
import { QRCodeModal } from './QRCodeModal';

export const Header: React.FC = () => {
  const {
    deviceName,
    isConnected,
    currentDevice,
    roomCode,
    isInRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    getShareLink,
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const renderDeviceIcon = () => {
    if (!currentDevice) return <Laptop className="icon" />;
    switch (currentDevice.type) {
      case 'mobile': return <Smartphone className="icon" />;
      case 'tablet': return <Tablet className="icon" />;
      default: return <Laptop className="icon" />;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCreateRoom = () => {
    createRoom();
    setShowRoomMenu(false);
  };

  return (
    <header className="app-header">
      <div className="logo-container">
        <div className="logo-icon-bg">
          <Wifi className="logo-icon" />
        </div>
        <div className="logo-text">
          <h1>NearFlux</h1>
          <span className="logo-tagline">
            {isInRoom ? 'Private Worldwide P2P Transfers' : 'Local Direct File Sharing'}
          </span>
        </div>
      </div>

      <div className="header-actions">
        <div className="connection-pill" title={isConnected ? 'Connected' : 'Offline'}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
          <span className="status-text">{isConnected ? 'Online' : 'Disconnected'}</span>
        </div>

        {/* Room Badge */}
        {isInRoom ? (
          <div className="room-badge-wrapper">
            <button
              className="room-badge"
              onClick={() => setShowRoomMenu((v) => !v)}
              title="Room options"
            >
              <Lock size={13} />
              <span>Room: {roomCode}</span>
              <Grid size={13} className="qr-icon" onClick={(e) => { e.stopPropagation(); setIsQRModalOpen(true); }} />
            </button>
            {showRoomMenu && (
              <div className="room-dropdown" onMouseLeave={() => setShowRoomMenu(false)}>
                <button className="room-dropdown-item" onClick={handleCopyLink}>
                  {copied ? '✓ Copied!' : 'Copy Share Link'}
                </button>
                <button className="room-dropdown-item" onClick={() => { setIsQRModalOpen(true); setShowRoomMenu(false); }}>
                  Show QR Code
                </button>
                <div className="room-dropdown-divider" />
                <button className="room-dropdown-item danger" onClick={() => { leaveRoom(); setShowRoomMenu(false); }}>
                  <LogOut size={13} /> Leave Room
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="room-badge-wrapper">
            <button
              className="room-badge create"
              onClick={() => setShowRoomMenu((v) => !v)}
              title="Create or join a private room"
            >
              <Lock size={13} />
              <span>Private Room</span>
            </button>
            {showRoomMenu && (
              <div className="room-dropdown" onMouseLeave={() => setShowRoomMenu(false)}>
                <button className="room-dropdown-item" onClick={handleCreateRoom}>
                  Create New Room
                </button>
                <button className="room-dropdown-item" onClick={() => { setIsJoinModalOpen(true); setShowRoomMenu(false); }}>
                  Join Room with Code
                </button>
              </div>
            )}
          </div>
        )}

        <button className="device-badge" onClick={() => setIsEditModalOpen(true)} title="Edit Device Name">
          {renderDeviceIcon()}
          <span className="device-name-text">{deviceName}</span>
          <Edit2 className="edit-icon" size={14} />
        </button>

        <a
          href="https://near-flux-online.onrender.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="help-btn"
          title="Help & How to use"
        >
          <HelpCircle size={18} />
        </a>

        <ThemeToggle />
      </div>

      <DeviceNameModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
      <JoinRoomModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} onJoin={joinRoom} />
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        value={getShareLink()}
        roomCode={roomCode}
      />
    </header>
  );
};
