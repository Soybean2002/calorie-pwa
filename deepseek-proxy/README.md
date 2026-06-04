# DeepSeek Proxy

GitHub Pages 是纯前端，不能安全保存 DeepSeek API Key。这个 Cloudflare Worker 模板负责把 Key 放在服务端，并给 PWA 提供一个 `/estimate` 接口。

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
