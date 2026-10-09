import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss, { type AcceptedPlugin } from 'postcss';
import rtlCss from 'postcss-rtlcss';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import type CopyPlugin from 'copy-webpack-plugin';
import type { RuleSetRule } from 'webpack';
import { discardFontFace } from '../../../postcss-plugins/discard-font-face';

const nodeModules = join(__dirname, '../../../../node_modules');

// Styles for the outer X document. They cannot be bundled into the widget
// frame HTML because that HTML is the iframe, so they are imported as strings
// and injected by the content script instead.
export const cashtagHostPageCssPathRegex =
  /scripts[\\/]cashtag[\\/](?:pill|widget)[\\/]page\.css$/u;

// HtmlBundlerPlugin extracts every stylesheet it recognises into its own asset,
// which would break the string imports above, so they are excluded here.
export const htmlBundlerCssPathRegex =
  /^(?!.*[\\/]cashtag[\\/](?:pill|widget)[\\/]page\.css$|.*[\\/]cashtag[\\/]widget[\\/]widget\.css$).*\.(?:css|scss|sass)$/u;

// Host-page styles, imported as text so the content script can inject and
// remove them without exposing a web-accessible stylesheet.
export function getCashtagPageStylesRule(
  browsersListQuery: string,
): RuleSetRule {
  return {
    test: cashtagHostPageCssPathRegex,
    use: [
      { loader: 'css-loader', options: { exportType: 'string' } },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            config: false,
            plugins: [
              tailwindcss() as unknown as AcceptedPlugin,
              autoprefixer({
                overrideBrowserslist: browsersListQuery,
              }) as unknown as AcceptedPlugin,
              rtlCss({ processEnv: false }) as unknown as AcceptedPlugin,
              discardFontFace(['woff2']) as unknown as AcceptedPlugin, // keep woff2 fonts
            ],
          },
        },
      },
    ],
  };
}

// Keep widget.css outside HtmlBundler. Its CSS @import is not resolved
// correctly there, which leaves design-token variables undefined in dist
// builds. This transform preserves the previous working bundle behavior.
async function buildCashtagWidgetCss(
  content: Buffer | string,
  from: string,
  browsersListQuery: string,
) {
  const tokens = readFileSync(
    join(nodeModules, '@metamask/design-tokens/dist/styles.css'),
    'utf8',
  );
  const source = content
    .toString()
    .replace(
      /@import\s+['"]@metamask\/design-tokens\/styles\.css['"];?\s*/u,
      '',
    );
  const cssPlugins: AcceptedPlugin[] = [
    tailwindcss() as unknown as AcceptedPlugin,
    autoprefixer({
      overrideBrowserslist: browsersListQuery,
    }) as unknown as AcceptedPlugin,
  ];
  const result = await postcss(cssPlugins).process(source, { from });
  return `${tokens}\n${result.css}`;
}

export function getCashtagWidgetCssCopyPattern(
  context: string,
  browsersListQuery: string,
): CopyPlugin.ObjectPattern {
  return {
    from: join(context, 'scripts/cashtag/widget/widget.css'),
    to: 'scripts/cashtag/widget/widget.css',
    transform: (content, absoluteFrom) =>
      buildCashtagWidgetCss(content, absoluteFrom, browsersListQuery),
  };
}
