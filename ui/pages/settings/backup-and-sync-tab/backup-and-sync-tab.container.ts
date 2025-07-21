import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../../store/store';
import BackupAndSyncTab from './backup-and-sync-tab.component';

const mapStateToProps = (_state: MetaMaskReduxState) => {
  return {};
};

const mapDispatchToProps = (_dispatch: MetaMaskReduxDispatch) => {
  return {};
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(BackupAndSyncTab);
