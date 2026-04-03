import { useEffect, useRef, useState } from "react";
import { mutate } from "swr";

export function useSSE() {
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "session_updated" || data.type === "connected") {
          // Revalidate all SWR caches on any session change
          mutate(() => true, undefined, { revalidate: true });
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  return { connected };
}
