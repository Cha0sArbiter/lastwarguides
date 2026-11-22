const normalize = (value) => value.normalize('NFKD').replace(/\p{M}/gu, '')
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function setupSearch(form) {
  const query = form.elements.q;
  const filters = document.querySelector('.filters');
  const topic = document.querySelector('#topic');
  const format = document.querySelector('#format');
  const language = document.querySelector('#language');
  const grid = document.querySelector('#resource-grid');
  const resultsHeading = document.querySelector('#catalog-heading');
  const status = document.querySelector('#result-count');
  const empty = document.querySelector('#no-results');
  const reset = document.querySelector('#reset');
  const more = document.querySelector('#show-more');
  const pageSize = 9;
  const fields = { q: query, topic, format, language };
  const records = Array.from(grid.children, (element) => ({
    element,
    title: normalize(element.dataset.title),
    text: ' ' + normalize(element.dataset.search) + ' ',
    topic: element.dataset.topic,
    format: element.dataset.type,
    languages: element.dataset.language.split(' / '),
  }));
  let matches = [];
  let limit = pageSize;

  function saveFilters() {
    const url = new URL(window.location.href);
    for (const [name, field] of Object.entries(fields)) {
      const value = field.value.trim();
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    if (url.href !== window.location.href) window.history.replaceState(null, '', url);
  }

  function showMatches() {
    const visible = matches.slice(0, limit);
    const visibleSet = new Set(visible);
    for (const record of records) record.element.hidden = !visibleSet.has(record);
    grid.prepend(...visible.map(({ element }) => element));
    status.textContent = matches.length + (matches.length === 1 ? ' resource' : ' resources');
    empty.hidden = matches.length !== 0;
    more.hidden = matches.length <= limit;
  }

  function update() {
    const phrase = normalize(query.value);
    const words = phrase ? phrase.split(' ') : [];
    matches = records.filter((record) =>
      (!topic.value || record.topic === topic.value) &&
      (!format.value || record.format === format.value) &&
      (!language.value || record.languages.includes(language.value)) &&
      words.every((word) => record.text.includes(word.length < 3 ? ' ' + word + ' ' : word)));
    if (phrase) {
      const score = (record) => (record.title === phrase ? 5 : 0) +
        (record.format === 'Topic guide' ? 3 : 0) +
        (record.title.includes(phrase) ? 2 : 0);
      matches.sort((a, b) => score(b) - score(a));
    }
    reset.hidden = !Object.values(fields).some((field) => field.value);
    limit = pageSize;
    showMatches();
  }

  function readFilters() {
    const params = new URLSearchParams(window.location.search);
    for (const [name, field] of Object.entries(fields)) {
      field.value = (params.get(name) || '').slice(0, 120);
      if (field instanceof HTMLSelectElement && field.selectedIndex < 0) field.selectedIndex = 0;
    }
  }

  function onChange() {
    update();
    saveFilters();
  }

  function goToResults() {
    resultsHeading.focus({ preventScroll: true });
    resultsHeading.scrollIntoView({ block: 'start' });
  }

  query.addEventListener('input', onChange);
  filters.addEventListener('change', onChange);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onChange();
    goToResults();
  });
  reset.addEventListener('click', () => {
    for (const field of Object.values(fields)) field.value = '';
    onChange();
    goToResults();
  });
  more.addEventListener('click', () => {
    const firstNew = matches[limit];
    limit += pageSize;
    showMatches();
    firstNew.element.querySelector('h3 a').focus();
  });
  window.addEventListener('popstate', () => {
    readFilters();
    update();
  });
  readFilters();
  update();
  if (Object.values(fields).some((field) => field.value) && !window.location.hash) goToResults();
  filters.hidden = false;
}

function setupSharing(button) {
  const status = document.querySelector('.copy-status');
  button.hidden = false;
  button.addEventListener('click', async () => {
    const url = new URL('./', window.location.href).href;
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = 'Link copied.';
    } catch {
      const field = document.createElement('input');
      field.className = 'share-url';
      field.setAttribute('aria-label', 'Page link');
      field.readOnly = true;
      field.value = url;
      status.replaceChildren(field);
      field.select();
    }
  });
}

const form = document.querySelector('#search');
if (form) setupSearch(form);
const copyButton = document.querySelector('.copy-link');
if (copyButton) setupSharing(copyButton);

for (const image of document.querySelectorAll('.preview img')) {
  const hidePreview = () => { image.parentElement.hidden = true; };
  image.addEventListener('error', hidePreview, { once: true });
  if (image.complete && image.naturalWidth === 0) hidePreview();
}
