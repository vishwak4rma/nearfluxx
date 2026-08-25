import React from 'react';
import { Smartphone, Tablet, Laptop, Check } from 'lucide-react';
import { Device } from '../types/index.js';

interface DeviceCardProps {
  device: Device;
  isSelected: boolean;
  onSelect: (device: Device) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, isSelected, onSelect }) => {
  const getDeviceIcon = () => {
    switch (device.type) {
      case 'mobile':
        return <Smartphone size={28} className="device-icon" />;
      case 'tablet':
        return <Tablet size={28} className="device-icon" />;
      default:
        return <Laptop size={28} className="device-icon" />;
    }
  };

  return (
    <div
      className={`device-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(device)}
    >
      <div className="device-avatar">
        {getDeviceIcon()}
        <span className="online-indicator"></span>
      </div>

      <div className="device-info">
        <span className="device-card-name">{device.name}</span>
        <span className="device-card-sub">
          {device.os} • {device.browser}
        </span>
      </div>

      <div className={`checkbox-indicator ${isSelected ? 'checked' : ''}`}>
        {isSelected && <Check size={14} />}
      </div>
    </div>
  );
};