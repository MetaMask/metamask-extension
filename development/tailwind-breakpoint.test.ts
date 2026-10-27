import resolveConfig from 'tailwindcss/resolveConfig';
import type { Config } from 'tailwindcss';
import tailwindConfig from '../tailwind.config';
import {
  getTailwindMdMinWidth,
  parseTailwindMinWidthPx,
} from './webpack/utils/tailwind-breakpoint';

describe('parseTailwindMinWidthPx', () => {
  it('reads a px string breakpoint', () => {
    expect(parseTailwindMinWidthPx('768px')).toBe(768);
  });

  it('reads the min width from an object breakpoint', () => {
    expect(parseTailwindMinWidthPx({ min: '768px', max: '1023px' })).toBe(768);
  });

  it('trims surrounding whitespace', () => {
    expect(parseTailwindMinWidthPx(' 768px ')).toBe(768);
  });

  it('throws when the screen does not define a px min width', () => {
    expect(() => parseTailwindMinWidthPx({ max: '767px' })).toThrow(
      'Tailwind screen must define a min width',
    );
    expect(() => parseTailwindMinWidthPx('48rem')).toThrow(
      'Expected a px min-width breakpoint',
    );
  });
});

describe('getTailwindMdMinWidth', () => {
  it('returns the resolved Tailwind md screen in pixels', () => {
    const { md } = resolveConfig(tailwindConfig as Config).theme.screens;

    expect(getTailwindMdMinWidth()).toBe(parseTailwindMinWidthPx(md));
  });
});
