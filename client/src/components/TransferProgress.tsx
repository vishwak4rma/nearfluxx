import React from 'react';
import { ArrowUpRight, ArrowDownLeft, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBytes, formatSpeed, formatTime } from '../utils/formatters';

export const TransferProgress: React.FC = () => {
  const { transferState, cancelTransfer, closeTransfer } = useApp();

  if (transferState.status === 'idle') {
    return null;
  }

  const isEndedState =
    transferState.status === 'completed' ||
    transferState.status === 'cancelled' ||
    transferState.status === 'failed';

  const handleCloseOrCancel = () => {
    if (isEndedState) {
      closeTransfer();
    } else {
      cancelTransfer();
    }
  };

  const renderStatusMessage = () => {
    switch (transferState.status) {
      case 'pending_approval':
        return `Waiting for ${transferState.peerDeviceName || 'recipient(s)'} to accept...`;
      case 'connecting':
        return 'Establishing connection...';
      case 'transferring':
        return `Transferring file (${transferState.currentFileIndex || 1}/${transferState.totalFiles || 1})`;
      case 'completed':
        return 'Transfer completed successfully!';
      case 'failed':
        return transferState.error || 'Transfer failed';
      case 'cancelled':
        return 'Transfer was cancelled';
      default:
        return '';
    }
  };

  const getFileExtension = (filename?: string) => {
    if (!filename) return 'FILE';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toUpperCase() || 'FILE' : 'FILE';
  };

  return (
    <div className="transfer-modal-overlay">
      <div className="transfer-card popup-box">
        <div className="transfer-header">
          <div className="transfer-type">
            <div className={`transfer-icon-badge ${transferState.role}`}>
              {transferState.role === 'sender' ? (
                <ArrowUpRight size={22} className="send-icon" />
              ) : (
                <ArrowDownLeft size={22} className="receive-icon" />
              )}
            </div>
            <div>
              <h3>
                {transferState.role === 'sender' ? 'Sending Files' : 'Receiving Files'}
              </h3>
              <p className="transfer-peer-subtitle">
                {transferState.role === 'sender' ? 'To: ' : 'From: '}
                <strong>{transferState.peerDeviceName || 'Device'}</strong>
              </p>
            </div>
          </div>
          <button className="icon-btn close-btn" onClick={handleCloseOrCancel} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="transfer-body">
          <div className="file-info-card">
            <div className="file-info-main">
              <FileText size={22} className="file-icon" />
              <div className="file-text-details">
                <span className="file-title" title={transferState.currentFileName}>
                  {transferState.currentFileName || renderStatusMessage()}
                </span>
                {transferState.currentFileName && (
                  <span className="file-type-badge">{getFileExtension(transferState.currentFileName)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="progress-bar-container">
            <div
              className={`progress-bar-fill ${transferState.status}`}
              style={{ width: `${transferState.progress}%` }}
            ></div>
          </div>

          <div className="transfer-stats-row">
            <span className="progress-percent">{transferState.progress.toFixed(1)}%</span>
            {transferState.fileSize !== undefined && (
              <span className="transferred-bytes">
                {formatBytes(transferState.transferredBytes)} / {formatBytes(transferState.fileSize)}
              </span>
            )}
          </div>

          {transferState.status === 'transferring' && (
            <div className="transfer-meta-row">
              <span className="meta-item">
                <span className="meta-label">Speed:</span> {formatSpeed(transferState.speed)}
              </span>
              <span className="meta-item">
                <span className="meta-label">ETA:</span> {formatTime(transferState.timeRemaining)}
              </span>
            </div>
          )}

          {transferState.status === 'completed' && (
            <div className="transfer-status-msg success">
              <CheckCircle size={18} />
              <span>Transfer completed! Saved to downloads.</span>
            </div>
          )}

          {(transferState.status === 'failed' || transferState.status === 'cancelled') && (
            <div className="transfer-status-msg error">
              <AlertCircle size={18} />
              <span>{transferState.error || 'Transfer interrupted'}</span>
            </div>
          )}
        </div>

        <div className="transfer-actions">
          <button className="btn secondary danger-hover" onClick={handleCloseOrCancel}>
            {isEndedState ? 'Close' : 'Cancel Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
};