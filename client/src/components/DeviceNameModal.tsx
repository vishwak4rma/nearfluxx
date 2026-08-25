import React, { useState, useEffect } from 'react';
import { X, Check, Edit3 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DeviceNameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceNameModal: React.FC<DeviceNameModalProps> = ({ isOpen, onClose }) => {
  const { deviceName, updateDeviceName } = useApp();
  const [name, setName] = useState(deviceName);

  useEffect(() => {
    setName(deviceName);
  }, [deviceName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      updateDeviceName(name);
      onClose();
    }
  };

  const isUnchangedOrEmpty = !name.trim() || name.trim() === deviceName;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card edit-device-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bg">
              <Edit3 size={20} className="accent-icon" />
            </div>
            <h3>Edit Device Name</h3>
          </div>
          <button className="icon-btn close-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="device-name-input" className="form-label">
              Device Name
            </label>
            <span className="form-hint">This name will be shown to all nearby devices on the local network.</span>
            <div className="input-wrapper">
              <input
                id="device-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John's Laptop"
                maxLength={32}
                autoFocus
                className="modal-input"
              />
              <span className="char-counter">{name.length}/32</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={isUnchangedOrEmpty}
            >
              <Check size={16} />
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};