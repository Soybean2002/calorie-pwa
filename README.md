# 小鲨记账

![PWA](https://img.shields.io/badge/PWA-ready-f4c92f)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-555555)
![Local First](https://img.shields.io/badge/data-local%20first-2f9875)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

一个给自己用的轻量记账 PWA，界面参考手机记账 App 的黄色月度头部、快捷入口、按日期分组明细和底部大号记账按钮。没有广告，没有后端依赖，数据默认只保存在当前浏览器本地。

## Demo

[https://soybean2002.github.io/calorie-pwa/](https://soybean2002.github.io/calorie-pwa/)

## 功能

- 月度概览：展示当月收入、支出和结余
- 快速记账：支出/收入切换、分类、账户、日期和备注
- 明细列表：按日期分组，接近常见记账 App 的流水样式
- 图表统计：最近 7 天柱状图和分类排行
- 月预算：设置本月支出预算并查看使用进度
- 资产管家：记录现金、储蓄和负债，计算净资产
- JSON 备份：导出/导入本地数据
- PWA 支持：可添加到 iPhone 主屏幕，支持基础离线缓存

## 项目结构

```text
.
├── index.html              # 应用页面
├── styles.css              # 移动端 UI 样式
├── app.js                  # 记账、统计、本地存储逻辑
├── sw.js                   # Service Worker 离线缓存
├── manifest.webmanifest    # PWA Manifest
├── icons/                  # 主屏幕图标
└── deepseek-proxy/         # 历史模板，当前记账版不依赖
```

## 本地运行

```bash
cd calorie-pwa
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

## 部署到 GitHub Pages

1. 推送代码到 `main`
2. 打开仓库 `Settings -> Pages`
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main`，Folder 选择 `/root`
5. 保存后等待部署完成

部署完成后，Safari 打开 HTTPS 地址，点击分享按钮，选择“添加到主屏幕”。

## 隐私与安全

- 账单、预算和资产数据默认只保存在本机浏览器 `localStorage`
- 清除 Safari 网站数据或删除主屏幕 App 可能导致本地数据丢失
- 建议定期使用右上角导出按钮保存 JSON 备份

## 技术栈

- HTML / CSS / JavaScript
- PWA Manifest + Service Worker
- GitHub Pages 静态部署

## Roadmap

- [ ] 自定义分类
- [ ] CSV 导出
- [ ] 月份左右滑动切换
- [ ] 账单搜索
- [ ] 更精细的账户统计

## License

[MIT](LICENSE)
