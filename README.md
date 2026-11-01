# DLSite RJ 码预览 · Kikoeru 本地库增强版

> **Fork 自 [SettingDust/rj-code-preview](https://github.com/SettingDust/rj-code-preview)。**
> 原脚本会把网页中的 RJ 码变成可悬停预览的链接；本 fork 在此基础上新增「本地 Kikoeru 是否已收录」检查，并覆盖同一作品的日文版、简体中文版、繁体中文版。

- 用户脚本：[dlsite-rj-code-preview.user.js](dlsite-rj-code-preview.user.js)
- 原作者：SettingDust
- 基于上游版本：3.1.0
- 当前版本：3.2.1
- 许可证：ISC（沿用上游）

## 功能

- **RJ 码预览**（原有功能）：自动识别页面中的 `RJxxxxxx`，悬停显示 DLsite 作品名、社团、声优、标签、评分、销量等信息。
- **本地库检查**：弹窗底部新增一行，显示该 RJ 在本地 Kikoeru 中的状态：
  - `已收录（简体中文版）`，并带「打开」跳转本地作品页；
  - `未收录`；
  - `未配置（点击设置）` / `无法连接（点击设置）`。
- **多语言匹配**：无论当前打开的是日文、简中还是繁中页面，都会同时检查同一作品的三个语言版本。
- **设置面板**：配置 Kikoeru 地址、账号、密码，支持测试连接；也可从脚本管理器菜单打开。
- **可交互弹窗**：鼠标可以移入弹窗并点击其中的「打开 / 未配置」，弹窗在视口边缘会自动翻到另一侧。
- **缓存**：本地检查结果缓存 5 分钟；登录 token 缓存 7 天，失效时自动重新登录。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 Violentmonkey；
2. 打开本仓库中的 `dlsite-rj-code-preview.user.js`，通过 Raw 地址安装（或新建脚本后粘贴内容）；
3. 首次使用时配置本地 Kikoeru。

> 本仓库直接发布修改后的构建产物 `dlsite-rj-code-preview.user.js`；上游 TypeScript 源码与 `dist/` 构建配置保持原样，未随本 fork 重新编译。

## 配置

安装后通过脚本管理器菜单 **「Kikoeru 本地库设置…」** 打开设置；也可以直接点击弹窗中的「未配置 / 查询失败」那一行。

| 字段 | 说明 |
| --- | --- |
| 地址 | 本地 Kikoeru 地址，例如 `http://192.168.1.10:9087`；不写协议时自动补 `http://` |
| 用户名 | Kikoeru 账号 |
| 密码 | Kikoeru 密码 |

保存前可先点「测试连接」。

> 账号密码以明文保存在脚本管理器自己的存储中，只会发往上面填写的地址。

## 工作原理

### 多语言定位

与 prekikoeru 的 `dlrenamer` 行为一致：

1. 读取 DLsite `product.json` 中的 `language_editions`；
2. 将 `lang` 映射为 `JPN → ja_jp`、`CHI_HANS → zh_cn`、`CHI_HANT → zh_tw`；
3. 当前悬停的 RJ 本身也作为候选；
4. 若列表中没有日文版，则通过 `translation_info.original_workno` 反查日文原版。

因此三种语言的页面都能找到本地已存在的另一语言版本。

### 本地 Kikoeru 检索

1. `POST /api/auth/me` 获取 JWT；
2. 对每个候选 RJ 调用 `GET /api/search?keyword=RJxxxxxx&nsfw=0&page=1`；
3. 将返回 `works[].id` 去掉前缀和前导零后与目标 RJ 精确比对，兼容数字 id 和字符串 id；
4. `nsfw=0` 不筛选年龄限制，R18 作品也可命中。

### 弹窗交互

- 鼠标离开 RJ 链接后延迟约 400ms 再隐藏；
- 鼠标移入弹窗、或在弹窗内移动会取消隐藏，移出弹窗才关闭；
- 下方放不下时弹窗翻到鼠标上方，右侧放不下时翻到左侧；
- 异步检查结果或图片导致高度变化后，会重新贴住指针，避免弹窗被鼠标"甩开"。

## 与上游的差异

- 新增「本地库」检查行、Kikoeru 设置面板、登录与检索、多语言匹配、错误分类和缓存；
- 弹窗交互修复：延迟隐藏、可移入点击、边缘翻转、高度变化后重新定位；
- 脚本头更新为 `3.2.1`，新增 `@grant GM_registerMenuCommand` 与 `@connect`；
- **移除了 `@downloadURL` / `@updateURL`**，避免安装后被上游 3.1.0 自动覆盖；如需跟进上游更新，请手动合并；
- 原有的 RJ 链接化、DLsite 信息、图片、缓存与样式保持不变；
- 本仓库直接发布修改后的构建产物 `dlsite-rj-code-preview.user.js`，上游源码与 `dist/` 保持原样。

## 兼容性与限制

- 依赖 Kikoeru 的 `/api/search` 接口（0.6.x / [Number178/kikoeru-express](https://github.com/Number178/kikoeru-express) 等版本）；更老的 `/api/works` 结构不兼容。
- 多语言匹配依赖 DLsite 的 `language_editions` 标记；个别「子版本 / 特典」不会自动视为同一作品。
- 只检查日文、简体中文、繁体中文；英文、韩文版本仅在它就是当前悬停的 RJ 时才会检查。
- 「打开」跳到本地 Kikoeru 作品页；需要浏览器已登录 Kikoeru Web 端，否则 Kikoeru 会先跳转到自己的登录页。
- `GM_xmlhttpRequest` 需要跨域访问局域网地址，脚本使用了 `@connect *`，首次安装时脚本管理器可能询问权限。

## 致谢

- [SettingDust/rj-code-preview](https://github.com/SettingDust/rj-code-preview)：原脚本与项目结构；
- [prekikoeru](https://github.com/Sakyoriii/prekikoeru)：多语言版本查找逻辑参考；
- [Number178/kikoeru-express](https://github.com/Number178/kikoeru-express)：Kikoeru API 参考；
- [sleazyfork 451795](https://sleazyfork.org/zh-CN/scripts/451795-dlsite-rj-code-preview)：原脚本发布页。

## License

ISC。原脚本版权归 SettingDust 所有；本 fork 的修改同样以 ISC 发布。
