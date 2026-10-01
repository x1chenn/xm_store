const store = require('../../utils/store');
Page({
  data: {
    hero: store.image('cardigan-rust.jpg'),
    interior: store.image('boutique-interior.jpg'),
    featured: store.products.slice(0, 4).map(store.card)
  },
  onLoad() { store.enableShare(); },
  openCollection() { wx.switchTab({ url: '/pages/collection/index' }); },
  openBoutique() { wx.switchTab({ url: '/pages/boutique/index' }); },
  openProduct: store.openProduct,
  onShareAppMessage() { return store.shopShare(); },
  onShareTimeline() { return { title: '希美 · XM｜日常，自有风格。', imageUrl: this.data.hero }; }
});
