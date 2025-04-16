import { Infer, Struct } from 'superstruct';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Unique<Element extends Struct<any>> = (
  struct: Struct<Infer<Element>[], Infer<Element>>,
  eq?: (a: Infer<Element>, b: Infer<Element>) => boolean,
) => Struct<Infer<Element>[], Infer<Element>>;
