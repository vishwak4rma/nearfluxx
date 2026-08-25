import React, { useRef, useState } from 'react';
import { Upload, FileUp, FolderOpen, Files } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FileDropzone: React.FC = () => {
  const { addFiles } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  return (
    <div
      className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        // @ts-ignore
        webkitdirectory=""
        multiple
        style={{ display: 'none' }}
      />

      <div className="dropzone-icon-wrapper">
        {isDragOver ? <FileUp size={44} /> : <Upload size={44} />}
      </div>
      <h3>Drag & Drop Files or Folders Here</h3>
      <p>Supports single files, multiple files, and nested folder structures</p>

      <div className="dropzone-buttons">
        <button
          className="btn secondary dropzone-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <Files size={16} />
          Select Files
        </button>
        <button
          className="btn secondary dropzone-btn"
          onClick={() => folderInputRef.current?.click()}
        >
          <FolderOpen size={16} />
          Select Folder
        </button>
      </div>
    </div>
  );
};
