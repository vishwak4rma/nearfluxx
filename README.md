# ⚡ NearFlux

**High-Speed, Cross-Platform Local Network File Sharing**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-333333?logo=webrtc&logoColor=white)](https://webrtc.org/)

---

## Table of Contents

- [Description](#description)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Contributing](#contributing)
- [License](#license)

---

## Description

**NearFlux** is an open-source, ultra-fast local file sharing web application built for seamless transfer of files across devices connected to the same Wi-Fi network or mobile hotspot.

Unlike cloud storage services, **NearFlux transfers files directly peer-to-peer using WebRTC DataChannels**, ensuring complete privacy, zero cellular/internet data usage, and maximum local Wi-Fi transfer speeds.

---

## ✨ Key Features

- 📱💻 **Cross-Platform**: Transfer files seamlessly between Phone-to-Phone, Phone-to-PC, PC-to-Phone, and PC-to-PC (Windows, macOS, Linux, iOS, Android).
- ⚡ **Direct WebRTC P2P**: Binary file streams travel directly between devices without ever being stored on any server.
- 🔄 **Automatic Hybrid Fallback**: Automatically switches to Socket.IO streaming if WebRTC P2P is blocked by router AP Isolation or mobile hotspot firewalls.
- 👥 **Multi-Device Target Selection**: Select multiple target devices or click "Select All" to broadcast files to multiple recipients in parallel.
- 📦 **256 KB Chunked Streaming**: Handles multi-gigabyte files smoothly using chunked array buffers and backpressure monitoring (`bufferedAmount`) to prevent browser memory overload.
- 🎨 **Modern Dark & Light UI**: Sleek theme toggle, drag-and-drop dropzone, character-limited custom device naming modal, and responsive design.
- 📊 **Real-Time Transfer Metrics**: Centered popup modal featuring live transfer speed (MB/s or KB/s), estimated time remaining (ETA), percentage progress, and uppercase file extension badges (e.g. `JPG`, `PDF`, `ZIP`).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: Modern CSS Variables (Dark & Light themes)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express
- **Signaling Server**: Socket.IO

### P2P Protocol
- **WebRTC**: `RTCPeerConnection` & `RTCDataChannel` (256 KB chunked binary transfer)

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Installation Steps
1. **Clone** the repository: `git clone https://github.com/satyampand4y/nearflux.git`
2. **Navigate** into the project directory: `cd nearflux`
3. **Install** all dependencies: `npm run install:all`
4. **Start** the development server: `npm run dev`
5. **Open** in your browser:
   - Primary computer: `http://localhost:5173`
   - Mobile / secondary devices: `http://<YOUR_LOCAL_IP>:5173`

---

## 🚀 Available Scripts

In the root directory, you can run:

- `npm run dev`: Runs both backend server and frontend client concurrently in 1 terminal window
- `npm run install:all`: Installs root, client, and server dependencies at once
- `npm run dev:server`: Runs backend signaling server only (`port 3000`)
- `npm run dev:client`: Runs React Vite dev server only (`port 5173`)
- `npm run build:client`: Builds production bundle for the React client
- `npm run build:server`: Compiles TypeScript for the Express backend server

---

## 📁 Project Structure

```
NearFlux
├── client
│   ├── index.html
│   ├── package.json
│   ├── src
│   │   ├── App.tsx
│   │   ├── components
│   │   │   ├── DeviceCard.tsx
│   │   │   ├── DeviceList.tsx
│   │   │   ├── DeviceNameModal.tsx
│   │   │   ├── FileDropzone.tsx
│   │   │   ├── FileList.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── TransferProgress.tsx
│   │   │   └── TransferRequestModal.tsx
│   │   ├── context
│   │   │   └── AppContext.tsx
│   │   ├── hooks
│   │   │   ├── useDeviceName.ts
│   │   │   ├── useSocket.ts
│   │   │   └── useTheme.ts
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── services
│   │   │   ├── socket.ts
│   │   │   └── webrtc.ts
│   │   ├── types
│   │   │   └── index.ts
│   │   └── utils
│   │       ├── device.ts
│   │       └── formatters.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── package.json
├── server
│   ├── package.json
│   ├── src
│   │   ├── index.ts
│   │   ├── services
│   │   │   └── deviceManager.ts
│   │   ├── socket
│   │   │   └── socketHandler.ts
│   │   ├── types
│   │   │   └── index.ts
│   │   └── utils
│   │       └── network.ts
│   └── tsconfig.json
└── shared
    └── types
        ├── device.ts
        └── socket.ts
```

---

## 🛠️ Development Setup

### Local Network Testing
1. **Connect** your computer and mobile phone to the **same Wi-Fi network** or **mobile hotspot**
2. **Start** the server: `npm run dev`
3. **Copy** the Network URL printed in your terminal (e.g., `http://192.168.1.50:5173`)
4. **Open** that URL on your phone's browser. Both devices will discover each other automatically!

### Production Build & Run
1. **Build** client assets: `npm run build:client`
2. **Build** server code: `npm run build:server`
3. **Start** single production server: `node server/dist/index.js`
4. **Access** single-port application: `http://localhost:3000`

---

## 👥 Contributing

Contributions are welcome! Here's the standard flow:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/satyampand3y/nearflux.git`
3. **Branch**: `git checkout -b feature/your-feature`
4. **Commit**: `git commit -m 'feat: add some feature'`
5. **Push**: `git push origin feature/your-feature`
6. **Open** a pull request

---

## 📜 License

This project is licensed under the **MIT** License.

---
