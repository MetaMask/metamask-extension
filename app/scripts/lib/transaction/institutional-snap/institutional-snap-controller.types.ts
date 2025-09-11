// Response from the `transactions.getMutableTransactionParameters` method of the Institutional Snap
export type InstitutionalSnapResponse = {
  keyringRequest: {
    id: string;
    scope: string;
    account: string;
    request: {
      method: string;
      params: [
        {
          chainId: string;
          nonce: string;
          maxPriorityFeePerGas: string;
          maxFeePerGas: string;
          gasLimit: string;
          to: string;
          value: string;
          data: string;
          accessList: string[];
          from: string;
          type: string;
        },
      ];
    };
  };
  type: string;
  fulfilled: boolean;
  rejected: boolean;
  lastUpdated: number;
  transaction: {
    custodianTransactionId: string;
    transactionStatus: {
      finished: boolean;
      success: boolean;
      displayText: string;
      submitted: boolean;
      reason: string;
      signed: boolean;
    };
    from: string;
    custodianPublishesTransaction: boolean;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    gasLimit: string;
    nonce: string;
    to: string;
    transactionHash: string;
    type: string;
  };
  result: {
    v: string;
    r: string;
    s: string;
  };
};

// Parameters for the `transactions.getMutableTransactionParameters` method of the Institutional Snap
export type InstitutionalSnapRequestSearchParameters = {
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: string;
};
