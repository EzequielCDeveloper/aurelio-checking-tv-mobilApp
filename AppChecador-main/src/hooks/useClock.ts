import { useEffect, useState } from 'react';

/**
 * Reloj vivo. Se re-renderiza cada segundo solo en el componente que lo usa,
 * no en la pantalla completa: el prototipo seteaba un intervalo que filtraba
 * el layout entero a 1 Hz.
 */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}
