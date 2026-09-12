XIAOQUAN SAIMA 云端同步版（虚拟余额演示）

这版不再使用 localStorage 保存余额；余额、密码、比赛记录和后台调整记录由服务器统一保存。
朋友手机和管理员手机访问同一个部署网址时，可以读取同一份数据。

部署：
1. 准备 Node.js 18+
2. 上传整个文件夹
3. 设置环境变量：
   ADMIN_USER=ADMIN
   ADMIN_PASSWORD=你自己设置的管理员密码
4. 运行：npm start
5. 把服务器生成的 HTTPS 网址发给朋友，朋友不要直接打开 ZIP。

顾客账号：XIAOQUANSAIMA1 到 XIAOQUANSAIMA999
顾客初始密码：789789
初始虚拟余额：RM0

重要：
- 这是虚拟余额演示系统，不连接真实支付、提现或现金兑换。
- 管理员密码不写在网页界面里；由服务器环境变量提供。
- 如果你把网站部署到公网，建议使用 HTTPS、强管理员密码，并限制服务器访问。
- 当前数据文件 data.json 会在首次运行时自动创建。


本版本：玩家初始虚拟余额改为 RM0，并加入 YouTube 背景音乐（视频 ID encmiOd_lbc）。data.json 不建议提交到公开 GitHub，因为其中包含玩家密码哈希。Render Free 本地文件仍不具备持久化能力。
【游戏内背景音乐】
本版本已把用户提供的视频音频提取为 public/background-music.mp3，并直接内置到游戏网页。
登录后，右上角会出现「🎵 音乐」按钮。点击后可在游戏页面内播放/暂停、静音和调节音量；不会跳转到 YouTube。

【HTTPS / Render】
把本 ZIP 中的文件上传到 GitHub 仓库（不要上传 data.json），Render 使用 Start Command：node server.js。
Render 会自动提供 HTTPS 地址。需要在 Render Environment Variables 设置 ADMIN_PASSWORD。
注意：Render Free 本地文件不是永久存储，data.json 会在实例重启/重新部署后重新初始化；如需长期保存余额，请接外部数据库。
