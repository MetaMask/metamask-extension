import { filterDiffLineAdditions } from '../common/shared';

// Note: Remove this file once we have migrated all deprecated components to the design system

const DEPRECATED_COMPONENT_PATHS = [
  // Deprecated component-library paths
  'component-library/avatar-base',
  'component-library/avatar-favicon',
  'component-library/avatar-icon',
  'component-library/avatar-network',
  'component-library/avatar-token',
  'component-library/box',
  'component-library/button',
  'component-library/button-base',
  'component-library/button-icon',
  'component-library/button-link',
  'component-library/button-primary',
  'component-library/checkbox',
  'component-library/form-text-field/deprecated',
  'component-library/icon',
  'component-library/modal-content/deprecated/modal-content',
  'component-library/modal-header/deprecated/modal-header',
  'component-library/text',
  'component-library/text-field-search/deprecated',
  // Deprecated ui/components/ui paths
  'ui/actionable-message',
  'ui/box',
  'ui/button',
  'ui/callout',
  'ui/check-box',
  'ui/chip',
  'ui/form-field',
  'ui/icon',
  'ui/icon-border',
  'ui/icon-with-fallback',
  'ui/identicon',
  'ui/menu',
  'ui/popover',
  'ui/site-origin',
  'ui/textarea',
  'ui/text-field',
  'ui/typography',
  'ui/url-icon',
];

function preventDeprecatedImports(diff: string): boolean {
  // Skip checking if this is a change to the fitness functions directory itself
  if (diff.includes('development/fitness-functions/')) {
    return true;
  }

  const diffAdditions = filterDiffLineAdditions(diff);

  for (const deprecatedPath of DEPRECATED_COMPONENT_PATHS) {
    // Match: from '...path...';
    const importRegex = new RegExp(`from '.*${deprecatedPath}.*';`, 'u');

    if (importRegex.test(diffAdditions)) {
      return false;
    }
  }

  return true;
}

export { preventDeprecatedImports };
