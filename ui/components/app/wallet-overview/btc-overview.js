import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import { I18nContext } from '../../../contexts/i18n';
import IconButton from '../../ui/icon-button';
import { Tag, Icon, IconName, Text, Box } from '../../component-library';
import Tooltip from '../../ui/tooltip';
import Spinner from '../../ui/spinner';
import {
  AlignItems,
  Display,
  TextVariant,
  IconColor,
  Color,
} from '../../../helpers/constants/design-system';
import { getBalanceFromChain } from '../../../store/actions';
import { getSelectedInternalAccount } from '../../../selectors';
import WalletOverview from './wallet-overview';

const BtcOverview = ({ className, showAddress }) => {
  const t = useContext(I18nContext);
  const account = useSelector(getSelectedInternalAccount);
  const [balance, setBalance] = useState(null);

  const notSupported = (contents) => {
    return (
      <Tooltip title="Not supported yet" position="bottom">
        {contents}
      </Tooltip>
    );
  };

  return (
    <WalletOverview
      showAddress={showAddress}
      balance={
        <Tooltip
          position="top"
          title={t('balanceOutdated')}
          disabled={!balance}
        >
          <div className="eth-overview__balance">
            <div>
              <Tag
                label={account.type}
                labelProps={{
                  variant: TextVariant.bodyXs,
                  color: Color.textAlternative,
                }}
                startIconName={IconName.Coin}
                style={{ marginBottom: 10 }}
              />
            </div>
            <div className="eth-overview__primary-container">
              {balance ? (
                <Box
                  className={classnames(
                    'currency-display-component',
                    className,
                  )}
                  data-testid="eth-overview-balance__box"
                  title="Balance"
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                >
                  <Text
                    as="span"
                    className="currency-display-component__text"
                    ellipsis
                    variant={TextVariant.inherit}
                  >
                    {balance}
                    {` BTC`}
                  </Text>
                </Box>
              ) : (
                <Spinner
                  color="var(--color-secondary-default)"
                  className="loading-overlay__spinner"
                />
              )}
            </div>
          </div>
        </Tooltip>
      }
      buttons={
        <>
          <IconButton
            className="eth-overview__button"
            data-testid="btc-overview-get-balance"
            Icon={
              <Icon name={IconName.Refresh} color={IconColor.primaryInverse} />
            }
            label="Sync"
            onClick={async () => {
              const balance = await getBalanceFromChain(account.id);
              setBalance(balance.amount);
            }}
          />

          {
            // Disabled buttons to have the same "look and feel" than EthOverview
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className="eth-overview__button"
              Icon={
                <Icon
                  name={IconName.PlusMinus}
                  color={IconColor.primaryInverse}
                />
              }
              disabled
              label={t('buyAndSell')}
              tooltipRender={notSupported}
            />
            ///: END:ONLY_INCLUDE_IF
          }

          <IconButton
            className="eth-overview__button"
            Icon={
              <Icon
                name={IconName.Arrow2UpRight}
                color={IconColor.primaryInverse}
              />
            }
            disabled
            label={t('send')}
            tooltipRender={notSupported}
          />
          <IconButton
            className="eth-overview__button"
            disabled
            Icon={
              <Icon
                name={IconName.SwapHorizontal}
                color={IconColor.primaryInverse}
              />
            }
            label={t('swap')}
            tooltipRender={notSupported}
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className="eth-overview__button"
              disabled
              Icon={
                <Icon name={IconName.Bridge} color={IconColor.primaryInverse} />
              }
              label={t('bridge')}
              tooltipRender={notSupported}
            />
            ///: END:ONLY_INCLUDE_IF
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            <IconButton
              className="eth-overview__button"
              Icon={
                <Icon
                  name={IconName.Diagram}
                  color={IconColor.primaryInverse}
                />
              }
              label={t('portfolio')}
              onClick={() => {
                const url = getPortfolioUrl('', 'ext_portfolio_button');
                global.platform.openTab({ url });
              }}
            />
            ///: END:ONLY_INCLUDE_IF
          }
        </>
      }
      className={className}
    />
  );
};

BtcOverview.propTypes = {
  className: PropTypes.string,
  showAddress: PropTypes.bool,
};

export default BtcOverview;
