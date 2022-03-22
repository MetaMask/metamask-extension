import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { connect, useSelector, useDispatch } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import CloseIcon from '../../../../components/ui/icon/close-icon.component';
import {
    getRecipient,
    resetRecipientInput,
} from '../../../../ducks/send';
import { ellipsify } from '../../send.utils';

function mapStateToProps(state) {
    return {
    };
}

function SendTo({ }) {
    const t = useI18nContext();
    const dispatch = useDispatch();
    const recipient = useSelector(getRecipient);
    return (
        <div className={classnames('send-v2__to-wrap')}>
            <div className="send-v2__to-title">To</div>
            <div className="send-v2__to-cont">
                <div className="send-v2__to-cont-img">pic</div>
                <div className="send-v2__to-cont-address">
                    {ellipsify(recipient.address)}
                </div>
            </div>
            <div className="send-v2__to-close" onClick={() => dispatch(resetRecipientInput())}>
                <CloseIcon color="#525252" />
            </div>
        </div>
    );
}
SendTo.propTypes = {

};
export default compose(
    withRouter,
    connect(mapStateToProps),
)(SendTo);