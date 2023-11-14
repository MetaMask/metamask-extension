import { NodeType } from '@metamask/snaps-sdk';
import { UI_MAPPING } from './snap-ui-renderer';

describe('Snap UI mapping', () => {
  it('supports all exposed components', () => {
    const nodes = Object.values(NodeType);
    expect(Object.keys(UI_MAPPING).sort()).toStrictEqual(nodes.sort());
  });
});
