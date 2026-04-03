import { useEffect, useRef, useState, useCallback } from "react";
import { mutate } from "swr";

export function useSSE() {
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revalidate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mutate(
        () => true,
        undefined,
        { revalidate: true, populateCache: false, rollbackOnError: false },
      );
    }, 2000);
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/events");
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "session_updated") {
          revalidate();
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      esRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [revalidate]);

  return { connected };
}
