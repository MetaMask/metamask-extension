import { formatAgentPrompt, formatForClipboard } from './prompt';
import type { ComponentInfo, ChangesetEntry } from './types';

const buildInfo = (overrides: Partial<ComponentInfo> = {}): ComponentInfo => ({
  componentName: 'AccountListItem',
  filePath: 'ui/components/multichain/account-list-item/account-list-item.tsx',
  lineNumber: 42,
  props: { size: '"lg"' },
  testId: 'account-list-item',
  classes: ['box', 'box--display-flex'],
  computedStyles: {
    layout: { display: 'flex', width: '100px' },
    typography: { 'font-size': '14px' },
    color: { color: 'rgb(0, 0, 0)' },
    spacing: {},
    border: {},
    effects: {},
  },
  layoutRect: { x: 0, y: 0, width: 100, height: 50 } as DOMRectReadOnly,
  textContent: 'Account 1',
  domPath: 'div#root > div.box',
  ...overrides,
});

describe('formatAgentPrompt', () => {
  it('wraps the prompt in the request envelope', () => {
    const prompt = formatAgentPrompt(buildInfo(), [], '');

    expect(prompt.startsWith('=== DESIGNER MODE REQUEST ===')).toBe(true);
    expect(prompt.endsWith('=== END ===')).toBe(true);
  });

  it('includes component name, file path with line number, test id and classes', () => {
    const prompt = formatAgentPrompt(buildInfo(), [], '');

    expect(prompt).toContain('Component : AccountListItem');
    expect(prompt).toContain(
      'ui/components/multichain/account-list-item/account-list-item.tsx:42',
    );
    expect(prompt).toContain('Test ID   : account-list-item');
    expect(prompt).toContain('box box--display-flex');
  });

  it('includes non-empty computed style groups and omits empty ones', () => {
    const prompt = formatAgentPrompt(buildInfo(), [], '');

    expect(prompt).toContain('Layout');
    expect(prompt).toContain('display');
    expect(prompt).not.toContain('Spacing');
  });

  it('includes the changeset with original and current values', () => {
    const changeset: ChangesetEntry[] = [
      { property: 'color', original: 'rgb(0, 0, 0)', current: '#ff0000' },
    ];

    const prompt = formatAgentPrompt(buildInfo(), changeset, '');

    expect(prompt).toContain('Changeset (inline edits made by designer)');
    expect(prompt).toContain('rgb(0, 0, 0) → #ff0000');
  });

  it('includes the designer message when provided', () => {
    const prompt = formatAgentPrompt(buildInfo(), [], 'Make it red');

    expect(prompt).toContain('Designer Message');
    expect(prompt).toContain('"Make it red"');
  });

  it('prints the original text content when it was not edited', () => {
    const prompt = formatAgentPrompt(buildInfo(), [], '');

    expect(prompt).toContain('Text Content');
    expect(prompt).toContain('"Account 1"');
  });

  it('omits the static text content block when the changeset already carries a text edit', () => {
    const changeset: ChangesetEntry[] = [
      { property: '__textContent', original: 'Account 1', current: 'Wallet' },
    ];

    const prompt = formatAgentPrompt(buildInfo(), changeset, '');

    expect(prompt).not.toContain('Text Content');
    expect(prompt).toContain('Account 1 → Wallet');
  });
});

describe('formatForClipboard', () => {
  it('matches formatAgentPrompt with an empty message', () => {
    const info = buildInfo();
    const changeset: ChangesetEntry[] = [
      { property: 'gap', original: '4px', current: '8px' },
    ];

    expect(formatForClipboard(info, changeset)).toBe(
      formatAgentPrompt(info, changeset, ''),
    );
  });
});
