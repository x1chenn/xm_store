const catalog = require('../data/catalog');
const image = (file) => `/assets/images/${file}`;
const website = 'https://x1chenn.github.io/xm_store/';

function priceText(product) {
  return typeof product.price === 'number' ? `¥ ${product.price.toLocaleString('zh-CN')}` : '价格待确认';
}
function card(product) {
  return {
    id: product.id, name: product.name, category: product.category,
    categoryText: catalog.categoryNames[product.category],
    cover: image(product.variants[0].images[0]),
    tagsText: product.tags.join(' / '),
    materialText: product.material || '材质待确认', priceText: priceText(product),
    colors: product.variants.map(variant => ({ color: variant.color, hex: variant.hex }))
  };
}
function enableShare() {
  wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
}
function shopShare(path = '/pages/home/index', title = '希美 · XM｜日常，自有风格。') {
  return { title, path, imageUrl: image('cardigan-rust.jpg') };
}
function openProduct(event) {
  wx.navigateTo({ url: `/pages/product/index?id=${encodeURIComponent(event.currentTarget.dataset.id)}` });
}
function previewPhotos(files, selected = 0) {
  const urls = files.map(image);
  const index = Number.isInteger(selected) && selected >= 0 && selected < urls.length ? selected : 0;
  wx.previewImage({ current: urls[index], urls });
}
module.exports = { ...catalog, image, website, priceText, card, enableShare, shopShare, openProduct, previewPhotos };
