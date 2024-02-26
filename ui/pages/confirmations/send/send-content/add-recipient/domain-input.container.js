import { debounce } from 'lodash';
import { connect } from 'react-redux';
import {
  lookupDomainName,
  initializeDomainSlice,
  resetDomainResolution,
} from '../../../../../ducks/domains';
import { getCurrentChainId } from '../../../../../selectors';
import DomainInput from './domain-input.component';

// Trigger onChange when chainId changes using MapStateToProps
function mapStateToProps(state) {
  return { chainId: getCurrentChainId(state) };
}

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

export default connect(mapStateToProps, mapDispatchToProps)(DomainInput);
