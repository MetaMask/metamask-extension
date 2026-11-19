export const BRAZE_TARGET = 'braze-identity';

export type BrazeWorkerCommand =
  | { type: 'start'; apiKey: string; endpoint: string; profile: string }
  | { type: 'response'; id: number; status: number };

export type BrazeWorkerRequest = {
  id: number;
  method: string;
  url: string;
  body: string;
};

/** @returns Whether the value is a nonempty SDK external ID. */
export function isBrazeProfile(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256;
}

/** @returns The build-validated SDK configuration, or null when disabled. */
export function getBrazeConfig(): { apiKey: string; endpoint: string } | null {
  const apiKey = process.env.BRAZE_WEB_API_KEY;
  const endpoint = process.env.BRAZE_SDK_ENDPOINT;
  return !process.env.IN_TEST && apiKey && endpoint
    ? { apiKey, endpoint }
    : null;
}
