# TERA Translate Chat AI

TERA 聊天翻译插件。支持 Google 翻译(默认)和自定义 AI 接口，可独立配置接收和发送的翻译引擎。

[English](README.md) | [简体中文](README-zh.md)

---
 **⚠️ 隐私与数据安全免责声明**

 本插件通过调用第三方 AI 模型（如 OpenAI GPT, Google Gemini）来实现翻译功能。在使用此功能前，请务必注意以下事项：

 1.  **数据传输**：为了进行翻译，您的游戏聊天内容将被发送至您配置的 AI 服务提供商的服务器。
 2.  **模型训练风险**：请仔细查阅您所选用的 AI 服务提供商的隐私条款。某些服务商（尤其是免费版或非企业级 API）可能会将上传的数据用于**模型训练**或**质量改进**。这意味着您的聊天记录理论上可能被用于优化未来的 AI 模型。
 3.  **敏感信息**：建议不要使用本插件翻译包含个人身份信息（PII）、账号密码或高度敏感的私聊内容。

 **如果您对数据隐私高度敏感，或者不希望您的聊天内容被第三方 AI 公司获取，请勿开启或使用 AI 翻译功能。**
 
---
## 说明

*   **Google 翻译**：
    *   插件内置 Google 翻译，开箱即用，无需任何配置。

*   **AI 翻译接口**：
    *   支持添加兼容 OpenAI 格式的 API 接口。
    *   可使用 ChatGPT, Gemini, DeepSeek等Ai模型接口。
    *   需要自行获取 API 密钥并通过命令添加。

*   **本地缓存**：
    *   缓存已翻译的内容到本地，相同内容无需重复请求 API。
    *   减少 API 调用次数，节省费用并加快响应速度。
    *   采用 LRU (最近最少使用) 策略管理缓存，自动清理旧条目。
    *   支持手动保存、搜索和按条件删除缓存。

*   **图形界面 (GUI)**：
    *   输入 `/8 translate` 即可打开图形设置界面。
    *   可在界面中切换翻译引擎、设置语言、管理缓存等。
    *   界面支持多语言显示。

### 支持的语言代码
`am, ar, az, be, bg, bn, ca, cs, da, de, el, en, es, et, eu, fa, fi, fr, gu, he, hi, hr, hu, hy, is, it, ja, ka, kn, ko, ku, lo, lt, lv, ml, mr, ms, nl, no, or, pa, pl, pt, ro, ru, sk, sl, sq, sr, sv, ta, te, th, tl, tr, uk, ur, vi, yo, zh, zh-TW, auto`

---

## 快速开始

1.  **使用**：进入游戏后插件自动运行，默认使用 Google 翻译。
2.  **设置**：
    *   输入 `/8 translate` 打开设置界面。

### 语言设置
*   **源语言 (Source Language)**: 消息发送者的语言。通常保留默认值 `auto` (自动检测)。
*   **目标语言 (Target Language)**: 接收翻译的目标语言。即您希望**看到**的语言。
*   **发送语言 (Send Language)**: 发送翻译的目标语言。即您希望**发送**出去的语言。

### 说明
*   **跳过翻译**：如果您开启了发送翻译模式，但某条消息不想被翻译，可以在消息末尾添加 **#** 号 (例如 `hello#`)，插件将直接发送原文。

---

## AI 接口配置

### 1. 添加接口
使用命令添加您的 API 服务。
格式：`/8 translate endpoint add <名称> <API地址> <密钥>`
```bash
/8 translate endpoint add mygpt https://api.openai.com/v1 sk-your-api-key...
```
*注意：API 地址通常以 `/v1` 结尾，不需要包含 `/chat/completions`（即使包含也会被自动去除）。*

### 2. 在 GUI 界面中选择接口并获取模型
输入 `/8 translate` 打开图形界面，在 **Receive Settings** (接收设置) 或 **Send Settings** (发送设置) 中，将 **Translation Provider** 选择为您刚才添加的接口 (如 `mygpt`)，然后点击 **获取远程模型列表** 按钮，插件会自动从远程 API 拉取可用模型供您选择。

### 3. 无法获取时的备用方案
如果在 GUI 中无法成功获取远程模型列表，可以通过命令手动获取或设置模型。

**通过命令获取远程模型：**
格式：`/8 translate endpoint fetch-models <名称>`
```bash
/8 translate endpoint fetch-models mygpt
```

**手动填写模型列表：**
格式：`/8 translate endpoint models <名称> <模型列表>`
```bash
/8 translate endpoint models mygpt gpt-4o-mini,gpt-3.5-turbo
```

---

## API接口供应商

### OpenRouter (推荐)

