import { Json } from '@metamask/utils';
import localforage from 'localforage';

type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

/**
 * A type that can be cloned using structured cloning.
 * Not perfect and not exhaustive, but covers most common types.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types
 */
export type Cloneable =
  | string
  | number
  | boolean
  | null
  | undefined
  | ArrayBuffer
  | TypedArray
  | Blob
  | AudioData
  | DOMMatrix
  | DOMMatrixReadOnly
  | DOMQuad
  | DOMRect
  | DOMRectReadOnly
  | EncodedAudioChunk
  | EncodedVideoChunk
  | File
  | FileList
  | FileSystemDirectoryHandle
  | FileSystemFileHandle
  | FileSystemHandle
  | ImageBitmap
  | ImageData
  | RTCCertificate
  | RTCEncodedAudioFrame
  | RTCEncodedVideoFrame
  | VideoFrame
  | WebTransportError
  | CryptoKey
  | DataView
  | Date
  | Error
  | Map<Cloneable, Cloneable>
  | Set<Cloneable>
  | Cloneable[]
  | {
      [key: string | number]: Cloneable;
    };

export const version = 1;

localforage.config({
  storeName: `storage-helpers-v${version}`,
});

/**
 * Retrieves an item from local storage.
 *
 * @param key - The key of the item to retrieve from storage.
 * @returns The value associated with the key, or undefined if the item does not exist or an error occurs.
 */
export async function getStorageItem<T extends Cloneable>(key: string) {
  try {
    return (await localforage.getItem(key)) as T;
  } catch (err) {
    return undefined;
  }
}

/**
 * Stores an item in local storage.
 *
 * @param key - The key to associate with the item.
 * @param value - The item to store.
 * @returns The value that was set in storage, or undefined if an error occurs.
 */
export async function setStorageItem(key: string, value: Cloneable) {
  try {
    return await localforage.setItem(key, value);
  } catch (err) {
    console.warn(err);
  }
}
