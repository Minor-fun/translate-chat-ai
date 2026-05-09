# TERA Translate Chat AI

TERA chat translation plugin. Supports Google Translate (default) and custom AI interfaces, with independent configuration for receive and send translation engines.

[English](README.md) | [简体中文](README-zh.md)

---

 **⚠️ Privacy & Data Security Disclaimer**

 This plugin utilizes third-party AI models (e.g., OpenAI GPT, Google Gemini) to provide translation services. Before using this feature, please be aware of the following:

 1.  **Data Transmission**: To perform translations, your in-game chat content will be sent to the servers of the AI provider you have configured.
 2.  **Data Training Risk**: Please review the privacy policy of your chosen AI provider carefully. Some providers (especially free tiers or non-enterprise APIs) may use submitted data for **model training** or **quality improvement**. This means your chat logs could theoretically be used to train future AI models.
 3.  **Sensitive Information**: It is recommended NOT to use this plugin to translate messages containing Personally Identifiable Information (PII), passwords, or highly sensitive private chats.

 **If you are concerned about data privacy or do not wish for your chat content to be processed by third-party AI companies, please DO NOT use the AI translation feature.**

---
## Description

*   **Google Translate**:
    *   Built-in Google Translate works out of the box with no configuration required.

*   **AI Translation Interface**:
    *   Supports adding OpenAI-compatible API endpoints.
    *   Works with ChatGPT, Gemini, DeepSeek,etc.
    *   Requires obtaining an API key and adding it via command.

*   **Local Cache**:
    *   Caches translated content locally; identical content does not require repeated API requests.
    *   Reduces API calls, saves costs, and speeds up response time.
    *   Uses LRU (Least Recently Used) strategy to manage cache and automatically cleans old entries.
    *   Supports manual save, search, and conditional deletion of cache.

*   **Graphical User Interface (GUI)**:
    *   Type `/8 translate` to open the graphical settings interface.
    *   Switch translation engines, set languages, manage cache, etc.
    *   Interface supports multiple display languages.

### Supported Language Codes
`am, ar, az, be, bg, bn, ca, cs, da, de, el, en, es, et, eu, fa, fi, fr, gu, he, hi, hr, hu, hy, is, it, ja, ka, kn, ko, ku, lo, lt, lv, ml, mr, ms, nl, no, or, pa, pl, pt, ro, ru, sk, sl, sq, sr, sv, ta, te, th, tl, tr, uk, ur, vi, yo, zh, zh-TW, auto`

---

## Quick Start

1.  **Usage**: The plugin runs automatically after entering the game, using Google Translate by default.
2.  **Settings**:
    *   Type `/8 translate` to open the settings interface.

### Language Settings
*   **Source Language**: The language of the message sender. Usually keep the default value `auto` (auto-detect).
*   **Target Language**: The target language for received translations. The language you want to **see**.
*   **Send Language**: The target language for sent translations. The language you want to **send**.

### Notes
*   **Skip Translation**: If you have send translation mode enabled but don't want a specific message translated, add **#** at the end of the message (e.g., `hello#`), and the plugin will send the original text.

---

## AI Interface Configuration

### 1. Add Endpoint
Use a command to add your API service.
Format: `/8 translate endpoint add <name> <API_URL> <key>`
```bash
/8 translate endpoint add mygpt https://api.openai.com/v1 sk-your-api-key...
```
*Note: API URL typically ends with `/v1`, do not include `/chat/completions` (it will be auto-stripped even if included).*

### 2. Select Endpoint in GUI and Fetch Models
Type `/8 translate` to open the graphical interface. In **Receive Settings** or **Send Settings**, select **Translation Provider** as the endpoint you just added (e.g., `mygpt`), then click the **Fetch Remote Model List** button. The plugin will automatically retrieve available models from the remote API for you to choose from.

### 3. Fallback When Fetching Fails
If the GUI fails to fetch the remote model list, you can use commands to fetch or set models manually.

**Fetch remote models via command:**
Format: `/8 translate endpoint fetch-models <name>`
```bash
/8 translate endpoint fetch-models mygpt
```

**Manually set model list:**
Format: `/8 translate endpoint models <name> <model_list>`
```bash
/8 translate endpoint models mygpt gpt-4o-mini,gpt-3.5-turbo
```

---

## API Providers

