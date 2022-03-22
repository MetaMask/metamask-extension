import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import ArrowIcon from '../../../../components/ui/icon/arrow-icon.component';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';

import {
    getMetaMaskAccounts,
    getMetaMaskAccountsOrdered
} from '../../../../selectors';

function mapStateToProps(state) {
    return {
        accountsList: getMetaMaskAccountsOrdered(state),
        accounts: getMetaMaskAccounts(state),
        selectedAddress: state.metamask.selectedAddress,
    };
}

function SendFrom({ accounts, selectedAddress, accountsList }) {
    const balanceValue = accounts[selectedAddress]
        ? accounts[selectedAddress].balance
        : '';
    const t = useI18nContext();
    return (
        <div className={classnames('send-v2__from-wrap')}>
            <div className="send-v2__from-title">from</div>
            <div className="send-v2__from-cont">
                <div className="send-v2__from-cont-img">pic</div>
                <div className="send-v2__from-cont-info">
                    {accountsList.map((identity) => {
                        const isSelected = identity.address === selectedAddress;
                        return (
                            isSelected ?
                                <div className="send-v2__from-cont-info-name">{identity.name}</div>
                                : null
                        )
                    })}
                    <div className='d-flex align-items-center'>
                        <span className='send-v2__from-cont-info-balance'>
                            {`${t('balance')} :`}
                        </span>
                        <UserPreferencedCurrencyDisplay
                            className='send-v2__from-cont-info-balance'
                            ethNumberOfDecimals={2}
                            value={balanceValue}
                        />
                    </div>

                </div>
            </div>
            <div className="send-v2__from-arrow">
                <ArrowIcon />
            </div>
        </div>
    );
}
SendFrom.propTypes = {

};
export default compose(
    withRouter,
    connect(mapStateToProps),
)(SendFrom);