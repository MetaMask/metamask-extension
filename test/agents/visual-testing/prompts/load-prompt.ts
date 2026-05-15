import fs from 'node:fs';
import path from 'node:path';
import { SKILL_MD_PATH } from '../constants';

export function loadSystemPrompt(extensionCwd: string): string {
  const systemMdPath = path.join(__dirname, 'system.md');
  const systemMd = fs.readFileSync(systemMdPath, 'utf-8');

  const skillPath = path.join(extensionCwd, SKILL_MD_PATH);
  let skillReference = '';
  if (fs.existsSync(skillPath)) {
    skillReference = [
      '',
      '## Tool reference',
      '',
      'For detailed command reference, error codes, and workflows, refer to the',
      'metamask-visual-testing skill documentation available in the repository.',
    ].join('\n');
  }

  return `${systemMd}${skillReference}`;
}

export function composeTaskPrompt(taskPrompt: string): string {
  return ['## Your task', '', taskPrompt].join('\n');
}
