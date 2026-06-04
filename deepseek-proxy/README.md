# DeepSeek Proxy

Cloudflare Worker 模板，用于给大卡记提供两个可选能力：

- `/estimate`：服务端调用 DeepSeek，估算食物热量和营养素
- `/log` / `/logs`：把新增记录同步保存到 Cloudflare KV

GitHub Pages 是纯前端，不能安全保存 DeepSeek API Key。请把 Key 放在 Worker 的 Secret 中。

## 部署

1. 在 Cloudflare 创建 Worker
2. 把 [`worker.js`](worker.js) 粘贴进去并部署
3. 在 `Settings -> Variables and Secrets` 添加：

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | Secret | Yes, for `/estimate` | DeepSeek API Key |
| `ALLOWED_ORIGIN` | Text | Recommended | 例如 `https://soybean2002.github.io` |
| `DEEPSEEK_MODEL` | Text | No | 默认 `deepseek-v4-flash` |
| `PROXY_TOKEN` | Secret | No | 保护 `/estimate`，防止公开滥用 |
| `SYNC_TOKEN` | Secret | No | 保护 `/log` 和 `/logs` |

## DeepSeek 估算

PWA 中填写：

```text
https://your-worker.your-account.workers.dev/estimate
```

如果设置了 `PROXY_TOKEN`，填写：

```text
https://your-worker.your-account.workers.dev/estimate?token=your-proxy-token
```

测试：

```bash
curl -X POST "https://your-worker.your-account.workers.dev/estimate?token=your-proxy-token" \
  -H "Content-Type: application/json" \
  --data '{"description":"一碗牛肉面"}'
```

## 记录同步

如果你想把每次添加的记录保存到 Cloudflare：

1. 创建 Cloudflare KV namespace，例如 `CALORIE_LOGS`
2. 到 Worker 的 `Settings -> Bindings` 添加 KV binding：
   - Variable name: `CALORIE_LOGS`
   - KV namespace: 选择刚创建的 namespace
3. 在 `Variables and Secrets` 添加：
   - `SYNC_TOKEN`: 自己生成一串随机密码
4. PWA 中填写：

```text
https://your-worker.your-account.workers.dev/log?token=your-sync-token
```

查看最近记录：

```bash
curl "https://your-worker.your-account.workers.dev/logs?token=your-sync-token"
```

## 注意

- CORS 不是鉴权。公开 Worker 地址后，别人仍可能通过命令行直接访问
- 建议为 `/estimate` 设置 `PROXY_TOKEN`
- 不要把真实 token 写进公开 README、Issue 或截图
