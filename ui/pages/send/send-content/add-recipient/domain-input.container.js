import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupEnsName,
<<<<<<< HEAD
  initializeDomainSlice,
  resetDomainResolution,
} from '../../../../ducks/domains';
=======
  initializeEnsSlice,
  resetEnsResolution,
} from '../../../../ducks/ens';
import {
  initializeUnsSlice,
  resetUnsResolution,
  prepareResolutionCall,
} from '../../../../ducks/uns';
>>>>>>> ef8046d00 (squashes swap token resolve bug)
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
