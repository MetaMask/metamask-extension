import getFirstPreferredLangCode from '../../../app/scripts/lib/get-first-preferred-lang-code';
import { setupLocale } from '../..';

const getLocaleContext = (currentLocaleMessages, enLocaleMessages) => {
  return (key) => {
    let message;
    try {
      message = currentLocaleMessages[key].message;
    } finally {
      if (!message && enLocaleMessages) {
        message = enLocaleMessages[key].message;
      }
    }

    return message;
  };
};

export async function getErrorHtml(supportLink, store) {
  let currentLocaleMessages, enLocaleMessages;
  if (store?.getState()?.localeMessages?.current) {
    currentLocaleMessages = store.getState().localeMessages.current;
  } else {
    const preferredLocale = await getFirstPreferredLangCode();
    const response = await setupLocale(preferredLocale);
    currentLocaleMessages = response.currentLocaleMessages;
    enLocaleMessages = response.enLocaleMessages;
  }

  const t = getLocaleContext(currentLocaleMessages, enLocaleMessages);

  return `
    <div class="critical-error-container">
      <div class="critical-error-div">
        ${t('troubleStarting')}        
      </div>
      <div>
        <button id='critical-error-button' class="critical-error-button">
          ${t('restartMetamask')}
        </button>      
      </div>
      <p class="critical-error-paragraph">    
        ${t('stillGettingMessage')}
        <a           
          href=${supportLink} 
          class="critical-error-anchor" 
          target="_blank" 
          rel="noopener noreferrer">
            ${t('sendBugReport')}
          </a>  
      </p>
    </div>
    `;
}
