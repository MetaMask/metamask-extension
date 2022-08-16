import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupEnsName,
  resolveUNS,
  initializeEnsSlice,
  resetEnsResolution,
} from '../../../../ducks/ens';
import EnsInput from './ens-input.component';

function mapDispatchToProps(dispatch) {
  return {
    lookupEnsName: debounce((ensName) => dispatch(lookupEnsName(ensName)), 150),
    resolveUNS: debounce((ensName) => dispatch(resolveUNS(ensName)), 150),
    initializeEnsSlice: () => dispatch(initializeEnsSlice()),
    resetEnsResolution: debounce(() => dispatch(resetEnsResolution()), 300),
  };
}

export default connect(null, mapDispatchToProps)(EnsInput);
