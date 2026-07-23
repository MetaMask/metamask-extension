'use strict';

const { RuleTester } = require('eslint');
const { parser: tsParser } = require('typescript-eslint');
const rule = require('./page-object-member-order');

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

ruleTester.run('page-object-member-order', rule, {
  valid: [
    {
      name: 'selectors (constant and arrow-function), constructor, then alphabetical actions',
      code: `
class Page {
  private readonly aButton = '[data-testid="a"]';

  private readonly bLabel = { xpath: '//b' };

  private readonly rowValue = (i: number) => ({ css: \`row:\${i}\` });

  private readonly statusLabel = (s: string) => ({ testId: s });

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickThing(): Promise<void> {}

  async waitForThing(): Promise<void> {}
}`,
    },
    {
      name: 'arrow-function selector may appear among constant selectors',
      code: `
class Page {
  private readonly aButton = '[data-testid="a"]';

  private readonly bRow = (i: number) => ({ css: \`row:\${i}\` });

  private readonly cButton = '[data-testid="c"]';

  async clickThing(): Promise<void> {}
}`,
    },
    {
      name: 'class with only selectors',
      code: `
class Page {
  private readonly aButton = '[data-testid="a"]';

  private readonly bButton = '[data-testid="b"]';
}`,
    },
    {
      name: 'handles private-identifier and string-literal keys and ignores members without a resolvable name (static blocks, computed keys)',
      code: `
class Page {
  static {}

  readonly #secret = '[data-testid="s"]';

  private readonly 'data-role' = '[data-testid="r"]';

  [computed.key]() {}

  async doThing(): Promise<void> {}
}`,
    },
  ],
  invalid: [
    {
      name: 'action method declared before a selector',
      code: `
class Page {
  private readonly aButton = '[data-testid="a"]';

  async clickThing(): Promise<void> {}

  private readonly bButton = '[data-testid="b"]';
}`,
      errors: [{ messageId: 'groupOrder' }],
    },
    {
      name: 'arrow-function selector declared after an action method is still a misplaced selector',
      code: `
class Page {
  private readonly aButton = '[data-testid="a"]';

  async clickThing(): Promise<void> {}

  private readonly rowValue = (i: number) => ({ css: \`row:\${i}\` });
}`,
      errors: [{ messageId: 'groupOrder' }],
    },
    {
      name: 'selector declared after the constructor',
      code: `
class Page {
  private readonly aButton = '[data-testid="a"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly bButton = '[data-testid="b"]';
}`,
      errors: [{ messageId: 'groupOrder' }],
    },
    {
      name: 'selectors out of alphabetical order',
      code: `
class Page {
  private readonly zebra = '[data-testid="z"]';

  private readonly apple = '[data-testid="a"]';
}`,
      errors: [{ messageId: 'alphabetical' }],
    },
    {
      name: 'action methods out of alphabetical order',
      code: `
class Page {
  private readonly aButton = '[data-testid="a"]';

  async waitForThing(): Promise<void> {}

  async clickThing(): Promise<void> {}
}`,
      errors: [{ messageId: 'alphabetical' }],
    },
  ],
});
