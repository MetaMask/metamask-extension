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
  markPasswordForgotten,
  forceUpdateMetamaskState,
} from '../../store/actions';
import { getIsSocialLoginFlow } from '../../selectors';
import UnlockPage from './unlock-page.component';

const mapStateToProps = (state) => {
  const {
    metamask: { isUnlocked },
  } = state;
  return {
    isUnlocked,
    isSocialLoginFlow: getIsSocialLoginFlow(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    tryUnlockMetamask: (password) => dispatch(tryUnlockMetamask(password)),
    markPasswordForgotten: () => dispatch(markPasswordForgotten()),
    forceUpdateMetamaskState: () => forceUpdateMetamaskState(dispatch),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    markPasswordForgotten: propsMarkPasswordForgotten,
    tryUnlockMetamask: propsTryUnlockMetamask,
    ...restDispatchProps
  } = dispatchProps;
  const {
    history,
    onSubmit: ownPropsSubmit,
    location,
    ...restOwnProps
  } = ownProps;

  const onImport = async () => {
    await propsMarkPasswordForgotten();
    history.push(RESTORE_VAULT_ROUTE);

    if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
      global.platform.openExtensionInBrowser?.(RESTORE_VAULT_ROUTE);
    }
  };

  const onSubmit = async (password) => {
    await propsTryUnlockMetamask(password);
    // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
    let redirectTo = DEFAULT_ROUTE;
    if (location.state?.from?.pathname) {
      const search = location.state.from.search || '';
      redirectTo = location.state.from.pathname + search;
    }
    history.push(redirectTo);
  };

  return {
    ...stateProps,
    ...restDispatchProps,
    ...restOwnProps,
    onRestore: onImport,
    onSubmit: ownPropsSubmit || onSubmit,
    history,
    location,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(UnlockPage);
