import { classifyNesting, expectNested, type SpanWindow } from './span-nesting';

/* eslint-disable @typescript-eslint/naming-convention */
const parent: SpanWindow = {
  span_id: 'p',
  start_timestamp: 1000,
  timestamp: 1010,
};
const child = (overrides: Partial<SpanWindow>): SpanWindow => ({
  span_id: 'c',
  parent_span_id: 'p',
  start_timestamp: 1001,
  timestamp: 1002,
  ...overrides,
});

describe('span nesting assertion', () => {
  it('accepts a child inside its parent window', () => {
    expect(() => expectNested(child({}), parent)).not.toThrow();
  });

  // Negative control: the parent id resolves, so a parent-resolution check
  // passes, but the child starts 318 s after the parent ended.
  it('fails a child whose parent id resolves but starts after the parent ended', () => {
    const late = child({ start_timestamp: 1328, timestamp: 1329 });
    expect(late.parent_span_id).toBe(parent.span_id);
    expect(classifyNesting(late, parent)).toBe('graft');
    expect(() => expectNested(late, parent)).toThrow(/got graft/u);
  });

  it('fails a child that starts before its parent', () => {
    expect(classifyNesting(child({ start_timestamp: 990 }), parent)).toBe(
      'graft',
    );
  });

  it('fails a child that ends after its parent unless allowed', () => {
    const outlives = child({ timestamp: 1020 });
    expect(classifyNesting(outlives, parent)).toBe('graft');
    expect(
      classifyNesting(outlives, parent, { childMayOutliveParent: true }),
    ).toBe('nested');
  });

  it('still fails a late start when the child may outlive the parent', () => {
    const late = child({ start_timestamp: 1328, timestamp: 1329 });
    expect(classifyNesting(late, parent, { childMayOutliveParent: true })).toBe(
      'graft',
    );
  });

  it('allows the stated tolerance at the edges and no more', () => {
    expect(classifyNesting(child({ start_timestamp: 999.96 }), parent)).toBe(
      'nested',
    );
    expect(classifyNesting(child({ start_timestamp: 999.9 }), parent)).toBe(
      'graft',
    );
    expect(
      classifyNesting(child({ start_timestamp: 999.9 }), parent, {
        toleranceSeconds: 0.2,
      }),
    ).toBe('nested');
  });

  it('treats a running parent as open-ended', () => {
    expect(
      classifyNesting(child({}), { span_id: 'p', start_timestamp: 1000 }),
    ).toBe('nested');
  });

  it('reports an orphan when the parent is absent or the ids differ', () => {
    expect(classifyNesting(child({}), undefined)).toBe('orphan');
    expect(classifyNesting(child({ parent_span_id: 'other' }), parent)).toBe(
      'orphan',
    );
    expect(classifyNesting(child({ parent_span_id: undefined }), parent)).toBe(
      'orphan',
    );
  });
});
