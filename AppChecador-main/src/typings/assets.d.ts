/**
 * Metro resuelve un require de asset a un id numerico opaco. Expo lo acepta
 * tanto para <Image> como para el `AudioSource` de expo-audio, asi que se
 * tipa como number.
 */
declare module '*.png' {
  const assetId: number;
  export default assetId;
}

declare module '*.jpg' {
  const assetId: number;
  export default assetId;
}

declare module '*.wav' {
  const assetId: number;
  export default assetId;
}
