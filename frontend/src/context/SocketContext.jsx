import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) { socketRef.current?.disconnect(); return; }
    const s = io(window.location.origin, { path: '/socket.io', transports: ['websocket'] });
    socketRef.current = s;
    setSocket(s);
    return () => { s.disconnect(); setSocket(null); };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
