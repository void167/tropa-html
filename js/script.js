const form = document.querySelector('form');
const fields = form.elements;
const catalog = document.querySelector('#routes');
const template = document.querySelector('#route-template');
const count = document.querySelector('#count');
const empty = document.querySelector('#empty');
const retry = document.querySelector('#retry');
const favorites = document.querySelector('#favorites');
const reset = form.querySelector('[type="reset"]');

let routes = [];
let ready = false;
let onlySaved = false;
let filters = {};
let saved = new Set();

try {
  const names = JSON.parse(localStorage.getItem('tropa-routes') || '[]');
  if (Array.isArray(names)) saved = new Set(names);
} catch {
  // В приватном режиме избранное всё равно можно хранить до закрытия вкладки.
}

function readFilters() {
  return {
    text: fields.q.value.trim().toLowerCase(),
    hours: Number(fields.hours.value),
    level: fields.level.value,
    kind: fields.kind.value
  };
}

function hasFilters(values) {
  return Boolean(values.text || values.hours || values.level || values.kind);
}

function updateReset() {
  reset.disabled = !ready || !(onlySaved || hasFilters(filters) || hasFilters(readFilters()) || fields.q.value);
}

function validateSearch() {
  const error = document.querySelector('#search-error');
  const invalid = fields.q.value.trim().length > 80;
  error.hidden = !invalid;
  fields.q.setAttribute('aria-invalid', String(invalid));
  fields.q.setCustomValidity(invalid ? error.textContent : '');
}

function matchesFilters(route) {
  const text = (route.name + ' ' + route.place).toLowerCase();
  return text.includes(filters.text)
    && (!filters.hours || route.hours <= filters.hours)
    && (!filters.level || route.level === filters.level)
    && (!filters.kind || route.kind === filters.kind)
    && (!onlySaved || saved.has(route.name));
}

function createCard(route) {
  const card = template.content.firstElementChild.cloneNode(true);
  const image = card.querySelector('img');
  image.src = route.image;
  image.alt = route.alt;
  card.querySelector('h3').textContent = route.name;
  card.querySelector('.place').textContent = route.place;
  card.querySelector('.description').textContent = route.description;
  card.querySelector('.facts').textContent = route.km + ' · ' + route.time;
  card.querySelector('.level').textContent = route.level;
  card.querySelector('.kind').textContent = route.kind;
  const button = card.querySelector('.save');
  button.dataset.id = route.id;
  button.setAttribute('aria-pressed', String(saved.has(route.name)));
  button.textContent = saved.has(route.name) ? 'Убрать из избранного' : 'Сохранить маршрут';
  return card;
}

function renderRoutes() {
  const shown = routes.filter(matchesFilters);
  catalog.replaceChildren();
  for (const route of shown) catalog.append(createCard(route));
  count.textContent = (onlySaved ? 'В избранном: ' : 'Маршрутов: ') + shown.length;
  empty.hidden = shown.length > 0;
  empty.querySelector('span').textContent = onlySaved && !saved.size
    ? 'Избранное пусто. Отключите «Мои маршруты», чтобы увидеть каталог.'
    : 'По этим условиям ничего не найдено.';
  favorites.setAttribute('aria-pressed', String(onlySaved));
  updateReset();
}

async function loadRoutes() {
  ready = false;
  form.querySelector('[type="submit"]').disabled = true;
  favorites.disabled = true;
  reset.disabled = true;
  retry.hidden = true;
  empty.hidden = true;
  catalog.replaceChildren();
  count.textContent = 'Загрузка маршрутов…';
  try {
    const response = await fetch('./data/data.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Ожидался список маршрутов');
    routes = data;
    filters = readFilters();
    renderRoutes();
    ready = true;
    favorites.disabled = false;
    form.querySelector('[type="submit"]').disabled = false;
    updateReset();
    console.info('Тропа: загружено маршрутов — ' + routes.length);
  } catch {
    catalog.replaceChildren();
    count.textContent = 'Не удалось загрузить маршруты. Проверьте соединение и попробуйте ещё раз.';
    retry.hidden = false;
  }
}

form.addEventListener('input', () => {
  validateSearch();
  updateReset();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!ready) return;
  filters = readFilters();
  renderRoutes();
  location.hash = 'catalog';
});

form.addEventListener('reset', () => {
  onlySaved = false;
  // Сначала браузер возвращает полям исходные значения.
  requestAnimationFrame(() => {
    validateSearch();
    filters = readFilters();
    if (ready) renderRoutes();
  });
});

catalog.addEventListener('click', event => {
  const button = event.target.closest('.save');
  if (!button) return;
  const route = routes.find(item => item.id === Number(button.dataset.id));
  if (saved.has(route.name)) saved.delete(route.name);
  else saved.add(route.name);
  try {
    localStorage.setItem('tropa-routes', JSON.stringify([...saved]));
  } catch {
    // Если запись недоступна, выбор остаётся в памяти.
  }
  renderRoutes();
  const next = catalog.querySelector('[data-id="' + route.id + '"]') || catalog.querySelector('.save') || favorites;
  next.focus({preventScroll:true});
});

favorites.addEventListener('click', () => {
  onlySaved = !onlySaved;
  renderRoutes();
  location.hash = 'catalog';
});

retry.addEventListener('click', loadRoutes);
loadRoutes();
