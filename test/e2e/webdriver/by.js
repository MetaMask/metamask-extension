const { By: SeleniumBy } = require('selenium-webdriver');
const { parse, xPathBuilder } = require('css-to-xpath');

module.exports = class By {
  constructor(selector) {
    this.selector = selector;
  }

  text(text) {
    return new By(this.selector.where(xPathBuilder.text().equals(text)));
  }

  static tag(tag) {
    return new By(parse(tag));
  }

  static css(selector) {
    return new By(parse(selector));
  }

  toSelector() {
    return SeleniumBy.xpath(this.selector.toXPath());
  }
};
