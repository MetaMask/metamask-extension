export enum DecodedTransactionDataSource {
  Uniswap = 'Uniswap',
  Sourcify = 'Sourcify',
  FourByte = 'FourByte',
}

export type DecodedTransactionDataResponse = {
  data: DecodedTransactionDataMethod[];
  source: DecodedTransactionDataSource;
};

export type DecodedTransactionDataMethod = {
  name: string;
  description?: string;
  params: DecodedTransactionDataParam[];
};

export type DecodedTransactionDataParam = {
  name?: string;
  description?: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  children?: DecodedTransactionDataParam[];
};
