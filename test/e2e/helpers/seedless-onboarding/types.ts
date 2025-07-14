export type JsonRpcResponse<Result> = {
  id: number;
  jsonrpc: string;
  result: Result;
};

export type ToprfJsonRpcRequestMethod = 'TOPRFCommitmentRequest' | 'TOPRFAuthenticateRequest' | 'TOPRFStoreKeyShareRequest' | 'TOPRFEvalRequest';

export type ToprfCommitmentRequestParams = {
  token_commitment: string;
  verifier: string;
  temp_pub_key_x: string;
  temp_pub_key_y: string;
};

export type ToprfAuthenticateResponse = {
  auth_token: string;
  node_index: number;
  node_pub_key: string;
  pub_key?: string;
  key_index?: number;
};

export type ToprfEvalRequestParams = {
  auth_token: string;
  share_coefficient: string;
  blinded_input_x: string;
  blinded_input_y: string;
  verifier: string;
  verifier_id: string;
};

export type ToprfJsonRpcRequestBody<Params> = {
  method: ToprfJsonRpcRequestMethod;
  params: Params;
};
