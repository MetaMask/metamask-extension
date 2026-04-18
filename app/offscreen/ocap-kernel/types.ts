import type { OffscreenCommunicationTarget } from '../../../shared/constants/offscreen-communication';

export type HostApiProxyRequest = {
  target: OffscreenCommunicationTarget;
  action: string;
  args: unknown[];
};

export type HostApiProxyResponse = {
  success: boolean;
  result?: unknown;
  error?: { message: string; stack?: string };
};

export type HostApiProxy = {
  invoke: (method: string, args?: unknown[]) => Promise<unknown>;
};
