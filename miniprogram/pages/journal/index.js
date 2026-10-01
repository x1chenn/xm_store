const store = require('../../utils/store');
Page({
  data: { looks: Object.keys(store.looks).map((key, index) => ({ key, number: `0${index + 1}`, title: store.looks[key].title, description: store.looks[key].description, cover: store.image(store.looks[key].images[0]) })) },
  onLoad() { store.enableShare(); },
  openLook(event) {
    const look = store.looks[event.currentTarget.dataset.key];
    if (look) store.previewPhotos(look.images);
  },
  onShareAppMessage() { return store.shopShare('/pages/journal/index', '希美 · XM｜穿搭，是日常的表达'); },
  onShareTimeline() { return { title: '希美 · XM｜穿搭手记', imageUrl: store.image('vest-ivory.jpg') }; }
});
