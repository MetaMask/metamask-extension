import { AccountSelectorElement } from '@metamask/snaps-sdk/jsx';
import { UIComponentFactory } from './types';

export const accountSelector: UIComponentFactory<AccountSelectorElement> = ({
  element,
  form,
}) => {
  return {
    element: 'SnapUIAccountSelector',
    props: {
      id: element.props.name,
      name: element.props.name,
      hideExternalAccounts: element.props.hideExternalAccounts,
      chainIds: element.props.chainIds,
      switchGlobalAccount: element.props.switchGlobalAccount,
      form,
    },
  };
};
