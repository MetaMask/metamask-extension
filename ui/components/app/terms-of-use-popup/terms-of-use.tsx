import React from 'react';
import {
  TextVariant,
  TextAlign,
  TextColor,
} from '../../../helpers/constants/design-system';
import { Box, ButtonLink, Text } from '../../component-library';
import type { BoxProps } from '../../component-library/box';

type TermsOfUseProps = {
  showHeader?: boolean;
} & Omit<BoxProps<'div'>, 'children'>;

export const TermsOfUse: React.FC<TermsOfUseProps> = ({
  showHeader,
  ...props
}) => {
  return (
    <Box className="terms-of-use" {...props}>
      <Box
        className="terms-of-use__content"
        marginBottom={4}
        marginLeft={4}
        marginRight={4}
      >
        {showHeader ? (
          <Box textAlign={TextAlign.Center} marginBottom={4}>
            <Text variant={TextVariant.headingLg}>Terms of use</Text>
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              Last update: February 2024
            </Text>
          </Box>
        ) : null}
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          IMPORTANT NOTICE: THIS AGREEMENT IS SUBJECT TO BINDING ARBITRATION AND
          A WAIVER OF CLASS ACTION RIGHTS AS DETAILED IN SECTION 11. PLEASE READ
          THE AGREEMENT CAREFULLY.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          Consensys Software Inc. (“Consensys,” “we,” “us,” or “our”) is the
          leading blockchain software development company. With a focus on
          utilizing decentralized technologies, such as Ethereum, our software
          is powering a revolution in commerce and finance and helping to
          optimize business processes. Consensys hosts a top level domain
          website,{' '}
          <ButtonLink
            href="https://consensys.io/"
            target="_blank"
            rel="noopener noreferrer"
            color={TextColor.primaryDefault}
            variant={TextVariant.bodySm}
          >
            https://consensys.io/
          </ButtonLink>
          , that serves information regarding Consensys and our products and
          services (collectively, the “Offerings”), as well as sub-domains for
          our products or services (the top level domain with the sub-domains
          collectively referred to as the “Site”), which include text, images,
          audio, code and other materials or third party information.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          These Terms of Use, including their appendix (the “Terms,” “Terms of
          Use” or “Agreement”) contain the terms and conditions that govern your
          access to and use of the Site and Offerings provided by us and is an
          agreement between us and you or the entity you represent (“you” or
          “your”). Please read these Terms of Use carefully before using the
          Site or Offerings. By using the Site, clicking a button or checkbox to
          accept or agree to these Terms where that option is made available,
          clicking a button to use or access any of the Offerings, completing an
          Order, or, if earlier, using or otherwise accessing the Offerings (the
          date on which any of the events listed above occur being the
          “Effective Date”), you (1) accept and agree to these Terms and any
          additional terms that apply to certain Additional Offerings (as
          defined below), rules and conditions of participation issued by
          Consensys from time to time and (2) consent to the collection, use,
          disclosure and other handling of information as described in our{' '}
          <ButtonLink
            href="https://consensys.io/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
            color={TextColor.primaryDefault}
            variant={TextVariant.bodySm}
          >
            Privacy Notice
          </ButtonLink>
          . If you do not agree to the Terms or perform any and all obligations
          you accept under the Terms, then you may not access or use the
          Offerings.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          You represent to us that you are lawfully able to enter into
          contracts. If you are entering into this Agreement for an entity, such
          as the company you work for, you represent to us that you have legal
          authority to bind that entity. Please see Section 13 for definitions
          of certain capitalized terms used in this Agreement.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          In addition, you represent to us that you are (1) not subject to
          sanctions or otherwise designated on any list of prohibited or
          restricted parties, including but not limited to the lists maintained
          by the United Nations Security Council, the U.S. Government (i.e., the
          Specially Designated Nationals List and Foreign Sanctions Evaders List
          of the U.S. Department of Treasury and the Entity List of the U.S.
          Department of Commerce), the European Union or its Member States, the
          United Kingdom, or other applicable government authority and (2) not
          located in any country subject to a comprehensive sanctions program
          implemented by the United States.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          1. The Offerings.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.1 Generally. You may access and use the Offerings only in accordance
          with this Agreement. You agree to comply with the terms of this
          Agreement and all laws, rules and regulations applicable to your use
          of the Offerings.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.2 Offerings and Access. Consensys offers a number of Offerings under
          the Consensys brand or brands owned by us. These include Infura,
          MetaMask and others. Offerings are generally accessed through the Site
          or through a third party provider of which we approved, such as the
          Google Play or Apple App stores, unless otherwise agreed in writing.
          Some Offerings may require you to create an account with Consensys,
          enter a valid form of payment, and select a paid plan (a “Paid Plan”),
          or initiate an Order.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.3 Third-Party Content and Services. In certain Offerings, including
          MetaMask Swaps, Bridging, Staking, and Snaps, you may view, have
          access to, and may use the informational content, products, or
          services of one or more third parties (“Third Party Content” and
          “Third Party Services” respectively). In each such case, you agree
          that you view, access or use such content and services at your own
          election. Your reliance on any Third Party Content and use of Third
          Party Services in connection with the Offerings is governed on one
          hand by this Agreement but, on the other, will also generally be
          subject to separate terms and conditions set forth by the applicable
          third party content and/or service provider. Those terms and
          conditions may involve separate fees and charges or may include
          disclaimers or risk warnings about reliance on or the accuracy of any
          information. Such terms may also apply a privacy policy different than
          that which Consensys maintains and incorporates into this Agreement.
          It is your responsibility to understand the terms and conditions of
          Third Party Services, including how those service providers use any of
          your information under their privacy policies.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          Third Party Content and Third Party Services are provided for your
          convenience only. We do not verify, curate, or control Third Party
          Content. We do not control Third Party Services. As a result, we do
          not guarantee, endorse, or recommend such content or services to any
          or all users of the Offerings, or the use of such content or services
          for any particular purpose. You access, rely upon or use any Third
          Party Content or Third Party Service at your own risk. Consensys
          disclaims all responsibility and liability for any Losses on account
          of your reliance upon or use of such content or services. We have no
          responsibility for Third Party Content that may be misleading,
          incomplete, erroneous, offensive, indecent, or otherwise objectionable
          to you or under the law in your jurisdiction. The choice to rely on
          Third Party Content or to use a Third Party Service is your own, and
          you are solely responsible for ensuring that your reliance or use is
          in compliance with all applicable laws. Dealing or correspondence with
          any third party that provides such content or services is solely
          between you and that third party. We reserve the right to change,
          suspend, remove, disable, or impose access restrictions or limits on
          the use of any Third Party Service at any time without notice.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.4 Support. You may seek or receive technical or product support,
          information, advice, or guidance from us regarding the Offerings,
          including via third party service provider, chat interface, or email.
          All support made available or provided by or on behalf of Consensys is
          believed to be reliable, but we do not make representations or
          warranties, express or implied, as to its accuracy, its completeness,
          or the results to be obtained. Such support is being provided for
          informational purposes only and, by accepting such support, you are
          representing that you have adequate skill and experience regarding the
          proper selection, use, and/or application of Offerings and use such
          Offerings at your own discretion and risk. With the exception of
          instances of gross negligence, you hold us harmless for any injury
          that may result from the support you receive from us. You are aware
          that our customer support efforts may be impersonated by malicious
          third parties, and you agree that we are not responsible for the
          actions of such impersonators. You further acknowledge that we will
          not offer support via SMS, WhatsApp, Telegram, WeChat, or Twitter DMs,
          and that we will never ask you for your private key or secret recovery
          phrase or for you to make a payment to us.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          2. Changes.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          2.1 To the Offerings. We may change or discontinue any or all of the
          Offerings or change or remove functionality of any or all of the
          Offerings from time to time. We will use commercially reasonable
          efforts to communicate to you any discontinuation of an Offering
          through the Site or public communication channels. If you are on a
          Paid Plan, we will use commercially reasonable efforts to communicate
          to you any discontinuation of the Offering at least 30 days in advance
          of such discontinuation, and we will use commercially reasonable
          efforts to continue supporting the Offering for up to three months
          after the discontinuation, except if doing so (a) would pose an
          information security or intellectual property issue, (b) is
          economically or technically burdensome, or (c) would create undue risk
          of us violating the law.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          2.2 To this Agreement. We reserve the right, at our sole discretion,
          to modify or replace any part of this Agreement or any Policies at any
          time. It is your responsibility to check this Agreement periodically
          for changes, but we will also use commercially reasonable efforts to
          communicate any material changes to this Agreement through the Site,
          email (if you have an account), or public channels. You agree that
          your continued use of or access to the Offerings following the posting
          of any changes to this Agreement constitutes acceptance of those
          changes, whether or not you were checking for changes or actually read
          the changes.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          3. Your Responsibilities.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          3.1 Use of the Offerings. For any Offerings, whether they require that
          you set up an account with Consensys (such as Diligence) or they do
          not (such as MetaMask), and except to the extent caused by our breach
          of this Agreement, (a) you are responsible for all activities that
          occur with respect to your use of the Offerings, regardless of whether
          the activities are authorized by you or undertaken by you, your
          employees or a third party (including your contractors, agents or
          other End Users), and (b) we and our affiliates are not responsible
          for unauthorized access to the Offerings or your account, including
          any access that occurred as a result of fraud, phishing, or other
          criminal activity perpetrated against you by third parties. You will
          ensure that your use of the Offerings does not violate any applicable
          law.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          3.2 Your Security and Backup. You are solely responsible for properly
          configuring and using the Offerings and otherwise taking appropriate
          action to secure, protect, and backup your accounts and/or Your
          Content in a manner that will provide appropriate security and
          protection, which might include use of encryption. If you are not able
          to be responsible for your own account security, or do not want such
          an obligation, then you should not use the Offerings. Your obligations
          under this Agreement include ensuring any available software updates
          or upgrades to an Offering you are using are promptly installed or
          implemented, and recording and securely maintaining any passwords or
          secret recovery phrases that relate to your use of the Offerings. You
          acknowledge that certain methods of securing your secret recovery
          phrase, such as storing it as a digital file anywhere, including on
          your personal device or on a cloud storage provider, increase the risk
          that your account or secret recovery phrase will be compromised. You
          further acknowledge that you will not share with us nor any other
          third party any password or secret recovery phrase that relates to
          your use of the Offerings, and that we will not be held responsible if
          you do share any such password or phrase, whether you do so knowingly
          or unknowingly. For the avoidance of doubt, we take no responsibility
          whatsoever for any theft of a secret recovery phrase that involved
          intrusion through any means into your personal device or a cloud
          provider’s data repository.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          3.3 Log-In Credentials and API Authentication. To the extent we
          provide you with log-in credentials and API authentication generated
          by the Offerings, such log-in credentials and API authentication are
          for your use only and you will not sell, transfer, or sublicense them
          to any other entity or person, except that you may disclose your
          password or private key to your agents and subcontractors performing
          work on your behalf.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          3.4 Applicability to Offerings that facilitate access to addresses on
          blockchain protocols. For the avoidance of doubt, the terms of this
          Section 3 are applicable to all Offerings such as MetaMask through
          which you generate a public/private key pair (which can be thought of
          as a blockchain account and related password) either with a blockchain
          protocol directly or with Third Party Offerings, such as decentralized
          applications. You are solely responsible for the use and security of
          these security keys and that we will not be held responsible if you
          share any keys or secret recovery phrases with anyone else, whether
          knowingly or unknowingly.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          4. Fees and Payment.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          4.1 Publicly Available Offerings. Some Offerings may be offered to the
          public and licensed on a royalty free basis, including Offerings that
          require a Paid Plan for software licensing fees above a certain
          threshold of use. These terms apply to all Offerings regardless of
          whether they require a Paid Plan.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          4.2 Offering Fees. If your use of an Offering does not require an
          Order or Paid Plan but software licensing fees are charged
          contemporaneously with your use of the Offering, those fees will be
          charged as described on the Site or in the user interface of the
          Offering. Such fees may be calculated by combining a fee charged by us
          and a fee charged by a Third Party Offering that provides certain
          functionality related to the Offering. For those Offerings which
          entail an Order or Paid Plan, we calculate and bill fees and charges
          according to your Order or Paid Plan. For such Offerings, on the first
          day of each billing period, you will pay us the applicable fees (the
          “Base Fees”) and any applicable taxes based on the Offerings in the
          Paid Plan. In addition, for particular Orders, we may issue an invoice
          to you for all charges above the applicable threshold for your Paid
          Plan which constitute overage fees for the previous billing period. If
          you make any other changes to the Offerings during a billing period
          (for example, upgrading or downgrading your Paid Plan), we will apply
          any additional charges or credits to the next billing period. We may
          bill you more frequently for fees accrued at our discretion upon
          notice to you. You will pay all fees in U.S. dollars unless the
          particular Offering specifies a different form of payment or otherwise
          agreed to by you and us in writing. All amounts payable by you under
          this Agreement will be paid to us without setoff or counterclaim, and
          without any deduction or withholding. Fees and charges for any new
          Offering or new feature of an Offering will be effective when we use
          commercially reasonable efforts to communicate updated fees and
          charges through our Site, the interface of the Offering itself, or
          other public channels or, if you are on a Paid Plan, upon commercially
          reasonable efforts to notify you directly, but we may expressly state
          when notifying you that another effective date applies. We may
          increase or add new fees and charges for any existing Offerings you
          are using by using commercially reasonable efforts to notify users of
          the Offerings through our Site, the interface of the Offering itself,
          other public channels or, if you are on a Paid Plan, by giving you 30
          days’ notice. Unless otherwise specified in an Order, all Paid Plan
          amounts due under this Agreement are payable within 30 days following
          receipt of your invoice. We may elect to charge you interest at the
          rate of 1.5% per month (or the highest rate permitted by law, if less)
          on all late payments.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          4.3 Taxes. Each party will be responsible, as required under
          applicable law, for identifying and paying all taxes and other
          governmental fees and charges (and any penalties, interest, and other
          additions thereto) that are imposed on that party upon or with respect
          to the transactions and payments under this Agreement. All fees
          payable by you are exclusive taxes unless otherwise noted. We reserve
          the right to withhold taxes where required.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          5. Temporary Suspension; Limiting API Requests.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          5.1 Generally. We may suspend your right to access or use any portion
          or all of the Offerings immediately if we determine:
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (a) your use of the Offerings (i) poses a security risk to the
          Offerings or any third party, (ii) could adversely impact our systems,
          the Offerings, or the systems of any other user, (iii) could subject
          us, our affiliates, or any third party to liability, or (iv) could be
          unlawful;
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (b) you are, or any End User is, in breach of this Agreement;
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (c) you are in breach of your payment obligations under Section 4 for
          30 days or longer; or
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (d) for entities, you have ceased to operate in the ordinary course,
          made an assignment for the benefit of creditors or similar disposition
          of your assets, or become the subject of any bankruptcy,
          reorganization, liquidation, dissolution or similar proceeding.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          5.2 Effect of Suspension. If we suspend your right to access or use
          any portion or all of an Offering:
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
          5.3 Limiting API Requests. We retain sole discretion to limit your API
          requests (“API Requests”) submitted in conjunction with your use of an
          Offering at any time if your usage of the Offering exceeds the usage
          threshold specified in your Paid Plan or otherwise on the Site or user
          interface of the Offering. Further, excessive API requests, as
          determined by Consensys in our sole discretion, may result in the
          temporary or permanent suspension of your access to an account or to
          your use of the applicable Offering. Consensys is not required but
          will endeavor, when reasonable, to warn an account owner or user prior
          to suspension.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          6. Term; Termination.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          6.1 Term. For Offerings subject to a Paid Plan, the term of this
          Agreement will commence on the Effective Date and will remain in
          effect until terminated under this Section 6 or by separate written
          agreement. Any notice of termination of this Agreement by either party
          to the other must include a Termination Date that complies with the
          notice periods in Section 6.2 or the Appendix 1 - Additional Offerings
          as applicable. For Offerings that are not subject to a Paid Plan, the
          term of this Agreement will commence on the Effective Date and will
          remain in effect until you stop accessing or using the Offerings.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          6.2 Termination.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (a) Termination for Convenience. If you are not on a Paid Plan, you
          may terminate this Agreement for any reason by ceasing use of the
          Offering. For Paid Plans, Consensys may terminate this Agreement for
          any reason after providing 30 calendar days’ written notice.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (b) Termination for Cause.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (i) By Either Party. Either party may terminate this Agreement for
          cause if the other party is in material breach of this Agreement and
          the material breach remains uncured for a period of 30 days from
          receipt of the other party’s notice of breach.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (ii) By Us. We may also terminate this Agreement for cause immediately
          (A) if we have the right to suspend under Section 5, (B) if our
          relationship with a third-party partner who provides software or other
          technology we use to provide the Offerings expires, terminates, or
          requires us to change the way we provide the software or other
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
          incurred through the Termination Date and are responsible for any fees
          and charges it incurs during the post-termination period;
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (iii) the terms and conditions of this Agreement shall survive the
          expiration or termination of this Agreement to the full extent
          necessary for their enforcement and for the protection of the party in
          whose favor they operate. For instance, should this Agreement between
          you and us terminate, any dispute raised after you stop accessing or
          using the Offerings will be subject to the applicable provisions of
          this Agreement if that dispute relates to your prior access or use.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          For any use of the Offerings after the Termination Date, the terms of
          this Agreement will again apply and, if your use is under a Paid Plan,
          you will pay the applicable fees at the rates under Section 4.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          7. Proprietary Rights.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          7.1 Your Content. Depending on the Offering, you may share Content
          with us. Except as provided in this Section 7, we obtain no rights
          under this Agreement from you (or your licensors) to Your Content;
          however, you consent to our use of Your Content in any manner that is
          consistent with the purpose of your use of the Offerings or that
          otherwise facilitates providing the Offerings to you.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          7.2 Offerings License. We or our licensors own all right, title, and
          interest in and to the Offerings, and all related technology and
          intellectual property rights. Subject to the terms of this Agreement,
          we grant you a limited, revocable, non-exclusive, non-sublicensable,
          non-transferable license to do the following: (a) access and use the
          Offerings solely in accordance with this Agreement; and (b) copy and
          use Our Content solely in connection with your permitted use of the
          Offerings. Except as provided in this Section 7.2, you obtain no
          rights under this Agreement from us, our affiliates or our licensors
          to the Offerings, including any related intellectual property rights.
          Some of Our Content and Third-Party Content may be provided to you
          under a separate license, such as the Apache License, Version 2.0, or
          other open source license. In the event of a conflict between this
          Agreement and any separate license, the separate license will prevail
          with respect to Our Content or Third-Party Content that is the subject
          of such separate license.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          7.3 License Restrictions. Neither you nor any End User will use the
          Offerings in any manner or for any purpose other than as expressly
          permitted by this Agreement. Except for as authorized, neither you nor
          any End User will, or will attempt to (a) modify, distribute, alter,
          tamper with, repair, or otherwise create derivative works of any
          Content included in the Offerings (except to the extent Content
          included in the Offerings is provided to you under a separate license
          that expressly permits the creation of derivative works), (b) reverse
          engineer, disassemble, or decompile the Offerings or apply any other
          process or procedure to derive the source code of any software
          included in the Offerings (except to the extent applicable law doesn’t
          allow this restriction), (c) access or use the Offerings in a way
          intended to avoid incurring fees or exceeding usage limits or quotas,
          (d) use scraping techniques to mine or otherwise scrape data except as
          permitted by a Plan, or (e) resell or sublicense the Offerings unless
          otherwise agreed in writing. You will not use Our Marks unless you
          obtain our prior written consent. You will not misrepresent or
          embellish the relationship between us and you (including by expressing
          or implying that we support, sponsor, endorse, or contribute to you or
          your business endeavors). You will not imply any relationship or
          affiliation between us and you except as expressly permitted by this
          Agreement.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          7.4 Suggestions. If you provide any Suggestions to us or our
          affiliates, we and our affiliates will be entitled to use the
          Suggestions without restriction. You hereby irrevocably assign to us
          all right, title, and interest in and to the Suggestions and agree to
          provide us any assistance we require to document, perfect, and
          maintain our rights in the Suggestions.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          7.5 U.S. Government Users. If you are a U.S. Government End User, we
          are licensing the Offerings to you as a “Commercial Item” as that term
          is defined in the U.S. Code of Federal Regulations (see 48 C.F.R. §
          2.101), and the rights we grant you to the Offerings are the same as
          the rights we grant to all others under these Terms of Use.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          8. Indemnification.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          8.1 General.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (a) You will defend, indemnify, and hold harmless us, our affiliates
          and licensors, and each of their respective employees, officers,
          directors, and representatives from and against any Losses arising out
          of or relating to any claim concerning: (a) breach of this Agreement
          or violation of applicable law by you; or (b) a dispute between you
          and any of your customers or users. You will reimburse us for
          reasonable attorneys’ fees and expenses, associated with claims
          described in (a) and (b) above.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (b) We will defend, indemnify, and hold harmless you and your
          employees, officers, directors, and representatives from and against
          any Losses arising out of or relating to any claim concerning our
          material and intentional breach of this Agreement. We will reimburse
          you for reasonable attorneys’ fees and expenses associated with the
          claims described in this paragraph.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          8.2 Intellectual Property.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (a) Subject to the limitations in this Section 8, you will defend
          Consensys, its affiliates, and their respective employees, officers,
          and directors against any third-party claim alleging that any of Your
          Content infringes or misappropriates that third party’s intellectual
          property rights, and will pay the amount of any adverse final judgment
          or settlement.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (b) Subject to the limitations in this Section 8 and the limitations
          in Section 10, we will defend you and your employees, officers, and
          directors against any third-party claim alleging that the Offerings
          infringe or misappropriate that third party’s intellectual property
          rights, and will pay the amount of any adverse final judgment or
          settlement. However, we will not be required to spend more than
          $200,000 pursuant to this Section 8, including without limitation
          attorneys’ fees, court costs, settlements, judgments, and
          reimbursement costs.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (c) Neither party will have obligations or liability under this
          Section 8.2 arising from infringement by you combining the Offerings
          with any other product, service, software, data, content or method. In
          addition, we will have no obligations or liability arising from your
          use of the Offerings after we have notified you to discontinue such
          use. The remedies provided in this Section 8.2 are the sole and
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
          EXTENT PROHIBITED BY LAW, OR TO THE EXTENT ANY STATUTORY RIGHTS APPLY
          THAT CANNOT BE EXCLUDED, LIMITED OR WAIVED, WE AND OUR AFFILIATES AND
          LICENSORS (A) MAKE NO REPRESENTATIONS OR WARRANTIES OF ANY KIND,
          WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE REGARDING THE
          OFFERINGS, THE THIRD PARTY CONTENT, OR THE THIRD PARTY SERVICES, AND
          (B) DISCLAIM ALL WARRANTIES, INCLUDING ANY IMPLIED OR EXPRESS
          WARRANTIES (I) OF MERCHANTABILITY, SATISFACTORY QUALITY, FITNESS FOR A
          PARTICULAR PURPOSE, NON-INFRINGEMENT, OR QUIET ENJOYMENT, (II) ARISING
          OUT OF ANY COURSE OF DEALING OR USAGE OF TRADE, (III) THAT THE
          OFFERINGS, THIRD PARTY CONTENT, OR THIRD PARTY SERVICE WILL BE
          UNINTERRUPTED, ERROR FREE OR FREE OF HARMFUL COMPONENTS, AND (IV) THAT
          ANY CONTENT WILL BE SECURE OR NOT OTHERWISE LOST OR ALTERED. YOU
          ACKNOWLEDGE AND AGREE THAT YOU HAVE NOT RELIED AND ARE NOT RELYING
          UPON ANY REPRESENTATION OR WARRANTY FROM CONSENSYS THAT IS NOT
          OTHERWISE IN THIS AGREEMENT OR IN A SEPARATE WRITTEN AGREEMENT BETWEEN
          US, AND YOU AGREE YOU WILL NOT TAKE A POSITION IN ANY PROCEEDING THAT
          IS INCONSISTENT WITH THIS PROVISION.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          9.2 RISKS. OUR OFFERINGS RELY ON EMERGING TECHNOLOGIES, SUCH AS
          ETHEREUM. SOME OFFERINGS ARE SUBJECT TO INCREASED RISK THROUGH YOUR
          POTENTIAL MISUSE OF THINGS SUCH AS PUBLIC/PRIVATE KEY CRYPTOGRAPHY, OR
          FAILING TO PROPERLY UPDATE OR RUN SOFTWARE TO ACCOMMODATE PROTOCOL
          UPGRADES, LIKE THE TRANSITION TO PROOF OF STAKE CONSENSUS. BY USING
          THE OFFERINGS YOU EXPLICITLY ACKNOWLEDGE AND ACCEPT THESE HEIGHTENED
          RISKS. YOU REPRESENT THAT YOU ARE FINANCIALLY AND TECHNICALLY
          SOPHISTICATED ENOUGH TO UNDERSTAND THE INHERENT RISKS ASSOCIATED WITH
          USING CRYPTOGRAPHIC AND BLOCKCHAIN-BASED SYSTEMS AND UPGRADING YOUR
          SOFTWARE AND PROCESSES TO ACCOMMODATE OFFERING AND PROTOCOL UPGRADES,
          AND THAT YOU HAVE A WORKING KNOWLEDGE OF THE USAGE AND INTRICACIES OF
          DIGITAL ASSETS SUCH AS ETHER (ETH) AND OTHER DIGITAL TOKENS, SUCH AS
          THOSE FOLLOWING THE ERC-20 TOKEN STANDARD. IN PARTICULAR, YOU
          UNDERSTAND THAT WE DO NOT OPERATE THE ETHEREUM PROTOCOL OR ANY OTHER
          BLOCKCHAIN PROTOCOL, COMMUNICATE OR EXECUTE PROTOCOL UPGRADES, OR
          APPROVE OR PROCESS BLOCKCHAIN TRANSACTIONS ON BEHALF OF YOU. YOU
          FURTHER UNDERSTAND THAT BLOCKCHAIN PROTOCOLS PRESENT THEIR OWN RISKS
          OF USE, THAT SUPPORTING OR PARTICIPATING IN THE PROTOCOL MAY RESULT IN
          LOSSES IF YOUR PARTICIPATION VIOLATES CERTAIN PROTOCOL RULES, THAT
          BLOCKCHAIN-BASED TRANSACTIONS ARE IRREVERSIBLE, THAT YOUR PRIVATE KEY
          AND SECRET RECOVERY PHRASE MUST BE KEPT SECRET AT ALL TIMES, THAT
          CONSENSYS WILL NOT STORE A BACKUP OF, NOR WILL BE ABLE TO DISCOVER OR
          RECOVER, YOUR PRIVATE KEY OR SECRET RECOVERY PHRASE, THAT DIGITALLY
          COPYING AND STORING YOUR SECRET RECOVERY PHRASE ON A CLOUD STORAGE
          SYSTEM OR OTHER THIRD PARTY SUPPORTED DATA STORAGE, INCLUDING YOUR
          PERSONAL DEVICE, MAY INCREASE THE RISK OF LOSS OR THEFT, AND THAT YOU
          ARE SOLELY RESPONSIBLE FOR ANY APPROVALS OR PERMISSIONS YOU PROVIDE BY
          CRYPTOGRAPHICALLY SIGNING BLOCKCHAIN MESSAGES OR TRANSACTIONS,
          ESPECIALLY THOSE RESPONDING TO SOLICITATIONS AND OTHER PROMPTS FROM
          THIRD PARTIES. WITH RESPECT TO THIRD PARTIES, YOU ARE AWARE THAT
          SOCIAL ENGINEERING SCAMS LIKE PIG BUTCHERING PERPETRATED BY MALICIOUS
          THIRD PARTIES IS A RISK AND YOU AGREE THAT YOU AND YOU ALONE ARE
          RESPONSIBLE FOR TRANSACTIONS OR AGREEMENTS WITH SUCH THIRD PARTIES
          THAT MAY LEAD TO INJURY. YOU AGREE THAT WE ARE NOT RESPONSIBLE FOR
          VERIFYING THE LEGITIMACY OR SAFETY OR SUITABILITY OF ANY THIRD PARTY
          APPLICATIONS OR TOKENS THAT YOU MAY INTERACT WITH OR RECEIVE USING OUR
          OFFERINGS. YOU ARE AWARE THAT THERE ARE TECHNICAL MEASURES IN CERTAIN
          OFFERINGS THAT IMPROVE USER SAFETY, AND YOU ARE SOLELY RESPONSIBLE FOR
          UNDERSTANDING HOW THEY FUNCTION AND USING THEM AS APPROPRIATE.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          YOU FURTHER UNDERSTAND AND ACCEPT THAT DIGITAL ASSETS PRESENT MARKET
          VOLATILITY RISK, TECHNICAL SOFTWARE RISKS, REGULATORY RISKS, AND
          CYBERSECURITY RISKS. YOU UNDERSTAND THAT THE COST AND SPEED OF A
          BLOCKCHAIN-BASED SYSTEM IS VARIABLE, THAT COST MAY INCREASE
          DRAMATICALLY AT ANY TIME, AND THAT COST AND SPEED IS NOT WITHIN THE
          CAPABILITY OF CONSENSYS TO CONTROL. YOU UNDERSTAND THAT PROTOCOL
          UPGRADES MAY INADVERTENTLY CONTAIN BUGS OR SECURITY VULNERABILITIES
          THAT MAY RESULT IN LOSS OF FUNCTIONALITY AND ULTIMATELY FUNDS.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          YOU UNDERSTAND AND ACCEPT THAT CONSENSYS DOES NOT CONTROL ANY
          BLOCKCHAIN PROTOCOL, NOR DOES CONSENSYS CONTROL ANY SMART CONTRACT
          THAT IS NOT OTHERWISE OFFERED BY CONSENSYS AS PART OF THE OFFERINGS
          AND IS NOT ITSELF A THIRD PARTY SERVICE. YOU UNDERSTAND AND ACCEPT
          THAT CONSENSYS DOES NOT CONTROL AND IS NOT RESPONSIBLE FOR THE
          TRANSITION OF ANY BLOCKCHAIN PROTOCOL FROM PROOF OF WORK TO PROOF OF
          STAKE CONSENSUS OR THE FUNCTIONING OF ANY PROTOCOL AFTER IT UNDERGOES
          A TECHNICAL UPGRADE. YOU UNDERSTAND AND ACCEPT THAT CONSENSYS DOES NOT
          CONTROL AND IS NOT RESPONSIBLE FOR ANY THIRD PARTY SERVICE. YOU AGREE
          THAT YOU ALONE, AND NOT CONSENSYS, IS RESPONSIBLE FOR ANY TRANSACTIONS
          THAT YOU ENGAGE IN WITH REGARD TO SUPPORTING ANY BLOCKCHAIN PROTOCOL
          WHETHER THROUGH TRANSACTION VALIDATION OR OTHERWISE, OR ANY
          TRANSACTIONS THAT YOU ENGAGE IN WITH ANY THIRD-PARTY-DEVELOPED SMART
          CONTRACT OR TOKEN, INCLUDING TOKENS THAT WERE CREATED BY A THIRD PARTY
          FOR THE PURPOSE OF FRAUDULENTLY MISREPRESENTING AFFILIATION WITH ANY
          BLOCKCHAIN PROJECT. YOU AGREE THAT CONSENSYS IS NOT RESPONSIBLE FOR
          THE REGULATORY STATUS OR TREATMENT IN ANY JURISDICTION OF ANY DIGITAL
          ASSETS THAT YOU MAY ACCESS OR TRANSACT WITH USING CONSENSYS OFFERINGS.
          YOU EXPRESSLY ASSUME FULL RESPONSIBILITY FOR ALL OF THE RISKS OF
          ACCESSING AND USING THE OFFERINGS TO INTERACT WITH BLOCKCHAIN
          PROTOCOLS.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          10. Limitation of Liability.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          10.1 Limitation of Amount. WITH THE EXCEPTION OF CLAIMS RELATING TO A
          BREACH OF OUR PROPRIETARY RIGHTS AS GOVERNED BY SECTION 7 AND
          INDEMNIFICATION AS GOVERNED BY SECTION 8, IN NO EVENT SHALL THE
          AGGREGATE LIABILITY OF EACH PARTY TOGETHER WITH ALL OF ITS AFFILIATES
          ARISING OUT OF OR RELATED TO THIS AGREEMENT (REGARDLESS OF WHETHER
          SUCH LIABILITY ARISES FROM NEGLIGENCE OR OTHERWISE) EXCEED THE TOTAL
          AMOUNT PAID BY YOU HEREUNDER FOR THE OFFERINGS GIVING RISE TO THE
          LIABILITY IN THE TWELVE MONTHS PRECEDING THE FIRST INCIDENT OUT OF
          WHICH THE LIABILITY AROSE, OR, IF NO FEES HAVE BEEN PAID, $25,000. THE
          FOREGOING LIMITATION WILL APPLY WHETHER AN ACTION IS IN CONTRACT OR
          TORT AND REGARDLESS OF THE THEORY OF LIABILITY, BUT WILL NOT LIMIT
          YOUR PAYMENT OBLIGATIONS UNDER SECTION 4. CONSENSYS SHALL HAVE NO
          LIABILITY TO YOU WITH RESPECT TO ANY OFFERING EXCEPT TO THE EXTENT
          THAT SUCH DAMAGES ARE DETERMINED BY FINAL JUDGMENT OF A COURT OR
          ARBITRATOR.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          10.2 Exclusion of Consequential and Related Damages. IN NO EVENT WILL
          EITHER PARTY OR ITS AFFILIATES HAVE ANY LIABILITY ARISING OUT OF OR
          RELATED TO THIS AGREEMENT FOR ANY LOST PROFITS, REVENUES, GOODWILL, OR
          INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, COVER, BUSINESS
          INTERRUPTION OR PUNITIVE DAMAGES, WHETHER AN ACTION IS IN CONTRACT OR
          TORT AND REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF A PARTY OR ITS
          AFFILIATES HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES OR IF
          A PARTY’S OR ITS AFFILIATES’ REMEDY OTHERWISE FAILS OF ITS ESSENTIAL
          PURPOSE. THE FOREGOING DISCLAIMER WILL NOT APPLY TO THE EXTENT
          PROHIBITED BY LAW.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          11. Binding Arbitration and Class Action Waiver.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          PLEASE READ THIS SECTION CAREFULLY – IT MAY SIGNIFICANTLY AFFECT YOUR
          LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          11.1 Binding Arbitration. Any dispute, claim or controversy (“Claim”)
          relating in any way to this Agreement, the Site, or your use of the
          Offerings will be resolved by binding arbitration as provided in this
          Section 11, rather than in court, except that you may assert claims in
          small claims court if your claims qualify.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          11.1.1 If you are located in the United States: This agreement and any
          dispute or claim (including non-contractual disputes or claims)
          arising out of or in connection with it or its subject matter or
          formation shall be governed by and construed in accordance with the
          laws of the State of Texas. The Federal Arbitration Act and federal
          arbitration law apply to this Agreement. There is no judge or jury in
          arbitration, and court review of an arbitration award is limited.
          However, an arbitrator can award on an individual basis the same
          damages and relief as a court (including injunctive and declaratory
          relief or statutory damages), and must follow the terms of this
          Agreement as a court would. The arbitration will be conducted in
          accordance with the expedited procedures set forth in the JAMS
          Comprehensive Arbitration Rules and Procedures (the “Rules”) as those
          Rules exist on the effective date of this Agreement, including Rules
          16.1 and 16.2 of those Rules. The arbitrator’s decision shall be
          final, binding, and non-appealable. Judgment upon the award may be
          entered and enforced in any court having jurisdiction. Neither party
          shall sue the other party other than as provided herein or for
          enforcement of this clause or of the arbitrator’s award; any such suit
          may be brought only in a Federal District Court or a Texas state court
          located in Tarrant County, Texas. The arbitrator, and not any federal,
          state, or local court, shall have exclusive authority to resolve any
          dispute relating to the interpretation, applicability,
          unconscionability, arbitrability, enforceability, or formation of this
          Agreement including any claim that all or any part of the Agreement is
          void or voidable. If for any reason a claim proceeds in court rather
          than in arbitration we and you waive any right to a jury trial.
          Notwithstanding the foregoing we and you both agree that you or we may
          bring suit in court to enjoin infringement or other misuse of
          intellectual property rights.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          11.1.2 If you are located in the United Kingdom: This agreement and
          any dispute or claim (including non-contractual disputes or claims)
          arising out of or in connection with it or its subject matter or
          formation shall be governed by and construed in accordance with the
          law of England and Wales. Any dispute, claim or controversy relating
          in any way to this Agreement, the Offerings, your use of the
          Offerings, or to any products or services licensed or distributed by
          us will be resolved by binding arbitration as provided in this clause.
          Prior to commencing any formal arbitration proceedings, parties shall
          first seek settlement of any claim by mediation in accordance with the
          LCIA Mediation Rules, which Rules are deemed to be incorporated by
          reference into this clause. If the dispute is not settled by mediation
          within 14 days of the commencement of the mediation, or such further
          period as the parties shall agree in writing, the dispute shall be
          referred to and finally resolved by arbitration under the LCIA Rules,
          which are deemed to be incorporated by reference into this clause. The
          language to be used in the mediation and in the arbitration shall be
          English. The seat or legal place of arbitration shall be London.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          11.1.3 If you are located in any territory that is not specifically
          enumerated in Sections 11.1.1 or 11.1.2, you may elect for either of
          Section 11.1.1 or 11.1.2 to apply to you, otherwise this Agreement and
          any Claim (including non-contractual disputes or claims) arising out
          of or in connection with it or its subject matter or formation shall
          be governed by and construed in accordance with the law of Ireland.
          Any Claim relating in any way to this Agreement, the Offerings, your
          use of the Offerings, or to any products or services licensed or
          distributed by us will be resolved by binding arbitration as provided
          in this clause. Prior to commencing any formal arbitration
          proceedings, parties shall first seek settlement of any claim by
          mediation in accordance with the LCIA Mediation Rules, which Rules are
          deemed to be incorporated by reference into this clause. If the
          dispute is not settled by mediation within 14 days of the commencement
          of the mediation, or such further period as the parties shall agree in
          writing, the Claim shall be referred to and finally resolved by
          arbitration under the LCIA Rules, which are deemed to be incorporated
          by reference into this clause. The language to be used in the
          mediation and in the arbitration shall be English. The seat or legal
          place of arbitration shall be Dublin, Ireland.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          11.2 Class Action Waiver. YOU AND WE AGREE THAT EACH MAY BRING CLAIMS
          AGAINST THE OTHER ONLY ON AN INDIVIDUAL BASIS, AND NOT AS A PLAINTIFF
          OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
          YOU AND WE EXPRESSLY WAIVE ANY RIGHT TO FILE A CLASS ACTION OR SEEK
          RELIEF ON A CLASS BASIS. Unless both you and we agree, no arbitrator
          or judge may consolidate more than one person’s claims or otherwise
          preside over any form of a representative or class proceeding. The
          arbitrator may award injunctive relief only in favor of the individual
          party seeking relief and only to the extent necessary to provide
          relief warranted by that party’s individual claim. If a court decides
          that applicable law precludes enforcement of any of this paragraph’s
          limitations as to a particular claim for relief, then that claim (and
          only that claim) must be severed from the arbitration and may be
          brought in court. If any court or arbitrator determines that the class
          action waiver set forth in this paragraph is void or unenforceable for
          any reason or that an arbitration can proceed on a class basis, then
          the arbitration provision set forth above shall be deemed null and
          void in its entirety and the parties shall be deemed to have not
          agreed to arbitrate disputes.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          11.3 30-Day Right to Opt Out. You have the right to opt-out and not be
          bound by the arbitration and class action waiver provisions set forth
          above by sending written notice of your decision to opt-out to the
          email address{' '}
          <ButtonLink
            href="mailto:notices@consensys.net"
            target="_blank"
            rel="noopener noreferrer"
            color={TextColor.primaryDefault}
            variant={TextVariant.bodySm}
          >
            notices@consensys.net
          </ButtonLink>{' '}
          with subject line LEGAL OPT OUT. The notice must be sent within 30
          days of your first use of the Offerings, otherwise you shall be bound
          to arbitrate disputes and will be deemed to have agreed to waive any
          right to pursue a class action in accordance with the terms of those
          paragraphs. If you opt-out of these provisions, we will also not be
          bound by them.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          12. Miscellaneous.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.1 Assignment. You will not assign or otherwise transfer this
          Agreement or any of your rights and obligations under this Agreement,
          without our prior written consent. Any assignment or transfer in
          violation of this Section 12.1 will be void. We may assign this
          Agreement without your consent (a) in connection with a merger,
          acquisition or sale of all or substantially all of our assets, or (b)
          to any Affiliate or as part of a corporate reorganization; and
          effective upon such assignment, the assignee is deemed substituted for
          us as a party to this Agreement and we are fully released from all of
          our obligations and duties to perform under this Agreement. Subject to
          the foregoing, this Agreement will be binding upon, and inure to the
          benefit of the parties and their respective permitted successors and
          assigns.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.2 DAOs. As a blockchain native company, we may interact with and
          provide certain Offerings to DAOs. Due to the unique nature of DAOs,
          to the extent the DAO votes in favor of and/or accepts such Offerings
          from Consensys, the DAO has acknowledged and agreed to these Terms in
          their entirety.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.3 Entire Agreement and Modifications. This Agreement incorporates
          the Policies by reference and is the entire agreement between you and
          us regarding the subject matter of this Agreement. If the terms of
          this document are inconsistent with the terms contained in any Policy,
          the terms contained in this document will control. Any modification to
          the terms of this Agreement may only be made in writing.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.4 Force Majeure. Neither party nor their respective affiliates will
          be liable for any delay or failure to perform any obligation under
          this Agreement where the delay or failure results from any cause
          beyond such party’s reasonable control, including but not limited to
          acts of God, utilities or other telecommunications failures, cyber
          attacks, earthquake, storms or other elements of nature, pandemics,
          blockages, embargoes, riots, acts or orders of government, acts of
          terrorism, or war.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.5 Export and Sanctions Compliance. In connection with this
          Agreement, you will comply with all applicable import, re-import,
          sanctions, anti-boycott, export, and re-export control laws and
          regulations, including all such laws and regulations that prohibit
          certain transactions. For clarity, you are solely responsible for
          compliance related to the manner in which you choose to use the
          Offerings. You may not use any Offering if you are the subject of U.S.
          sanctions or of sanctions consistent with U.S. law imposed by the
          governments of the country where you are using the Offering.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.6 Independent Contractors; Non-Exclusive Rights. We and you are
          independent contractors, and this Agreement will not be construed to
          create a partnership, joint venture, agency, or employment
          relationship. Neither party, nor any of their respective affiliates,
          is an agent of the other for any purpose or has the authority to bind
          the other. Both parties reserve the right (a) to develop or have
          developed for it products, services, concepts, systems, or techniques
          that are similar to or compete with the products, services, concepts,
          systems, or techniques developed or contemplated by the other party,
          and (b) to assist third party developers or systems integrators who
          may offer products or services which compete with the other party’s
          products or services.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.7 Eligibility. If you are under the age of majority in your
          jurisdiction of residence, you may use the Site or Offerings only with
          the consent of or under the supervision of your parent or legal
          guardian.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          NOTICE TO PARENTS AND GUARDIANS: By granting your minor permission to
          access the Site or Offerings, you agree to these Terms of Use on
          behalf of your minor. You are responsible for exercising supervision
          over your minor’s online activities. If you do not agree to these
          Terms of Use, do not let your minor use the Site or Offerings.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.8 Language. All communications and notices made or given pursuant
          to this Agreement must be in the English language. If we provide a
          translation of the English language version of this Agreement, the
          English language version of the Agreement will control if there is any
          conflict.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.9 Notice.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (a) To You. We may provide any notice to you under this Agreement
          using commercially reasonable means, including: (i) posting a notice
          on the Site; (ii) sending a message to the email address then
          associated with your account; (iii) posting the notice in the
          interface of the applicable Offering; or (iv) using public
          communication channels. Notices we provide by posting on the Site or
          using public communication channels will be effective upon posting,
          and notices we provide by email will be effective when we send the
          email. It is your responsibility to keep your email address current to
          the extent you have an account. You will be deemed to have received
          any email sent to the email address then associated with your account
          when we send the email, whether or not you actually receive the email.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          (b) To Us. To give us notice under this Agreement, you must contact us
          by email at{' '}
          <ButtonLink
            href="mailto:notices@consensys.net"
            target="_blank"
            rel="noopener noreferrer"
            color={TextColor.primaryDefault}
            variant={TextVariant.bodySm}
          >
            notices@consensys.net
          </ButtonLink>
          .
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.10 No Third-Party Beneficiaries. Except as otherwise set forth
          herein, this Agreement does not create any third-party beneficiary
          rights in any individual or entity that is not a party to this
          Agreement.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.11 No Waivers. The failure by us to enforce any provision of this
          Agreement will not constitute a present or future waiver of such
          provision nor limit our right to enforce such provision at a later
          time. All waivers by us must be in writing to be effective.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.12 Severability. If any portion of this Agreement is held to be
          invalid or unenforceable, the remaining portions of this Agreement
          will remain in full force and effect. Any invalid or unenforceable
          portions will be interpreted to effect and intent of the original
          portion. If such construction is not possible, the invalid or
          unenforceable portion will be severed from this Agreement but the rest
          of the Agreement will remain in full force and effect.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          12.13 Notice and Procedure for Making Claims of Copyright
          Infringement. If you are a copyright owner or agent of the owner, and
          you believe that your copyright or the copyright of a person on whose
          behalf you are authorized to act has been infringed, please provide us
          a written notice at the address below with the following information:
        </Text>
        <Box as="ol" marginLeft={4} className="terms-of-use__terms-list">
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            an electronic or physical signature of the person authorized to act
            on behalf of the owner of the copyright or other intellectual
            property interest;
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            a description of the copyrighted work or other intellectual property
            that you claim has been infringed;
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            a description of where the material that you claim is infringing is
            located with respect to the Offerings;
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            your address, telephone number, and email address;
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            a statement by you that you have a good faith belief that the
            disputed use is not authorized by the copyright owner, its agent, or
            the law;
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            a statement by you, made under penalty of perjury, that the above
            information in your notice is accurate and that you are the
            copyright or intellectual property owner or authorized to act on the
            copyright or intellectual property owner’s behalf.
          </Text>
        </Box>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          You can reach us at:
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          Email:
          <ButtonLink
            href="mailto:notices@consensys.net"
            target="_blank"
            rel="noopener noreferrer"
            color={TextColor.primaryDefault}
            variant={TextVariant.bodySm}
          >
            notices@consensys.net
          </ButtonLink>
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          Subject Line: Copyright Notification Mail
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          Attention: Copyright ℅
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          Consensys Software Inc.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          5049 Edwards Ranch Road, Fort Worth, TX 76109
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          13. Definitions.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Acceptable Use Policy” means the policy set forth below, as it may be
          updated by us from time to time. You agree not to, and not to allow
          third parties to, use the Offerings:
        </Text>
        <Box as="ol" marginLeft={4} className="terms-of-use__terms-list">
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            to violate, or encourage the violation of, the legal rights of
            others (for example, this may include allowing End Users to infringe
            or misappropriate the intellectual property rights of others in
            violation of the Digital Millennium Copyright Act);
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            to engage in, promote or encourage any illegal or infringing
            content;
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            for any unlawful, invasive, infringing, defamatory or fraudulent
            purpose (for example, this may include phishing, creating a pyramid
            scheme or mirroring a website);
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            to intentionally distribute viruses, worms, Trojan horses, corrupted
            files, hoaxes, or other items of a destructive or deceptive nature;
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            to interfere with the use of the Offerings, or the equipment used to
            provide the Offerings, by customers, authorized resellers, or other
            authorized users;
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            to disable, interfere with or circumvent any aspect of the Offerings
            (for example, any thresholds or limits);
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            to generate, distribute, publish or facilitate unsolicited mass
            email, promotions, advertising or other solicitation; or
          </Text>
          <Text as="li" variant={TextVariant.bodySm} marginBottom={2}>
            to use the Offerings, or any interfaces provided with the Offerings,
            to access any other product or service in a manner that violates the
            terms of service of such other product or service.
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
          “Digital Assets” means any digital asset (including virtual currency
          or virtual commodity) which is a digital representation of value based
          on (or built on top of) a cryptographic protocol of a computer
          network.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “End User” means any individual or entity that directly or indirectly
          through another user: (a) accesses or uses Your Content; or (b)
          otherwise accesses or uses the Offerings under your account.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Fees” has the meaning set forth in Section 4.2.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Losses” means any claims, damages, losses, liabilities, costs, and
          expenses (including reasonable attorneys’ fees).
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Our Content” means any software (including machine images), data,
          text, audio, video, images, or documentation that we offer in
          connection with the Offerings.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Our Marks” means any trademarks, service marks, service or trade
          names, logos, and other designations of Consensys Software Inc. and
          their affiliates or licensors that we may make available to you in
          connection with this Agreement.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Order” means an order for Offerings executed through an order form
          directly with Consensys, or through a cloud vendor, such as Amazon Web
          Services, Microsoft Azure, or Google Cloud.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Offerings” means each of the products and services, including but not
          limited to Codefi, Infura, MetaMask, Quorum and any other features,
          tools, materials, or services offered from time to time, by us or our
          affiliates.
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
            href="https://consensys.io/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
            color={TextColor.primaryDefault}
            variant={TextVariant.bodySm}
          >
            https://consensys.io/privacy-notice
          </ButtonLink>{' '}
          (and any successor or related locations designated by us), as it may
          be updated by us from time to time.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Service Offerings” means the Services (including associated APIs),
          Our Content, Our Marks, and any other product or service provided by
          us under this Agreement. Service Offerings do not include Third-Party
          Content or Third-Party Services.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Suggestions” means all suggested improvements to the Service
          Offerings that you provide to us.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Supported Digital Assets” means only those particular Digital Assets
          listed as available to interact with or self-custody in your MetaMask
          wallet. Services and supported assets may vary by jurisdiction.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Term” means the term of this Agreement described in Section 6.1.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Termination Date” means the effective date of termination provided in
          accordance with Section 6, in a notice from one party to the other.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Third-Party Content” means Content made available to you by any third
          party on the Site or in conjunction with the Offerings.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          “Your Content” means content that you or any End User transfers to us
          for storage or hosting by the Offerings and any computational results
          that you or any End User derive from the foregoing through your use of
          the Offerings, excluding however any information submitted to a
          blockchain protocol for processing.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          Appendix 1 - Additional Offerings
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          In addition to the Service Offerings described in the Terms, the
          following services ("Additional Offerings") may be made available by
          Consensys to You. The provisions for each Additional Offering below
          apply to your use of such Additional Offerings, supplementing the
          other applicable provisions of the Terms. If you do not use any
          Additional Offerings, then this Appendix does not apply to you.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          1. Staking Services
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          When you hold Supported Digital Assets in your MetaMask wallet you may
          be given the option to license our software that you may use to
          “stake” on your own behalf these assets in a third party
          proof-of-stake (POS) network. Please visit our staking information
          page for further details on how proof of stake consensus mechanism
          works.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.1. General. Through MetaMask Staking, you can stake specific assets
          to receive rewards for securing Proof-of-Stake (POS) networks. You may
          choose to stake your assets by delegating to a Consensys-operated
          validator node or to a third-party validator node (both a “Designated
          Validator Node”). If you choose to stake your assets with a
          third-party validator node (including the “Lido Staked ETH” node or
          any other provider), then such staking is subject to the third party’s
          staking terms and conditions. CONSENSYS DOES NOT PROVIDE ANY ADVICE OR
          MAKE ANY RECOMMENDATIONS ABOUT ENGAGING IN STAKING OR CHOOSING A
          VALIDATOR. Your choice to participate in staking and which method to
          do so are entirely your own. Consensys reserves the right to modify
          the list of referenced validators at any time without prior notice.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.2. Staking Rewards and Fees. You understand and agree that the
          delegation of staking rights to a validator operator listed in
          Metamask does not grant to your benefit any right to request payment
          of any kind, but merely a potential right to share a reward perceived
          by the validator. If you stake your assets through MetaMask Staking,
          the Designated Validator Node will be acting as a transaction
          validator on the applicable Proof-of-Stake (POS) network. If the
          Designated Validator Node successfully validates a block of
          transactions in that network, you may receive staking rewards granted
          by such network and Consensys will receive a flat service fee (at the
          rate indicated either on the Site or in the user interface of the
          Offering). Your reward will be determined by the protocols of the
          applicable network. Please be aware that some Proof-of-Stake networks
          require that a certain amount of staked assets be “locked” (restricted
          from any use, sale or transfer) for a certain period of time while
          staking.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.3 No Custody. Consensys operates non-custodial services, including
          staking, meaning we do not have access to the security key that
          permits you to access the funds you have staked and any rewards you
          have earned. We are not able to take custody of your rewards or
          assets. You acknowledge that you and not Consensys are responsible for
          safeguarding the security key that controls access to your staked
          tokens and your rewards.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.4 Disclaimer and Slashing. Staking is provided “as is”. Consensys is
          not responsible in any way for any failure by any supported blockchain
          network to transfer rewards (including any risks of “slashing”) or for
          the loss, destruction, or transfer of rewards to the incorrect wallet
          address. Consensys does not guarantee uninterrupted or error-free
          operation of the staking services or that it will correct all defects
          or prevent third-party disruptions or unauthorized third party access.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.5 Suspension, Termination and Withdrawal. You may un-stake or stop
          using the services at any time. Depending on the protocol and the
          provider withdrawal processing queue, which Consensys does not
          control, the unstaking process may take hours or even days to
          complete. Any expected unstaking periods are estimates only. You may
          have to complete additional steps to claim your rewards depending on
          the third party service provider that is supporting the validators you
          chose to use. Consensys may suspend or terminate this staking offering
          for any reason in its sole discretion and is under no obligation to
          disclose the details of its decision to take such action with you, but
          if Consensys does so, Consensys will not itself inhibit access to your
          staked tokens or to any rewards you have earned, but we take no
          responsibility for any third party service provider or any third party
          protocol. In certain offerings, such as MetaMask Validator Staking,
          Consensys may be able to initiate the un-stake process to the wallet
          you staked with. Upon 90 days notice from Consensys of termination of
          the offering or suspension of your access, you must initiate and
          complete the un-stake process. After Upon expiration of that 90 day
          notice period, in its sole discretion, Consensys may initiate the
          un-stake process on your behalf and your staked tokens and any rewards
          issued by the third party protocol to the wallet you staked with and
          will not accessible by Consensys.
        </Text>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          1.6 No Guarantee of Rewards. CONSENSYS DOES NOT GUARANTEE THAT YOU
          WILL RECEIVE STAKING REWARDS OR ANY STAKING REWARD RATES. SUCCESSFUL
          TRANSFER OF THE REWARDS IS SUBJECT TO THE PROOF-OF-STAKE NETWORKS AND
          IS NOT UNDER CONSENSYS’ CONTROL. REWARD RATES ARE DETERMINED BY THE
          UNDERLYING PROTOCOLS AND NOT BY CONSENSYS AND MAY FLUCTUATE, INCLUDING
          BECAUSE THE UNDERLYING SERVICES GENERATING REWARDS ARE PERFORMED
          IMPROPERLY.
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
          2. Linea and Bridging
        </Text>{' '}
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          Please visit the Linea{' '}
          <ButtonLink
            href="https://linea.build/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            color={TextColor.primaryDefault}
            variant={TextVariant.bodySm}
          >
            Terms of Service
          </ButtonLink>
          .
        </Text>
      </Box>
    </Box>
  );
};
