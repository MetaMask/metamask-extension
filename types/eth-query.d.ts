declare module 'eth-query' {
  // What it says on the tin. We omit `null` because confusingly, this is used
  // for a successful response to indicate a lack of an error.
  type EverythingButNull =
    | string
    | number
    | boolean
    | object
    | symbol
    | undefined;

  type ProviderSendAsyncResponse<Result> = {
    error?: { message: string };
    result?: Result;
  };

  type ProviderSendAsyncCallback<Result> = (
    error: unknown,
    response: ProviderSendAsyncResponse<Result>,
  ) => void;

  type Provider = {
    sendAsync<Params, Result>(
      payload: SendAsyncPayload<Params>,
      callback: ProviderSendAsyncCallback<Result>,
    ): void;
  };

  type SendAsyncPayload<Params> = {
    id: number;
    jsonrpc: '2.0';
    method: string;
    params: Params;
  };

  type SendAsyncCallback<Result> = (
    ...args:
      | [error: EverythingButNull, result: undefined]
      | [error: null, result: Result]
  ) => void;

  export default class EthQuery {
    constructor(provider: Provider);

    sendAsync<Params, Result>(
      opts: Partial<SendAsyncPayload<Params>>,
      callback: SendAsyncCallback<Result>,
    ): void;
  }
}
