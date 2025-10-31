import { expect, test } from 'tstyche';
import { FlattenedBackgroundStateProxy } from './background';

test('FlattenedBackgroundStateProxy', () => {
  expect<FlattenedBackgroundStateProxy>().type.not.toBe<never>();
});
