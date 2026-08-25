import React, { useState } from 'react';
import { Radar, CheckSquare, Square, Copy, QrCode, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DeviceCard } from './DeviceCard';
import { Device } from '../types/index.js';
import { QRCodeModal } from './QRCodeModal';

export const DeviceList: React.FC = () => {
  const {
    nearbyDevices,
    selectedTargetDevices,
    toggleTargetDevice,
    selectAllTargetDevices,
    clearTargetDevices,
    isInRoom,
    roomCode,
    getShareLink,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);

  const allSelected =
    nearbyDevices.length > 0 && selectedTargetDevices.length === nearbyDevices.length;

  const handleToggleSelectAll = () => {
    if (allSelected) clearTargetDevices();
    else selectAllTargetDevices();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isPrivate = isInRoom;

  return (
    <>
      <section className="section-card devices-section">
        <div className="section-header">
          <div>
            <div className="devices-title-row">
              <h2>{isPrivate ? 'Devices in Private Room' : 'Nearby Devices'}</h2>
              {isPrivate && (
                <span className="room-code-badge">
                  <span className="room-code-lock">🔒</span>
                  {roomCode}
                </span>
              )}
            </div>
            <span className="subtitle">
              {isPrivate
                ? `Only devices with Secret Code "${roomCode}" are visible here.`
                : 'Select one or more devices to send files to'}
            </span>
          </div>
          {nearbyDevices.length > 0 && (
            <button className="btn text-btn" onClick={handleToggleSelectAll}>
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {nearbyDevices.length === 0 ? (
          <div className="empty-state">
            <div className="radar-pulse">
              <Radar size={40} className="pulse-icon" />
            </div>
            <p className="empty-title">
              {isPrivate
                ? `Waiting for friends to join Room "${roomCode}"...`
                : 'Searching for nearby devices...'}
            </p>
            <p className="empty-desc">
              {isPrivate ? (
                <>Share the Secret Room Link or QR Code with your friend to connect.</>
              ) : (
                <>Open <strong>NearFlux</strong> on other devices on the same Wi-Fi network.</>
              )}
            </p>
            {isPrivate && (
              <div className="room-share-actions">
                <button className="btn secondary" onClick={handleCopy}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy Share Link'}
                </button>
                <button className="btn primary" onClick={() => setIsQROpen(true)}>
                  <QrCode size={15} />
                  Show QR Code
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="device-grid">
              {nearbyDevices.map((device: Device) => {
                const isSelected = selectedTargetDevices.some((d) => d.id === device.id);
                return (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    isSelected={isSelected}
                    onSelect={toggleTargetDevice}
                  />
                );
              })}
            </div>
            {isPrivate && (
              <div className="room-share-actions room-share-actions--bottom">
                <button className="btn secondary" onClick={handleCopy}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy Share Link'}
                </button>
                <button className="btn secondary" onClick={() => setIsQROpen(true)}>
                  <QrCode size={15} />
                  Show QR Code
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <QRCodeModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        value={getShareLink()}
        roomCode={roomCode}
      />
    </>
  );
};
