import { Infer, Struct } from 'superstruct';

export type Unique<Element extends Struct<any>> = (
  struct: Struct<Infer<Element>[], Infer<Element>>,
  eq?: (a: Infer<Element>, b: Infer<Element>) => boolean,
) => Struct<Infer<Element>[], Infer<Element>>;
