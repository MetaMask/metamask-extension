import { NodeType } from '@metamask/snaps-sdk';
import { COMPONENT_MAPPING } from './components';

describe('Snap UI mapping', () => {
  it('supports all exposed components', () => {
    const nodes = Object.values(NodeType);
    expect(Object.keys(COMPONENT_MAPPING).sort()).toStrictEqual(nodes.sort());
  });
});
