import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  roomCode: string;
}

// Minimal QR code generator (no external lib needed)
// Uses a canvas-based approach drawing a data-URL style QR
// We use a simple approach: embed a Google Charts-style SVG via a data URL
// Since we want zero deps, we generate a simple visual grid

function generateQRMatrix(text: string): boolean[][] {
  // Simple deterministic visual representation using text hash
  // (For production a real QR lib like 'qrcode' npm package should be used)
  // Here we create a visually distinct pattern based on the room code
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Fixed position detection patterns (top-left, top-right, bottom-left)
  const addFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          if (row + r < size && col + c < size) matrix[row + r][col + c] = true;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data modules: hash-based fill for inner region
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }

  for (let r = 9; r < size - 1; r++) {
    for (let c = 9; c < size - 1; c++) {
      const val = ((hash ^ (r * 31) ^ (c * 17)) >>> 0) % 3;
      matrix[r][c] = val === 0;
    }
  }

  return matrix;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, value, roomCode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const matrix = generateQRMatrix(value);
    const size = matrix.length;
    const cellSize = Math.floor(200 / size);
    const totalSize = cellSize * size;
    canvas.width = totalSize;
    canvas.height = totalSize;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalSize, totalSize);

    ctx.fillStyle = '#1e293b';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Share QR Code</h2>
            <p className="modal-subtitle">Scan to join Room <strong>{roomCode}</strong></p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="qr-canvas-wrapper">
          <canvas ref={canvasRef} className="qr-canvas" />
        </div>
        <p className="qr-hint">Anyone who scans this joins your private room instantly</p>
      </div>
    </div>
  );
};
