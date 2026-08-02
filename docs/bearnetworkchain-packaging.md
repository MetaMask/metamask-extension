# Bear Network Chain 客製版 — 正式封裝說明

本文件描述 **Bear Network Chain 客製版**（MetaMask 分支）的**正式／可公开发布**封裝流程。

## 專用封裝指令

在 **Windows PowerShell** 下請使用：

```powershell
yarn.cmd dist
```

在 bash / macOS / Linux 下可使用：

```bash
yarn dist
```

> **Bear Network Chain 客製版：正式封裝一律以 `yarn.cmd dist`（或 `yarn dist`）為準。**  
> 產出可載入的未壓縮擴充功能與可上傳／分發的 ZIP。

### 指令做了什麼

`yarn dist` 會依序：

1. 執行 `lavamoat:check-fetch-endowments` — 檢查 LavaMoat 的 `fetch` / `btoa` endowment（避免 RPC `Illegal invocation`）
2. 以 **production + LavaMoat** 建置 Chrome MV3
3. 產出 ZIP 到 `builds/`

請**不要**用 `--no-lavamoat` 做公开发布；正式包必須保留 LavaMoat 安全層。

---

## 首次／環境準備

```powershell
# 1. Node 版本（見 .nvmrc，建議 >= 24）
# 2. 啟用 Corepack（管理 Yarn）
corepack enable

# 3. 安裝依賴
yarn.cmd install

# 4. 設定環境（若尚無 .metamaskrc）
copy .metamaskrc.dist .metamaskrc
```

編輯 `.metamaskrc`，至少設定真實 Infura Project ID：

```ini
INFURA_PROJECT_ID=你的_infura_project_id
```

> 占位值（如 `00000000000`）可以通過建置，但鏈上 RPC 會失敗。  
> 請到 [Infura](https://app.infura.io/) 建立專案並填入 Project ID。

若為乾淨環境首次建置，webpack 工具需先編譯（`yarn install` 後若已有 `development/.webpack/` 可略過）：

```powershell
yarn.cmd webpack:tsc
```

---

## 正式封裝（客製版標準流程）

```powershell
yarn.cmd dist
```

成功後產物：

| 路徑 | 說明 |
|------|------|
| `dist/chrome/` | 未壓縮擴充功能（Chrome / Edge / Brave 等 Chromium 載入用） |
| `dist/sourcemaps/` | Source maps |
| `builds/metamask-chrome-<version>.zip` | 壓縮包（分發／上架用） |

版本號來自專案 manifest／建置設定（例如 `metamask-chrome-13.44.0.zip`）。

---

## 載入與驗證

### Chromium（Chrome / Edge / Brave）

1. 開啟 `chrome://extensions`（或對應瀏覽器的擴充功能頁）
2. 開啟「開發人員模式」
3. 「載入未封裝項目」→ 選擇專案下的 `dist/chrome`
4. 開擴充功能，確認可連線 Ethereum Mainnet（與 Bear Network 等已整合網路）

詳細步驟也可參考：[How to add custom build to Chrome](./add-to-chrome.md)。

### 常見問題：Unable to connect to Ethereum

若 Service Worker 控制台出現：

```text
Failed to execute 'fetch' on 'WorkerGlobalScope': Illegal invocation
```

代表 LavaMoat 的 `fetch` endowment 不正確。本客製版已在 `lavamoat/webpack/**/policy-override.json` 固定完整 `fetch` / `btoa`，並由 `yarn dist` 前置的 `lavamoat:check-fetch-endowments` 守護。

請確認：

1. 使用的是本倉庫的 `yarn.cmd dist`（不要略過 check）
2. `.metamaskrc` 的 `INFURA_PROJECT_ID` 為有效 key
3. 重新載入擴充功能前可先移除舊版再載入 `dist/chrome`

手動檢查 endowment：

```powershell
yarn.cmd lavamoat:check-fetch-endowments
```

---

## 開發建置（非發布）

日常開發、熱更新請用：

```powershell
yarn.cmd start
```

- 輸出同樣在 `dist/chrome/`，但為 development 模式，**預設不啟用 LavaMoat**
- **不可**以此作為公開 ZIP 的正式封裝指令

Firefox MV2 正式包（若需要）：

```powershell
yarn.cmd dist:mv2
```

---

## 依賴／LavaMoat 政策變更後

若有新增依賴或修改建置工具存取行為：

```powershell
yarn.cmd lavamoat:auto
yarn.cmd lavamoat:check-fetch-endowments
yarn.cmd dist
```

`policy-override.json` 中的 `@metamask/network-controller` `fetch` / `btoa` 必須保留，否則正式包 RPC 可能再次失敗。

---

## 快速對照

| 用途 | 指令 |
|------|------|
| **Bear Network Chain 客製版正式封裝（專用）** | **`yarn.cmd dist`** |
| 開發 watch | `yarn.cmd start` |
| Firefox 正式封裝 | `yarn.cmd dist:mv2` |
| LavaMoat fetch 檢查 | `yarn.cmd lavamoat:check-fetch-endowments` |
| 再生 LavaMoat 政策 | `yarn.cmd lavamoat:auto` |

---

## 相關文件

- [Building on your local machine](../README.md#building-on-your-local-machine)（上游 README）
- [Add to Chrome](./add-to-chrome.md)
- [Add to Firefox](./add-to-firefox.md)
- [LavaMoat policy review](./lavamoat-policy-review-process.md)
