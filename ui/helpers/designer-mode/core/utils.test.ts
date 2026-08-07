import {
  buildComponentInfo,
  buildDomPath,
  extractComponentNameFromPath,
  extractComputedStyles,
  getDirectTextContent,
  serializeProps,
} from './utils';

describe('extractComponentNameFromPath', () => {
  it('returns null for missing paths', () => {
    expect(extractComponentNameFromPath(null)).toBeNull();
    expect(extractComponentNameFromPath(undefined)).toBeNull();
    expect(extractComponentNameFromPath('')).toBeNull();
  });

  it('strips the directory and framework extension', () => {
    expect(
      extractComponentNameFromPath('ui/components/app/name-display.tsx'),
    ).toBe('name-display');
    expect(extractComponentNameFromPath('src/Button.jsx')).toBe('Button');
  });
});

describe('getDirectTextContent', () => {
  it('joins only the direct text nodes, ignoring child elements', () => {
    const el = document.createElement('div');
    el.appendChild(document.createTextNode('  Hello '));
    const child = document.createElement('span');
    child.textContent = 'nested';
    el.appendChild(child);
    el.appendChild(document.createTextNode(' world '));

    expect(getDirectTextContent(el)).toBe('Hello world');
  });

  it('returns null when there is no direct text', () => {
    const el = document.createElement('div');
    const child = document.createElement('span');
    child.textContent = 'nested only';
    el.appendChild(child);

    expect(getDirectTextContent(el)).toBeNull();
  });
});

describe('buildDomPath', () => {
  it('stops at the nearest id and includes up to two classes per node', () => {
    const parent = document.createElement('div');
    parent.id = 'anchor';
    const el = document.createElement('button');
    el.className = 'one two three';
    parent.appendChild(el);
    document.body.appendChild(parent);

    expect(buildDomPath(el)).toBe('#anchor > button.one.two');

    parent.remove();
  });

  it('adds nth-of-type when same-tag siblings exist', () => {
    const parent = document.createElement('ul');
    const first = document.createElement('li');
    const second = document.createElement('li');
    parent.appendChild(first);
    parent.appendChild(second);
    document.body.appendChild(parent);

    expect(buildDomPath(second)).toContain('li:nth-of-type(2)');

    parent.remove();
  });

  it('uses type-relative indexes in mixed markup so the selector matches', () => {
    const parent = document.createElement('div');
    const heading = document.createElement('h2');
    const first = document.createElement('p');
    const second = document.createElement('p');
    parent.appendChild(heading); // occupies :nth-child(1)
    parent.appendChild(first);
    parent.appendChild(second);
    document.body.appendChild(parent);

    const path = buildDomPath(second);

    expect(path).toContain('p:nth-of-type(2)');
    expect(parent.querySelector('p:nth-of-type(2)')).toBe(second);

    parent.remove();
  });
});

describe('serializeProps', () => {
  it('filters children and internal props and stringifies values by type', () => {
    const onClick = () => null;
    const props: Record<string, unknown> = {
      children: 'ignored',
      label: 'Send',
      count: 3,
      enabled: true,
      onClick,
      items: [1, 2, 3],
      style: { color: 'red' },
      missing: undefined,
    };
    const internalKey = '__internal';
    props[internalKey] = 'ignored';

    const result = serializeProps(props);

    expect(result.children).toBeUndefined();
    expect(result[internalKey]).toBeUndefined();
    expect(result.label).toBe('"Send"');
    expect(result.count).toBe('3');
    expect(result.enabled).toBe('true');
    expect(result.onClick).toBe('fn:onClick');
    expect(result.items).toBe('Array(3)');
    expect(result.style).toBe('{"color":"red"}');
    expect(result.missing).toBe('undefined');
  });

  it('caps the serialized props at 20 entries', () => {
    const props = Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [`prop${i}`, i]),
    );

    expect(Object.keys(serializeProps(props))).toHaveLength(20);
  });
});

describe('buildComponentInfo', () => {
  it('collects classes, test id and direct text from the element', () => {
    const el = document.createElement('button');
    el.className = 'btn primary';
    el.setAttribute('data-testid', 'send-button');
    el.appendChild(document.createTextNode('Send'));
    document.body.appendChild(el);

    const info = buildComponentInfo(el, { componentName: 'SendButton' });

    expect(info.componentName).toBe('SendButton');
    expect(info.classes).toEqual(['btn', 'primary']);
    expect(info.testId).toBe('send-button');
    expect(info.textContent).toBe('Send');
    expect(info.filePath).toBeNull();

    el.remove();
  });

  it('prefers an explicitly passed testId over the DOM attribute', () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'from-dom');

    const info = buildComponentInfo(el, {
      componentName: 'X',
      testId: 'explicit',
    });

    expect(info.testId).toBe('explicit');
  });
});

describe('extractComputedStyles', () => {
  it('always includes the core layout props and groups the rest', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const snapshot = extractComputedStyles(el);

    expect(Object.keys(snapshot.layout)).toEqual(
      expect.arrayContaining(['display', 'position', 'width', 'height']),
    );
    expect(snapshot).toHaveProperty('typography');
    expect(snapshot).toHaveProperty('spacing');
    expect(snapshot).toHaveProperty('effects');

    el.remove();
  });
});
