import {
  isPortMessageBatch,
  packPortMessages,
  unpackPortMessage,
} from './port-message-batch';

describe('port message batch', () => {
  it('unpacks a batch in order', () => {
    expect(unpackPortMessage([{ a: 1 }, { a: 2 }, { a: 3 }])).toStrictEqual([
      { a: 1 },
      { a: 2 },
      { a: 3 },
    ]);
  });

  it('passes a non-array through as one message', () => {
    expect(unpackPortMessage({ data: { method: 'ALIVE' } })).toStrictEqual([
      { data: { method: 'ALIVE' } },
    ]);
    expect(unpackPortMessage(undefined)).toStrictEqual([undefined]);
  });

  it('packs one message unwrapped and several as an array', () => {
    expect(packPortMessages([{ a: 1 }])).toStrictEqual({ a: 1 });
    expect(packPortMessages([{ a: 1 }, { a: 2 }])).toStrictEqual([
      { a: 1 },
      { a: 2 },
    ]);
  });

  it('wraps a lone array so unpacking returns it intact', () => {
    const packed = packPortMessages([[1, 2]]);

    expect(isPortMessageBatch(packed)).toBe(true);
    expect(unpackPortMessage(packed)).toStrictEqual([[1, 2]]);
  });
});
