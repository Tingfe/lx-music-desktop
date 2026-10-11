# LX Music 桌面版 · Tingfe 同步增强版

面向 Windows、macOS 与 Linux 的 LX Music 桌面端 Fork。它接入 Tingfe 私有同步服务，与移动端、车机端共享音乐数据和可信自定义音源，同时严格隔离设备专属设置。

- 下载测试包：[Releases](https://github.com/Tingfe/lx-music-desktop/releases)
- 同步服务：[Tingfe/lx-music-sync-server](https://github.com/Tingfe/lx-music-sync-server)
- 当前版本：`v2.12.7`
- 支持 Windows、macOS 与 Linux。

## 本 Fork 的功能

- 同步歌单、收藏与不喜欢列表。
- 同步自定义音源的元信息和完整 JavaScript 脚本，可与手机、车机直接互通。
- 同步跨设备语义一致的播放、搜索、歌词和列表偏好。
- 语言、主题、同步地址、连接码、设备密钥、代理、下载与缓存路径、音频输出、音量、窗口和桌面歌词均保持本机独立，避免跨端配置错用或出现空白界面。
- 「设置 → 数据同步」可查看同账号设备的在线状态和最近同步时间，并移除其他旧设备以撤销访问权限。
- 应用内更新仅读取本 Fork 的正式 GitHub Release；测试预发布只用于手动验证。
- 默认只检查正式版；在「设置 → 软件更新」开启“接收测试版更新”后，可检测并安装符合语义版本规范的最新预发布包。

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

## 隐私保护

v2.12.5 清理认证与完整请求地址日志，加入日志脱敏、敏感文件忽略规则和发布前隐私回归检查。公网同步必须使用 HTTPS/WSS；已有旧日志不会自动清理。详情见：[隐私与安全说明](doc/PRIVACY_SECURITY.md)。

## GD音乐台可选接入（v2.12.6 测试版）

设置中的音源列表新增“GD音乐台（网易云·在线播放）”，需手动选择；支持 128k、320k 和无损请求，保留原有搜索、歌单、自定义音源与同步。当前 GD 官方禁止下载，因此仅用于在线播放；其他允许下载的音源不受影响。请从本仓库 Releases 安装 v2.12.6 或之后的测试包，旧发布包不会自动获得此功能。

使用方式、音质边界、限流、升级和回归说明：[GD音乐台接入说明](docs/GD_STUDIO.md)。

## 上游修复同步（v2.12.7 测试版）

已选择性引入上游搜索、歌单、歌曲匹配和歌词修复，保留本 Fork 的同步扩展、GD 接入。同时修复歌单排序保存、更新检查误报及本地文件路径问题。测试版更新打开本仓库发布页下载，正式版仍使用自动更新。这不是整仓覆盖；版本号不代表完整合入上游全部提交。

引入范围、保留项、依赖边界与验证步骤见：[上游同步与升级说明](doc/UPSTREAM_SYNC.md)。

## 上游项目与许可证

本仓库基于 [lyswhut/lx-music-desktop](https://github.com/lyswhut/lx-music-desktop) 维护；原始功能说明、FAQ、开放 API、Scheme URL、源码开发方式和完整使用限制请参阅上游 [README](https://github.com/lyswhut/lx-music-desktop#readme) 与 [官方文档](https://lyswhut.github.io/lx-music-doc/desktop/)。

本项目遵循仓库中的 [Apache-2.0 License](LICENSE) 及其适用说明。
