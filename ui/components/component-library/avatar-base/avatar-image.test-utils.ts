type MockImageEvent = 'load' | 'error';

type MockImage = {
  onerror: (() => void) | null;
  onload: (() => void) | null;
  removeAttribute: jest.Mock;
  src?: string;
};

export function mockImageEvent(event: MockImageEvent) {
  const removeAttribute = jest.fn();

  jest.spyOn(window, 'Image').mockImplementation(() => {
    const image: MockImage = {
      onerror: null,
      onload: null,
      removeAttribute,
    };

    let imageSrc = '';
    Object.defineProperty(image, 'src', {
      get() {
        return imageSrc;
      },
      set(src) {
        imageSrc = src;
        if (event === 'load') {
          image.onload?.();
        } else {
          image.onerror?.();
        }
      },
    });

    return image as unknown as HTMLImageElement;
  });
  return { removeAttribute };
}
