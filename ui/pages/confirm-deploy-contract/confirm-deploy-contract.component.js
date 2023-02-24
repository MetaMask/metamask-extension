import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConfirmTransactionBase from '../confirm-transaction-base';
import { toBuffer } from '../../../shared/modules/buffer-utils';
import Box from '../../components/ui/box';
import { Text } from '../../components/component-library';
import {
  Color,
  DISPLAY,
  TextVariant,
  TEXT_TRANSFORM,
} from '../../helpers/constants/design-system';

export default class ConfirmDeployContract extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    txData: PropTypes.object,
  };

  renderData() {
    const { t } = this.context;
    const { txData: { origin, txParams: { data } = {} } = {} } = this.props;

    return (
      <Box color={Color.textAlternative} className="confirm-data" padding={4}>
        <Text
          backgroundColor={Color.backgroundAlternative}
          padding={4}
          variant={TextVariant.bodySm}
          className="confirm-data__data-box"
        >
          <Box display={DISPLAY.FLEX}>
            <Text
              backgroundColor={Color.backgroundAlternative}
              marginBottom={1}
              paddingRight={4}
              variant={TextVariant.bodySmBold}
            >
              {`${t('origin')}:`}
            </Text>
            <div>{origin}</div>
          </Box>
          <Box display={DISPLAY.FLEX}>
            <Text
              backgroundColor={Color.backgroundAlternative}
              paddingRight={4}
              variant={TextVariant.bodySmBold}
            >
              {`${t('bytes')}:`}
            </Text>
            <div>{toBuffer(data).length}</div>
          </Box>
        </Text>
        <Text
          paddingBottom={3}
          paddingTop={2}
          textTransform={TEXT_TRANSFORM.UPPERCASE}
          variant={TextVariant.bodySm}
        >{`${t('hexData')}:`}</Text>
        <Text
          backgroundColor={Color.backgroundAlternative}
          padding={4}
          variant={TextVariant.bodySm}
          className="confirm-data__data-box"
        >
          {data}
        </Text>
      </Box>
    );
  }

  render() {
    return (
      <ConfirmTransactionBase
        actionKey="contractDeployment"
        dataComponent={this.renderData()}
      />
    );
  }
}
