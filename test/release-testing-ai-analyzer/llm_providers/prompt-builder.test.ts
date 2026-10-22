import type { FileCategories, PullRequestInfo } from '../types';
import { PromptBuilder } from './prompt-builder';

const prInfo: PullRequestInfo = {
  number: 47119,
  title: 'release: 13.54.0',
  body: '',
  author: 'metamaskbot',
  baseBranch: 'stable',
  headBranch: 'release/13.54.0',
  files: [],
  commitCount: 0,
  commits: [],
};

const fileCategories: FileCategories = {
  controllers: [],
  uiComponents: [],
  migrations: [],
  tests: [],
  config: [],
  other: [],
};

describe('PromptBuilder', () => {
  it('tells the model that NFT auto-detect is the Basic functionality toggle', () => {
    const prompt = new PromptBuilder().buildAnalysisPrompt(
      prInfo,
      fileCategories,
    );

    expect(prompt).toContain('Autodetect NFTs');
    expect(prompt).toContain('Settings → Security & privacy');
    expect(prompt).toContain(
      'Never write a step that says "turn off NFT auto-detection"',
    );
  });
});
