import {
  // buildBlock,
  loadHeader,
  loadFooter,
  decorateIcon,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  sampleRUM,
} from './aem.js';

/**
 * Creates DOM element with optional attributes and children.
 * @param {string} tag - Tag name of the element
 * @param {Object} [attrs = {}] - Attributes to set
 * @param {Array} [children = []] - Children to append
 * @returns {HTMLElement} Newly created and populated DOM element
 */
export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  // apply attributes
  Object.entries(attrs).forEach(([attr, value]) => {
    switch (attr) {
      case 'class':
        el.className = value;
        break;
      case 'text':
        el.textContent = value;
        break;
      case 'html':
        el.innerHTML = value;
        break;
      default:
        el.setAttribute(attr, value);
        break;
    }
  });

  // normalize and append children
  // eslint-disable-next-line no-param-reassign
  if (!Array.isArray(children)) children = children != null ? [children] : [];
  children.forEach((child) => {
    if (child instanceof Node) el.append(child);
    else el.append(document.createTextNode(child));
  });

  return el;
}

/**
 * Load fonts.css and set a session storage flag.
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function swapIcon(icon) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const resp = await fetch(icon.src);
        const temp = document.createElement('div');
        temp.innerHTML = await resp.text();
        const svg = temp.querySelector('svg');
        temp.remove();
        // check if svg has inline styles
        let style = svg.querySelector('style');
        if (style) style = style.textContent.toLowerCase().includes('currentcolor');
        let fill = svg.querySelector('[fill]');
        if (fill) fill = fill.getAttribute('fill').toLowerCase().includes('currentcolor');
        // replace image with SVG, ensuring color inheritance
        if ((style || fill) || (!style && !fill)) {
          icon.replaceWith(svg);
        }
        observer.disconnect();
      }
    });
  }, { threshold: 0 });
  observer.observe(icon);
}

/**
 * Replaces image icons with inline SVGs when they enter the viewport.
 */
export function swapIcons() {
  document.querySelectorAll('span.icon > img[src]').forEach((icon) => {
    swapIcon(icon);
  });
}

export function buildIcon(name, modifier) {
  const icon = document.createElement('span');
  icon.className = `icon icon-${name}`;
  if (modifier) icon.classList.add(modifier);
  decorateIcon(icon);
  return icon;
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
// function buildAutoBlocks(main) {
//   try {
//     // build auto blocks
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error('Auto Blocking failed', error);
//   }
// }

/**
 * Decorates links with appropriate classes to style them as buttons
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    // identify standalone links
    if (a.href !== a.textContent && p.textContent.trim() === a.textContent.trim()) {
      a.className = 'button';
      const strong = a.closest('strong');
      const em = a.closest('em');
      const double = !!strong && !!em;
      if (double) a.classList.add('accent');
      else if (strong) a.classList.add('emphasis');
      else if (em) a.classList.add('outline');
      p.replaceChild(a, p.firstChild);
      p.className = 'button-wrapper';
    }
  });
  // collapse adjacent button wrappers
  const wrappers = main.querySelectorAll('p.button-wrapper');
  let previousWrapper = null;
  wrappers.forEach((wrapper) => {
    if (previousWrapper && previousWrapper.nextElementSibling === wrapper) {
      // move all buttons from the current wrapper to the previous wrapper
      previousWrapper.append(...wrapper.childNodes);
      // remove the empty wrapper
      wrapper.remove();
    } else previousWrapper = wrapper; // now set the current wrapper as the previous wrapper
  });
}

function decorateImages(main) {
  main.querySelectorAll('p img').forEach((img) => {
    const p = img.closest('p');
    p.className = 'img-wrapper';
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  decorateImages(main);
  // buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  sampleRUM.enhance();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  swapIcons(main);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
