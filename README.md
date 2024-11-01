### 1. 一些文档
- [如何向 Chrome 添加自定义版本](docs%2Fadd-to-chrome.md)
- [如何向 Firefox 添加自定义版本](docs%2Fadd-to-firefox.md)
- [发版指南](docs%2Fpublishing.md)
- [如何添加隐藏在秘密功能标志后面的功能](docs%2Fsecret-preferences.md)
- [在 MetaMask 上进行开发](development%2FREADME.md)

### 2. 构建

- [Node.js](https://nodejs.org) version 20
  - 如果您正在使用 [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) （推荐），运行 `nvm use` 将自动为您选择正确的节点版本。
- 通过在 metamask-extension 项目中执行命令来启用 Corepack。Corepack `corepack enable` 是 Node.js 默认附带的实用程序。它使用 `packageManager` 项目的 package.json 文件中属性指定的版本，按项目管理 Yarn。请注意， [Yarn](https://yarnpkg.com/getting-started/install) 的现代版本不打算全局安装或通过 npm 安装。
- 复制根目录中.metamaskrc.dist并将其重命名为.metamaskrc
  - `INFURA_PROJECT_ID`用您自己的个人[Infura API Key](https://docs.infura.io/networks/ethereum/how-to/secure-a-project/project-id)替换该值
    - 如果您没有 Infura 帐户，您可以在 [Infura website](https://app.infura.io/register) 上免费创建一个。
  - 如果调试 MetaMetrics，则需要为`SEGMENT_WRITE_KEY` [Segment write key](https://segment.com/docs/connections/find-writekey/)添加一个值，请参阅[在MetaMask 上进行开发 - Segment](development%2FREADME.md#segment).
  - 如果调试未处理的异常，您需要为`SENTRY_DSN` [Sentry Dsn](https://docs.sentry.io/product/sentry-basics/dsn-explainer/)添加一个值，请参阅[在 MetaMask - Sentry 上进行开发](development%2FREADME.md#sentry).
  - 或者，将该 `PASSWORD` 值替换为您的开发钱包密码，以避免每次打开应用程序时都输入该密码。
- 运行`yarn install`以安装依赖项
- `./dist/`使用`yarn dist`（针对基于 Chromium 的浏览器）或`yarn dist:mv2`（针对 Firefox）将项目构建到文件夹中
  - 或者，要创建开发版本，您可以运行`yarn start`（针对基于 Chromium 的浏览器）或`yarn start:mv2`（针对 Firefox）
  - 未压缩的版本可以在 中找到，压缩的版本在构建后`/dist`可以在 中找到。`/builds`
  - 有关[构建系统](development%2Fbuild%2FREADME.md)使用信息，请参阅构建系统自述文件。
- 按照以下说明验证您的本地构建是否正常运行：
  - [如何向 Chrome 添加自定义版本](docs%2Fadd-to-chrome.md)
  - [如何向 Firefox 添加自定义版本](docs%2Fadd-to-firefox.md)

