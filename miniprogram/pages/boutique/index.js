const store = require('../../utils/store');
Page({
  data: { photos: store.storePhotos.map(photo => ({ ...photo, src: store.image(photo.file) })), website: store.website },
  onLoad() { store.enableShare(); },
  openPhoto(event) { store.previewPhotos(store.storePhotos.map(photo => photo.file), Number(event.currentTarget.dataset.index)); },
  copyWebsite() { wx.setClipboardData({ data: store.website }); },
  onShareAppMessage() { return { title: '希美 · XM｜在希美，慢慢找到喜欢。', path: '/pages/boutique/index', imageUrl: store.image('boutique-interior.jpg') }; },
  onShareTimeline() { return { title: '希美 · XM｜店铺空间', imageUrl: store.image('boutique-interior.jpg') }; }
});
