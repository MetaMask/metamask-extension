import React, { useContext, useState } from 'react';
// import PropTypes from 'prop-types';
import {
    // useDispatch, 
    useSelector
} from 'react-redux';
// import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import {
    getSelectedAccount,
    getSelectedIdentity,
} from '../../../selectors/selectors';
import {
    useMetricEvent,
} from '../../../hooks/useMetricEvent';
import {
    SEND_ROUTE,
    // BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import copyToClipboard from 'copy-to-clipboard';
import { SECOND } from '../../../../shared/constants/time';
import { shortenAddress } from '../../../helpers/utils/util';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import Tooltip from '../../ui/tooltip';
import EditIcon from '../../ui/icon/edit-icon.component';
import CopyIcon from '../../ui/icon/copy-icon.component';
import SendIcon from '../../ui/icon/send-icon.component';
import ReceiveIcon from '../../ui/icon/receive-icon.component';
import { I18nContext } from '../../../contexts/i18n';


const ActOverview = () => {
    // const dispatch = useDispatch();
    const t = useContext(I18nContext);
    const history = useHistory();
    const [copied, setCopied] = useState(false);
    let copyTimeout = null;
    //get address & account name
    const selectedIdentity = useSelector(getSelectedIdentity);
    const checksummedAddress = toChecksumHexAddress(selectedIdentity.address);
    //get token
    const selectedAccount = useSelector(getSelectedAccount);
    const { balance } = selectedAccount;
    //get currency
    const { currency } = useUserPreferencedCurrency('PRIMARY', {});
    const [title, parts] = useCurrencyDisplay(balance, { currency });

    //send method
    const sendEvent = useMetricEvent({
        eventOpts: {
            category: 'Navigation',
            action: 'Home',
            name: 'Clicked Send: TACT',
        },
    });
    return (
        <div className='act-overview__wrapper'>
            <div className="act-overview__balance">
                <div className="act-overview__balance-head">
                    <img src="./images/alphaCarbon/avatar.svg" height='50' alt="TACT" />
                </div>
                <div className="act-overview__balance-info">
                    <div className="act-overview__balance-info-account">
                        <span>{selectedIdentity.name}</span>
                        <span><EditIcon /></span>
                    </div>
                    <Tooltip
                        wrapperClassName="selected-account__tooltip-wrapper"
                        position="bottom"
                        title={
                            copied ? t('copiedExclamation') : t('copyToClipboard')
                        }
                    >
                        <button className='act-overview__balance-info-copy' onClick={() => {
                            setCopied(true);
                            copyTimeout = setTimeout(
                                () => setCopied(true),
                                SECOND * 3,
                            );
                            copyToClipboard(checksummedAddress);
                        }}>
                            <div className="act-overview__balance-info-address">
                                <span> {shortenAddress(checksummedAddress)}</span>
                                <span><CopyIcon color='#2EE8DB' size={12} /></span>
                            </div>
                        </button>
                    </Tooltip>
                </div>
            </div>
            <div className="act-overview__balance-token">
                <span className='act-overview__balance-token-currency'>{parts.suffix}</span>
                <span>{parts.value}</span>
            </div>
            <div className="act-overview__buttons">
                <button className='act-overview__buttons-receive'>
                    <ReceiveIcon className='act-overview__buttons-icon' size={24} color='#FFFFFF' />
                    {t('receive')}
                </button>
                <button className='act-overview__buttons-send' onClick={() => {
                    sendEvent();
                    history.push(SEND_ROUTE);
                }}>
                    <SendIcon className='act-overview__buttons-icon' size={24} color='#FFFFFF' />
                    {t('send')}
                </button>
            </div>
        </div>
    );
};

// ActOverview.propTypes = {

// };

// ActOverview.defaultProps = {

// };

export default ActOverview;
