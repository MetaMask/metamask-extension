import { JSXElementStruct } from '@metamask/snaps-sdk/jsx';
import { COMPONENT_MAPPING } from './components';

const EXCLUDED_COMPONENTS = ['Option', 'Radio', 'SelectorOption'];

describe('Snap UI mapping', () => {
  it('supports all exposed components', () => {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elements = (JSXElementStruct.schema as unknown as any[])
      .map((struct) => JSON.parse(struct.schema.type.type))
      .filter((key) => !EXCLUDED_COMPONENTS.includes(key));
    expect(Object.keys(COMPONENT_MAPPING).sort()).toStrictEqual(
      elements.sort(),
    );
  });
});
