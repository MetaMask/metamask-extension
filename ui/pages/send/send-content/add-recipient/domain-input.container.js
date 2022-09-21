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
// adding Uns functions to dispatch
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
<<<<<<< HEAD
=======
    initializeUnsSlice: () => dispatch(initializeUnsSlice()),
    resetUnsResolution: debounce(() => dispatch(resetUnsResolution())),
    initializeEnsSlice: () => dispatch(initializeEnsSlice()),
    resetEnsResolution: debounce(() => dispatch(resetEnsResolution())),
>>>>>>> 47095ebaa (swaps out API with new NPM package)
  };
}

export default connect(null, mapDispatchToProps)(DomainInput);
