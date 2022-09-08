import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupEnsName,
  initializeEnsSlice,
  resetEnsResolution,
} from '../../../../ducks/ens';
import {
  initializeUnsSlice,
  resetUnsResolution,
  prepareResolutionCall,
} from '../../../../ducks/uns';
import DomainInput from './domain-input.component';

function mapDispatchToProps(dispatch) {
  return {
    lookupEnsName: debounce(
      (domainName) => dispatch(lookupEnsName(domainName)),
      150,
    ),
    initializeDomainSlice: () => dispatch(initializeDomainSlice()),
    resetDomainResolution: debounce(
      () => dispatch(resetDomainResolution()),
      300,
    ),
  };
}

export default connect(null, mapDispatchToProps)(DomainInput);
