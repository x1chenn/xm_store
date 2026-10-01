import { products, looks, storePhotos, categoryNames } from './catalog.js';

const imagePath = (file) => `./assets/images/${file}`;
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#detail-dialog');
const detailImage = document.querySelector('#detail-image');
const thumbnailBar = document.querySelector('#photo-thumbnails');
const specList = document.querySelector('#detail-specs');
const colorOptions = document.querySelector('#detail-colors');
const photoStatus = document.querySelector('#gallery-status');
const previousPhoto = document.querySelector('#previous-photo');
const nextPhoto = document.querySelector('#next-photo');
const closeButton = document.querySelector('.dialog-close');
const selectedVariants = new Map();
let gallery = [];
let photoIndex = 0;
let currentProduct = null;
let galleryMode = 'product';
let returnFocus = null;

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function priceLabel(product) {
  return typeof product.price === 'number' ? `¥ ${product.price.toLocaleString('zh-CN')}` : '价格待确认';
}

function renderProducts(filter = 'all') {
  const shown = products.filter((product) => filter === 'all' || product.category === filter);
  const cards = shown.map((product) => {
    const variantIndex = selectedVariants.get(product.id) ?? 0;
    const variant = product.variants[variantIndex];
    const card = element('article', 'product-card');
    card.dataset.product = product.id;
    const imageButton = element('button', 'product-photo');
    imageButton.type = 'button';
    imageButton.setAttribute('aria-label', `查看${product.name}详情`);
    const image = element('img');
    image.src = imagePath(variant.images[0]);
    image.alt = `${variant.color}${product.name}，希美店内实拍穿搭`;
    image.loading = 'lazy';
    image.width = 1280;
    image.height = 1707;
    const expand = element('span', 'photo-expand', '↗');
    expand.setAttribute('aria-hidden', 'true');
    imageButton.append(image, element('span', 'product-category', categoryNames[product.category]), expand);
    imageButton.addEventListener('click', () => openProduct(product, selectedVariants.get(product.id) ?? 0));
    const text = element('div', 'product-text');
    const titleRow = element('div', 'product-title-row');
    const title = element('h3', 'product-title');
    const titleButton = element('button', '', product.name);
    titleButton.type = 'button';
    titleButton.addEventListener('click', () => openProduct(product, selectedVariants.get(product.id) ?? 0));
    title.append(titleButton);
    titleRow.append(title, element('span', 'product-id', `XM ${String(products.indexOf(product) + 1).padStart(2, '0')}`));
    const bottom = element('div', 'product-bottom');
    const info = element('p', 'product-info', `${product.material ?? '材质待确认'} · ${priceLabel(product)}`);
    const swatches = element('div', 'product-swatches');
    swatches.setAttribute('role', 'group');
    swatches.setAttribute('aria-label', `${product.name}颜色`);
    product.variants.forEach((item, index) => {
      const swatch = element('button', 'swatch');
      swatch.type = 'button';
      swatch.style.setProperty('--swatch', item.hex);
      swatch.setAttribute('aria-label', `${product.name}：${item.color}`);
      swatch.setAttribute('aria-pressed', String(index === variantIndex));
      swatch.title = item.color;
      swatch.addEventListener('click', () => {
        selectedVariants.set(product.id, index);
        image.src = imagePath(item.images[0]);
        image.alt = `${item.color}${product.name}，希美店内实拍穿搭`;
        for (const button of swatches.children) button.setAttribute('aria-pressed', String(button === swatch));
      });
      swatches.append(swatch);
    });
    bottom.append(info, swatches);
    text.append(titleRow, element('p', 'product-tags', product.tags.join(' / ')), bottom);
    card.append(imageButton, text);
    return card;
  });
  grid.replaceChildren(...cards);
  document.querySelector('#product-count').textContent = String(shown.length);
}

function setSpecs(product, variant) {
  const specs = [
    ['颜色', variant.color],
    ['材质', product.material ?? '成分待确认'],
    ['价格', priceLabel(product)],
    ['尺码', product.sizes ?? '尺码待确认']
  ];
  specList.replaceChildren(...specs.map(([name, value]) => {
    const row = element('div', 'spec-row');
    row.append(element('dt', '', name), element('dd', '', value));
    return row;
  }));
}

function setGallery(images, index = 0) {
  gallery = images;
  photoIndex = index;
  thumbnailBar.replaceChildren(...images.map((item, position) => {
    const button = element('button', 'thumbnail');
    button.type = 'button';
    button.setAttribute('aria-label', `查看第 ${position + 1} 张照片：${item.alt}`);
    const image = element('img');
    image.src = imagePath(item.file);
    image.alt = '';
    button.append(image);
    button.addEventListener('click', () => showPhoto(position));
    return button;
  }));
  previousPhoto.disabled = images.length < 2;
  nextPhoto.disabled = images.length < 2;
  showPhoto(index);
}

