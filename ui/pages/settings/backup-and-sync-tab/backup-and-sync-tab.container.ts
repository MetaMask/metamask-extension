import { compose } from 'redux';
import { connect } from 'react-redux';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../../store/store';
import withRouterHooks from '../../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import BackupAndSyncTab from './backup-and-sync-tab.component';

const mapStateToProps = (_state: MetaMaskReduxState) => {
  return {};
};

const mapDispatchToProps = (_dispatch: MetaMaskReduxDispatch) => {
  return {};
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(BackupAndSyncTab);
