import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import * as codec from '@truffle/codec';

const EthTxParams = ({
  decoding,
}) => {
   
  switch (decoding.kind) {
    case 'function':

      const { arguments: args, abi: { name } } = decoding;
      return (
        <div>
          <h2>{ name }</h2>
          <ol>
            { args.map((argument, index) => {
              const { name, value } = argument;
              return (
                <div key={index}>
                  <span>{name}</span>
                  <span>{ codec.Format.Utils.Inspect.nativize(value) }</span>
                </div>
              );
            })}
          </ol>
        </div>
      )

    case 'constructor':
    default:
      return 'Unable to render function data';

  }

};

EthTxParams.propTypes = {
  name: PropTypes.string,
  args: PropTypes.arrayOf(),
  large: PropTypes.bool,
  rounded: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  icon: PropTypes.node,
};

export default EthTxParams;
