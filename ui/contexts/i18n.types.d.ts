import type TranslationsJson from '../../app/_locales/en/messages.json.d.ts';

type TJson = typeof TranslationsJson;
type Keys = keyof TJson;

// Gets a message from a given key
type GetMessage<K extends Keys> = (typeof TranslationsJson)[K]['message'];

// A message might have $1, etc. This will aggregate all these into a args tuple
// Useful so we know how many args a given translation needs!
// Can be used to find outdated translations that forgot to remove args, or translations that forgot args.
type GetArgTuple<
  Message extends string,
  Acc extends unknown[] = [],
> = Message extends ''
  ? Acc
  : Message extends `${string}$${number}${infer Tail}`
  ? GetArgTuple<Tail, [...Acc, unknown]>
  : Acc;

// Yay JS. The first func sig are for cases where we have multiple params...
type FuncSig1 = <K extends Keys>(
  key: K,
  ...args: GetArgTuple<GetMessage<K>>
) => string;

// ...This second func sig is where developers use an array for multiple args.
type FuncSig2 = <K extends Keys>(
  key: K,
  args: GetArgTuple<GetMessage<K>>,
) => string;

// A bit cheeky here but it works.
// We declare that the translation can be either these 2 signatures
// NOTE - using intersection instead of unions by how functions are contravariant (or one of those terms).
export type TranslationFn = FuncSig1 & FuncSig2;
