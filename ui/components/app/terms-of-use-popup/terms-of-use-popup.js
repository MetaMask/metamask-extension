import React, { useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../../ui/popover';
import {
  AlignItems,
  FLEX_DIRECTION,
  TextVariant,
  Color,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  Button,
  BUTTON_VARIANT,
  ButtonLink,
  Label,
  Text,
} from '../../component-library';
import Box from '../../ui/box';
import CheckBox from '../../ui/check-box/check-box.component';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export default function TermsOfUsePopup({ onAccept }) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const [isTermsOfUseChecked, setIsTermsOfUseChecked] = useState(false);
  const [shouldShowScrollButton, setShouldShowScrollButton] = useState(true);

  const popoverRef = useRef();
  const bottomRef = React.createRef();

  const handleScrollDownClick = (e) => {
    e.stopPropagation();
    bottomRef.current.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const handleDebouncedScroll = debounce((target) => {
    setShouldShowScrollButton(
      target.scrollHeight - target.scrollTop !== target.clientHeight,
    );
  }, 100);

  const handleScroll = (e) => {
    handleDebouncedScroll(e.target);
  };

  useEffect(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.TermsOfUseShown,
      properties: {
        location: 'Terms Of Use Popover',
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Popover
      className="terms-of-use__popover"
      popoverRef={popoverRef}
      onScroll={handleScroll}
      showScrollDown={shouldShowScrollButton}
      title={t('termsOfUseTitle')}
      onScrollDownButtonClick={handleScrollDownClick}
      footerProps={{
        justifyContent: AlignItems.center,
        flexDirection: FLEX_DIRECTION.COLUMN,
      }}
      footer={
        <>
          <Button
            variant={BUTTON_VARIANT.PRIMARY}
            className="terms-of-use__button"
            onClick={onAccept}
            disabled={!isTermsOfUseChecked}
            data-testid="terms-of-use-accept-button"
          >
            {t('accept')}
          </Button>
          <Text
            as="p"
            marginTop={4}
            className="terms-of-use__footer-text"
            color={TextColor.textAlternative}
          >
            {t('termsOfUseFooterText')}
          </Text>
        </>
      }
    >
      <Box className="terms-of-use">
        <Box
          className="terms-of-use__content"
          marginBottom={4}
          marginLeft={4}
          marginRight={4}
        >
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            IMPORTANT NOTICE: THIS AGREEMENT IS SUBJECT TO BINDING ARBITRATION
            AND A WAIVER OF CLASS ACTION RIGHTS AS DETAILED IN SECTION 11.
            PLEASE READ THE AGREEMENT CAREFULLY.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            ConsenSys Software Inc. (“ConsenSys,” “we,” “us,” or “our”) is the
            leading blockchain software development company. With a focus on
            utilizing decentralized technologies, such as Ethereum, our software
            is powering a revolution in commerce and finance and helping to
            optimize business processes. ConsenSys hosts a top level domain
            website, www.consensys.net, that serves information regarding
            ConsenSys and our Offerings, as defined below, as well as
            sub-domains for our products or services (the top level domain with
            the sub-domains collectively referred to as the “Site”), which
            include text, images, audio, code and other materials or third party
            information.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            These Terms of Use (the “Terms,” “Terms of Use” or “Agreement”)
            contain the terms and conditions that govern your access to and use
            of the Site and Offerings provided by us and is an agreement between
            us and you or the entity you represent (“you” or “your”). Please
            read these Terms of Use carefully before using the Site or
            Offerings. By using the Site, clicking a button or checkbox to
            accept or agree to these Terms where that option is made available,
            clicking a button to use or access any of the Offerings, completing
            an Order, or,&nbsp; if earlier, using or otherwise accessing the
            Offerings (the date on which any of the events listed above occur
            being the “Effective Date”), you (1) accept and agree to these Terms
            and any additional terms, rules and conditions of participation
            issued by ConsenSys from time to time and (2) consent to the
            collection, use, disclosure and other handling of information as
            described in our{' '}
            <ButtonLink
              href="https://consensys.net/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              color={Color.primaryDefault}
              variant={TextVariant.bodySm}
            >
              Privacy Policy.
            </ButtonLink>{' '}
            If you do not agree to the Terms or perform any and all obligations
            you accept under the Terms, then you may not access or use the
            Offerings.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            You represent to us that you are lawfully able to enter into
            contracts. If you are entering into this Agreement for an entity,
            such as the company you work for, you represent to us that you have
            legal authority to bind that entity. Please see Section 13 for
            definitions of certain capitalized terms used in this Agreement.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            In addition, you represent to us that you and your financial
            institutions, or any party that owns or controls you or your
            financial institutions, are (1) not subject to sanctions or
            otherwise designated on any list of prohibited or restricted
            parties, including but not limited to the lists maintained by the
            United Nations Security Council, the U.S. Government (i.e., the
            Specially Designated Nationals List and Foreign Sanctions Evaders
            List of the U.S. Department of Treasury and the Entity List of the
            U.S. Department of Commerce), the European Union or its Member
            States, or other applicable government authority and (2) not located
            in any country subject to a comprehensive sanctions program
            implemented by the United States.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            1. The Offerings.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            1.1 Generally. You may access and use the Offerings in accordance
            with this Agreement. You agree to comply with the terms of this
            Agreement and all laws, rules and regulations applicable to your use
            of the Offerings.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            1.2 Offerings and Access. ConsenSys offers a number of products and
            services, each an “Offering”, under the ConsenSys brand or brands
            owned by us. These include Codefi, Quorum, Infura, MetaMask and
            others. Offerings are generally accessed through the Site or through
            a third party provider of which we approved, such as the Google Play
            or Apple App Store, unless otherwise agreed in writing. Some
            Offerings may require you to create an account, enter a valid form
            of payment, and select a paid plan (a “Paid Plan”), or initiate an
            Order.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            1.3 Third-Party Content. In certain Offerings, Third-Party Content
            may be used by you at your election. Third-Party Content is governed
            by this Agreement and, if applicable, separate terms and conditions
            accompanying such Third-Party Content, which terms and conditions
            may include separate fees and charges.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            1.4 Third-Party Offerings. When you use our Offerings, you may also
            be using the products or services of one or more third parties. Your
            use of these third party offerings may be subject to the separate
            policies, terms of use, and fees of these third parties.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            2. Changes.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            2.1 To the Offerings. We may change or discontinue any or all of the
            Offerings or change or remove functionality of any or all of the
            Offerings from time to time. We will use commercially reasonable
            efforts to communicate to you any material change or discontinuation
            of an Offering through the Site or public communication
            channels.&nbsp; If you are on a Paid Plan, we will use commercially
            reasonable efforts to communicate to you&nbsp; any material changes
            to or discontinuation of the Offering at least 30 days in advance of
            such change, and we will use commercially reasonable efforts to
            continue supporting the previous version of the Offering for up to
            three months after the change or discontinuation, except if doing so
            (a) would pose an information security or intellectual property
            issue, (b) is economically or technically burdensome, or (c) would
            create undue risk of us violating the law.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            2.2 To this Agreement. We reserve the right, at our sole discretion,
            to modify or replace any part of this Agreement or any Policies at
            any time. It is your responsibility to check this Agreement
            periodically for changes, but we will also use commercially
            reasonable efforts to communicate any material changes to this
            Agreement through the Site or other public channels. Your continued
            use of or access to the Offerings following the posting of any
            changes to this Agreement constitutes acceptance of those changes.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            3. Your Responsibilities.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            3.1 Your Accounts.&nbsp; For those Offerings that require an
            account, and except to the extent caused by our breach of this
            Agreement, (a) you are responsible for all activities that occur
            under your account, regardless of whether the activities are
            authorized by you or undertaken by you, your employees or a third
            party (including your contractors, agents or other End Users), and
            (b) we and our affiliates are not responsible for unauthorized
            access to your account, including any access that occurred as a
            result of fraud, phishing, or other criminal activity perpetrated by
            third parties.&nbsp;&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            3.2 Your Use. You are responsible for all activities that occur
            through your use of those Offerings that do not require an account,
            except to the extent caused by our breach of this Agreement,
            regardless of whether the activities are authorized by you or
            undertaken by you, your employees or a third party (including your
            contractors, agents or other End Users).&nbsp; We and our affiliates
            are not responsible for unauthorized access that may occur during
            your use of the Offerings, including any access that occurred as a
            result of fraud, phishing, or other criminal activity perpetrated by
            third parties.&nbsp; You will ensure that your use of the Offerings
            does not violate any applicable law.&nbsp;&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            3.3 Your Security and Backup. You are solely responsible for
            properly configuring and using the Offerings and otherwise taking
            appropriate action to secure, protect and backup your accounts
            and/or Your Content in a manner that will provide appropriate
            security and protection, which might include use of
            encryption.&nbsp; This includes your obligation under this Agreement
            to record and securely maintain any passwords or backup security
            phrases (i.e. “seed” phrases) that relate to your use of the
            Offerings. You acknowledge that you will not share with us nor any
            other third party any password or backup/seed phrase that relates to
            your use of the Offerings, and that we will not be held responsible
            if you do share any such phrase or password.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            3.4 Log-In Credentials and API Authentication. To the extent we
            provide you with log-in credentials and API authentication generated
            by the Offerings, such log-in credentials and API authentication are
            for your use only and you will not sell, transfer or sublicense them
            to any other entity or person, except that you may disclose your
            password or private key to your agents and subcontractors performing
            work on your behalf.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            3.5 Applicability to MetaMask Offerings. For the avoidance of doubt,
            the terms of this Section 3 are applicable to all Offerings,
            including MetaMask and any accounts you create through MetaMask with
            Third Party Offerings, such as decentralized applications, or
            blockchain-based accounts themselves.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            4. Fees and Payment.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            4.1 Publicly Available Offerings. Some Offerings may be offered to
            the public and licensed on a royalty free basis, including Offerings
            that require a Paid Plan for software licensing fees above a certain
            threshold of use.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            4.2 Offering Fees.&nbsp; If your use of an Offering does not require
            an Order or Paid Plan but software licensing fees are charged
            contemporaneously with your use of the Offering, those fees will be
            charged as described on the Site or in the user interface of the
            Offering.&nbsp; Such fees may be calculated by combining a fee
            charged by us and a fee charged by a Third Party Offering that
            provides certain functionality related to the Offering.&nbsp; For
            those Offerings which entail an Order or Paid Plan, we calculate and
            bill fees and charges according to your Order or Paid Plan. For such
            Offerings, on the first day of each billing period, you will pay us
            the applicable fees (the “Base Fees”) and any applicable taxes based
            on the Offerings in the Paid Plan. In addition, we may, for
            particular Orders, issue an invoice to you for all charges above the
            applicable threshold for your Paid Plan which constitute overage
            fees for the previous billing period. If you make any other changes
            to the Offerings during a billing period (e.g. upgrading or
            downgrading your Paid Plan), we will apply any additional charges or
            credits to the next billing period. We may bill you more frequently
            for fees accrued at our discretion upon notice to you.&nbsp; You
            will pay all fees in U.S. dollars unless the particular Offering
            specifies a different form of payment or otherwise agreed to in
            writing. All amounts payable by you under this Agreement will be
            paid to us without setoff or counterclaim, and without any deduction
            or withholding. Fees and charges for any new Offering or new feature
            of an Offering will be effective when we use commercially reasonable
            efforts to communicate updated fees and charges through our Site or
            other public channels or, if you are on a Paid Plan, upon
            commercially reasonable efforts to notify you, unless we expressly
            state otherwise in a notice. We may increase or add new fees and
            charges for any existing Offerings you are using by using
            commercially reasonable efforts to notify users of the Offerings
            through our Site or other public channels or, if you are on a Paid
            Plan, by giving you at least 30 days’ prior notice.&nbsp; Unless
            otherwise specified in an Order, if you are on a Paid Plan, all
            amounts due under this Agreement are payable within thirty (30) days
            following receipt of your invoice.&nbsp; We may elect to charge you
            interest at the rate of 1.5% per month (or the highest rate
            permitted by law, if less) on all late payments.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            4.3 Taxes. Each party will be responsible, as required under
            applicable law, for identifying and paying all taxes and other
            governmental fees and charges (and any penalties, interest, and
            other additions thereto) that are imposed on that party upon or with
            respect to the transactions and payments under this Agreement. All
            fees payable by you are exclusive taxes unless otherwise noted. We
            reserve the right to withhold taxes where required.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            5. Temporary Suspension; Limiting API Requests.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            5.1 Generally. We may suspend your right to access or use any
            portion or all of the Offerings immediately if we determine:
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (a) your use of the Offerings (i) poses a security risk to the
            Offerings or any third party, (ii) could adversely impact our
            systems, the Offerings or the systems of any other user, (iii) could
            subject us, our affiliates, or any third party to liability, or (iv)
            could be unlawful;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (b) you are, or any End User is, in breach of this Agreement;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (c) you are in breach of your payment obligations under Section 4
            and such breach continues for 30 days or longer; or
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (d) for entities, you have ceased to operate in the ordinary course,
            made an assignment for the benefit of creditors or similar
            disposition of your assets, or become the subject of any bankruptcy,
            reorganization, liquidation, dissolution or similar proceeding.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            5.2 Effect of Suspension. If we suspend your right to access or use
            any portion or all of the Offerings:
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (a) you remain responsible for all fees and charges you incur during
            the period of suspension; and
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (b) you will not be entitled to any fee credits for any period of
            suspension.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            5.3 Limiting API Requests. If applicable to a particular Offering,
            we retain sole discretion to limit your usage of the Offerings
            (including without limitation by limiting the number of API requests
            you may submit (“API Requests”)) at any time if your usage of the
            Offerings exceeds the usage threshold specified in your Paid
            Plan.&nbsp;&nbsp;&nbsp;
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            6. Term; Termination.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            6.1 Term. For Offerings subject to a Paid Plan, the term of this
            Agreement will commence on the Effective Date and will remain in
            effect until terminated under this Section 6. Any notice of
            termination of this Agreement by either party to the other must
            include a Termination Date that complies with the notice periods in
            Section 6.2.&nbsp; For Offerings that are not subject to a Paid
            Plan, the term of this Agreement will commence on the Effective Date
            and will remain in effect until you stop accessing or using the
            Offerings.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            6.2 Termination.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (a) Termination for Convenience. If you are not on a Paid Plan, you
            may terminate this Agreement for any reason by ceasing use of the
            Offering. If you are on a Paid Plan, each party may terminate this
            Agreement for any reason by giving the other party at least 30 days’
            written notice, subject to the provisions in Section 6.2(b).
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (b) Termination for Cause.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (i) By Either Party. Either party may terminate this Agreement for
            cause if the other party is in material breach of this Agreement and
            the material breach remains uncured for a period of 30 days from
            receipt of notice by the other party.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (ii) By Us. We may also terminate this Agreement immediately (A) for
            cause if we have the right to suspend under Section 5, (B) if our
            relationship with a third-party partner who provides software or
            other technology we use to provide the Offerings expires, terminates
            or requires us to change the way we provide the software or other
            technology as part of the Offerings, or (C) in order to avoid undue
            risk of violating the law.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            6.3 Effect of Termination. Upon the Termination Date:
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (i) all your rights under this Agreement immediately terminate; and
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (ii) each party remains responsible for all fees and charges it has
            incurred through the Termination Date and are responsible for any
            fees and charges it incurs during the post-termination period;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (iii) the terms and conditions of this Agreement shall survive the
            expiration or termination of this Agreement to the full extent
            necessary for their enforcement and for the protection of the party
            in whose favor they operate.&nbsp; For instance, despite this
            Agreement between you and us terminating, any dispute raised after
            you stop accessing or using the Offerings will be subject to the
            applicable provisions of this Agreement if that dispute relates to
            your prior access or use.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            For any use of the Offerings after the Termination Date, the terms
            of this Agreement will again apply and, if your use is under a Paid
            Plan, you will pay the applicable fees at the rates under Section 4.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            7. Proprietary Rights.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            7.1 Your Content. Depending on the Offering, you may share Content
            with us. Except as provided in this Section 7, we obtain no rights
            under this Agreement from you (or your licensors) to Your Content.
            You consent to our use of Your Content to provide the Offerings to
            you.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            7.2 Offerings License. We or our licensors own all right, title, and
            interest in and to the Offerings, and all related technology and
            intellectual property rights. Subject to the terms of this
            Agreement, we grant you a limited, revocable, non-exclusive,
            non-sublicensable, non-transferable license to do the following: (a)
            access and use the Offerings solely in accordance with this
            Agreement; and (b) copy and use Our Content solely in connection
            with your permitted use of the Offerings. Except as provided in this
            Section 7.2, you obtain no rights under this Agreement from us, our
            affiliates or our licensors to the Offerings, including any related
            intellectual property rights. Some of Our Content and Third-Party
            Content may be provided to you under a separate license, such as the
            Apache License, Version 2.0, or other open source license. In the
            event of a conflict between this Agreement and any separate license,
            the separate license will prevail with respect to Our Content or
            Third-Party Content that is the subject of such separate license.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            7.3 License Restrictions. Neither you nor any End User will use the
            Offerings in any manner or for any purpose other than as expressly
            permitted by this Agreement. Except for as authorized, neither you
            nor any End User will, or will attempt to (a) modify, distribute,
            alter, tamper with, repair, or otherwise create derivative works of
            any Content included in the Offerings (except to the extent Content
            included in the Offerings is provided to you under a separate
            license that expressly permits the creation of derivative works),
            (b) reverse engineer, disassemble, or decompile the Offerings or
            apply any other process or procedure to derive the source code of
            any software included in the Offerings (except to the extent
            applicable law doesn’t allow this restriction), (c) access or use
            the Offerings in a way intended to avoid incurring fees or exceeding
            usage limits or quotas, (d) use scraping techniques to mine or
            otherwise scrape data except as permitted by a Plan, or (e) resell
            or sublicense the Offerings unless otherwise agreed in writing. You
            will not use Our Marks unless you obtain our prior written consent.
            You will not misrepresent or embellish the relationship between us
            and you (including by expressing or implying that we support,
            sponsor, endorse, or contribute to you or your business endeavors).
            You will not imply any relationship or affiliation between us and
            you except as expressly permitted by this Agreement.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            7.4 Suggestions. If you provide any Suggestions to us or our
            affiliates, we and our affiliates will be entitled to use the
            Suggestions without restriction. You hereby irrevocably assign to us
            all right, title, and interest in and to the Suggestions and agree
            to provide us any assistance we require to document, perfect, and
            maintain our rights in the Suggestions.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            7.5 U.S. Government Users. If you are a U.S. Government End User, we
            are licensing the Offerings to you as a “Commercial Item” as that
            term is defined in the U.S. Code of Federal Regulations (see 48
            C.F.R. § 2.101), and the rights we grant you to the Offerings are
            the same as the rights we grant to all others under these Terms of
            Use.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            8. Indemnification.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            8.1 General.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (a) You will defend, indemnify, and hold harmless us, our affiliates
            and licensors, and each of their respective employees, officers,
            directors, and representatives from and against any Losses arising
            out of or relating to any claim concerning: (a) breach of this
            Agreement or violation of applicable law by you; and (b) a dispute
            between you and any of your customers or users. You will reimburse
            us for reasonable attorneys’ fees and expenses, associated with
            claims described in (a) and (b) above.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (b) We will defend, indemnify, and hold harmless you and your
            employees, officers, directors, and representatives from and against
            any Losses arising out of or relating to any claim concerning our
            material and intentional breach of this Agreement.&nbsp; We will
            reimburse you for reasonable attorneys’ fees and expenses associated
            with the claims described in this paragraph.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            8.2 Intellectual Property.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (a) Subject to the limitations in this Section 8, you will defend
            ConsenSys, its affiliates, and their respective employees, officers,
            and directors against any third-party claim alleging that any of
            Your Content infringes or misappropriates that third party’s
            intellectual property rights, and will pay the amount of any adverse
            final judgment or settlement.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (b) Subject to the limitations in this Section 8 and the limitations
            in Section 10, we will defend you and your employees, officers, and
            directors against any third-party claim alleging that the Offerings
            infringe or misappropriate that third party’s intellectual property
            rights, and will pay the amount of any adverse final judgment or
            settlement.&nbsp; However, we will not be required to spend more
            than $200,000 pursuant to this Section 8, including without
            limitation attorneys’ fees, court costs, settlements, judgments, and
            reimbursement costs.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (c) Neither party will have obligations or liability under this
            Section 8.2 arising from infringement by you combining the Offerings
            with any other product, service, software, data, content or method.
            In addition, we will have no obligations or liability arising from
            your use of the Offerings after we have notified you to discontinue
            such use. The remedies provided in this Section 8.2 are the sole and
            exclusive remedies for any third-party claims of infringement or
            misappropriation of intellectual property rights by the Offerings or
            by Your Content.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            8.3 Process. In no event will a party agree to any settlement of any
            claim that involves any commitment, other than the payment of money,
            without the written consent of the other party.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            9. Disclaimers; Risk.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            9.1 DISCLAIMER. THE OFFERINGS ARE PROVIDED “AS IS.” EXCEPT TO THE
            EXTENT PROHIBITED BY LAW, OR TO THE EXTENT ANY STATUTORY RIGHTS
            APPLY THAT CANNOT BE EXCLUDED, LIMITED OR WAIVED, WE AND OUR
            AFFILIATES AND LICENSORS (A) MAKE NO REPRESENTATIONS OR WARRANTIES
            OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE
            REGARDING THE OFFERINGS OR THE THIRD-PARTY CONTENT, AND (B) DISCLAIM
            ALL WARRANTIES, INCLUDING ANY IMPLIED OR EXPRESS WARRANTIES (I) OF
            MERCHANTABILITY, SATISFACTORY QUALITY, FITNESS FOR A PARTICULAR
            PURPOSE, NON-INFRINGEMENT, OR QUIET ENJOYMENT, (II) ARISING OUT OF
            ANY COURSE OF DEALING OR USAGE OF TRADE, (III) THAT THE OFFERINGS OR
            THIRD-PARTY CONTENT WILL BE UNINTERRUPTED, ERROR FREE OR FREE OF
            HARMFUL COMPONENTS, AND (IV) THAT ANY CONTENT WILL BE SECURE OR NOT
            OTHERWISE LOST OR ALTERED.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            9.2 RISKS. OUR OFFERINGS RELY ON EMERGING TECHNOLOGIES, SUCH AS
            ETHEREUM. SOME OFFERINGS ARE SUBJECT TO INCREASED RISK THROUGH YOUR
            POTENTIAL MISUSE OF THINGS SUCH AS PUBLIC/PRIVATE KEY CRYPTOGRAPHY,
            OR FAILING TO PROPERLY UPDATE OR RUN SOFTWARE TO ACCOMMODATE
            PROTOCOL UPGRADES, LIKE THE TRANSITION TO PROOF OF STAKE CONSENSUS.
            BY USING THE OFFERINGS YOU EXPLICITLY ACKNOWLEDGE AND ACCEPT THESE
            HEIGHTENED RISKS.&nbsp; YOU REPRESENT THAT YOU ARE FINANCIALLY AND
            TECHNICALLY SOPHISTICATED ENOUGH TO UNDERSTAND THE INHERENT RISKS
            ASSOCIATED WITH USING CRYPTOGRAPHIC AND BLOCKCHAIN-BASED SYSTEMS AND
            UPGRADING YOUR SOFTWARE AND PROCESSES TO ACCOMMODATE PROTOCOL
            UPGRADES, AND THAT YOU HAVE A WORKING KNOWLEDGE OF THE USAGE AND
            INTRICACIES OF DIGITAL ASSETS SUCH AS ETHER (ETH) AND OTHER DIGITAL
            TOKENS, SUCH AS THOSE FOLLOWING THE ERC-20 TOKEN STANDARD.&nbsp; IN
            PARTICULAR, YOU UNDERSTAND THAT WE DO NOT OPERATE THE ETHEREUM
            PROTOCOL OR ANY OTHER BLOCKCHAIN PROTOCOL, COMMUNICATE OR EXECUTE
            PROTOCOL UPGRADES, OR APPROVE OR PROCESS BLOCKCHAIN TRANSACTIONS ON
            BEHALF OF YOU.&nbsp; YOU FURTHER UNDERSTAND THAT BLOCKCHAIN
            PROTOCOLS PRESENT THEIR OWN RISKS OF USE, THAT SUPPORTING OR
            PARTICIPATING IN THE PROTOCOL MAY RESULT IN LOSSES IF YOUR
            PARTICIPATION VIOLATES CERTAIN PROTOCOL RULES, THAT&nbsp;
            BLOCKCHAIN-BASED TRANSACTIONS ARE IRREVERSIBLE, THAT YOUR PRIVATE
            KEY AND BACKUP SEED PHRASE MUST BE KEPT SECRET AT ALL TIMES, THAT
            CONSENSYS WILL NOT STORE A BACKUP OF, NOR WILL BE ABLE TO DISCOVER
            OR RECOVER, YOUR PRIVATE KEY OR BACKUP SEED PHRASE, AND THAT YOU ARE
            SOLELY RESPONSIBLE FOR ANY APPROVALS OR PERMISSIONS YOU PROVIDE BY
            CRYPTOGRAPHICALLY SIGNING BLOCKCHAIN MESSAGES OR TRANSACTIONS.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            YOU FURTHER UNDERSTAND AND ACCEPT THAT DIGITAL TOKENS PRESENT MARKET
            VOLATILITY RISK, TECHNICAL SOFTWARE RISKS, REGULATORY RISKS, AND
            CYBERSECURITY RISKS.&nbsp; YOU UNDERSTAND THAT THE COST AND SPEED OF
            A BLOCKCHAIN-BASED SYSTEM IS VARIABLE, THAT COST MAY INCREASE
            DRAMATICALLY AT ANY TIME, AND THAT COST AND SPEED IS NOT WITHIN THE
            CAPABILITY OF CONSENSYS TO CONTROL.&nbsp; YOU UNDERSTAND THAT
            PROTOCOL UPGRADES MAY INADVERTENTLY CONTAIN BUGS OR SECURITY
            VULNERABILITIES THAT MAY RESULT IN LOSS OF FUNCTIONALITY AND
            ULTIMATELY FUNDS.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            YOU UNDERSTAND AND ACCEPT THAT CONSENSYS DOES NOT CONTROL ANY
            BLOCKCHAIN PROTOCOL, NOR DOES CONSENSYS CONTROL ANY SMART CONTRACT
            THAT IS NOT OTHERWISE OFFERED BY CONSENSYS AS PART OF THE
            OFFERINGS.&nbsp; YOU UNDERSTAND AND ACCEPT THAT CONSENSYS DOES NOT
            CONTROL AND IS NOT RESPONSIBLE FOR THE TRANSITION OF ANY BLOCKCHAIN
            PROTOCOL FROM PROOF OF WORK TO PROOF OF STAKE CONSENSUS.&nbsp; YOU
            AGREE THAT YOU ALONE, AND NOT CONSENSYS, IS RESPONSIBLE FOR ANY
            TRANSACTIONS THAT YOU ENGAGE IN WITH REGARD TO SUPPORTING ANY
            BLOCKCHAIN PROTOCOL WHETHER THROUGH TRANSACTION VALIDATION OR
            OTHERWISE, OR ANY TRANSACTIONS THAT YOU ENGAGE IN WITHANY
            THIRD-PARTY-DEVELOPED SMART CONTRACT OR TOKEN, INCLUDING TOKENS THAT
            WERE CREATED BY A THIRD PARTY FOR THE PURPOSE OF FRAUDULENTLY
            MISREPRESENTING AFFILIATION WITH ANY BLOCKCHAIN PROJECT.&nbsp; YOU
            AGREE THAT CONSENSYS IS NOT RESPONSIBLE FOR THE REGULATORY STATUS OR
            TREATMENT OF ANY DIGITAL ASSETS THAT YOU MAY ACCESS OR TRANSACT WITH
            USING CONSENSYS OFFERINGS.&nbsp; YOU EXPRESSLY ASSUME FULL
            RESPONSIBILITY FOR ALL OF THE RISKS OF ACCESSING AND USING THE
            OFFERINGS TO INTERACT WITH BLOCKCHAIN PROTOCOLS.&nbsp;
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            10. Limitations of Liability.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            10.1 Limitation of Liability. WITH THE EXCEPTION OF CLAIMS RELATING
            TO A BREACH OF OUR PROPRIETARY RIGHTS AS GOVERNED BY SECTION 7 AND
            INTELLECTUAL PROPERTY CLAIMS AS GOVERNED BY SECTION 8, IN NO EVENT
            SHALL THE AGGREGATE LIABILITY OF EACH PARTY TOGETHER WITH ALL OF ITS
            AFFILIATES ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE
            TOTAL AMOUNT PAID BY YOU HEREUNDER FOR THE OFFERINGS GIVING RISE TO
            THE LIABILITY IN THE TWELVE MONTHS PRECEDING THE FIRST INCIDENT OUT
            OF WHICH THE LIABILITY AROSE, OR, IF NO FEES HAVE BEEN PAID,
            $25,000. THE FOREGOING LIMITATION WILL APPLY WHETHER AN ACTION IS IN
            CONTRACT OR TORT AND REGARDLESS OF THE THEORY OF LIABILITY, BUT WILL
            NOT LIMIT YOUR PAYMENT OBLIGATIONS UNDER SECTION 4.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            10.2 Exclusion of Consequential and Related Damages. IN NO EVENT
            WILL EITHER PARTY OR ITS AFFILIATES HAVE ANY LIABILITY ARISING OUT
            OF OR RELATED TO THIS AGREEMENT FOR ANY LOST PROFITS, REVENUES,
            GOODWILL, OR INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, COVER,
            BUSINESS INTERRUPTION OR PUNITIVE DAMAGES, WHETHER AN ACTION IS IN
            CONTRACT OR TORT AND REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF
            A PARTY OR ITS AFFILIATES HAVE BEEN ADVISED OF THE POSSIBILITY OF
            SUCH DAMAGES OR IF A PARTY’S OR ITS AFFILIATES’ REMEDY OTHERWISE
            FAILS OF ITS ESSENTIAL PURPOSE. THE FOREGOING DISCLAIMER WILL NOT
            APPLY TO THE EXTENT PROHIBITED BY LAW.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            11. Binding Arbitration and Class Action Waiver.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            PLEASE READ THIS SECTION CAREFULLY – IT MAY SIGNIFICANTLY AFFECT
            YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            11.1 Binding Arbitration. Any dispute, claim or controversy
            (“Claim”) relating in any way to this Agreement, the Site, or your
            use of the Offerings will be resolved by binding arbitration as
            provided in this Section 11, rather than in court, except that you
            may assert claims in small claims court if your claims qualify.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            11.1.1 If you are located in the United States: This agreement and
            any dispute or claim (including non-contractual disputes or claims)
            arising out of or in connection with it or its subject matter or
            formation shall be governed by and construed in accordance with the
            laws of the State of New York. The Federal Arbitration Act and
            federal arbitration law apply to this Agreement. There is no judge
            or jury in arbitration, and court review of an arbitration award is
            limited. However, an arbitrator can award on an individual basis the
            same damages and relief as a court (including injunctive and
            declaratory relief or statutory damages), and must follow the terms
            of this Agreement as a court would. The arbitration will be
            conducted in accordance with the expedited procedures set forth in
            the JAMS Comprehensive Arbitration Rules and Procedures (the
            “Rules”) as those Rules exist on the effective date of this
            Agreement, including Rules 16.1 and 16.2 of those Rules. The
            arbitrator’s decision shall be final, binding, and non-appealable.
            Judgment upon the award may be entered and enforced in any court
            having jurisdiction. Neither party shall sue the other party other
            than as provided herein or for enforcement of this clause or of the
            arbitrator’s award; any such suit may be brought only in a Federal
            District Court or a New York state court located in New York County,
            New York. The arbitrator, and not any federal, state, or local
            court, shall have exclusive authority to resolve any dispute
            relating to the interpretation, applicability, unconscionability,
            arbitrability, enforceability, or formation of this Agreement
            including any claim that all or any part of the Agreement is void or
            voidable.&nbsp; If for any reason a claim proceeds in court rather
            than in arbitration we and you waive any right to a jury trial.
            Notwithstanding the foregoing we and you both agree that you or we
            may bring suit in court to enjoin infringement or other misuse of
            intellectual property rights.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            11.1.2 If you are located in the United Kingdom: This agreement and
            any dispute or claim (including non-contractual disputes or claims)
            arising out of or in connection with it or its subject matter or
            formation shall be governed by and construed in accordance with the
            law of England and Wales. Any dispute, claim or controversy relating
            in any way to this Agreement, the Offerings, your use of the
            Offerings, or to any products or services licensed or distributed by
            us will be resolved by binding arbitration as provided in this
            clause. Prior to commencing any formal arbitration proceedings,
            parties shall first seek settlement of any claim by mediation in
            accordance with the LCIA Mediation Rules, which Rules are deemed to
            be incorporated by reference into this clause. If the dispute is not
            settled by mediation within 14 days of the commencement of the
            mediation, or such further period as the parties shall agree in
            writing, the dispute shall be referred to and finally resolved by
            arbitration under the LCIA Rules, which are deemed to be
            incorporated by reference into this clause. The language to be used
            in the mediation and in the arbitration shall be English. The seat
            or legal place of arbitration shall be London.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            11.1.3 If you are located in any territory that is not specifically
            enumerated in Sections 11.1.1 or 11.1.2, you may elect for either of
            Section 11.1.1 or 11.1.2 to apply to you, otherwise this Agreement
            and any Claim (including non-contractual disputes or claims) arising
            out of or in connection with it or its subject matter or formation
            shall be governed by and construed in accordance with the law of
            Ireland. Any Claim relating in any way to this Agreement, the
            Offerings, your use of the Offerings, or to any products or services
            licensed or distributed by us will be resolved by binding
            arbitration as provided in this clause. Prior to commencing any
            formal arbitration proceedings, parties shall first seek settlement
            of any claim by mediation in accordance with the LCIA Mediation
            Rules, which Rules are deemed to be incorporated by reference into
            this clause. If the dispute is not settled by mediation within 14
            days of the commencement of the mediation, or such further period as
            the parties shall agree in writing, the Claim shall be referred to
            and finally resolved by arbitration under the LCIA Rules, which are
            deemed to be incorporated by reference into this clause. The
            language to be used in the mediation and in the arbitration shall be
            English. The seat or legal place of arbitration shall be Dublin,
            Ireland.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            11.2 Class Action Waiver. YOU AND WE AGREE THAT EACH MAY BRING
            CLAIMS AGAINST THE OTHER ONLY ON AN INDIVIDUAL BASIS, AND NOT AS A
            PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE
            PROCEEDING. YOU AND WE EXPRESSLY WAIVE ANY RIGHT TO FILE A CLASS
            ACTION OR SEEK RELIEF ON A CLASS BASIS. Unless both you and we
            agree, no arbitrator or judge may consolidate more than one person’s
            claims or otherwise preside over any form of a representative or
            class proceeding. The arbitrator may award injunctive relief only in
            favor of the individual party seeking relief and only to the extent
            necessary to provide relief warranted by that party’s individual
            claim. If a court decides that applicable law precludes enforcement
            of any of this paragraph’s limitations as to a particular claim for
            relief, then that claim (and only that claim) must be severed from
            the arbitration and may be brought in court. If any court or
            arbitrator determines that the class action waiver set forth in this
            paragraph is void or unenforceable for any reason or that an
            arbitration can proceed on a class basis, then the arbitration
            provision set forth above shall be deemed null and void in its
            entirety and the parties shall be deemed to have not agreed to
            arbitrate disputes.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            11.3 30-Day Right to Opt Out. You have the right to opt-out and not
            be bound by the arbitration and class action waiver provisions set
            forth above by sending written notice of your decision to opt-out to
            the email address notices@consensys.net with subject line LEGAL OPT
            OUT. The notice must be sent within 30 days of your first use of the
            Offerings, otherwise you shall be bound to arbitrate disputes and
            will be deemed to have agreed to waive any right to pursue a class
            action in accordance with the terms of those paragraphs. If you
            opt-out of these provisions, we will also not be bound by them.
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            12. Miscellaneous.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.1 Assignment. You will not assign or otherwise transfer this
            Agreement or any of your rights and obligations under this
            Agreement, without our prior written consent. Any assignment or
            transfer in violation of this Section 12.1 will be void. We may
            assign this Agreement without your consent (a) in connection with a
            merger, acquisition or sale of all or substantially all of our
            assets, or (b) to any Affiliate or as part of a corporate
            reorganization; and effective upon such assignment, the assignee is
            deemed substituted for us as a party to this Agreement and we are
            fully released from all of our obligations and duties to perform
            under this Agreement. Subject to the foregoing, this Agreement will
            be binding upon, and inure to the benefit of the parties and their
            respective permitted successors and assigns.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.2 DAOs. As a blockchain native company, we may interact with and
            provide certain Offerings to DAOs. Due to the unique nature of DAOs,
            to the extent the DAO votes in favor of and/or accepts such
            Offerings from ConsenSys, the DAO has acknowledged and agreed to
            these Terms in their entirety.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.2 Entire Agreement and Modifications. This Agreement incorporates
            the Policies by reference and is the entire agreement between you
            and us regarding the subject matter of this Agreement. If the terms
            of this document are inconsistent with the terms contained in any
            Policy, the terms contained in this document will control. Any
            modification to the terms of this Agreement may only be made in
            writing.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.3 Force Majeure. Neither party nor their respective affiliates
            will be liable for any delay or failure to perform any obligation
            under this Agreement where the delay or failure results from any
            cause beyond such party’s reasonable control, including but not
            limited to acts of God, utilities or other telecommunications
            failures, cyber attacks, earthquake, storms or other elements of
            nature, pandemics, blockages, embargoes, riots, acts or orders of
            government, acts of terrorism, or war.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.4 Export and Sanctions Compliance. In connection with this
            Agreement, you will comply with all applicable import, re-import,
            sanctions, anti-boycott, export, and re-export control laws and
            regulations, including all such laws and regulations that may apply.
            For clarity, you are solely responsible for compliance related to
            the manner in which you choose to use the Offerings. You may not use
            any Offering if you are the subject of U.S. sanctions or of
            sanctions consistent with U.S. law imposed by the governments of the
            country where you are using the Offering.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.5 Independent Contractors; Non-Exclusive Rights. We and you are
            independent contractors, and this Agreement will not be construed to
            create a partnership, joint venture, agency, or employment
            relationship. Neither party, nor any of their respective affiliates,
            is an agent of the other for any purpose or has the authority to
            bind the other. Both parties reserve the right (a) to develop or
            have developed for it products, services, concepts, systems, or
            techniques that are similar to or compete with the products,
            services, concepts, systems, or techniques developed or contemplated
            by the other party, and (b) to assist third party developers or
            systems integrators who may offer products or services which compete
            with the other party’s products or services.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.6 Eligibility. If you are under the age of majority in your
            jurisdiction of residence, you may use the Site or Offerings only
            with the consent of or under the supervision of your parent or legal
            guardian.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            NOTICE TO PARENTS AND GUARDIANS: By granting your minor permission
            to access the Site or Offerings, you agree to these Terms of Use on
            behalf of your minor. You are responsible for exercising supervision
            over your minor’s online activities. If you do not agree to these
            Terms of Use, do not let your minor use the Site or Offerings.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.7 Language. All communications and notices made or given pursuant
            to this Agreement must be in the English language. If we provide a
            translation of the English language version of this Agreement, the
            English language version of the Agreement will control if there is
            any conflict.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.8 Notice.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (a) To You. We may provide any notice to you under this Agreement
            using commercially reasonable means, including: (i) posting a notice
            on the Site; (ii) sending a message to the email address then
            associated with your account; or (iii) using public communication
            channels . Notices we provide by posting on the Site or using public
            communication channels will be effective upon posting, and notices
            we provide by email will be effective when we send the email. It is
            your responsibility to keep your email address current to the extent
            you have an account. You will be deemed to have received any email
            sent to the email address then associated with your account when we
            send the email, whether or not you actually receive the email.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            (b) To Us. To give us notice under this Agreement, you must contact
            us by email at notices@consensys.net.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.9 No Third-Party Beneficiaries. Except as otherwise set forth
            herein, this Agreement does not create any third-party beneficiary
            rights in any individual or entity that is not a party to this
            Agreement.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.10 No Waivers. The failure by us to enforce any provision of this
            Agreement will not constitute a present or future waiver of such
            provision nor limit our right to enforce such provision at a later
            time. All waivers by us must be in writing to be effective.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.11 Severability. If any portion of this Agreement is held to be
            invalid or unenforceable, the remaining portions of this Agreement
            will remain in full force and effect. Any invalid or unenforceable
            portions will be interpreted to effect and intent of the original
            portion. If such construction is not possible, the invalid or
            unenforceable portion will be severed from this Agreement but the
            rest of the Agreement will remain in full force and effect.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            12.12 Notice and Procedure for Making Claims of Copyright
            Infringement. If you are a copyright owner or agent of the owner,
            and you believe that your copyright or the copyright of a person on
            whose behalf you are authorized to act has been infringed, please
            provide us a written notice at the address below with the following
            information:
          </Text>
          <Box as="ol" marginLeft={4} className="terms-of-use__terms-list">
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              an electronic or physical signature of the person authorized to
              act on behalf of the owner of the copyright or other intellectual
              property interest;
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              a description of the copyrighted work or other intellectual
              property that you claim has been infringed;
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              a description of where the material that you claim is infringing
              is located with respect to the Offerings;
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              your address, telephone number, and email address;
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              a statement by you that you have a good faith belief that the
              disputed use is not authorized by the copyright owner, its agent,
              or the law;
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              a statement by you, made under penalty of perjury, that the above
              information in your notice is accurate and that you are the
              copyright or intellectual property owner or authorized to act on
              the copyright or intellectual property owner’s behalf.
            </Text>
          </Box>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            You can reach us at:
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            Email: notices@consensys.net
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            Subject Line: Copyright Notification Mail
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            Attention: Copyright ℅
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            ConsenSys Software Inc.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            49 Bogart Street Suite 22 Brooklyn, NY 11206
          </Text>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            13. Definitions.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Acceptable Use Policy” means the policy set forth below, as it may
            be updated by us from time to time. You agree not to, and not to
            allow third parties to, use the Offerings:
          </Text>
          <Box as="ol" marginLeft={4} className="terms-of-use__terms-list">
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              to violate, or encourage the violation of, the legal rights of
              others (for example, this may include allowing End Users to
              infringe or misappropriate the intellectual property rights of
              others in violation of the Digital Millennium Copyright Act);
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              to engage in, promote or encourage any illegal or infringing
              content;
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              for any unlawful, invasive, infringing, defamatory or fraudulent
              purpose (for example, this may include phishing, creating a
              pyramid scheme or mirroring a website);
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              to intentionally distribute viruses, worms, Trojan horses,
              corrupted files, hoaxes, or other items of a destructive or
              deceptive nature;
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              to interfere with the use of the Offerings, or the equipment used
              to provide the Offerings, by customers, authorized resellers, or
              other authorized users;
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              to disable, interfere with or circumvent any aspect of the
              Offerings (for example, any thresholds or limits);
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              to generate, distribute, publish or facilitate unsolicited mass
              email, promotions, advertising or other solicitation; or
            </Text>
            <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
              to use the Offerings, or any interfaces provided with the
              Offerings, to access any other product or service in a manner that
              violates the terms of service of such other product or service.
            </Text>
          </Box>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “API” means an application program interface.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “API Requests” has the meaning set forth in Section 5.3.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Applicable Threshold” has the meaning set forth in Section 4.2.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Base Fees” has the meaning set forth in Section 4.2.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Content” means any data, text, audio, video or images, software
            (including machine images), and any documentation.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “DAO” means Decentralized Autonomous Organization.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “End User” means any individual or entity that directly or
            indirectly through another user: (a) accesses or uses Your Content;
            or (b) otherwise accesses or uses the Offerings under your
            account.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Fees” has the meaning set forth in Section 4.2.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Losses” means any claims, damages, losses, liabilities, costs, and
            expenses (including reasonable attorneys’ fees).’
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Our Content” means any software (including machine images), data,
            text, audio, video, images, or documentation that we offer in
            connection with the Offerings.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Our Marks” means any trademarks, service marks, service or trade
            names, logos, and other designations of ConsenSys Software Inc. and
            their affiliates or licensors that we may make available to you in
            connection with this Agreement.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Order” means an order for Offerings executed through an order form
            directly with ConsenSys, or through a cloud vendor, such as Amazon
            Web Services, Microsoft Azure, or Google Cloud.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Offerings” means each of the products and services, including but
            not limited to Codefi, Infura, MetaMask, Quorum and any other
            features, tools, materials, or services offered from time to time,
            by us or our affiliates.&nbsp;
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Policies” means the Acceptable Use Policy, Privacy Policy, any
            supplemental policies or addendums applicable to any Service as
            provided to you, and any other policy or terms referenced in or
            incorporated into this Agreement, each as may be updated by us from
            time to time.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Privacy Policy” means the privacy policy located at{' '}
            <ButtonLink
              href="https://consensys.net/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              color={Color.primaryDefault}
              variant={TextVariant.bodySm}
            >
              https://consensys.net/privacy-policy
            </ButtonLink>{' '}
            (and any successor or related locations designated by us), as it may
            be updated by us from time to time.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Service Offerings” means the Services (including associated APIs),
            Our Content, Our Marks, and any other product or service provided by
            us under this Agreement. Service Offerings do not include
            Third-Party Content or Third-Party Services.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Suggestions” means all suggested improvements to the Service
            Offerings that you provide to us..
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Term” means the term of this Agreement described in Section 6.1.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Termination Date” means the effective date of termination provided
            in accordance with Section 6, in a notice from one party to the
            other.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Third-Party Content” means Content made available to you by any
            third party on the Site or in conjunction with the Offerings.
          </Text>
          <Text variant={TextVariant.bodySm} marginBottom={4}>
            “Your Content” means content that you or any End User transfers to
            us, storage or hosting by the Offerings in connection with account
            and any computational results that you or any End User derive from
            the foregoing through their use of the Offerings, excluding however
            any information submitted to a blockchain protocol for
            processing.&nbsp;
          </Text>
          <Box
            flexDirection={FLEX_DIRECTION.ROW}
            alignItems={AlignItems.flexStart}
            marginLeft={3}
            marginRight={3}
            gap={2}
          >
            <CheckBox
              id="terms-of-use__checkbox"
              className="terms-of-use__checkbox"
              dataTestId="terms-of-use-checkbox"
              checked={isTermsOfUseChecked}
              onClick={() => {
                setIsTermsOfUseChecked(!isTermsOfUseChecked);
              }}
            />
            <Label htmlFor="terms-of-use__checkbox">
              <Text variant={TextVariant.bodyMdBold} as="span" ref={bottomRef}>
                {t('termsOfUseAgreeText')}
              </Text>
            </Label>
          </Box>
        </Box>
      </Box>
    </Popover>
  );
}

TermsOfUsePopup.propTypes = {
  onAccept: PropTypes.func.isRequired,
};
