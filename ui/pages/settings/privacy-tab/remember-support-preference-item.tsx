import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { setShouldShowSupportConsent } from '../../../store/actions';
import type { MetaMaskReduxState } from '../../../store/store';
import { createToggleItem } from '../shared';
import { PRIVACY_ITEMS } from '../search-config';

export const RememberSupportPreferenceToggleItem = createToggleItem({
  name: 'RememberSupportPreferenceToggleItem',
  titleKey: PRIVACY_ITEMS['remember-support-preference'],
  descriptionKey: 'rememberSupportPreferenceDescription',
  selector: (state: MetaMaskReduxState) =>
    getPreferences(state).shouldShowSupportConsent === false,
  action: (rememberPreference: boolean) =>
    setShouldShowSupportConsent(!rememberPreference),
  dataTestId: 'remember-support-preference-toggle',
});
