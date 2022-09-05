import { _setBackgroundConnection } from '../../ui/store/action-queue';

export const setBackgroundConnection = (backgroundConnection = {}) => {
  _setBackgroundConnection(backgroundConnection);
};
