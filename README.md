# LX Music 桌面版 · Tingfe 同步增强版

面向 Windows、macOS 与 Linux 的 LX Music 桌面端 Fork。它接入 Tingfe 私有同步服务，与移动端、车机端共享音乐数据和可信自定义音源，同时严格隔离设备专属设置。

- 下载测试包：[Releases](https://github.com/Tingfe/lx-music-desktop/releases)
- 同步服务：[Tingfe/lx-music-sync-server](https://github.com/Tingfe/lx-music-sync-server)
- 当前版本：`v2.12.3`
- 支持 Windows、macOS 与 Linux。

## 本 Fork 的功能

- 同步歌单、收藏与不喜欢列表。
- 同步自定义音源的元信息和完整 JavaScript 脚本，可与手机、车机直接互通。
- 同步跨设备语义一致的播放、搜索、歌词和列表偏好。
- 语言、主题、同步地址、连接码、设备密钥、代理、下载与缓存路径、音频输出、音量、窗口和桌面歌词均保持本机独立，避免跨端配置错用或出现空白界面。
- 「设置 → 数据同步」可查看同账号设备的在线状态和最近同步时间，并移除其他旧设备以撤销访问权限。
- 应用内更新仅读取本 Fork 的正式 GitHub Release；测试预发布只用于手动验证。

## 开始使用

1. 升级同步服务至 [`v2.1.11` 及以上](https://github.com/Tingfe/lx-music-sync-server/releases)。
2. 在桌面端、手机端和车机端的「设置 → 数据同步」使用同一服务地址、账号和连接码。
3. 首次接入时以服务端已有数据为准；旧设备密钥失效时重新输入连接码即可，无需清除数据。

完整兼容范围、同步设置白名单、发布方式和验证步骤见：[桌面端升级说明](doc/CUSTOM_SYNC_UPGRADE.md)。

## 相关项目

- 手机端：[Tingfe/lx-music-mobile](https://github.com/Tingfe/lx-music-mobile)
- 车机端：[Tingfe/lx-music-car](https://github.com/Tingfe/lx-music-car)
- 同步服务：[Tingfe/lx-music-sync-server](https://github.com/Tingfe/lx-music-sync-server)

自定义音源是可执行 JavaScript，只应导入可信来源，并只在自己控制的账号和服务之间同步。

## 上游项目与许可证

本仓库基于 [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) 维护；原始功能说明、FAQ、开放 API、Scheme URL、源码开发方式和完整使用限制请参阅上游 [README](https://github.com/lyswhut/lx-music-desktop#readme) 与 [官方文档](https://lyswhut.github.io/lx-music-doc/desktop/)。

本项目遵循仓库中的 [Apache-2.0 License](LICENSE) 及其适用说明。
