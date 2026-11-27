const polyfills = [
  {
    isSupported: () => 'interestForElement' in HTMLButtonElement.prototype,
    load: () => import('interestfor'),
  },
];

export async function loadPolyfills() {
  await Promise.allSettled(
    polyfills
      .filter(({ isSupported }) => !isSupported())
      .map(({ load }) => load()),
  );
}
