const { brandColor } = require('@metamask/design-tokens');
const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    // eslint-disable-next-line n/global-require
    require('@metamask/design-system-tailwind-preset'),
  ],
  content: [
    './ui/**/*.{js,jsx,ts,tsx}',
    // Ensures tailwind classnames are generated for design system components
    './node_modules/@metamask/design-system-react/**/*.{mjs,cjs}',
    // Required from @metamask/design-system-react@0.17.0+ (shared typography types)
    './node_modules/@metamask/design-system-shared/**/*.{mjs,cjs}',
  ],
  theme: {
    // Keep essential semantic colors, remove default palette colors. We want to rely on the colors provided by @metamask/design-system-tailwind-preset
    colors: {
      inherit: 'inherit',
      current: 'currentColor',
      transparent: 'transparent',
      black: brandColor.black,
      white: brandColor.white,
    },
    fontSize: {}, // This removes all default Tailwind font sizes. We want to rely on the design system font sizes and enforce use of the Text component
    extend: {},
  },
  plugins: [
    plugin(({ addVariant, addUtilities, addBase }) => {
      addVariant('@compact', '@container list-item (max-width: 399px)');
      // TODO: Remove these polyfills once we update to Tailwind v4
      addVariant('starting', '@starting-style');
      addUtilities({
        '.transition-discrete': {
          'transition-behavior': 'allow-discrete',
        },
      });
      addBase({
        '@keyframes slide-in-from-right': {
          from: { translate: '100% 0' },
          to: { translate: '0 0' },
        },
      });
    }),
  ],
};
