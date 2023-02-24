import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Dropdown from '../../../../components/ui/dropdown';

export default class JwtDropdown extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    jwtList: PropTypes.array,
    currentJwt: PropTypes.string,
    onChange: PropTypes.func,
  };

  render() {
    const { currentJwt, jwtList } = this.props;
    return (
      <div>
        <span className="custody-search-jwt__select-title">
          {this.context.t('selectJWT')}
        </span>
        <Dropdown
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
          onChange={(opt) => this.props.onChange(opt.value)}
        />
      </div>
    );
  }
}
