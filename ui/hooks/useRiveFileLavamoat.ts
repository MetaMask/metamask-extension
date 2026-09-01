import { useRiveFile } from '@rive-app/react-canvas';
import { useRiveWasmFile } from '../contexts/rive-wasm';

export const useRiveFileLavamoat = ({ src }: { src: string }) => {
  const { buffer } = useRiveWasmFile(src);

  return useRiveFile({ buffer });
};
