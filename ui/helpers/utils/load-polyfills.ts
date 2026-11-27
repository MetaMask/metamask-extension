const polyfills = [
  {
    name: 'interestfor',
    isSupported: () => 'interestForElement' in HTMLButtonElement.prototype,
    load: () => import('interestfor'),
  },
];

export async function loadPolyfills() {
  console.info('[polyfill] loadPolyfills called');

  const toLoad = polyfills.filter(({ isSupported, name }) => {
    const supported = isSupported();
    const dataCheck = '__interestForData' in document;
    console.info(`[polyfill] ${name} isSupported BEFORE load:`, supported);
    console.info(
      `[polyfill] ${name} __interestForData BEFORE load:`,
      dataCheck,
    );
    return !supported;
  });

  console.info(
    '[polyfill] polyfills to load:',
    toLoad.map((p) => p.name),
  );

  const results = await Promise.allSettled(toLoad.map(({ load }) => load()));

  results.forEach((result, index) => {
    const { name } = toLoad[index];
    if (result.status === 'rejected') {
      console.error(`[polyfill] ${name} FAILED:`, result.reason);
    } else {
      console.info(`[polyfill] ${name} loaded successfully`);
    }
  });

  polyfills.forEach(({ name, isSupported }) => {
    const supported = isSupported();
    const dataCheck = '__interestForData' in document;
    console.info(`[polyfill] ${name} isSupported AFTER load:`, supported);
    console.info(`[polyfill] ${name} __interestForData AFTER load:`, dataCheck);
  });
}
