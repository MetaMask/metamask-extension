/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './ui/**/*.{js,jsx,ts,tsx}',
    './node_modules/@metamask/design-system-react/**/*.{cjs,mjs}',
  ],
  presets: [
    // eslint-disable-next-line node/global-require
    require('@metamask/design-system-tailwind-preset'),
  ],
  theme: {
    colors: {}, // This removes all default Tailwind colors. We want to rely on the colors provided by @metamask/design-system-tailwind-preset
    extend: {},
  },
  plugins: [],
};
