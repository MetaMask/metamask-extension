FROM cimg/node:20.11.0-browsers AS build

WORKDIR '/usr/src/app'

USER root
COPY . .
# Download and install Chrome
RUN wget -q https://googlechromelabs.github.io/chrome-for-testing/#stable -O chrome.html \
    && CHROME_VERSION=$(grep -o 'Stable<\/a><td><code>[0-9.]\+' chrome.html | sed 's/Stable<\/a><td><code>//') \
    && CHROME_URL="https://storage.googleapis.com/chrome-for-testing-public/$CHROME_VERSION/linux64/chrome-linux64.zip" \
    && wget -q "$CHROME_URL" -O chrome.zip \
    && unzip -q chrome.zip \
    && rm -f chrome.zip \
    && mv chrome-linux64 /usr/local/bin/chrome &&\
    chmod +x /usr/local/bin/chrome

# Download the latest ChromeDriver
RUN LATEST_CHROME_DRIVER_VERSION=$(curl -s https://googlechromelabs.github.io/chrome-for-testing/#stable | grep -o 'Stable<\/a><td><code>[0-9.]\+' | sed 's/Stable<\/a><td><code>//') && \
    echo $LATEST_CHROME_DRIVER_VERSION &&\
    wget -O /tmp/chromedriver.zip https://storage.googleapis.com/chrome-for-testing-public/$LATEST_CHROME_DRIVER_VERSION/linux64/chromedriver-linux64.zip && \
    unzip /tmp/chromedriver.zip && \
    mkdir -p /usr/local/bin && \
    mv chromedriver-linux64/chromedriver /usr/local/bin/chromedriver &&\
    chmod +x /usr/local/bin/chromedriver

# Set environment variable for ChromeDriver
ENV PATH="/usr/local/bin:${PATH}"

# Install testing dependencies
ENV HEADLESS=false
ENV ENABLE_CHROME_LOGGING=true
# ENV HEADLESS=true
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
# ENV NVIDIA_VISIBLE_DEVICES=all

ENTRYPOINT ["xvfb-run", "-a", "yarn", "test:e2e:single", "/usr/src/app/test/e2e/tests/account-menu/account-details.spec.js", "--browser=chrome"]
