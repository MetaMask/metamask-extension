import { extractFromSource } from './extract';

describe('extractFromSource', () => {
  it('extracts a plain string selector declared on a class', () => {
    const result = extractFromSource({
      relativePath: 'pages/network-manager.ts',
      sourceText: `
        class NetworkManager {
          private readonly networkManagerToggle = '[data-testid="sort-by-networks"]';
        }
      `,
    });

    expect(result.pageObjects).toStrictEqual([
      {
        className: 'NetworkManager',
        relativePath: 'pages/network-manager.ts',
        extendsClass: null,
        selectors: [
          {
            id: 'NetworkManager.networkManagerToggle',
            kind: 'css',
            value: '[data-testid="sort-by-networks"]',
            propertyName: 'networkManagerToggle',
            line: 3,
            isDynamic: false,
          },
        ],
      },
    ]);
  });

  describe('RawLocator object shapes', () => {
    function selectorsFor(classBody: string) {
      return extractFromSource({
        relativePath: 'pages/example.ts',
        sourceText: `class Example {\n${classBody}\n}`,
      }).pageObjects[0].selectors;
    }

    it('extracts a testId locator', () => {
      expect(
        selectorsFor(`  private readonly loading = { testId: 'import-tokens-loading' };`),
      ).toStrictEqual([
        {
          id: 'Example.loading',
          kind: 'testId',
          value: 'import-tokens-loading',
          propertyName: 'loading',
          line: 2,
          isDynamic: false,
        },
      ]);
    });

    it('extracts a tag and text locator, keeping tag and text separate', () => {
      expect(
        selectorsFor(`  private readonly title = { text: 'Token imported', tag: 'h6' };`),
      ).toStrictEqual([
        {
          id: 'Example.title',
          kind: 'tagText',
          value: 'h6',
          text: 'Token imported',
          propertyName: 'title',
          line: 2,
          isDynamic: false,
        },
      ]);
    });

    it('extracts a css and text locator regardless of key order', () => {
      const cssFirst = selectorsFor(
        `  private readonly label = { css: '.mm-label', text: 'Token symbol' };`,
      );
      const textFirst = selectorsFor(
        `  private readonly label = { text: 'Token symbol', css: '.mm-label' };`,
      );

      expect(cssFirst).toStrictEqual([
        {
          id: 'Example.label',
          kind: 'cssText',
          value: '.mm-label',
          text: 'Token symbol',
          propertyName: 'label',
          line: 2,
          isDynamic: false,
        },
      ]);
      expect(textFirst).toStrictEqual(cssFirst);
    });

    it('extracts a text-only locator', () => {
      expect(
        selectorsFor(`  private readonly note = { text: 'Continue' };`),
      ).toStrictEqual([
        {
          id: 'Example.note',
          kind: 'text',
          text: 'Continue',
          propertyName: 'note',
          line: 2,
          isDynamic: false,
        },
      ]);
    });

    it('extracts an xpath locator', () => {
      expect(
        selectorsFor(`  private readonly toggle = { xpath: '//label[@id="x"]' };`),
      ).toStrictEqual([
        {
          id: 'Example.toggle',
          kind: 'xpath',
          value: '//label[@id="x"]',
          propertyName: 'toggle',
          line: 2,
          isDynamic: false,
        },
      ]);
    });

    it('treats a css-only object as a plain css locator', () => {
      expect(
        selectorsFor(`  private readonly panel = { css: '.panel' };`),
      ).toStrictEqual([
        {
          id: 'Example.panel',
          kind: 'css',
          value: '.panel',
          propertyName: 'panel',
          line: 2,
          isDynamic: false,
        },
      ]);
    });

    it('ignores properties that are not locators', () => {
      expect(selectorsFor(`  private readonly retries = 3;`)).toStrictEqual([]);
    });

    it('keeps a non-literal text as an expression rather than dropping it', () => {
      expect(
        selectorsFor(
          `  private readonly section = { css: 'p', text: tEn('interactingWith') };`,
        ),
      ).toStrictEqual([
        {
          id: 'Example.section',
          kind: 'cssText',
          value: 'p',
          textExpression: "tEn('interactingWith')",
          propertyName: 'section',
          line: 2,
          isDynamic: true,
        },
      ]);
    });

    it('keeps selectors distinct when only their non-literal text differs', () => {
      const selectors = selectorsFor(
        `  private readonly a = { css: 'p', text: tEn('one') };\n` +
          `  private readonly b = { css: 'p', text: tEn('two') };`,
      );

      expect(selectors[0].textExpression).not.toBe(selectors[1].textExpression);
    });
  });

  describe('dynamic selectors', () => {
    function extract(classBody: string) {
      return extractFromSource({
        relativePath: 'pages/example.ts',
        sourceText: `class Example {\n${classBody}\n}`,
      });
    }

    it('extracts a template literal selector as literal chunks and parameters', () => {
      const { pageObjects } = extract(
        `  private readonly item = (networkName: string) =>
    \`[data-testid="network-list-item-\${networkName}"]\`;`,
      );

      expect(pageObjects[0].selectors).toStrictEqual([
        {
          id: 'Example.item',
          kind: 'css',
          chunks: ['[data-testid="network-list-item-', '"]'],
          params: ['networkName'],
          propertyName: 'item',
          line: 2,
          isDynamic: true,
        },
      ]);
    });

    it('rejects a pattern whose hole spans an entire attribute value', () => {
      const { pageObjects, unresolved } = extract(
        `  private readonly any = (networkName: string) =>
    \`[data-testid="\${networkName}"]\`;`,
      );

      expect(pageObjects[0].selectors).toStrictEqual([]);
      expect(unresolved).toStrictEqual([
        {
          relativePath: 'pages/example.ts',
          className: 'Example',
          propertyName: 'any',
          line: 2,
          reason: 'unanchored-pattern',
        },
      ]);
    });

    it('accepts a hole filling one attribute when another attribute anchors it', () => {
      const { pageObjects, unresolved } = extract(
        `  private readonly amount = (amount: string) =>
    \`[data-testid="to-amount"][value="\${amount}"]\`;`,
      );

      expect(unresolved).toStrictEqual([]);
      expect(pageObjects[0].selectors[0]).toMatchObject({
        chunks: ['[data-testid="to-amount"][value="', '"]'],
        params: ['amount'],
        isDynamic: true,
      });
    });

    it('accepts a hole anchored by a leading class selector', () => {
      const { unresolved } = extract(
        `  private readonly item = (name: string) =>
    \`.network-list-item--selected [data-testid="\${name}"]\`;`,
      );

      expect(unresolved).toStrictEqual([]);
    });

    it('resolves a this-reference to another selector on the same class', () => {
      const { pageObjects, unresolved } = extract(
        `  private readonly address = '[data-testid="address"]';\n` +
          '  private readonly byText = (text: string) => ({\n' +
          '    css: this.address,\n' +
          `    text: 'Etherscan',\n` +
          '  });',
      );

      expect(unresolved).toStrictEqual([]);
      expect(pageObjects[0].selectors[1]).toStrictEqual({
        id: 'Example.byText',
        kind: 'cssText',
        value: '[data-testid="address"]',
        text: 'Etherscan',
        propertyName: 'byText',
        line: 3,
        isDynamic: false,
      });
    });

    it('resolves a this-reference declared after the selector that uses it', () => {
      const { unresolved } = extract(
        '  private readonly byText = (text: string) => ({\n' +
          '    css: this.address,\n' +
          `    text: 'Etherscan',\n` +
          '  });\n' +
          `  private readonly address = '[data-testid="address"]';`,
      );

      expect(unresolved).toStrictEqual([]);
    });

    it('reports a non-literal identity value as uninterpretable, not unanchored', () => {
      const { unresolved } = extract(
        '  private readonly byText = (address: string) => ({\n' +
          '    css: someImportedConstant,\n' +
          '    text: address,\n' +
          '  });',
      );

      expect(unresolved).toStrictEqual([
        {
          relativePath: 'pages/example.ts',
          className: 'Example',
          propertyName: 'byText',
          line: 2,
          reason: 'uninterpretable-expression',
        },
      ]);
    });

    it('rejects a pattern that is nothing but a hole', () => {
      const { unresolved } = extract(
        `  private readonly any = (value: string) => \`\${value}\`;`,
      );

      expect(unresolved).toStrictEqual([
        {
          relativePath: 'pages/example.ts',
          className: 'Example',
          propertyName: 'any',
          line: 2,
          reason: 'unanchored-pattern',
        },
      ]);
    });

    it('treats a template literal with no substitutions as static', () => {
      const { pageObjects } = extract(
        '  private readonly toggle = `[data-testid="sort-by-networks"]`;',
      );

      expect(pageObjects[0].selectors).toStrictEqual([
        {
          id: 'Example.toggle',
          kind: 'css',
          value: '[data-testid="sort-by-networks"]',
          propertyName: 'toggle',
          line: 2,
          isDynamic: false,
        },
      ]);
    });

    it('records the parent class name when a page object extends another', () => {
      const { pageObjects } = extractFromSource({
        relativePath: 'pages/home/tokens-tab.ts',
        sourceText: 'class TokensTab extends HomePage {}',
      });

      expect(pageObjects[0].extendsClass).toBe('HomePage');
    });

    it('ignores an async arrow-function method rather than calling it unresolved', () => {
      const { pageObjects, unresolved } = extract(
        '  approveModal = async () => {\n' +
          '    await this.driver.clickElement(this.button);\n' +
          '  };',
      );

      expect(pageObjects[0].selectors).toStrictEqual([]);
      expect(unresolved).toStrictEqual([]);
    });

    it('ignores a block-bodied arrow-function method', () => {
      const { pageObjects, unresolved } = extract(
        '  closeModal = () => {\n    this.driver.click(this.x);\n  };',
      );

      expect(pageObjects[0].selectors).toStrictEqual([]);
      expect(unresolved).toStrictEqual([]);
    });

    it('unwraps an as-const assertion on a locator value', () => {
      const { pageObjects } = extract(
        `  private readonly button = { tag: 'button' as const, text: 'Confirm' };`,
      );

      expect(pageObjects[0].selectors).toStrictEqual([
        {
          id: 'Example.button',
          kind: 'tagText',
          value: 'button',
          text: 'Confirm',
          propertyName: 'button',
          line: 2,
          isDynamic: false,
        },
      ]);
    });

    it('extracts an arrow returning an object literal with a template testId', () => {
      const { pageObjects } = extract(
        `  public assetInfoIcon = (assetId: string) => ({
    tag: 'button' as const,
    testId: \`bridge-asset-info-icon-\${assetId}\`,
  });`,
      );

      expect(pageObjects[0].selectors).toStrictEqual([
        {
          id: 'Example.assetInfoIcon',
          kind: 'testId',
          chunks: ['bridge-asset-info-icon-', ''],
          params: ['assetId'],
          propertyName: 'assetInfoIcon',
          line: 2,
          isDynamic: true,
        },
      ]);
    });

    it('records a selector it cannot interpret as unresolved', () => {
      const { pageObjects, unresolved } = extract(
        `  private readonly composed = (selector: string) =>
    \`:is(\${selector}.a, \${selector} .b)\`.trim();`,
      );

      expect(pageObjects[0].selectors).toStrictEqual([]);
      expect(unresolved).toStrictEqual([
        {
          relativePath: 'pages/example.ts',
          className: 'Example',
          propertyName: 'composed',
          line: 2,
          reason: 'uninterpretable-expression',
        },
      ]);
    });
  });
});
