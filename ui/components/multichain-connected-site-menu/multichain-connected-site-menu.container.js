import { connect } from 'react-redux';

import { getConnectedSubjectsForSelectedAddress } from '../../selectors';

import { MultichainConnectedSiteMenu } from './multichain-connected-site-menu.component';

const mapStateToProps = (state) => {
  const connectedSubjects = getConnectedSubjectsForSelectedAddress(state);

  return {
    connectedSubjects,
  };
};

export default connect(mapStateToProps)(MultichainConnectedSiteMenu);
