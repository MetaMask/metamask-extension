/* eslint-disable @typescript-eslint/naming-convention */
// disable eslint naming convention for the Network Request body fields

export type JsonRpcResponse<Result> = {
  id: number;
  jsonrpc: string;
  result: Result;
};

export type ToprfJsonRpcRequestMethod =
  | 'TOPRFCommitmentRequest'
  | 'TOPRFAuthenticateRequest'
  | 'TOPRFStoreKeyShareRequest'
  | 'TOPRFEvalRequest'
  | 'TOPRFResetRateLimitRequest'
  | 'TOPRFGetPubKeyRequest';

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

export type ToprfStoreKeyShareRequestParams = {
  pub_key: string;
  verifier: string;
  verifier_id: string;
  share_import_items: {
    encrypted_share: string;
    encrypted_auth_token: string;
    key_share_index: number;
    node_index: number;
    sss_endpoint: string;
  }[];
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
