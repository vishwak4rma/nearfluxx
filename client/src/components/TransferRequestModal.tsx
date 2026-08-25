import React from 'react';
import { Download, X, File, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBytes } from '../utils/formatters';

export const TransferRequestModal: React.FC = () => {
  const { incomingRequest, acceptIncomingRequest, rejectIncomingRequest } = useApp();

  if (!incomingRequest) return null;

  const totalSize = incomingRequest.files.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="modal-backdrop">
      <div className="modal-card transfer-request-modal">
        <div className="modal-header">
          <div className="request-header-title">
            <Download className="accent-icon" size={22} />
            <h3>Incoming Transfer Request</h3>
          </div>
          <button className="icon-btn" onClick={rejectIncomingRequest} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="request-body">
          <div className="sender-info-box">
            <p className="sender-prompt">
              <strong className="sender-name">{incomingRequest.senderName}</strong> wants to send you{' '}
              <span className="highlight-badge">{incomingRequest.files.length} file(s)</span>
            </p>
            <span className="total-size-tag">Total Size: {formatBytes(totalSize)}</span>
          </div>

          <div className="file-preview-list">
            {incomingRequest.files.map((file, idx) => (
              <div key={idx} className="request-file-item">
                <div className="file-item-left">
                  <File size={18} className="file-type-icon" />
                  <span className="file-name" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <span className="file-size-badge">{formatBytes(file.size)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn secondary danger" onClick={rejectIncomingRequest}>
            Decline
          </button>
          <button className="btn primary" onClick={acceptIncomingRequest}>
            <Check size={16} />
            Accept & Receive
          </button>
        </div>
      </div>
    </div>
  );
};