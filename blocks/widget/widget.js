import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  const { section } = document.body.dataset;
  const variants = [...block.classList].filter((c) => c !== 'block' && c !== 'widget');

  block.dataset.widget = 'loading';

  if (section) {
    await loadScript(
      `../widgets/${section}/${variants[0] || 'index'}.js`,
      { type: 'module' },
    );
  } else {
    // no section, run default widgets
  }
}
