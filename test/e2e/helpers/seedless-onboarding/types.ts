export type ToprfJsonRpcRequestMethod = 'TOPRFCommitmentRequest' | 'TOPRFAuthenticateRequest' | 'TOPRFStoreKeyShareRequest';

export type ToprfCommitmentRequestParams = {
  token_commitment: string;
  verifier: string;
  temp_pub_key_x: string;
  temp_pub_key_y: string;
};

export type ToprfJsonRpcRequestBody<Params> = {
  method: ToprfJsonRpcRequestMethod;
  params: Params;
};
