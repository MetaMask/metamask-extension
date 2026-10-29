import resolverAbi from './resolver';

describe('ENS resolver contract ABI', () => {
  it('exports a non-empty ABI', () => {
    expect(resolverAbi.length).toBeGreaterThan(0);
  });

  it('includes standard public resolver functions', () => {
    const functionNames = resolverAbi
      .filter((entry) => entry.type === 'function')
      .map((entry) => entry.name);

    expect(functionNames).toContain('contenthash');
    expect(functionNames).toContain('text');
    expect(functionNames).toContain('addr');
  });
});
