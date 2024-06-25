export type DecodedTransactionMethod = {
  name: string;
  description?: string;
  params: { name?: string; description?: string; type: string; value: any }[];
};
