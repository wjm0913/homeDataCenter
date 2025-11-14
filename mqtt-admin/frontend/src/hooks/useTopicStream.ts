import { useEffect, useRef, useState } from 'react';

export interface TopicMessage {
  topic: string;
  payload: string;
  timestamp: number;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000/ws';

export const useTopicStream = (topics: string[]) => {
  const [messages, setMessages] = useState<TopicMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const latestTopicsRef = useRef<string[]>(topics);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      if (latestTopicsRef.current.length) {
        socket.send(JSON.stringify({ action: 'subscribe', topics: latestTopicsRef.current }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages((prev) => [data as TopicMessage, ...prev].slice(0, 200));
        }
      } catch (error) {
        console.error('WS parse error', error);
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      latestTopicsRef.current = topics;
      return;
    }
    socket.send(JSON.stringify({ action: 'unsubscribe', topics: latestTopicsRef.current }));
    socket.send(JSON.stringify({ action: 'subscribe', topics }));
    latestTopicsRef.current = topics;
  }, [topics]);

  const clear = () => setMessages([]);

  return { messages, clear };
};
