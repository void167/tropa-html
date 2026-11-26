const form = document.querySelector('form');
const cards = document.querySelectorAll('.cards article');
const counter = document.querySelector('#count');
const empty = document.querySelector('#empty');
const error = document.querySelector('#search-error');
const favorites = document.querySelector('#favorites');
const reset = form.querySelector('[type="reset"]');
let onlySaved = false;
let saved = new Set();

try {
  const names = JSON.parse(localStorage.getItem('tropa-routes') || '[]');
  if (Array.isArray(names)) saved = new Set(names);
} catch {
  // Если браузер запрещает хранение, избранное работает до закрытия страницы.
}

function refreshButtons() {
  const fields = form.elements;
  reset.disabled = !fields.q.value && !fields.hours.value && !fields.level.value
    && !fields.kind.value && !onlySaved && !document.querySelector('article[hidden]');
}

function validateSearch() {
  const valid = form.elements.q.value.trim().length <= 80;
  error.hidden = valid;
  form.elements.q.setAttribute('aria-invalid', String(!valid));
  form.elements.q.setCustomValidity(valid ? '' : error.textContent);
  return valid;
}

function showResults() {
  const fields = form.elements;
  const query = fields.q.value.trim().toLowerCase();
  let found = 0;
  for (const card of cards) {
    const name = card.querySelector('h3').textContent;
    const place = card.querySelector('.place').textContent;
    const matchesText = (name + ' ' + place).toLowerCase().includes(query);
    const matchesTime = !fields.hours.value || Number(card.dataset.hours) <= Number(fields.hours.value);
    const matchesLevel = !fields.level.value || card.dataset.level === fields.level.value;
    const matchesKind = !fields.kind.value || card.dataset.kind === fields.kind.value;
    const matchesSaved = !onlySaved || saved.has(name);

    card.hidden = !(matchesText && matchesTime && matchesLevel && matchesKind && matchesSaved);
    if (!card.hidden) found++;

    const button = card.querySelector('.save');
    button.setAttribute('aria-pressed', String(saved.has(name)));
    button.textContent = saved.has(name) ? 'Убрать из избранного' : 'Сохранить маршрут';
  }
  counter.textContent = (onlySaved ? 'Мои маршруты: ' : 'Маршрутов: ') + found;
  empty.hidden = found !== 0;
  empty.querySelector('span').textContent = onlySaved && saved.size === 0
    ? 'Вы пока ничего не сохранили. Нажмите «Мои маршруты» ещё раз, чтобы открыть весь каталог.'
    : 'По этим условиям ничего не найдено.';
  favorites.setAttribute('aria-pressed', String(onlySaved));
  refreshButtons();
}

form.addEventListener('input', () => {
  validateSearch();
  refreshButtons();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateSearch()) return;
  showResults();
  location.hash = 'catalog';
});

form.addEventListener('reset', () => {
  onlySaved = false;
  // Браузер очищает поля сразу после события reset.
  requestAnimationFrame(() => {
    validateSearch();
    showResults();
  });
});

for (const card of cards) {
  card.querySelector('.save').addEventListener('click', () => {
    const name = card.querySelector('h3').textContent;
    if (saved.has(name)) saved.delete(name);
    else saved.add(name);
    try {
      localStorage.setItem('tropa-routes', JSON.stringify([...saved]));
    } catch {
      // Выбор остаётся в памяти вкладки.
    }
    showResults();
  });
}

favorites.addEventListener('click', () => {
  onlySaved = !onlySaved;
  showResults();
  location.hash = 'catalog';
});

showResults();
