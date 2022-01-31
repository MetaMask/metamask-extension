import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import NewNetworkInfo from './new-network-info';

describe('NewNetworkInfo', () => {
    const props = {
        primaryTokenImage: "./images/eth_logo.svg",
        providerTicker: "ETH",
        providerNickname: "",
        providerType: "mainnet",
        tokenDetectionSupported: false,
    }

    it('should render title', () => {
        const { container } = render(<NewNetworkInfo {...props} />);
        const title = container.querySelector('.new-network-info__title');
        expect(title).toBeDefined();
    });

    it('should render a question mark icon image', () => {
        props.primaryTokenImage = undefined;
        const { container }  = render(<NewNetworkInfo {...props} />);
        const questionMark = container.querySelector('.fa fa-question-circle');
        expect(questionMark).toBeDefined();
    })

    it('should render first box when provider ticker is available', () => {
        const { container } = render(<NewNetworkInfo {...props} />);
        const firstBox = container.querySelector('.new-network-info__content-box-1');
        expect(firstBox).toBeDefined();
    });

    it('should not render first box when provider ticker is not available', () => {
        props.providerTicker = undefined;
        const { container } = render(<NewNetworkInfo {...props} />);
        const firstBox = container.querySelector('.new-network-info__content-box-1');
        expect(firstBox).toBeNull();
    });

    it('should render text in first box when provider ticker is available', () => {
        const { container } = render(<NewNetworkInfo {...props} />);
        const firstBoxText = container.querySelector('.new-network-info__content-box-1__text-1');
        expect(firstBoxText).toBeDefined();
    });

    it('should not render first box when provider ticker is not available', () => {
        const { container } = render(<NewNetworkInfo {...props} />);
        const firstBox = container.querySelector('.new-network-info__content-box-1');
        expect(firstBox).toBe(null);
    });

    it('should render text in second box', () => {
        const { container } = render(<NewNetworkInfo {...props} />);
        const secondBoxText = container.querySelector('.new-network-info__content-box-1__text-1');
        expect(secondBoxText).toBeDefined();
    });

    it('should not render text in second box', () => {
        props.tokenDetectionSupported = true;
        const { container } = render(<NewNetworkInfo {...props} />);
        const secondBoxText = container.querySelector('.new-network-info__content-box-1__text-1');
        expect(secondBoxText).toBeNull();
    });
})