import { Infer, Struct } from 'superstruct';

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Unique<Element extends Struct<any>> = (
  struct: Struct<Infer<Element>[], Infer<Element>>,
  eq?: (a: Infer<Element>, b: Infer<Element>) => boolean,
) => Struct<Infer<Element>[], Infer<Element>>;
