// Side-effect-only bootstrap module. If `sideEffects: false` is ever set on
// this package, this file must be allowlisted (e.g. `"sideEffects":
// ["**/register-extras.{ts,js}"]`) or the registration will be tree-shaken.
import MetaMaskTranslation from '../metamask-translation/metamask-translation';
import { registerSafeComponent } from './safe-component-list';

registerSafeComponent('MetaMaskTranslation', MetaMaskTranslation);
