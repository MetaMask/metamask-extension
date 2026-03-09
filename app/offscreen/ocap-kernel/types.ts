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

export type LlmResponse = {
  capabilityName: string;
  sourceCode: string;
  description: string;
  methodNames: string[];
};

export type CapabilityRecord = {
  id: string;
  name: string;
  description: string;
  methodNames: string[];
  exo: unknown;
  sourceCode: string;
};

export type HostApiProxy = {
  invoke: (method: string, ...args: unknown[]) => Promise<unknown>;
};

export type LlmService = {
  prompt: (request: string) => Promise<LlmResponse>;
};
