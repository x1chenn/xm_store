# 希美 · XM

服装店展示网站初版，使用店主提供的 14 张真实照片。设计以奶油白、木色、深棕与大幅实拍照片为主，包含服饰精选、穿搭手记、店铺空间和品牌介绍。

## 本地预览

需要 Node.js 20 或更新版本，无需安装第三方依赖。

```sh
npm run dev
```

打开 http://127.0.0.1:4173 。支持 `PORT` 环境变量更改端口。此服务器仅用于本地预览，绑定本机地址。

## 功能

- 按全部、针织、上衣、裙装、裤装筛选服饰。
- 卡片上的颜色按钮切换对应照片。
- 点击服饰查看名称、颜色、材质、价格、尺码与照片；同款颜色可在详情中切换。
- 穿搭图集与店铺相册支持缩略图、前后翻页和键盘方向键；Escape 关闭，焦点回到原来的按钮。
- 自适应电脑和手机，手机折叠菜单，支持减少动态效果的系统设置。
- 图片和资源均在仓库中，不依赖外部图片服务或字体服务。

## 内容维护

编辑 `catalog.js` 的 `products` 即可修改服饰信息。例如：

```js
material: '这里填写经过确认的实际成分',
price: 399, // 示例格式，不是当前商品的真实价格
sizes: 'S / M / L',
```

初版中所有 `material`、`price`、`sizes` 均为 `null`，页面显示待确认。不能根据照片准确判断成分，因此没有编造羊毛、羊绒等材质。

商品名称、颜色名称与标签根据照片拟定，正式发布前请店主核对。多个颜色先按照相似款式归组；若实际不是同款，在 `products` 中拆分即可。半裙和裤装的照片为整体穿搭照片，详情已明确说明。

穿搭数据位于 `looks`，店铺相册位于 `storePhotos`。首页介绍和品牌文案在 `index.html`，属于初版设计文案，可按品牌真实情况调整。尚未提供真实地址、营业时间、联系方式，初版未编造这些信息，也未添加无效预约或支付功能。

## 检查与构建

```sh
npm run check
npm run build
```

`dist/` 是可部署的静态目录；使用相对路径，兼容根域名和 GitHub Pages 仓库子路径。`build` 会先检查服饰数据、图片文件和站内导航。

## GitHub Pages

网站地址：[https://x1chenn.github.io/xm_store/](https://x1chenn.github.io/xm_store/)。

发布配置：仓库的 **Settings → Pages → Build and deployment** 中使用 **Deploy from a branch**，选择 **main** 分支与 **/ (root)** 目录。

仓库根目录中的 `.nojekyll` 让 GitHub Pages 直接发布静态网页。页面、脚本和照片使用相对路径，适配 `/xm_store/` 子路径。以后将更新推送到 `main`，GitHub Pages 会自动重新发布，通常需要几分钟。

GitHub Pages 提供 HTTPS 公网访问。`npm run dev` 仍用于本地开发预览，`dist/` 可用于其他静态托管服务。

## 设计参考

- [RobustRLlib](https://robust-rllib.site/)：单页分区、锚点导航及内容浏览形式。
- [Louis Vuitton 官网](https://us.louisvuitton.com/eng-us/homepage)：以照片主导内容的展示方式。
- [Gucci 官网](https://www.gucci.com/us/en/)：精选、系列与店铺内容的浏览层次。

没有使用这些品牌的标识、照片或文案。所有服装与店面照片来自本次提供的素材，原始文件未改动。
