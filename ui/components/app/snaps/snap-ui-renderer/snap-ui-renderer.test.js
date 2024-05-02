import { JSXElementStruct } from '@metamask/snaps-sdk/jsx';
import { COMPONENT_MAPPING } from './components';

describe('Snap UI mapping', () => {
  it('supports all exposed components', () => {
    const elements = JSXElementStruct.schema.map((struct) =>
      JSON.parse(struct.schema.type.type),
    );
    expect(Object.keys(COMPONENT_MAPPING).sort()).toStrictEqual(
      elements.sort(),
    );
  });
});
