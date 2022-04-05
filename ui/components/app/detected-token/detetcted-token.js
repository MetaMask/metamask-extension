import React, { useState } from 'react';
import { Switch, Route } from 'react-router-dom';
import { useHistory} from 'react-router-dom';

import { DETECTED_TOKEN_IGNORED_ROUTE, DETECTED_TOKEN_SELECTION_ROUTE } from '../../../helpers/constants/routes';
import DetectedTokenSelectionPopover from './detected-token-selection-popover/detected-token-selection-popover';
import DetectedTokenIgnoredPopover from './detected-token-ignored-popover/detected-token-ignored-popover';

const DetectedToken = () => {
    const history= useHistory();
    const [selectedTokens, setSelectedTokens] = useState([]);
    
    const onIgnoreAll = () => {
        // setSelectedTokens([]);
        console.log('ignore tokens', selectedTokens)
        history.push(DETECTED_TOKEN_IGNORED_ROUTE);
      }

    const handleClearTokensSelection = () => {
        setSelectedTokens([]);
    }
    
    const handleTokenSelection = (tokenAddress) => {
        const newSelectedTokens = new Set(selectedTokens);
        if (newSelectedTokens.has(tokenAddress)) {
          newSelectedTokens.delete(tokenAddress);
        } else {
          newSelectedTokens.add(tokenAddress);
        }
        setSelectedTokens(newSelectedTokens);
    }
    console.log(`in DetectedToken`)
    return(
        <Switch>
            <Route exact path={DETECTED_TOKEN_SELECTION_ROUTE} render={() => <DetectedTokenSelectionPopover selectedTokens={selectedTokens} handleTokenSelection={handleTokenSelection} onIgnoreAll={onIgnoreAll}/>}/>
            <Route exact path={DETECTED_TOKEN_IGNORED_ROUTE} render={() => <DetectedTokenIgnoredPopover handleClearTokensSelection={handleClearTokensSelection}/>}/>
        </Switch>
    );
}

export default DetectedToken;