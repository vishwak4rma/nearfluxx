import React from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { FileDropzone } from './components/FileDropzone';
import { FileList } from './components/FileList';
import { DeviceList } from './components/DeviceList';
import { TransferProgress } from './components/TransferProgress';
import { TransferRequestModal } from './components/TransferRequestModal';

const MainContent: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <FileDropzone />
      <FileList />
      <DeviceList />
      <TransferRequestModal />
      <TransferProgress />
      <footer className="app-footer">
        <div className="footer-links">
          <a href="#" className="footer-link">About</a>
          <a href="#" className="footer-link">How to Use</a>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">FAQ</a>
          <a href="#" className="footer-link">Contact</a>
          <a
            href="https://buymeacoffee.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link support"
          >
            ☕ Support Developer
          </a>
        </div>
        <div className="footer-copy">
          © 2026 <strong>NearFlux Online</strong> — Fast, Private Worldwide P2P Transfers
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
