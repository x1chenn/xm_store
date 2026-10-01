const store = require('../../utils/store');
Page({
  data: { missing: false, product: null, variants: [], variantIndex: 0, photoIndex: 0, images: [] },
  onLoad(options = {}) {
    const product = store.products.find(item => item.id === options.id);
    store.enableShare();
    if (!product) { this.setData({ missing: true }); return; }
    this.product = product;
    const index = Number(options.variant || 0);
    const variantIndex = Number.isInteger(index) && index >= 0 && index < product.variants.length ? index : 0;
    this.setData({
      product: { id: product.id, name: product.name, english: product.english, description: product.description, materialText: product.material || '成分待确认', priceText: store.priceText(product), sizesText: product.sizes || '尺码待确认', tagsText: product.tags.join(' / ') },
      variants: product.variants.map(variant => ({ color: variant.color, hex: variant.hex }))
    });
    this.selectVariant(variantIndex);
    wx.setNavigationBarTitle({ title: product.name });
  },
  selectVariant(index) {
    if (!this.product || !Number.isInteger(index) || !this.product.variants[index]) return;
    const variant = this.product.variants[index];
    this.setData({ variantIndex: index, color: variant.color, images: variant.images.map(store.image), photoIndex: 0 });
  },
  changeVariant(event) { this.selectVariant(Number(event.currentTarget.dataset.index)); },
  changePhoto(event) { this.setData({ photoIndex: event.detail.current }); },
  previewImage() { wx.previewImage({ current: this.data.images[this.data.photoIndex], urls: this.data.images }); },
  openCollection() { wx.switchTab({ url: '/pages/collection/index' }); },
  openBoutique() { wx.switchTab({ url: '/pages/boutique/index' }); },
  onShareAppMessage() {
    if (!this.product) return store.shopShare();
    return { title: `希美 · XM｜${this.data.color} · ${this.product.name}`, path: `/pages/product/index?id=${encodeURIComponent(this.product.id)}&variant=${this.data.variantIndex}`, imageUrl: this.data.images[0] };
  },
  onShareTimeline() {
    const share = this.onShareAppMessage();
    return { title: share.title, query: this.product ? `id=${encodeURIComponent(this.product.id)}&variant=${this.data.variantIndex}` : '', imageUrl: share.imageUrl };
  }
});
