import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { NavigateFunction } from 'react-router-dom';
import Loading from '../../components/ui/loading-screen';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

type LockProps = {
  navigate: NavigateFunction;
  isUnlocked: boolean;
  lockMetamask: () => Promise<void>;
};

export default class Lock extends PureComponent<LockProps> {
  static propTypes = {
    navigate: PropTypes.func,
    isUnlocked: PropTypes.bool,
    lockMetamask: PropTypes.func,
  };

  componentDidMount() {
    const { lockMetamask, isUnlocked, navigate } = this.props;

    if (isUnlocked) {
      lockMetamask().then(() => navigate(DEFAULT_ROUTE));
    } else {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  }

  render() {
    return <Loading />;
  }
}
