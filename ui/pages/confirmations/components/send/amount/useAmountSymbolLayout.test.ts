import { getSymbolLayout } from './useAmountSymbolLayout';

describe('getSymbolLayout', () => {
  it('places the symbol one gap after the typed amount', () => {
    expect(
      getSymbolLayout({
        fieldLeft: 0,
        fieldWidth: 300,
        inputRight: 300,
        symbolWidth: 28,
        textStart: 16,
        textWidth: 40,
      }),
    ).toStrictEqual({ left: 64, paddingRight: 0 });
  });

  it('pins the symbol to the field inset when the amount would run under it', () => {
    expect(
      getSymbolLayout({
        fieldLeft: 0,
        fieldWidth: 300,
        inputRight: 300,
        symbolWidth: 28,
        textStart: 16,
        textWidth: 400,
      }),
    ).toStrictEqual({ left: 256, paddingRight: 52 });
  });
});
