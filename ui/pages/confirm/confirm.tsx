import React from 'react';

import { Footer as ConfirmFooter } from '../../components/app/confirm/footer';
import ScrollToBottom from '../../components/app/confirm/scroll-to-bottom';
import { ConfirmTitle } from '../../components/app/confirm/title';
import { Footer, Page } from '../../components/multichain/pages/page';
import { BackgroundColor } from '../../helpers/constants/design-system';
import setCurrentConfirmation from '../../hooks/confirm/setCurrentConfirmation';
import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  return (
    <Page backgroundColor={BackgroundColor.backgroundAlternative}>
      <ConfirmTitle />
      <ScrollToBottom padding={4}>
        {/* todo: replace with ConfirmInfo content */}
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel
        suscipit tortor. Curabitur vulputate felis nibh, vel pellentesque erat
        fermentum eget. Duis id turpis cursus, blandit magna sit amet, tempor
        sem. Orci varius natoque penatibus et magnis dis parturient montes,
        nascetur ridiculus mus. Maecenas ex nulla, suscipit id eros in,
        elementum lacinia leo. Etiam dignissim neque vitae nibh pretium, sed
        egestas est mollis. Nam venenatis tellus sed tempor bibendum. Phasellus
        sodales quam nec enim imperdiet, non dignissim ipsum maximus.
        Suspendisse tempor vestibulum nisl, vel congue est semper ac. Class
        aptent taciti sociosqu ad litora torquent per conubia nostra, per
        inceptos himenaeos. Praesent mattis lorem lectus, sit amet suscipit elit
        egestas nec. Nam rhoncus eleifend velit, sed rhoncus enim porttitor at.
        Nam eget leo ut purus pulvinar sodales. Nullam ornare euismod dignissim.
        Duis blandit commodo viverra. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Donec vel suscipit tortor. Curabitur vulputate felis
        nibh, vel pellentesque erat fermentum eget. Duis id turpis cursus,
        blandit magna sit amet, tempor sem. Orci varius natoque penatibus et
        magnis dis parturient montes, nascetur ridiculus mus. Maecenas ex nulla,
        suscipit id eros in, elementum lacinia leo. Etiam dignissim neque vitae
        nibh pretium, sed egestas est mollis. Nam venenatis tellus sed tempor
        bibendum. Phasellus sodales quam nec enim imperdiet, non dignissim ipsum
        maximus. Suspendisse tempor vestibulum nisl, vel congue est semper ac.
        Class aptent taciti sociosqu ad litora torquent per conubia nostra, per
        inceptos himenaeos. Praesent mattis lorem lectus, sit amet suscipit elit
        egestas nec. Nam rhoncus eleifend velit, sed rhoncus enim porttitor at.
        Nam eget leo ut purus pulvinar sodales. Nullam ornare euismod dignissim.
        Duis blandit commodo viverra. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Donec vel suscipit tortor. Curabitur vulputate felis
        nibh, vel pellentesque erat fermentum eget. Duis id turpis cursus,
        blandit magna sit amet, tempor sem. Orci varius natoque penatibus et
        magnis dis parturient montes, nascetur ridiculus mus. Maecenas ex nulla,
        suscipit id eros in, elementum lacinia leo. Etiam dignissim neque vitae
        nibh pretium, sed egestas est mollis. Nam venenatis tellus sed tempor
        bibendum. Phasellus sodales quam nec enim imperdiet, non dignissim ipsum
        maximus. Suspendisse tempor vestibulum nisl, vel congue est semper ac.
        Class aptent taciti sociosqu ad litora torquent per conubia nostra, per
        inceptos himenaeos. Praesent mattis lorem lectus, sit amet suscipit elit
        egestas nec. Nam rhoncus eleifend velit, sed rhoncus enim porttitor at.
        Nam eget leo ut purus pulvinar sodales. Nullam ornare euismod dignissim.
        Duis blandit commodo viverra.
      </ScrollToBottom>
      <Footer>
        <ConfirmFooter />
      </Footer>
    </Page>
  );
};

export default Confirm;
