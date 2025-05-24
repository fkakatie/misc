import { getMetadata } from '../../scripts/aem.js';
import { createEl, swapIcons } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

function decorateTitle(title) {
  const a = title.querySelector('a');
  if (!a) {
    const link = createEl('a', { href: '/' }, title.textContent);
    title.replaceWith(link);
  }
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const meta = getMetadata('nav');
  const path = meta ? new URL(meta, window.location).pathname : '/nav';
  const fragment = await loadFragment(path);
  if (!fragment) return; // eject if no nav fragment

  // extract and label nav sections
  const sections = [...fragment.children].map((c) => c.firstElementChild);
  const classes = ['title', 'links', 'tools'];
  sections.forEach((section, i) => {
    const type = classes[i] || 'other';
    section.className = `nav-${type}`;
  });

  // build semantic nav
  const nav = createEl('nav', { 'aria-label': 'Main navigation' }, sections);
  block.replaceChildren(nav);

  const title = nav.querySelector('.nav-title');
  if (title) decorateTitle(title);

  swapIcons(block);
}
