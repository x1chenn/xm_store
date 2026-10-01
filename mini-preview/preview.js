// Preview only: renders our WXML/WXSS and runs our Page controllers with mocked wx APIs.
const base = new URL('../miniprogram/', import.meta.url);
const pageSurface = document.querySelector('#wx-page');
const scrollArea = document.querySelector('#phone-scroll');
const modal = document.querySelector('#preview-dialog');
const modalContent = document.querySelector('#preview-dialog-content');
const moduleCache = new Map();
let appConfig;
let currentPage;
let currentRoute = 'pages/home/index';
let template;
let history = [];
let toastTimer;
let initializing = false;

const assetUrl = (path) => new URL(path.replace(/^\//, ''), base).href;
async function textFile(path) {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw new Error(`无法读取 ${path}`);
  return response.text();
}
function toast(message) {
  const node = document.querySelector('#preview-toast');
  node.textContent = message; node.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 2500);
}
function showShare() {
  const share = currentPage.onShareAppMessage?.();
  if (!share) return;
  const label = document.createElement('p'); label.className = 'share-card-label'; label.textContent = '微信分享卡片预览';
  const card = document.createElement('div'); card.className = 'share-card';
  const title = document.createElement('h2'); title.textContent = share.title;
  const photo = document.createElement('img'); photo.src = assetUrl(share.imageUrl);
  const footer = document.createElement('div'); footer.className = 'share-card-footer'; footer.textContent = '小程序 · 希美 XM';
  card.append(title, photo, footer);
  const route = document.createElement('p'); route.className = 'share-route'; route.textContent = `收件人进入页面：${share.path}`;
  const note = document.createElement('p'); note.className = 'share-preview-note'; note.textContent = '此处仅预览分享内容。真实发送和微信内打开，需要完成账号注册、AppID 配置与发布。';
  modalContent.replaceChildren(label, card, route, note); modal.showModal();
}
function showPhotos({ current, urls }) {
  let index = Math.max(0, urls.indexOf(current));
  const photo = document.createElement('img'); photo.className = 'large-photo';
  const controls = document.createElement('div'); controls.className = 'photo-controls';
  const previous = document.createElement('button'); previous.textContent = '←'; previous.setAttribute('aria-label', '上一张照片');
  const next = document.createElement('button'); next.textContent = '→'; next.setAttribute('aria-label', '下一张照片');
  const counter = document.createElement('span');
  const update = () => { photo.src = assetUrl(urls[index]); counter.textContent = `${index + 1} / ${urls.length}`; };
  previous.onclick = () => { index = (index - 1 + urls.length) % urls.length; update(); };
  next.onclick = () => { index = (index + 1) % urls.length; update(); };
  controls.append(previous, counter, next); update(); modalContent.replaceChildren(photo, controls); modal.showModal();
}
const wx = {
  showShareMenu() {},
  setNavigationBarTitle({ title }) { document.querySelector('#native-title').textContent = title; },
  navigateTo({ url }) { history.push({ route: currentRoute, scroll: scrollArea.scrollTop }); loadPage(url); },
  switchTab({ url }) { history = []; loadPage(url); },
  previewImage: showPhotos,
  setClipboardData({ data }) { navigator.clipboard.writeText(data).then(() => toast('链接已复制')).catch(() => toast('请打开店铺网站后复制地址')); }
};
async function initializeModules() {
  for (const path of ['data/catalog.js', 'utils/store.js']) {
    const code = await textFile(path);
    const module = { exports: {} };
    new Function('module', 'require', 'wx', code)(module, () => moduleCache.get('data/catalog.js'), wx);
    moduleCache.set(path, module.exports);
  }
}
function expression(code, scope) {
  const safeScope = new Proxy(scope, { has: () => true, get: (target, key) => key === Symbol.unscopables ? undefined : target[key] });
  return new Function('scope', `with(scope) { return (${code}); }`)(safeScope);
}
function value(content, scope) {
  const exact = content.match(/^\s*{{([^{}]*?)}}\s*$/);
  if (exact) return expression(exact[1], scope);
  return content.replace(/{{([\s\S]*?)}}/g, (_, code) => String(expression(code, scope) ?? ''));
}
function siblings(parent, scope) {
  const output = document.createDocumentFragment();
  let condition = false;
  for (const child of parent.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      if (child.hasAttribute('wx:if')) {
        condition = Boolean(value(child.getAttribute('wx:if'), scope));
        if (!condition) continue;
      } else if (child.hasAttribute('wx:else')) {
        if (condition) continue;
      }
    }
    output.append(renderNode(child, scope));
  }
  return output;
}
function renderNode(source, scope, looped = false) {
  if (source.nodeType === Node.TEXT_NODE) return document.createTextNode(String(value(source.textContent, scope) ?? ''));
  if (source.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();
  if (source.hasAttribute('wx:for') && !looped) {
    const nodes = document.createDocumentFragment();
    const items = value(source.getAttribute('wx:for'), scope) || [];
    const itemName = source.getAttribute('wx:for-item') || 'item';
    const indexName = source.getAttribute('wx:for-index') || 'index';
    items.forEach((item, index) => nodes.append(renderNode(source, { ...scope, [itemName]: item, [indexName]: index }, true)));
    return nodes;
  }
  const node = document.createElement(source.tagName.toLowerCase());
  for (const attribute of source.attributes) {
    if (attribute.name.startsWith('wx:') || attribute.name.startsWith('bind') || ['open-type', 'mode', 'lazy-load'].includes(attribute.name)) continue;
    const evaluated = value(attribute.value, scope);
    if (attribute.name === 'src') node.setAttribute('src', assetUrl(evaluated));
    else node.setAttribute(attribute.name, String(evaluated));
  }
  if (source.tagName.toLowerCase() === 'image') {
    const bitmap = document.createElement('img');
    bitmap.className = 'wx-image'; bitmap.alt = '';
    bitmap.src = node.getAttribute('src');
    if (source.getAttribute('mode') === 'aspectFit') bitmap.style.objectFit = 'contain';
    node.append(bitmap);
  }
  else node.append(siblings(source, scope));
  if (source.getAttribute('open-type') === 'share') node.addEventListener('click', showShare);
  const method = source.getAttribute('bindtap');
  if (method) node.addEventListener('click', (event) => {
    event.stopPropagation();
    currentPage[method]?.({ currentTarget: { dataset: { ...node.dataset } }, detail: {} });
  });
  if (source.tagName.toLowerCase() === 'swiper') {
    const change = source.getAttribute('bindchange');
    node.addEventListener('scroll', () => {
      const current = Math.round(node.scrollLeft / Math.max(1, node.clientWidth));
      if (current !== currentPage.data.photoIndex) currentPage[change]?.({ detail: { current } });
    });
    requestAnimationFrame(() => { node.scrollLeft = (Number(value(source.getAttribute('current') || '0', scope)) || 0) * node.clientWidth; });
  }
  return node;
}
function render() {
  if (!template || !currentPage) return;
  const oldScroll = scrollArea.scrollTop;
  pageSurface.replaceChildren(siblings(template, currentPage.data));
  scrollArea.scrollTop = oldScroll;
}
async function loadPage(url, restoreScroll = 0) {
  const [rawRoute, query = ''] = url.replace(/^\//, '').split('?');
  if (!appConfig.pages.includes(rawRoute)) throw new Error('Unknown preview route.');
  currentRoute = rawRoute;
  wx.setNavigationBarTitle({ title: '希美 · XM' });
  const [wxml, pageStyle, appStyle, controller] = await Promise.all([textFile(`${rawRoute}.wxml`), textFile(`${rawRoute}.wxss`), textFile('app.wxss'), textFile(`${rawRoute}.js`)]);
  document.querySelector('#wx-style').textContent = `${appStyle}\n${pageStyle}`.replace(/(-?\d+(?:\.\d+)?)rpx/g, 'calc(var(--rpx) * $1)');
  const xml = wxml.replace(/\bwx:else(?=\s|>)/g, 'wx:else="true"').replace(/\blazy-load(?=\s|\/?>)/g, 'lazy-load="true"');
  const parsed = new DOMParser().parseFromString(`<root xmlns:wx="urn:wechat">${xml}</root>`, 'application/xml');
  if (parsed.querySelector('parsererror')) throw new Error('WXML preview parse failed.');
  template = parsed.documentElement;
  currentPage = null;
  new Function('require', 'Page', 'wx', controller)(() => moduleCache.get('utils/store.js'), (definition) => { currentPage = definition; }, wx);
  currentPage.data = structuredClone(currentPage.data);
  currentPage.setData = (data) => { Object.assign(currentPage.data, data); if (!initializing) render(); };
  initializing = true;
  currentPage.onLoad?.(Object.fromEntries(new URLSearchParams(query)));
  currentPage.onShow?.();
  initializing = false;
  render(); scrollArea.scrollTop = restoreScroll;
  const isTab = appConfig.tabBar.list.some(tab => tab.pagePath === rawRoute);
  document.querySelector('#tab-bar').hidden = !isTab;
  document.querySelector('#back-button').hidden = isTab;
  document.querySelectorAll('[data-tab]').forEach(button => {
    if (button.dataset.tab === rawRoute) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}
document.querySelector('.preview-dialog-close').onclick = () => modal.close();
document.querySelector('#share-preview-button').onclick = showShare;
document.querySelector('#back-button').onclick = () => {
  const previous = history.pop();
  loadPage(previous?.route || '/pages/collection/index', previous?.scroll || 0);
};
new ResizeObserver(entries => {
  const width = entries[0].contentRect.width;
  document.querySelector('.phone-frame').style.setProperty('--rpx', `${width / 750}px`);
}).observe(document.querySelector('.phone-frame'));
try {
  appConfig = JSON.parse(await textFile('app.json'));
  await initializeModules();
  for (const tab of appConfig.tabBar.list) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = tab.text; button.dataset.tab = tab.pagePath;
    button.onclick = () => wx.switchTab({ url: tab.pagePath });
    document.querySelector('#tab-bar').append(button);
  }
  await loadPage('/pages/home/index');
} catch (error) { pageSurface.textContent = `预览加载失败：${error.message}`; console.error(error); }
