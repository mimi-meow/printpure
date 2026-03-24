const body = document.body;
const paper = document.getElementById('paper');
const emptyState = document.getElementById('empty-state');
let titleEl = document.getElementById('article-title');
let bylineEl = document.getElementById('article-byline');
let contentEl = document.getElementById('article-content');
const toastEl = document.getElementById('toast');
const loadingEl = document.getElementById('loading');

const reextractButton = document.getElementById('new-button');
const resetButton = document.getElementById('reset-button');
const undoButton = document.getElementById('undo-button');
const themeButton = document.getElementById('theme-button');
const imagesButton = document.getElementById('images-button');
const printButton = document.getElementById('print-button');
const reparseButton = document.getElementById('reparse-button');

let currentArticle = null;
let deletedNodes = [];
let showImages = false;
let isDarkMode = true;

const SELECTOR = 'p, h1, h2, h3, h4, h5, h6, img, figure, blockquote, li, ul, ol, div, table, hr, header';

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function setLoading(isLoading) {
  loadingEl.classList.toggle('hidden', !isLoading);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 4000);
}

function updateUndoButton() {
  undoButton.textContent = `Undo (${deletedNodes.length})`;
  undoButton.disabled = deletedNodes.length === 0;
}

function applyTheme() {
  body.classList.toggle('theme-dark', isDarkMode);
  body.classList.toggle('theme-light', !isDarkMode);
  localStorage.setItem('printpure.theme', isDarkMode ? 'dark' : 'light');
}

function applyImageToggle() {
  body.classList.toggle('hide-images', !showImages);
  imagesButton.textContent = showImages ? 'Hide Images' : 'Show Images';
  localStorage.setItem('printpure.images', showImages ? 'show' : 'hide');
}

function resetDeletionState() {
  deletedNodes = [];
  updateUndoButton();
}

function cloneArticle(article) {
  return {
    title: article?.title || '',
    byline: article?.byline || '',
    content: article?.content || '',
  };
}

function ensurePaperStructure() {
  let header = paper.querySelector('#article-header');
  if (!header) {
    header = document.createElement('header');
    header.id = 'article-header';
    header.className = 'paper-header';
    paper.prepend(header);
  }

  titleEl = paper.querySelector('#article-title');
  if (!titleEl) {
    titleEl = document.createElement('h1');
    titleEl.id = 'article-title';
    header.prepend(titleEl);
  }

  bylineEl = paper.querySelector('#article-byline');
  if (!bylineEl) {
    bylineEl = document.createElement('p');
    bylineEl.id = 'article-byline';
    header.appendChild(bylineEl);
  }

  contentEl = paper.querySelector('#article-content');
  if (!contentEl) {
    contentEl = document.createElement('div');
    contentEl.id = 'article-content';
    contentEl.className = 'paper-content';
    paper.appendChild(contentEl);
  }
}

function renderArticle(article) {
  if (!article?.content) {
    paper.classList.add('hidden');
    emptyState.classList.remove('hidden');
    showToast('No article content found for this page.');
    return;
  }

  currentArticle = cloneArticle(article);
  ensurePaperStructure();

  titleEl.textContent = currentArticle.title || 'Untitled';
  bylineEl.textContent = currentArticle.byline;
  bylineEl.classList.toggle('hidden', !currentArticle.byline);
  contentEl.innerHTML = currentArticle.content;

  resetDeletionState();
  paper.classList.remove('hidden');
  emptyState.classList.add('hidden');
}

function handleReset() {
  if (!currentArticle) return;
  renderArticle(currentArticle);
}

function handleUndo() {
  const lastDeleted = deletedNodes.pop();
  if (!lastDeleted) return;

  const { parent, node, index } = lastDeleted;
  const targetParent = parent?.isConnected ? parent : contentEl;
  const referenceNode = targetParent.childNodes[index] || null;

  if (referenceNode) {
    targetParent.insertBefore(node, referenceNode);
  } else {
    targetParent.appendChild(node);
  }

  updateUndoButton();
}

function handlePrint() {
  window.print();
}

function handleThemeToggle() {
  isDarkMode = !isDarkMode;
  applyTheme();
}

function handleImagesToggle() {
  showImages = !showImages;
  applyImageToggle();
}

function getTargetElement(target) {
  if (!target) return null;
  if (target instanceof Element) return target;
  if (target instanceof Node && target.parentElement) return target.parentElement;
  return null;
}

function attachDeletionHandlers() {
  paper.addEventListener('mouseover', (event) => {
    const el = getTargetElement(event.target);
    if (!el) return;

    const target = el.closest(SELECTOR);
    if (target && paper.contains(target) && target !== paper) {
      target.style.outline = `2px dashed ${getComputedStyle(document.documentElement).getPropertyValue('--danger')}`;
      target.style.cursor = 'pointer';
      target.title = 'Click to remove';
    }
  });

  paper.addEventListener('mouseout', (event) => {
    const el = getTargetElement(event.target);
    if (!el) return;

    const target = el.closest(SELECTOR);
    if (target) {
      target.style.outline = '';
      target.style.cursor = '';
      target.title = '';
    }
  });

  paper.addEventListener('click', (event) => {
    const el = getTargetElement(event.target);
    if (!el) return;

    if (el.closest('a')) {
      event.preventDefault();
    }

    const deletable = el.closest(SELECTOR);
    if (deletable && paper.contains(deletable) && deletable !== paper) {
      event.preventDefault();
      event.stopPropagation();

      const parent = deletable.parentNode;
      if (!parent) return;

      const index = Array.from(parent.childNodes).indexOf(deletable);
      deletedNodes.push({ parent, node: deletable, index });
      deletable.remove();
      updateUndoButton();
    }
  }, true);
}

async function loadInitialState() {
  isDarkMode = localStorage.getItem('printpure.theme') !== 'light';
  showImages = localStorage.getItem('printpure.images') === 'show';
  applyTheme();
  applyImageToggle();

  const stored = await chrome.storage.session.get('articleData');
  if (stored?.articleData) {
    renderArticle(stored.articleData);
  } else {
    paper.classList.add('hidden');
    emptyState.classList.remove('hidden');
    await requestArticleFromBackground();
  }
}

async function requestArticleFromBackground() {
  setLoading(true);
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ARTICLE' });
    if (response?.success && response.article) {
      renderArticle(response.article);
      return;
    }
    if (response?.error) {
      showToast(response.error);
    }
  } catch (error) {
    showToast(getErrorMessage(error, 'Unable to load article.'));
  } finally {
    setLoading(false);
  }
}

async function reparseArticle() {
  setLoading(true);
  try {
    const response = await chrome.runtime.sendMessage({ type: 'REPARSE_ARTICLE' });
    if (!response?.success) {
      throw new Error(response?.error || 'Unable to refresh.');
    }
    renderArticle(response.article);
  } catch (error) {
    showToast(getErrorMessage(error, 'Unable to refresh.'));
  } finally {
    setLoading(false);
  }
}

reextractButton.addEventListener('click', reparseArticle);
resetButton.addEventListener('click', handleReset);
undoButton.addEventListener('click', handleUndo);
printButton.addEventListener('click', handlePrint);
themeButton.addEventListener('click', handleThemeToggle);
imagesButton.addEventListener('click', handleImagesToggle);
reparseButton.addEventListener('click', reparseArticle);

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'ARTICLE_UPDATED') {
    renderArticle(message.article);
  }
});

attachDeletionHandlers();
loadInitialState();
