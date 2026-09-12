import { colorForClass, tintForClass } from './colors';

describe('page-object inspector colors', () => {
  it('returns a stable hsl colour for a class name', () => {
    expect(colorForClass('HomePage')).toStrictEqual(colorForClass('HomePage'));
    expect(colorForClass('HomePage')).toMatch(/^hsl\(\d+ 75% 45%\)$/u);
  });

  it('returns a translucent tint from the same hue', () => {
    const solid = colorForClass('SendPage');
    const tint = tintForClass('SendPage');
    const hue = solid.match(/^hsl\((\d+) /u)?.[1];

    expect(hue).toBeDefined();
    expect(tint).toBe(`hsl(${hue} 75% 50% / 0.1)`);
  });

  it('spreads neighbouring class names onto different hues', () => {
    expect(colorForClass('HomePage')).not.toBe(colorForClass('HomePage2'));
  });
});
