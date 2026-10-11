import { useState, useEffect } from 'react';

export default function useAhora(ms = 30000) {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return ahora;
}