### OpenRouter (Recommended)

[OpenRouter](https://openrouter.ai/) offers various free and paid models. Users who have purchased $10 or more in credits can enjoy 1000 calls per day for each free model (50 calls/day for users without credits). Paid models are charged based on usage.

**Configuration Example:**
```bash
/8 translate endpoint add openrouter https://openrouter.ai/api/v1 sk-api-key
```
After adding, select the `openrouter` endpoint in the GUI and click the **Fetch Remote Model List** button to retrieve available models.

> 💡 **Finding Free Models**: Visit the [OpenRouter Models](https://openrouter.ai/models) page and search for `free` to see all available free models. If the GUI fails to fetch the model list, you can manually add model names with `translate endpoint models` as a fallback.

### Google Gemini

**Configuration Example:**
```bash
/8 translate endpoint add gemini https://generativelanguage.googleapis.com/v1beta/openai api-key
```
After adding, select the `gemini` endpoint in the GUI and click the **Fetch Remote Model List** button to retrieve available models.

> ⚠️ **Note**: The Gemini endpoint URL differs from the standard OpenAI format. The base path is `https://generativelanguage.googleapis.com/v1beta/openai`.

---
## Interface Preview

![Interface Preview](https://i.imgur.com/c8KcL8d.jpeg)

---

## Command List

### Basic Commands
| Command | Description |
| :--- | :--- |
| `/8 translate gui` | Open graphical settings interface |
| `/8 translate list` | View command help |

### Configuration Commands
| Command | Description |
| :--- | :--- |
| `/8 translate config enabled <true/false>` | Enable/disable plugin (alias: `on/off`) |
| `/8 translate config sendMode <true/false>` | Enable/disable send translation mode |
| `/8 translate config sourceLang <code>` | Set source language (default `auto`) |
| `/8 translate config targetLang <code>` | Set receive target language (e.g., `zh`) |
| `/8 translate config sendLang <code>` | Set send target language (e.g., `en`) |
| `/8 translate config interfaceLanguage <code>` | Set interface display language |
| `/8 translate interface list` | List supported interface languages |
| `/8 translate interface <code>` | Quick command to switch interface language |

### Endpoint Management Commands
| Command | Description |
| :--- | :--- |
| `/8 translate endpoint list` | List all configured endpoints |
| `/8 translate endpoint add <name> <URL> <Key>` | Add a new API endpoint |
| `/8 translate endpoint fetch-models <name>` | Fetch supported models from remote API |
| `/8 translate endpoint models <name> <model...>` | Manually set supported models for an endpoint as a fallback (comma-separated) |
| `/8 translate endpoint delete <name>` | Delete the specified endpoint |
| `/8 translate endpoint receive <name> [model]` | Set endpoint and model for receive channel |
| `/8 translate endpoint send <name> [model]` | Set endpoint and model for send channel |
| `/8 translate endpoint fallback <name> [model]` | Set endpoint and model for fallback channel |

### Cache Management Commands
| Command | Description |
| :--- | :--- |
| `/8 translate config useCache <true/false>` | Enable/disable cache |
| `/8 translate cache save` | Save in-memory cache to disk |
| `/8 translate cache search <keyword>` | Search cache content |
| `/8 translate cache remove lang <code>` | Delete cache by source language |
| `/8 translate cache remove to <code>` | Delete cache by target language |
| `/8 translate cache remove keyword <keyword>` | Delete cache entries containing keyword |
| `/8 translate config cacheMaxSize <number>` | Set maximum cache entries (default 20000) |
| `/8 translate config cacheInterval <minutes>` | Set auto-save interval (default 10) |
| `/8 translate config cacheWriteThreshold <number>` | Set cache write threshold (default 100) |
| `/8 translate config cacheCleanupPercentage <0.2>` | Set cleanup deletion ratio (default 0.2) |

---

## Acknowledgements

* [teralove](https://github.com/teralove) — For creating the original translate-chat module that laid the foundation for this project.
* [HakuryuuDom](https://github.com/HakuryuuDom) — For adding Send Mode, auto-update, and other key features.
* [Pravv](https://github.com/Pravv) — For refactoring the codebase and optimizing dependencies into a cleaner project structure.
* [hsdn](https://github.com/hsdn) — For maintaining the TERA mod ecosystem and providing game patch compatibility support.
