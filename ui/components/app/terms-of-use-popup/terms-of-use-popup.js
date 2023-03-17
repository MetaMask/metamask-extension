import React, { useContext, useRef } from 'react';
import { I18nContext } from '../../../contexts/i18n';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import {
  AlignItems,
  BackgroundColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Text } from '../../component-library';

const renderTerms = (terms) => {
  const lastIndex = terms.length - 1;

  return (
    <>
      {terms.map((term, index) => {
        const isLast = index === lastIndex;
        return (
          <Text
            key={`item-${index}`}
            variant={TextVariant.bodyMd}
            marginBottom={isLast ? 0 : 4}
            marginLeft={4}
            marginRight={4}
            marginTop={4}
          >
            {term}
          </Text>
        );
      })}
    </>
  );
};

const onAcceptTerms = () => {
  console.log('clicked accept');
};

const handleScrollDownClick = () => {
  console.log('clicked scrollDown');
};

export default function TermsOfUsePopup() {
  const t = useContext(I18nContext);
  // TODO - add state to track if user has agreed to terms of use
  // const [lastAgreedTermsOfUse, setLastAgreedTermsOfUse] = useState({});

  const popoverRef = useRef();
  const terms = [t('termsOfUse1'), t('termsOfUse2'), t('termsOfUse3')];
  // I dont think this is the right way to do this ^ , working on the scroll down button

  return (
    <Popover
      className="terms-of-use__popover"
      title={
        <Text alignItems={AlignItems.center} variant={TextVariant.headingMd}>
          {t('termsOfUseTitle')}
        </Text>
      }
      popoverRef={popoverRef}
      showScrollDown
      onScrollDownButtonClick={handleScrollDownClick}
      headerProps={{
        backgroundColor: BackgroundColor.primaryDefault,
      }}
    >
      <div className="terms-of-use">
        <div className="terms-of-use__content">{renderTerms(terms)}</div>
        {/*
          <div
            className="terms-of-use__intersection-observable"
            ref={idRefMap[id]}
          /> */}
        {/* TODO - research ref creation */}
      </div>

      <Button
        type="primary"
        className="terms-of-use__button"
        onClick={onAcceptTerms}
        // onClick={setLastAgreedTermsOfUse(null)}
      >
        {t('accept')}
      </Button>
    </Popover>
  );
}

TermsOfUsePopup.propTypes = {};
