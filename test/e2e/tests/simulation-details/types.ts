export const SENDER_ADDRESS_NO_0X_MOCK =
  '5cfe73b6021e818b776b421b1c4db2474086a7e1';
export const SENDER_ADDRESS_MOCK = `0x${SENDER_ADDRESS_NO_0X_MOCK}`;
export const RECIPIENT_ADDRESS_MOCK =
  '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc';

type JsonRpcBase = {
  jsonrpc?: '2.0';
  id: string | number;
};

type JsonRpcRequest = JsonRpcBase & {
  method: string;
  params?: unknown[] | object;
};

type JsonRpcResponse = JsonRpcBase & {
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type MockRequest = Partial<JsonRpcRequest>;
export type MockResponse = Partial<JsonRpcResponse>;

export type MockRequestResponse = {
  request: MockRequest;
  response: MockResponse;
};
