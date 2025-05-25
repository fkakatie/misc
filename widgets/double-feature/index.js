import { createEl } from '../../scripts/scripts.js';
import { loadCSS } from '../../scripts/aem.js';

function buildRow(data) {
  // build connection
  let connection = createEl('div', { class: 'connection' });
  data.connection.split(',').forEach((c) => {
    if (c.trim()) {
      const ph = createEl('div', { class: 'image-wrapper' }, c.trim());
      connection.append(ph);
    } else connection = '';
  });

  // build movie
  const movie = createEl('div', { class: 'movie', 'data-choice': data.choice[0] });
  const title = createEl('h2', { class: 'title' }, data.title);
  movie.append(title);

  const row = createEl('div', {}, [connection, movie]);
  return row;
}

function buildRows(rows) {
  return rows.map((r) => buildRow(r));
}

async function fetchData(src) {
  const resp = await fetch(src);
  const { data } = await resp.json();
  return data;
}

async function decorate(doc) {
  const widget = doc.querySelector('.block.widget');
  const src = widget.querySelector('a[href]');
  const data = await fetchData(src);
  const rows = buildRows(data);
  widget.replaceChildren(...rows);
  loadCSS('/widgets/double-feature/styles.css').then(() => {
    widget.dataset.widget = 'loaded';
  });
}

decorate(document);
