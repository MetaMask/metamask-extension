import { ReactInspectorAdapter } from './react-adapter';

const FIBER_KEY = '__reactFiber$abc123';
const DEBUG_SOURCE_KEY = '_debugSource';

type FiberLike = Record<string, unknown>;

function namedComponent(name: string): () => null {
  const fn = () => null;
  Object.defineProperty(fn, 'name', { value: name });
  return fn;
}

const myComponent = namedComponent('MyComponent');
const fragmentInternal = namedComponent('Fragment');

function renderFn() {
  return null;
}

function makeFiber(fields: {
  type: unknown;
  parent?: FiberLike | null;
  props?: Record<string, unknown>;
  source?: { fileName?: string; lineNumber?: number } | null;
}): FiberLike {
  const fiber: FiberLike = {
    return: fields.parent ?? null,
    type: fields.type,
    memoizedProps: fields.props ?? {},
  };
  fiber[DEBUG_SOURCE_KEY] = fields.source ?? null;
  return fiber;
}

function attachFiber(el: HTMLElement, fiber: FiberLike) {
  (el as unknown as Record<string, unknown>)[FIBER_KEY] = fiber;
}

describe('ReactInspectorAdapter', () => {
  const adapter = new ReactInspectorAdapter();
  let el: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  it('falls back to DOM-only info when the element has no fiber', () => {
    el.className = 'plain';

    const info = adapter.getComponentInfo(el);

    expect(info?.componentName).toBe('div');
    expect(info?.filePath).toBeNull();
    expect(info?.classes).toEqual(['plain']);
  });

  it('resolves the nearest named component from the fiber tree', () => {
    el.setAttribute('data-testid', 'my-component-root');
    const componentFiber = makeFiber({
      type: myComponent,
      props: { title: 'x' },
      source: { fileName: 'ui/components/my-component.tsx', lineNumber: 5 },
    });
    const hostFiber = makeFiber({
      type: 'div',
      parent: componentFiber,
      source: { fileName: 'ui/components/foo.tsx', lineNumber: 12 },
    });
    attachFiber(el, hostFiber);

    const info = adapter.getComponentInfo(el);

    expect(info?.componentName).toBe('MyComponent');
    expect(info?.filePath).toBe('ui/components/my-component.tsx');
    expect(info?.lineNumber).toBe(5);
    expect(info?.props).toEqual({ title: '"x"' });
    expect(info?.testId).toBe('my-component-root');
  });

  it('picks the testId from the closest ancestor when the element has none', () => {
    const parent = document.createElement('section');
    parent.setAttribute('data-testid', 'parent-test-id');
    parent.appendChild(el);
    document.body.appendChild(parent);
    attachFiber(
      el,
      makeFiber({ type: 'div', parent: makeFiber({ type: myComponent }) }),
    );

    const info = adapter.getComponentInfo(el);

    expect(info?.testId).toBe('parent-test-id');
  });

  it('skips React internals in favor of an ancestor named component', () => {
    const grandparent = makeFiber({
      type: myComponent,
      source: { fileName: 'ui/components/my-component.tsx', lineNumber: 5 },
    });
    const fragmentFiber = makeFiber({
      type: fragmentInternal,
      parent: grandparent,
    });
    const hostFiber = makeFiber({ type: 'div', parent: fragmentFiber });
    attachFiber(el, hostFiber);

    const info = adapter.getComponentInfo(el);

    expect(info?.componentName).toBe('MyComponent');
    expect(info?.filePath).toBe('ui/components/my-component.tsx');
  });

  it('reads the displayName from object component types', () => {
    const styledFiber = makeFiber({
      type: { displayName: 'Styled(Button)' },
    });
    attachFiber(el, makeFiber({ type: 'div', parent: styledFiber }));

    const info = adapter.getComponentInfo(el);

    expect(info?.componentName).toBe('Styled(Button)');
  });

  it('reads the render function name from forwardRef-like types', () => {
    const forwardRefFiber = makeFiber({ type: { render: renderFn } });
    attachFiber(el, makeFiber({ type: 'div', parent: forwardRefFiber }));

    const info = adapter.getComponentInfo(el);

    expect(info?.componentName).toBe('renderFn');
  });

  it('falls back to the tag name when no fiber in the chain is named', () => {
    const anonymousParent = makeFiber({ type: 'span' });
    const hostFiber = makeFiber({
      type: 'div',
      parent: anonymousParent,
      source: { fileName: 'ui/components/foo.tsx', lineNumber: 12 },
    });
    attachFiber(el, hostFiber);

    const info = adapter.getComponentInfo(el);

    expect(info?.componentName).toBe('div');
    expect(info?.filePath).toBe('ui/components/foo.tsx');
    expect(info?.lineNumber).toBe(12);
    expect(info?.props).toEqual({});
  });

  it('exposes callable activation no-ops', () => {
    expect(() => adapter.onActivate()).not.toThrow();
    expect(() => adapter.onDeactivate()).not.toThrow();
  });
});
