import React from 'react';
import PropTypes from 'prop-types';

const Tree = (nodes) => {
  const data = ['signer', 'sender', 'affiliate', 'signature'];
  return (
    <div className="tree-component">
      <ol>
        <details open>
          <summary>order: </summary>
          <ol>
            <li className="solidity-value">
              <div className="solidity-named-item solidity-item">
                <span className="param-name typography--weight-bold typography--color-black">
                  nonce:{' '}
                </span>
                <span className="sol-item solidity-uint">1613670935156</span>
              </div>
            </li>
            <li className="solidity-value">
              <div className="solidity-named-item solidity-item">
                <span className="param-name typography--weight-bold typography--color-black">
                  expiry:{' '}
                </span>
                <span className="sol-item solidity-uint">1613682674</span>
              </div>
            </li>
            {data.map((param) => (
              <li className="solidity-value">
                <details>
                  <summary>{param}</summary>
                  <ol>
                    <li className="solidity-value">
                      <div className="solidity-named-item solidity-item">
                        <span className="param-name typography--weight-bold typography--color-black">
                          kind:{' '}
                        </span>
                        <span className="sol-item solidity-bytes">
                          0x36372b07
                        </span>
                      </div>
                    </li>
                    <li className="solidity-value">
                      <div className="solidity-named-item solidity-item">
                        <span className="param-name typography--weight-bold typography--color-black">
                          wallet:{' '}
                        </span>
                        <div>0x00000000000080C886232E9b7EBBFb942B5987AA</div>
                      </div>
                    </li>
                    <li className="solidity-value">
                      <div className="solidity-named-item solidity-item">
                        <span className="param-name typography--weight-bold typography--color-black">
                          token:{' '}
                        </span>
                        <div>AirSwap Token</div>
                      </div>
                    </li>
                    <li className="solidity-value">
                      <div className="solidity-named-item solidity-item">
                        <span className="param-name typography--weight-bold typography--color-black">
                          amount:{' '}
                        </span>
                        <div>15000.0000</div>
                      </div>
                    </li>
                    <li className="solidity-value">
                      <div className="solidity-named-item solidity-item">
                        <span className="param-name typography--weight-bold typography--color-black">
                          id:{' '}
                        </span>
                        <div>0</div>
                      </div>
                    </li>
                  </ol>
                </details>
              </li>
            ))}
          </ol>
        </details>
      </ol>
    </div>
  );
};

Tree.propTypes = {
  nodes: PropTypes.string,
  content: PropTypes.string.isRequired,
};

export default Tree;