function showPhoto(index) {
  photoIndex = (index + gallery.length) % gallery.length;
  const photo = gallery[photoIndex];
  detailImage.src = imagePath(photo.file);
  detailImage.alt = photo.alt;
  [...thumbnailBar.children].forEach((button, position) => button.setAttribute('aria-pressed', String(position === photoIndex)));
  photoStatus.textContent = `${String(photoIndex + 1).padStart(2, '0')} / ${String(gallery.length).padStart(2, '0')} · ${photo.alt}`;
  if (galleryMode === 'store') {
    document.querySelector('#detail-title').textContent = storePhotos[photoIndex].title;
    document.querySelector('#detail-description').textContent = storePhotos[photoIndex].description;
  }
}

function openDialog() {
  if (dialog.open) return;
  returnFocus = document.activeElement;
  dialog.showModal();
  document.querySelector('.detail-layout').scrollTop = 0;
  closeButton.focus();
}

function openProduct(product, variantIndex = 0) {
  currentProduct = product;
  galleryMode = 'product';
  document.querySelector('#detail-eyebrow').textContent = `XM COLLECTION / ${product.english.toUpperCase()}`;
  document.querySelector('#detail-title').textContent = product.name;
  document.querySelector('#detail-description').textContent = product.description;
  document.querySelector('#product-details').hidden = false;
  document.querySelector('.detail-store-link').hidden = false;
  colorOptions.replaceChildren(...product.variants.map((variant, index) => {
    const button = element('button', 'color-option');
    button.type = 'button';
    const dot = element('span', 'color-dot');
    dot.style.setProperty('--swatch', variant.hex);
    dot.setAttribute('aria-hidden', 'true');
    button.append(dot, element('span', '', variant.color));
    button.addEventListener('click', () => selectDetailVariant(index));
    return button;
  }));
  selectDetailVariant(variantIndex);
  openDialog();
}

function selectDetailVariant(index) {
  const variant = currentProduct.variants[index];
  setSpecs(currentProduct, variant);
  [...colorOptions.children].forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
  setGallery(variant.images.map((file) => ({ file, alt: `${variant.color}${currentProduct.name} · ${file.includes('detail') ? '细节实拍' : '穿搭实拍'}` })));
}

function openLook(key) {
  const look = looks[key];
  galleryMode = 'look';
  currentProduct = null;
  document.querySelector('#detail-eyebrow').textContent = 'XM / STYLE JOURNAL';
  document.querySelector('#detail-title').textContent = look.title;
  document.querySelector('#detail-description').textContent = look.description;
  document.querySelector('#product-details').hidden = true;
  document.querySelector('.detail-store-link').hidden = false;
  setGallery(look.images.map((file, index) => ({ file, alt: `${look.title} · 穿搭 ${index + 1}` })));
  openDialog();
}

function openStore(index) {
  galleryMode = 'store';
  currentProduct = null;
  document.querySelector('#detail-eyebrow').textContent = 'XM / OUR BOUTIQUE';
  document.querySelector('#product-details').hidden = true;
  document.querySelector('.detail-store-link').hidden = true;
  setGallery(storePhotos.map((photo) => ({ file: photo.file, alt: photo.title })), index);
  openDialog();
}

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((filter) => filter.setAttribute('aria-pressed', String(filter === button)));
    renderProducts(button.dataset.filter);
  });
});
document.querySelectorAll('[data-look]').forEach((button) => button.addEventListener('click', () => openLook(button.dataset.look)));
document.querySelectorAll('[data-store]').forEach((button) => button.addEventListener('click', () => openStore(Number(button.dataset.store))));
closeButton.addEventListener('click', () => dialog.close());
previousPhoto.addEventListener('click', () => showPhoto(photoIndex - 1));
nextPhoto.addEventListener('click', () => showPhoto(photoIndex + 1));
dialog.addEventListener('keydown', (event) => {
  // 原生 dialog 处理 Escape 和焦点范围；左右方向键只在照片区域翻页，保留其他控件的键盘行为。
  if (!event.target.closest('.detail-gallery') && event.target !== closeButton) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
});
document.querySelector('.detail-store-link').addEventListener('click', () => {
  dialog.close();
  document.querySelector('#boutique').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
});

const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '打开导航');
  mobileNav.hidden = true;
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? '打开导航' : '关闭导航');
  mobileNav.hidden = expanded;
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuButton.focus(); }
});
matchMedia('(min-width: 761px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.desktop-nav a').forEach((link) => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
document.querySelector('#copyright-year').textContent = String(new Date().getFullYear());
renderProducts();
