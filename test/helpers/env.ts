import { env } from 'process';

type HeadlessCapableServiceName = 'SELENIUM' | 'PLAYWRIGHT';

export function isHeadless(serviceName: HeadlessCapableServiceName): boolean {
  if (serviceName) {
    const serviceKey = `${serviceName}_HEADLESS`;
    if (env[serviceKey]) {
      return parseBoolean(env[serviceKey]);
    }
  }
  return Boolean(env.HEADLESS) && parseBoolean(env.HEADLESS);
}

export function parseBoolean(value: undefined | string): boolean {
  if (!value) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Not-a-Boolean: '${value}'`);
  }
  switch (value.toLowerCase().trim()) {
    case 'false':
    case '0':
    case '':
      return false;
    case 'true':
    case '1':
      return true;
    default:
      throw new Error(`Not-a-Boolean: '${value}'`);
  }
}
