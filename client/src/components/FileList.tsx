import React from 'react';
import { File, Trash2, X, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBytes } from '../utils/formatters';

export const FileList: React.FC = () => {
  const { selectedFiles, removeFile, clearFiles, selectedTargetDevices, startTransfer } = useApp();

  if (selectedFiles.length === 0) return null;

  const totalSize = selectedFiles.reduce((acc, curr) => acc + curr.size, 0);

  const renderSendButtonText = () => {
    const count = selectedTargetDevices.length;
    if (count === 0) {
      return 'Select target device(s) above to send';
    }
    if (count === 1) {
      return `Send to ${selectedTargetDevices[0].name}`;
    }
    return `Send to ${count} Selected Devices`;
  };

  return (
    <section className="section-card selected-files-section">
      <div className="section-header">
        <div>
          <h2>Selected Files ({selectedFiles.length})</h2>
          <span className="subtitle">Total Size: {formatBytes(totalSize)}</span>
        </div>
        <button className="btn text-danger" onClick={clearFiles} title="Clear all files">
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="file-list">
        {selectedFiles.map((file) => (
          <div key={file.id} className="file-item">
            <div className="file-icon-bg">
              <File size={20} />
            </div>
            <div className="file-details">
              <span className="file-name" title={file.name}>
                {file.name}
              </span>
              <span className="file-meta">
                {formatBytes(file.size)} • {file.type || 'Binary'}
              </span>
            </div>
            <button
              className="icon-btn remove-btn"
              onClick={() => removeFile(file.id)}
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="transfer-actions">
        <button
          className="btn primary send-btn"
          disabled={selectedTargetDevices.length === 0}
          onClick={startTransfer}
        >
          <Send size={18} />
          {renderSendButtonText()}
        </button>
      </div>
    </section>
  );
};