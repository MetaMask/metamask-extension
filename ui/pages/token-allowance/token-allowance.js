import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/components/ui/box/box';
import NetworkAccountBalanceHeader from '../../components/app/network-account-balance-header/network-account-balance-header';
import UrlIcon from '../../../ui/components/ui/url-icon/url-icon';
import Typography from '../../../ui/components/ui/typography/typography';
import { ALIGN_ITEMS, COLORS, DISPLAY, FLEX_DIRECTION, FONT_WEIGHT, JUSTIFY_CONTENT, TEXT_ALIGN, TYPOGRAPHY } from '../../../ui/helpers/constants/design-system';
import { I18nContext } from '../../contexts/i18n';
import ContractTokenValues from '../../../ui/components/ui/contract-token-values/contract-token-values';
import Button from '../../../ui/components/ui/button';
import ReviewSpendingCap from '../../../ui/components/ui/review-spending-cap/review-spending-cap';
import { PageContainerFooter } from '../../components/ui/page-container';
import ContractDetailsModal from '../../../ui/components/app/modals/contract-details-modal/contract-details-modal';

export default function TokenAllowance({
    origin,
    siteImage,
}) {
    const t = useContext(I18nContext);

    const [showContractDetails, setShowContractDetails] = useState(false);
    const [angleUp, setAngleUp] = useState(false);

    return (
        <Box className="token-allowance-container">
            <Box paddingLeft={4} paddingRight={4} alignItems={ALIGN_ITEMS.CENTER} display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW} justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}>
                <Button
                type="inline"
                onClick={() => {}}
                >
                    <Typography variant={TYPOGRAPHY.H6} color={COLORS.TEXT_MUTED} fontWeight={FONT_WEIGHT.BOLD}>{"<"} {t('back')}</Typography>
                </Button>
                <Box textAlign={TEXT_ALIGN.END}>
                    <Typography variant={TYPOGRAPHY.H7} color={COLORS.TEXT_MUTED} fontWeight={FONT_WEIGHT.BOLD}>2 {t('ofTextNofM')} 2</Typography>
                </Box>
            </Box>
            <NetworkAccountBalanceHeader 
            networkName={'Ethereum Network'}                
            accountName={'Account 1'}                       
            accountBalance={200.12}                         
            tokenName={'DAI'}                               
            accountAddress={'0x5CfE73b6021E818B776b421B1c4Db2474086a7e1'} 
            />
            <Box
            display={DISPLAY.FLEX}
            className="token-allowance-container__icon-display-content"
            >
                <Box display={DISPLAY.FLEX}>
                    <UrlIcon
                    className="token-allowance-container__icon-display-content__siteimage-identicon"
                    fallbackClassName="token-allowance-container__icon-display-content__siteimage-identicon"
                    name={origin}
                    url={siteImage}
                    />
                    <Typography
                    variant={TYPOGRAPHY.H6}
                    fontWeight={FONT_WEIGHT.NORMAL}
                    color={COLORS.TEXT_ALTERNATIVE}
                    boxProps={{ marginLeft: 1, marginTop: 2 }}
                    >
                    {origin}
                    </Typography>
                </Box>
            </Box>
            <Box marginBottom={5}>
                <Typography variant={TYPOGRAPHY.H3} fontWeight={FONT_WEIGHT.BOLD} align={TEXT_ALIGN.CENTER}>
                    {t('reviewSpendingCap')}
                </Typography>
            </Box>
            <Box>
                <ContractTokenValues
                tokenName={'DAI'}   
                address={'0x5CfE73b6021E818B776b421B1c4Db2474086a7e1'} 
                />
            </Box>
            <Box marginTop={1}>
                <Button
                type="link"
                onClick={() => setShowContractDetails(true)}
                className="token-allowance-container__verify-link"
                >
                    <Typography variant={TYPOGRAPHY.H6} color={COLORS.PRIMARY_DEFAULT}>
                        {t('verifyContractDetails')}
                    </Typography>
                </Button>
            </Box>
            <Box margin={[4, 4, 3, 4]}>
                <ReviewSpendingCap 
                tokenName={'DAI'}               
                currentTokenBalance={200.12}    
                tokenValue={7}                  
                onEdit={() => {}}
                />
            </Box>
            <Box marginTop={6}>
                <Button
                    type="link"
                    onClick={() => setAngleUp(!angleUp)}
                    >
                    <Typography variant={TYPOGRAPHY.H6} color={COLORS.PRIMARY_DEFAULT} marginRight={1}>
                        {t('viewDetails')}
                    </Typography>
                    {angleUp ? <i className="fa fa-sm fa-angle-up"/> :  <i className="fa fa-sm fa-angle-down"/>}
                </Button>
            </Box>
            <PageContainerFooter
            cancelText={t('reject')}
            submitText={t('approveButtonText')}
            onCancel={() => {}}
            onSubmit={() => {}}
            />
            {showContractDetails && 
            <ContractDetailsModal
            tokenName={'DAI'}                               
            address={'0x6B175474E89094C44Da98b954EedeAC495271d0F'}              
            onClose={() => setShowContractDetails(false)}
            />
            }
        </Box>
    )
}

TokenAllowance.propTypes = {
    origin: PropTypes.string,
    siteImage: PropTypes.string,

}
