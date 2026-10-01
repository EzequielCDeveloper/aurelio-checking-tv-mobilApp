import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BioIcon } from '@/components/BioIcon';
import { sounds } from '@/lib/sounds';

const BARCODE_TYPES = ['qr'] as const;
/** Ignora lecturas repetidas del mismo codigo dentro de esta ventana. */
const RESCAN_COOLDOWN_MS = 2500;

export interface QrScannerProps {
  active: boolean;
  onScanned: (raw: string) => void;
  onClose: () => void;
}

export function QrScanner({ active, onScanned, onClose }: QrScannerProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const lastScan = useRef<{ value: string; at: number }>({ value: '', at: 0 });
  const locked = useRef(false);

  // Al reabrir el visor hay que permitir escanear de nuevo.
  useEffect(() => {
    if (active) {
      locked.current = false;
      lastScan.current = { value: '', at: 0 };
    }
  }, [active]);

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (locked.current) return;

      // Feedback de audio: sin esto, en un terminal real el empleado no sabe
      // si el codigo fue leido hasta que aparece la pantalla siguiente.
      sounds.scanPing();

      const now = Date.now();
      const previous = lastScan.current;
      if (previous.value === data && now - previous.at < RESCAN_COOLDOWN_MS) return;

      // Se bloquea el handler: `onBarcodeScanned` sigue disparando en cada
      // frame mientras el codigo este en el campo, y sin esto se registraban
      // varias marcaciones por un solo escaneo.
      locked.current = true;
      lastScan.current = { value: data, at: now };
      onScanned(data);
    },
    [onScanned],
  );

  /**
   * `CameraView` se puede pasar siempre el handler y que el lock se evalue
   * DENTRO, en el momento de la llamada.
   *
   * Antes se hacia `onBarcodeScanned={locked.current ? undefined : handler}`:
   * eso lee un ref durante el render, y el valor de un ref no es confiable
   * durante render porque React puede renderizar sin commitear. El bloqueo
   * quedaba aplicado con el valor del render anterior, que es justo cuando
   * fallaba: dos marcaciones por un escaneo en frames seguidos.
   */
  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      handleBarcodeScanned(result);
    },
    [handleBarcodeScanned],
  );

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-primary">
          <BioIcon name="qr_code_scanner" size={30} color="#ffffff" />
        </View>
        <Text className="mt-5 text-center text-[16px] font-bold text-white">
          Permití el acceso a la cámara
        </Text>
        <Text className="mt-2 max-w-[280px] text-center text-[12px] leading-5 text-white/60">
          BioCheck la necesita únicamente para leer el código QR del terminal.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={requestPermission}
          className="mt-7 min-h-12 justify-center rounded-2xl bg-primary px-7 py-3 shadow-brand-glow"
        >
          <Text className="text-[13px] font-bold text-white">Habilitar cámara</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} className="mt-3 min-h-11 justify-center px-5">
          <Text className="text-[12px] font-semibold text-white/70">Cancelar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={onBarcodeScanned}
      />

      {/* Marco del visor. */}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View className="h-64 w-64 rounded-[32px] border-2 border-white/80">
          <View className="absolute -left-0.5 -top-0.5 h-12 w-12 rounded-tl-[30px] border-l-4 border-t-4 border-primary" />
          <View className="absolute -right-0.5 -top-0.5 h-12 w-12 rounded-tr-[30px] border-r-4 border-t-4 border-primary" />
          <View className="absolute -bottom-0.5 -left-0.5 h-12 w-12 rounded-bl-[30px] border-b-4 border-l-4 border-primary" />
          <View className="absolute -bottom-0.5 -right-0.5 h-12 w-12 rounded-br-[30px] border-b-4 border-r-4 border-primary" />
        </View>
      </View>

      <View className="absolute left-0 right-0 items-center px-6" style={{ top: insets.top + 20 }}>
        <View className="rounded-full bg-black/50 px-4 py-2.5">
          <Text className="text-[12px] font-semibold text-white">Encuadrá el código del terminal</Text>
        </View>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-6"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={torch ? 'Apagar linterna' : 'Encender linterna'}
          onPress={() => setTorch((t) => !t)}
          className="h-13 w-13 items-center justify-center rounded-full border border-white/20 bg-black/40"
        >
          <BioIcon name={torch ? 'flashlight_off' : 'flashlight_on'} size={22} color="#ffffff" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar escáner"
          onPress={onClose}
          className="h-13 w-13 items-center justify-center rounded-full border border-white/20 bg-black/40"
        >
          <BioIcon name="logout" size={22} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
