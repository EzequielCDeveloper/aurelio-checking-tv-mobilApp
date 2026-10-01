import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import tickWav from '@/assets/sounds/tick.wav';
import scanPingWav from '@/assets/sounds/scan-ping.wav';
import successWav from '@/assets/sounds/success.wav';

/**
 * Efectos de sonido de la interfaz.
 *
 * El prototipo los generaba en runtime con Web Audio (osciladores + rampas).
 * En nativo no hay equivalente, asi que los .wav se generan con
 * `npm run gen:sounds`, replicando la misma sintesis.
 *
 * Dos detalles que importan de expo-audio:
 *  1. `play()` NO rebobina: hay que hacer `seekTo(0)` o el segundo disparo
 *     no suena.
 *  2. `mixWithOthers` es el modo indicado para efectos de UI: no roba el foco
 *     de audio al usuario ni pausa lo que este escuchando.
 */
void setAudioModeAsync({
  playsInSilentMode: true,
  interruptionMode: 'mixWithOthers',
});

const players = {
  tick: createAudioPlayer(tickWav),
  scanPing: createAudioPlayer(scanPingWav),
  success: createAudioPlayer(successWav),
} satisfies Record<string, AudioPlayer>;

function play(player: AudioPlayer): void {
  player
    .seekTo(0)
    .then(() => player.play())
    .catch(() => {
      // Sin audio disponible (permisos, simulador, volumen): la UI no depende de esto.
    });
}

export const sounds = {
  /** Clic tactil de boton. */
  tick: () => play(players.tick),
  /** Ping de inicio de escaneo biometrico. */
  scanPing: () => play(players.scanPing),
  /** Confirmacion de registro. */
  success: () => play(players.success),
};
