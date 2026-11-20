import log from 'loglevel';

export async function loadInterestForPolyfill() {
  if ('interestForElement' in HTMLButtonElement.prototype) {
    return;
  }

  try {
    await import('interestfor');
  } catch (error) {
    log.error('Failed to load interestfor polyfill', error);
  }
}
