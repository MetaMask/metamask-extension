import React from 'react';

import ScrollToBottom from '../../components/app/confirm/scroll-to-bottom';
import { Footer, Page } from '../../components/multichain/pages/page';
import { BackgroundColor } from '../../helpers/constants/design-system';
import { Header } from '../../components/app/confirm/header';
import { Footer as ConfirmFooter } from '../../components/app/confirm/footer';
import syncConfirmPath from '../../hooks/confirm/syncConfirmPath';
import setCurrentConfirmation from '../../hooks/confirm/setCurrentConfirmation';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  const [hasScrolledToBottom, setHasScrolledToBottom] = React.useState(false);

  // TODO: use this to show/hide footer confirm button
  // const [isConfirmable, setIsConfirmable] = React.useState(false);
  // useEffect(() => {
  //   if (isConfirmable || !hasScrolledToBottom) {
  //     return;
  //   }
  //   setIsConfirmable(true);
  // }, [hasScrolledToBottom]);

  return (
    <Page backgroundColor={BackgroundColor.backgroundAlternative}>
      <Header />
      <ScrollToBottom
        padding={4}
        hasScrolledToBottom={hasScrolledToBottom}
        setHasScrolledToBottom={setHasScrolledToBottom}
      >
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
