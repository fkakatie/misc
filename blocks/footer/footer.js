import { getMetadata } from '../../scripts/aem.js';
import { createEl, swapIcons } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const meta = getMetadata('footer');
  const path = meta ? new URL(meta, window.location).pathname : '/footer';
  const fragment = await loadFragment(path);
  if (!fragment) return; // eject if no footer fragment

  // extract and label nav sections
  const sections = [...fragment.children].map((c) => c.firstElementChild);
  const classes = ['copy', 'links'];
  sections.forEach((section, i) => {
    const type = classes[i] || 'other';
    section.className = `footer-${type}`;
  });

  const footer = createEl('section', {}, sections);
  block.replaceChildren(footer);

  swapIcons(block);
}
