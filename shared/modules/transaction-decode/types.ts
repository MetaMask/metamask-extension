export type DecodedTransactionMethod = {
  name: string;
  description?: string;
  params: DecodedTransactionParam[];
};

export type DecodedTransactionParam = {
  name?: string;
  description?: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export type FourByteResponse = {
  label: string;
  name: string;
  params: { type: string }[];
  signature: string;
};
