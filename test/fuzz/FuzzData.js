import { FuzzedDataProvider } from '@jazzer.js/core';

export default class FuzzData {
  test() {
    const a = this.data.consumeBigIntegral(4);
    return a;
  }
}
