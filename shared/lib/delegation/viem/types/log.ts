import type {
  Abi,
  AbiEvent,
  Address,
  ExtractAbiEvent,
  ExtractAbiEventNames,
} from 'abitype';

import type {
  AbiEventParametersToPrimitiveTypes,
  GetEventArgs,
} from './contract';
import type { Hash, Hex } from './misc';

export type Log<
  quantity = bigint,
  index = number,
  pending extends boolean = boolean,
  abiEvent extends AbiEvent | undefined = undefined,
  strict extends boolean | undefined = undefined,
  abi extends Abi | readonly unknown[] | undefined = abiEvent extends AbiEvent
    ? [abiEvent]
    : undefined,
  eventName extends string | undefined = abiEvent extends AbiEvent
    ? abiEvent['name']
    : undefined,
> = {
  /** The address from which this log originated */
  address: Address;
  /** Hash of block containing this log or `null` if pending */
  blockHash: pending extends true ? null : Hash;
  /** Number of block containing this log or `null` if pending */
  blockNumber: pending extends true ? null : quantity;
  /** Contains the non-indexed arguments of the log */
  data: Hex;
  /** Index of this log within its block or `null` if pending */
  logIndex: pending extends true ? null : index;
  /** Hash of the transaction that created this log or `null` if pending */
  transactionHash: pending extends true ? null : Hash;
  /** Index of the transaction that created this log or `null` if pending */
  transactionIndex: pending extends true ? null : index;
  /** `true` if this filter has been destroyed and is invalid */
  removed: boolean;
} & GetInferredLogValues<abiEvent, abi, eventName, strict>;

type Topics<
  head extends AbiEvent['inputs'],
  base = [Hex],
> = head extends readonly [
  infer _Head,
  ...infer Tail extends AbiEvent['inputs'],
]
  ? _Head extends { indexed: true }
    ? [Hex, ...Topics<Tail>]
    : Topics<Tail>
  : base;

type GetTopics<
  abiEvent extends AbiEvent | undefined = undefined,
  abi extends Abi | readonly unknown[] = [abiEvent],
  eventName extends string | undefined = abiEvent extends AbiEvent
    ? abiEvent['name']
    : undefined,
  _AbiEvent extends AbiEvent | undefined = abi extends Abi
    ? eventName extends string
      ? ExtractAbiEvent<abi, eventName>
      : undefined
    : undefined,
  _Args = _AbiEvent extends AbiEvent
    ? AbiEventParametersToPrimitiveTypes<_AbiEvent['inputs']>
    : never,
  _FailedToParseArgs =
    | ([_Args] extends [never] ? true : false)
    | (readonly unknown[] extends _Args ? true : false),
> = true extends _FailedToParseArgs
  ? [Hex, ...Hex[]] | []
  : abiEvent extends AbiEvent
  ? Topics<abiEvent['inputs']>
  : _AbiEvent extends AbiEvent
  ? Topics<_AbiEvent['inputs']>
  : [Hex, ...Hex[]] | [];

type GetInferredLogValues<
  abiEvent extends AbiEvent | undefined = undefined,
  abi extends Abi | readonly unknown[] | undefined = abiEvent extends AbiEvent
    ? [abiEvent]
    : undefined,
  eventName extends string | undefined = abiEvent extends AbiEvent
    ? abiEvent['name']
    : undefined,
  strict extends boolean | undefined = undefined,
  _EventNames extends string = abi extends Abi
    ? Abi extends abi
      ? string
      : ExtractAbiEventNames<abi>
    : string,
> = abi extends Abi
  ? eventName extends string
    ? {
        args: GetEventArgs<
          abi,
          eventName,
          {
            EnableUnion: false;
            IndexedOnly: false;
            Required: strict extends boolean ? strict : false;
          }
        >;
        /** The event name decoded from `topics`. */
        eventName: eventName;
        /** List of order-dependent topics */
        topics: GetTopics<abiEvent, abi, eventName>;
      }
    : {
        [name in _EventNames]: {
          args: GetEventArgs<
            abi,
            name,
            {
              EnableUnion: false;
              IndexedOnly: false;
              Required: strict extends boolean ? strict : false;
            }
          >;
          /** The event name decoded from `topics`. */
          eventName: name;
          /** List of order-dependent topics */
          topics: GetTopics<abiEvent, abi, name>;
        };
      }[_EventNames]
  : {
      topics: [Hex, ...Hex[]] | [];
    };
