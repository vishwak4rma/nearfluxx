import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose, onJoin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const normalized = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (normalized.length < 4) {
      setError('Please enter a valid room code');
      return;
    }
    onJoin(normalized);
    setCode('');
    setError('');
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bg">
              <Lock size={18} className="accent-icon" />
            </div>
            <h2 className="modal-title">Join Private Room</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Room Code</label>
            <p className="form-hint">Enter the secret code shared by your friend</p>
            <div className="input-wrapper">
              <input
                className="modal-input"
                value={code}
                onChange={handleChange}
                placeholder="e.g. FLUX-DDCD"
                maxLength={12}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>
            {error && <span className="form-error">{error}</span>}
          </div>
          <div className="modal-actions">
            <button className="btn secondary" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={handleSubmit}>Join Room</button>
          </div>
        </div>
      </div>
    </div>
  );
};