[OpenRouter](https://openrouter.ai/) 提供多种免费和付费模型。累计购买过 $10 积分的用户可享受每个免费模型每天 1000 次调用（未充值用户每天 50 次），付费模型按使用量另外计费。

**配置示例：**
```bash
/8 translate endpoint add openrouter https://openrouter.ai/api/v1 sk-api-key
```
添加后，在 GUI 界面中选择 `openrouter` 接口并点击 **获取远程模型列表** 按钮即可获取可用模型。

> 💡 **获取免费模型**：访问 [OpenRouter Models](https://openrouter.ai/models) 页面，搜索 `free` 即可查看所有可用的免费模型。如果无法通过 GUI 获取模型列表，也可以用 `translate endpoint models` 手动补充，作为备用方案。

### Google Gemini

**配置示例：**
```bash
/8 translate endpoint add gemini https://generativelanguage.googleapis.com/v1beta/openai api-key
```
添加后，在 GUI 界面中选择 `gemini` 接口并点击 **获取远程模型列表** 按钮即可获取可用模型。

> ⚠️ **注意**：Gemini 的接口地址与标准 OpenAI 格式不同，基础路径为 `https://generativelanguage.googleapis.com/v1beta/openai`。

---
## 界面预览

![Interface Preview](https://i.imgur.com/c8KcL8d.jpeg)

---

## 详细命令列表

### 基础命令
| 命令 | 说明 |
| :--- | :--- |
| `/8 translate gui` | 打开图形设置界面 |
| `/8 translate list` | 查看命令帮助 |

### 配置命令
| 命令 | 说明 |
| :--- | :--- |
| `/8 translate config enabled <true/false>` | 开启/关闭插件 (别名: `on/off`) |
| `/8 translate config sendMode <true/false>` | 开启/关闭发送翻译模式 |
| `/8 translate config sourceLang <代码>` | 设置源语言 (默认 `auto`) |
| `/8 translate config targetLang <代码>` | 设置接收目标语言 (如 `zh`) |
| `/8 translate config sendLang <代码>` | 设置发送目标语言 (如 `en`) |
| `/8 translate config interfaceLanguage <代码>` | 设置界面显示语言 |
| `/8 translate interface list` | 列出支持的界面语言 |
| `/8 translate interface <代码>` | 切换界面语言快捷命令 |

### 接口管理命令
| 命令 | 说明 |
| :--- | :--- |
| `/8 translate endpoint list` | 列出所有已配置的接口信息 |
| `/8 translate endpoint add <名称> <URL> <Key>` | 添加一个新的 API 接口 |
| `/8 translate endpoint fetch-models <名称>` | 从远程 API 获取接口支持的模型列表 |
| `/8 translate endpoint models <名称> <模型...>` | 手动设置接口支持的模型列表，作为备用方案 (逗号分隔) |
| `/8 translate endpoint delete <名称>` | 删除指定名称的接口 |
| `/8 translate endpoint receive <名称> [模型]` | 设置接收通道使用的接口和模型 |
| `/8 translate endpoint send <名称> [模型]` | 设置发送通道使用的接口和模型 |
| `/8 translate endpoint fallback <名称> [模型]` | 设置回退通道使用的接口和模型 |

### 缓存管理命令
| 命令 | 说明 |
| :--- | :--- |
| `/8 translate config useCache <true/false>` | 开启/关闭缓存功能 |
| `/8 translate cache save` | 将内存中的缓存文件保存到硬盘 |
| `/8 translate cache search <关键词>` | 搜索缓存内容 |
| `/8 translate cache remove lang <代码>` | 删除指定源语言的缓存 |
| `/8 translate cache remove to <代码>` | 删除指定目标语言的缓存 |
| `/8 translate cache remove keyword <关键词>` | 删除包含关键词的缓存条目 |
| `/8 translate config cacheMaxSize <数值>` | 设置最大缓存条目数 (默认 20000) |
| `/8 translate config cacheInterval <分钟>` | 设置自动保存间隔 (默认 10) |
| `/8 translate config cacheWriteThreshold <数值>` | 设置缓存写入阈值 (默认 100) |
| `/8 translate config cacheCleanupPercentage <0.2>` | 设置清理时的删除比例 (默认 0.2) |

---

## 致谢

* [teralove](https://github.com/teralove) — 感谢创建了 translate-chat 的初始版本，为本项目奠定了基础。
* [HakuryuuDom](https://github.com/HakuryuuDom) — 感谢添加了发送翻译模式和自动更新等关键功能。
* [Pravv](https://github.com/Pravv) — 感谢对代码进行了重构和依赖优化，使项目结构更加规范。
* [hsdn](https://github.com/hsdn) — 感谢维护 TERA 模组生态，并提供了游戏补丁兼容性支持。
