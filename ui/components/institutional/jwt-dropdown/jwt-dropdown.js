import React from 'react';
import PropTypes from 'prop-types';
import Dropdown from '../../ui/dropdown';
import { useI18nContext } from '../../../hooks/useI18nContext';

const JwtDropdown = (props) => {
  const t = useI18nContext();
  const { currentJwt, jwtList } = props;

  return (
    <div>
      <span className="custody-search-jwt__select-title">{t('selectJWT')}</span>
      <Dropdown
        data-testid="jwt-dropdown"
        className="custody-search-jwt__select"
        name="jwt-select"
        selectedOption={currentJwt}
        options={[
          ...(jwtList.find((item) => item === currentJwt)
            ? []
            : [
                {
                  value: currentJwt,
                  name:
                    currentJwt.length > 9
                      ? `...${currentJwt.slice(-9)}`
                      : currentJwt,
                },
              ]),
          ...jwtList.map((text) => {
            return {
              value: text,
              name: `...${text?.slice(-9)}`,
            };
          }),
        ]}
        onChange={(opt) => props.onChange(opt.value)}
      />
    </div>
  );
};

JwtDropdown.propTypes = {
  jwtList: PropTypes.array,
  currentJwt: PropTypes.string,
  onChange: PropTypes.func,
};

export default JwtDropdown;
