import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';

const I18nValue = ({ messageKey, options }) => {
  const t = useI18nContext();
  return t(messageKey, options);
};

I18nValue.propTypes = {
  messageKey: PropTypes.string.isRequired,
  options: PropTypes.array,
};

export default I18nValue;
