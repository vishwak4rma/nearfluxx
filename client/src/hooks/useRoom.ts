import { useState, useEffect } from 'react';

const ROOM_KEY = 'nearflux_room_code';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part(4)}-${part(4)}`;
}

export function useRoom() {
  const [roomCode, setRoomCode] = useState<string>('');
  const [isInRoom, setIsInRoom] = useState<boolean>(false);

  // On mount: check URL params for a shared room link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) {
      const code = urlRoom.toUpperCase();
      setRoomCode(code);
      setIsInRoom(true);
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    } else {
      const saved = localStorage.getItem(ROOM_KEY);
      if (saved) {
        setRoomCode(saved);
        setIsInRoom(true);
      }
    }
  }, []);

  const createRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsInRoom(true);
    localStorage.setItem(ROOM_KEY, code);
    return code;
  };

  const joinRoom = (code: string) => {
    const normalized = code.toUpperCase().trim();
    setRoomCode(normalized);
    setIsInRoom(true);
    localStorage.setItem(ROOM_KEY, normalized);
  };

  const leaveRoom = () => {
    setRoomCode('');
    setIsInRoom(false);
    localStorage.removeItem(ROOM_KEY);
  };

  const getShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    return url.toString();
  };

  return { roomCode, isInRoom, createRoom, joinRoom, leaveRoom, getShareLink };
}
