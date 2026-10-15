import type { ComponentInfo, ChangesetEntry } from './types';

export function formatAgentPrompt(
  info: ComponentInfo,
  changeset: ChangesetEntry[],
  message: string,
): string {
  const lines: string[] = ['=== DESIGNER MODE REQUEST ===', ''];

  lines.push('Selected Element');
  lines.push(`  Component : ${info.componentName}`);
  if (info.filePath) {
    lines.push(
      `  File      : ${info.filePath}${info.lineNumber ? `:${info.lineNumber}` : ''}`,
    );
  }
  if (info.testId) {
    lines.push(`  Test ID   : ${info.testId}`);
  }
  if (info.classes.length) {
    lines.push(`  Classes   : ${info.classes.join(' ')}`);
  }
  if (info.domPath) {
    lines.push(`  DOM Path  : ${info.domPath}`);
  }
  lines.push('');

  if (info.props && Object.keys(info.props).length > 0) {
    lines.push('Props');
    for (const [k, v] of Object.entries(info.props)) {
      lines.push(`  ${k.padEnd(12)}: ${v}`);
    }
    lines.push('');
  }

  const styleGroups: [string, Record<string, string>][] = [
    ['Layout', info.computedStyles.layout],
    ['Typography', info.computedStyles.typography],
    ['Color', info.computedStyles.color],
    ['Spacing', info.computedStyles.spacing],
    ['Borders', info.computedStyles.border],
    ['Effects', info.computedStyles.effects],
  ];

  for (const [title, styles] of styleGroups) {
    const entries = Object.entries(styles).filter(([, v]) => v);
    if (!entries.length) {
      continue;
    }
    lines.push(title);
    for (const [k, v] of entries) {
      lines.push(`  ${k.padEnd(20)}: ${v}`);
    }
    lines.push('');
  }

  if (changeset.length > 0) {
    lines.push('Changeset (inline edits made by designer)');
    for (const e of changeset) {
      lines.push(`  ${e.property.padEnd(20)}: ${e.original} → ${e.current}`);
    }
    lines.push('');
  }

  // When the designer edited the text inline, the changeset already carries
  // `__textContent: old → new`; printing the original here as well would
  // contradict it.
  const textEdited = changeset.some((e) => e.property === '__textContent');
  if (info.textContent && !textEdited) {
    lines.push('Text Content');
    lines.push(`  "${info.textContent}"`);
    lines.push('');
  }

  if (message) {
    lines.push('Designer Message');
    lines.push(`  "${message}"`);
    lines.push('');
  }

  lines.push('=== END ===');
  return lines.join('\n');
}

export function formatForClipboard(
  info: ComponentInfo,
  changeset: ChangesetEntry[] = [],
): string {
  return formatAgentPrompt(info, changeset, '');
}
