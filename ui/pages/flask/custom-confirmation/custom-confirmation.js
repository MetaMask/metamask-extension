import React, { useCallback } from 'react';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import SiteOrigin from '../../../components/ui/site-origin/site-origin';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TextArea from '../../../components/ui/textarea/textarea';
import { RESIZE } from '../../../helpers/constants/design-system';
import { useSelector } from 'react-redux';
import { getDomainMetadata } from '../../../selectors';

export default function CustomConfirmation() {
  const t = useI18nContext();

  const onCancel = useCallback(() => {}, []);
  const onSubmit = useCallback(() => {}, []);

  const domainMetadata = useSelector(getDomainMetadata);

  return (
    <div className="page-container custom-confirmation">
      <div className="top-bar">
        <div className="page-count">{t('xOfY', ['1', '1'])}</div>
      </div>
      <div className="page-content">
        <div className="headers">
          <div className="icon">
            <SiteOrigin
              siteOrigin={domainMetadata.origin}
              iconSrc={domainMetadata.icon}
              name={domainMetadata.iconName}
            />
          </div>
          <div className="title">A request question here?</div>
          <div className="subtitle">A description of what is going on</div>
          <div className="text-area">
            <TextArea
              height="400px"
              value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus
                dapibus ligula nec nulla mollis finibus. Sed at blandit quam.
                Vestibulum arcu nunc, pulvinar sed tristique ac, varius eget est.
                Sed scelerisque pretium tincidunt. Mauris rhoncus porttitor
                elementum. Aliquam erat volutpat. Aenean accumsan elit lacinia,
                aliquam risus convallis, tincidunt elit. Fusce elementum, lectus
                at interdum sollicitudin, ligula lorem consectetur nibh, in
                venenatis dui libero eget purus. Sed imperdiet, lectus vel rhoncus
                lobortis, nisl tortor volutpat neque, nec lacinia magna tellus at
                felis. Fusce facilisis sem ac diam mollis, vel gravida sapien
                consequat. Praesent sollicitudin, justo at blandit malesuada,
                tortor enim congue lorem, in fringilla diam nisl et ipsum. Nulla
                facilisi. Mauris at arcu lacus. Vestibulum ante ipsum primis in
                faucibus orci luctus et ultrices posuere cubilia curae; Nunc
                pulvinar nulla a quam varius, sed gravida purus suscipit. Cras
                dictum, est sit amet venenatis condimentum, massa velit mattis
                augue, vel lobortis nunc risus sit amet odio. Nullam ut tempor
                nunc. Quisque ullamcorper sed sapien id lacinia. Phasellus et
                gravida nibh. Nullam sollicitudin ultrices mi, at accumsan ex
                maximus vitae. Maecenas velit nisi, pellentesque a hendrerit id,
                congue sed ipsum. Vivamus varius egestas mauris nec semper. In sed
                tortor vel orci rhoncus posuere eu non sem. Aenean congue eu
                tortor sed iaculis. Fusce blandit ac justo eget euismod. Aenean eu
                tincidunt augue. Cras vitae orci augue. Mauris pulvinar diam vitae
                euismod suscipit. Quisque ligula lorem, tristique ut semper vel,
                sodales sed turpis. Nam sagittis porttitor turpis vitae pharetra.
                Nullam lectus diam, dignissim id dictum sed, ornare ut urna. Nulla
                sit amet justo vitae ex porta lobortis quis id quam. Nam ut odio
                sit amet dui sollicitudin varius. Nullam rutrum risus eget lacus
                molestie sodales. Mauris vehicula nunc odio, ut lobortis massa
                luctus ac. Pellentesque ultrices egestas diam et interdum. Aenean
                sed consequat orci. Phasellus quis turpis nibh. Vestibulum congue
                porttitor tortor, vel sodales elit aliquam laoreet. Quisque
                consequat dui velit, in sodales sapien viverra in. Curabitur non
                mollis mi. Maecenas non tellus nibh. Curabitur tempor, orci ac
                ultrices varius, purus ipsum hendrerit quam, sed euismod erat
                augue quis augue. Curabitur at orci rutrum, elementum dui non,
                accumsan dui. Vivamus luctus magna sit amet leo tempus laoreet.
                Duis sollicitudin, quam vel hendrerit luctus, leo augue lacinia
                nunc, ac congue libero nisl in est. Ut pretium, erat vel pretium
                sagittis, neque sapien tempor justo, eget porta leo turpis in
                massa. In hac habitasse platea dictumst. Sed tempus tellus id
                vehicula faucibus. Nulla consequat lectus vitae eleifend congue.
                Fusce commodo dolor tortor, ut aliquet eros tincidunt vel. Sed
                quis suscipit magna, quis molestie elit."
              resize={RESIZE.VERTICAL}
              scrollable={true}
              className="text"
            />
          </div>
        </div>
        <div className="footers">
          <PermissionsConnectFooter />
          <PageContainerFooter
            cancelButtonTyype="default"
            onCancel={onCancel}
            cancelText={t('reject')}
            onSubmit={onSubmit}
            submitText={t('sign')}
            buttonsSizeLarge={false}
          />
        </div>
      </div>
    </div>
  );
}
