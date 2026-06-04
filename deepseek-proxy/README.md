# DeepSeek Proxy

GitHub Pages 是纯前端，不能安全保存 DeepSeek API Key。这个 Cloudflare Worker 模板负责把 Key 放在服务端，并给 PWA 提供一个 `/estimate` 接口。

同一个 Worker 也可以作为记录同步接口：PWA 每次点“添加”后，可以把食物记录 `POST` 到 `/log`，Worker 会写入 Cloudflare KV。

## Cloudflare Worker 设置

1. 在 Cloudflare 创建 Worker。
2. 把 `worker.js` 内容粘贴进去并部署。
3. 在 Worker 的变量/密钥里添加：
   - `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key
   - `ALLOWED_ORIGIN`: `https://soybean2002.github.io`
   - `DEEPSEEK_MODEL`: 可选，默认 `deepseek-v4-flash`
4. 复制 Worker 地址，例如：

```text
https://calorie-deepseek-proxy.yourname.workers.dev/estimate
```

5. 回到 PWA：`趋势 -> 数据 -> DeepSeek 代理地址`，粘贴这个地址并保存。

DeepSeek 官方接口使用 OpenAI 兼容的 `POST /chat/completions` 格式，当前模板默认调用 `https://api.deepseek.com/chat/completions`。

## 记录同步

如果你想把每次添加的记录也保存到 Cloudflare：

1. 在 Cloudflare 创建一个 KV namespace，例如 `CALORIE_LOGS`。
2. 到 Worker 的 `Settings -> Bindings` 添加 KV binding：
   - Variable name: `CALORIE_LOGS`
   - KV namespace: 选择刚创建的 namespace
3. 在 Worker 的 `Variables and Secrets` 添加一个 Secret：
   - `SYNC_TOKEN`: 自己生成一串随机密码，例如 `daka-ji-2026-xxxx`
4. 回到 PWA：`趋势 -> 数据 -> 记录同步地址`，填写：

```text
https://calorie-deepseek-proxy.yourname.workers.dev/log?token=你的SYNC_TOKEN
```

之后每次点“添加”，记录都会同步到 KV。

查看最近记录：

```text
https://calorie-deepseek-proxy.yourname.workers.dev/logs?token=你的SYNC_TOKEN
```
