# LittleSU TV App（已归档）

> **本仓库已于 2026-10-26 归档。**
>
> 本客户端已合并到单仓库 [xiaowulai-s/LittleSU](https://github.com/xiaowulai-s/LittleSU)，源码位于 `apps/app`；网页版源码位于 `apps/web`。
>
> 本仓库仅保留只读的历史提交与旧 Release，不再接受更新。新版本、问题反馈与下载请前往新仓库。

**免费在线视频搜索与观看平台 —— 独立客户端版**：搜索、播放、豆瓣推荐全部内置，**无需任何服务器、无需电脑、无需域名**，安装即用。

> 本应用基于 [LibreTV-App](https://github.com/KeyRotate/LibreTV-App)（MIT）修改，其上游为 [LibreTV](https://github.com/LibreSpark/LibreTV)（AGPL）。出处声明见 [NOTICE](./NOTICE)。

## 特性

- **完全独立运行**：聚合搜索与解析内置在应用内，通过 Tauri 原生 HTTP 直连资源站（无 CORS 限制）
- **内置实测可用源**：量子 / 非凡 / 暴风 / 360（可在设置中增删自定义 API）
- **跨平台**：Windows / macOS / Linux 桌面端 + Android APK
- **应用内自动更新**（桌面端）：启动时检查新版本 → 提示 → 下载进度 → 自动安装重启
- **播放体验**：ArtPlayer 内核，自动连播、记忆进度、倍速、快捷键
- **豆瓣推荐**：热门榜单 / Top250 / 分类筛选
- **移动端适配**：底部导航、沉浸式界面

## 下载

前往 [Releases](https://github.com/xiaowulai-s/LittleSU-TV-App/releases/latest)：

| 平台 | 文件 |
|---|---|
| Android | `LittleSU-TV-v*-android-universal.apk` |
| Windows | `LittleSU.TV_*_x64-setup.exe`（NSIS 安装包）或 `*.msi` |
| macOS | `LittleSU.TV-v*-ARM64.dmg` |
| Linux | `*.AppImage` / `*.deb` / `*.rpm` |

桌面端内置自动更新：安装 v1.2.0 及以上版本后，后续新版本会在启动时提示一键升级。

## 从源码构建

环境要求：Node.js 18+、Rust（桌面端）、Android SDK/NDK（安卓端）。

```bash
npm install

# 桌面端（Windows 需 MSVC 工具链）
npx tauri build

# 安卓端
npx tauri android init   # 首次
npx tauri android build --apk --target aarch64
```

推送 `v*` 标签会触发 GitHub Actions 自动构建全平台安装包并发布 Release。

## 修改内置采集源

编辑 `js/config.js` 中的 `API_SITES`（标准苹果CMS JSON 接口格式），推 `v*` 标签重新发布即可。

## 目录说明

- `index.html` / `watch.html` / `player.html` — 应用页面（直接运行的前端）
- `js/` — 前端逻辑（搜索聚合、播放器、豆瓣、设置）
- `src-tauri/` — Tauri 壳（Rust）与平台配置
- `public/` — Tauri 打包使用的前端目录（含安卓修正版）
- `.github/workflows/release.yml` — 全平台发布流水线

## 免责声明

本应用不存储、不制作任何视频内容，仅提供第三方公开接口的聚合与播放能力。
请尊重版权，勿用于商业侵权用途；内容的合法性由对应数据源负责。

## 许可证

[Apache-2.0](./LICENSE)（沿用上游授权；上游链条含 AGPL 的 LibreTV，详见 [NOTICE](./NOTICE)）
