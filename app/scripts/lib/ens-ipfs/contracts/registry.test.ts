import ensRegistryAbi from './registry';

describe('ens-registry ABI', () => {
  it('exports a non-empty fragment list', () => {
    expect(Array.isArray(ensRegistryAbi)).toBe(true);
    expect(ensRegistryAbi.length).toBe(11);
  });

  it('includes functions and events used with the ENS registry contract', () => {
    const names = ensRegistryAbi.map(
      (fragment: { name?: string }) => fragment.name,
    );
    expect(names).toContain('resolver');
    expect(names).toContain('owner');
    expect(names).toContain('setSubnodeOwner');
    expect(names).toContain('setTTL');
    expect(names).toContain('ttl');
    expect(names).toContain('setResolver');
    expect(names).toContain('setOwner');
    expect(names).toContain('Transfer');
    expect(names).toContain('NewOwner');
    expect(names).toContain('NewResolver');
    expect(names).toContain('NewTTL');
  });
});
