import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import {
  DEFAULT_ROUTE,
  RESTORE_VAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  tryUnlockMetamask,
  tryUnlockMetamaskWithGlobalSeedlessPassword,
  markPasswordForgotten,
  forceUpdateMetamaskState,
} from '../../store/actions';
import { getIsSeedlessPasswordOutdated } from '../../ducks/metamask/metamask';
import UnlockPage from './unlock-page.component';

const mapStateToProps = (state) => {
  const {
    metamask: { isUnlocked, preferences, firstTimeFlow, socialLoginEmail },
  } = state;
  const { passwordHint } = preferences;

  const socialLoginEnabled = Boolean(socialLoginEmail);

  const isSeedlessPasswordOutdated = getIsSeedlessPasswordOutdated(state);
  return {
    isUnlocked,
    passwordHint,
    firstTimeFlow,
    socialLoginEnabled,
    isSeedlessPasswordOutdated,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    tryUnlockMetamask: (password) => dispatch(tryUnlockMetamask(password)),
    tryUnlockMetamaskWithGlobalSeedlessPassword: (globalPassword) =>
      dispatch(tryUnlockMetamaskWithGlobalSeedlessPassword(globalPassword)),
    markPasswordForgotten: () => dispatch(markPasswordForgotten()),
    forceUpdateMetamaskState: () => forceUpdateMetamaskState(dispatch),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    markPasswordForgotten: propsMarkPasswordForgotten,
    tryUnlockMetamask: propsTryUnlockMetamask,
    tryUnlockMetamaskWithGlobalSeedlessPassword:
      propsTryUnlockMetamaskWithGlobalSeedlessPassword,
    ...restDispatchProps
  } = dispatchProps;
  const { history, onSubmit: ownPropsSubmit, ...restOwnProps } = ownProps;

  // TODO: might remove this once new forget password flow is implemented
  const onImport = async () => {
    await propsMarkPasswordForgotten();
    history.push(RESTORE_VAULT_ROUTE);

    if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
      global.platform.openExtensionInBrowser?.(RESTORE_VAULT_ROUTE);
    }
  };

  const onSubmit = async (password) => {
    const { isSeedlessPasswordOutdated } = stateProps;
    if (isSeedlessPasswordOutdated) {
      // use global seedless password to unlock the vault if seedless password is outdated
      await propsTryUnlockMetamaskWithGlobalSeedlessPassword(password);
    } else {
      await propsTryUnlockMetamask(password);
    }

    history.push(DEFAULT_ROUTE);
  };

  return {
    ...stateProps,
    ...restDispatchProps,
    ...restOwnProps,
    onRestore: onImport,
    onSubmit: ownPropsSubmit || onSubmit,
    history,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(UnlockPage);
