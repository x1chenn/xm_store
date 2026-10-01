const store = require('../../utils/store');
Page({
  data: {
    active: 'all', products: store.products.map(store.card), count: store.products.length,
    filters: [{ key: 'all', name: '全部' }, ...Object.keys(store.categoryNames).map(key => ({ key, name: store.categoryNames[key] }))]
  },
  onLoad() { store.enableShare(); },
  onShow() {
    const filters = this.data.filters;
    if (!filters.some(filter => filter.key === this.data.active)) this.setData({ active: 'all' });
  },
  filterProducts(event) {
    const active = event.currentTarget.dataset.filter;
    if (!this.data.filters.some(filter => filter.key === active)) return;
    const products = store.products.filter(product => active === 'all' || product.category === active).map(store.card);
    this.setData({ active, products, count: products.length });
  },
  openProduct: store.openProduct,
  onShareAppMessage() { return store.shopShare('/pages/collection/index', '希美 · XM｜发现你的日常衣橱'); },
  onShareTimeline() { return { title: '希美 · XM｜衣橱精选', imageUrl: store.image('cardigan-rust.jpg') }; }
});
