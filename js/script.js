const form = document.querySelector('form');
const cards = document.querySelectorAll('.cards article');
const counter = document.querySelector('#count');
const emptyMessage = document.querySelector('#empty');

function filterRoutes(event) {
  // Показываем результат на этой же странице.
  event.preventDefault();

  const search = form.elements.q.value.trim().toLowerCase();
  const maxHours = Number(form.elements.hours.value);
  const level = form.elements.level.value;
  const kind = form.elements.kind.value;
  let found = 0;

  for (const card of cards) {
    const name = card.querySelector('h3').textContent;
    const place = card.querySelector('.place').textContent;
    const searchText = (name + ' ' + place).toLowerCase();

    // Длительность, сложность и местность указаны в data-атрибутах карточки.
    const matchesSearch = searchText.includes(search);
    const matchesTime = maxHours === 0 || Number(card.dataset.hours) <= maxHours;
    const matchesLevel = level === '' || card.dataset.level === level;
    const matchesKind = kind === '' || card.dataset.kind === kind;

    if (matchesSearch && matchesTime && matchesLevel && matchesKind) {
      card.hidden = false;
      found++;
    } else {
      card.hidden = true;
    }
  }

  counter.textContent = 'Найдено маршрутов: ' + found;
  emptyMessage.hidden = found > 0;
  location.hash = 'catalog';
}

function showAllRoutes() {
  for (const card of cards) {
    card.hidden = false;
  }
  counter.textContent = 'Маршрутов в каталоге: ' + cards.length;
  emptyMessage.hidden = true;
}

form.addEventListener('submit', filterRoutes);
form.addEventListener('reset', showAllRoutes);
