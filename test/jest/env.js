// jest specific env vars that break mocha tests
import { generateIconNames } from '../../development/generate-icon-names';

/**
 * Used for testing components that use the Icon component
 * 'ui/components/component-library/icon/icon.js'
 */

process.env.ICON_NAMES = generateIconNames();
