import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import BuyIcon from '../../ui/icon/overview-buy-icon.component';
import { I18nContext } from '../../../contexts/i18n';
import { CircularProgress } from '@material-ui/core';
import { DISPLAY } from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';

export default function HoldToReveal({
    label,
    timeToHold,
}) {

    const t = useContext(I18nContext);

    const [progress, setProgress] = useState(0);

    const [holdButton, setHoldButton] = useState(false);

    useEffect(() => {
      if (holdButton && progress < 100) {
        const timer = setInterval(() => {
          setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 10));
        }, 800);
    
        return () => {
          clearInterval(timer);
        };
      }
    }, [holdButton, progress]);
console.log(progress);
    return (
      <Button onMouseDown={() => setHoldButton(true)}  onMouseUp={() => { setHoldButton(false); progress === 100 ? null : setProgress(0); }} type='primary' icon={
        <Box className="box1">
          <CircularProgress variant="determinate" value={progress} />
          <Box className="box2">
            <img src={progress === 100 ? 'images/unlock-icon.svg' : 'images/lock-icon.svg'}  className='lock-unlock-icon' />
          </Box>
        </Box>
      }>
        {t('holdToReveal')}
      </Button>
    )

//     let duration = 3000,
//     success = button => {
//         //Success function
//         button.classList.add('success');
//     };

// document.querySelectorAll('.button-hold').forEach(button => {
//     button.style.setProperty('--duration', duration + 'ms');
//     ['mousedown', 'touchstart', 'keypress'].forEach(e => {
//         button.addEventListener(e, ev => {
//             if(e != 'keypress' || (e == 'keypress' && ev.which == 32 && !button.classList.contains('process'))) {
//                 button.classList.add('process');
//                 button.timeout = setTimeout(success, duration, button);
//             }
//         });
//     });
//     ['mouseup', 'mouseout', 'touchend', 'keyup'].forEach(e => {
//         button.addEventListener(e, ev => {
//             if(e != 'keyup' || (e == 'keyup' && ev.which == 32)) {
//                 button.classList.remove('process');
//                 clearTimeout(button.timeout);
//             }
//         }, false);
//     });
// });

// return (
//     <button class="button-hold">
//     <div>
//         <svg class="icon" viewBox="0 0 23 26">
//             <path d="M19.9481 11.3944H18.7762V7.87881C18.7762 3.78702 15.4462 0.45694 11.3544 0.45694C7.26257 0.45694 3.9325 3.78702 3.9325 7.87881V11.3944H2.76062C1.46667 11.3944 0.41687 12.4442 0.41687 13.7382V23.1132C0.41687 24.4071 1.46667 25.4569 2.76062 25.4569H19.9481C21.2421 25.4569 22.2919 24.4071 22.2919 23.1132V13.7382C22.2919 12.4442 21.2421 11.3944 19.9481 11.3944ZM14.87 11.3944H7.83875V7.87881C7.83875 5.94034 9.41589 4.36319 11.3544 4.36319C13.2928 4.36319 14.87 5.94034 14.87 7.87881V11.3944Z"/>
//         </svg>
//         <svg class="progress" viewBox="0 0 32 32">
//             <circle r="8" cx="16" cy="16" />
//         </svg>
//         <svg class="tick" viewBox="0 0 24 24">
//             <polyline points="18,7 11,16 6,12" />
//         </svg>
//     </div>
//     Reveal SRP
// </button>
// )


}

HoldToReveal.propTypes = {
    label: PropTypes.string,
    timeToHold: PropTypes.string,
};
