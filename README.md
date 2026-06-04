# 大卡账本 PWA

一个自己使用的大卡摄入计算器。支持手动设置蛋白、碳水、脂肪目标，也可以通过 DeepSeek 代理估算食物热量和营养素范围。数据保存在当前浏览器本地，不会上传到服务器。

## 本地运行

```bash
cd calorie-pwa
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

## 在 iPhone 上预览

1. 让手机和电脑在同一个 Wi-Fi。
2. 在 Mac 上查看局域网 IP：`ipconfig getifaddr en0`。
3. 在 iPhone Safari 打开：`http://你的Mac局域网IP:4173/`。

## 安装到 iPhone 主屏幕

长期使用建议部署到 GitHub Pages、Netlify 或 Vercel。iPhone 上完整 PWA 离线能力需要 HTTPS，部署后用 Safari 打开 HTTPS 地址，再点分享按钮 -> 添加到主屏幕。

## 数据备份

右上角下载按钮会导出 JSON 备份；“趋势 -> 数据”里可以导入备份。

## DeepSeek 估算

不要把 DeepSeek API Key 写进前端代码或 GitHub Pages。推荐部署 `deepseek-proxy/worker.js` 到 Cloudflare Worker，把 API Key 放在 Worker 的密钥变量里。

部署后在应用里打开：

```text
趋势 -> 数据 -> DeepSeek 代理地址
```

填入 Worker 的 `/estimate` 地址，例如：

```text
https://calorie-deepseek-proxy.yourname.workers.dev/estimate
```

然后回到“记录”页，在“智能估算”里输入吃了什么，估算结果可以一键填入食物表单。
