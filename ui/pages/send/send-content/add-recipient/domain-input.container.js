import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupDomainName,
  initializeDomainSlice,
  resetDomainResolution,
} from '../../../../ducks/domains';
import DomainInput from './domain-input.component';

function mapDispatchToProps(dispatch) {
  return {
    lookupDomainName: debounce(
      (domainName) => dispatch(lookupDomainName(domainName)),
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
