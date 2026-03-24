const PREVIEW_URL = chrome.runtime.getURL('preview.html');
const CONTENT_SCRIPT_FILE = 'contentScript.js';

function isSupportedTabUrl(url) {
  return Boolean(
    url &&
      !url.startsWith('chrome://') &&
      !url.startsWith('chrome-extension://') &&
      !url.startsWith('edge://') &&
      !url.startsWith('about:')
  );
}

function getErrorMessage(error, fallbackMessage) {
  return error instanceof Error ? error.message : fallbackMessage;
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_SCRIPT_FILE],
  });
}

async function getStoredSourceTab() {
  const { sourceTabId } = await chrome.storage.session.get('sourceTabId');
  if (!sourceTabId) {
    return null;
  }

  try {
    const tab = await chrome.tabs.get(sourceTabId);
    if (!tab?.id || !isSupportedTabUrl(tab.url)) {
      return null;
    }
    return tab;
  } catch {
    return null;
  }
}

async function resolveExtractionTab(preferredTab) {
  if (preferredTab?.id && isSupportedTabUrl(preferredTab.url)) {
    return preferredTab;
  }

  const storedSourceTab = await getStoredSourceTab();
  if (storedSourceTab) {
    return storedSourceTab;
  }

  return null;
}

async function extractArticleFromTab(tabId, url) {
  await ensureContentScript(tabId);

  const response = await chrome.tabs.sendMessage(tabId, {
    type: 'EXTRACT_ARTICLE',
    url
  });

  if (!response || !response.success) {
    const message = response?.error || 'Failed to extract article.';
    throw new Error(message);
  }

  return response.article;
}

async function openOrUpdatePreviewTab() {
  const { previewTabId } = await chrome.storage.session.get('previewTabId');

  if (previewTabId) {
    try {
      await chrome.tabs.update(previewTabId, { url: PREVIEW_URL, active: true });
      return previewTabId;
    } catch {
      // Fall through and create a new tab.
    }
  }

  const tab = await chrome.tabs.create({ url: PREVIEW_URL, active: true });
  await chrome.storage.session.set({ previewTabId: tab.id });
  return tab.id;
}

async function storeArticlePayload(payload) {
  await chrome.storage.session.set({
    articleData: payload.article,
    sourceTabId: payload.sourceTabId,
    sourceUrl: payload.sourceUrl,
    lastUpdated: Date.now()
  });
}

async function pushArticleToPreview(article) {
  try {
    await chrome.runtime.sendMessage({ type: 'ARTICLE_UPDATED', article });
  } catch {
    // If no preview listeners are ready yet, ignore.
  }
}

async function handleExtractAndOpen(tab) {
  const extractionTab = await resolveExtractionTab(tab);
  if (!extractionTab?.id || !extractionTab.url) {
    throw new Error('Open a normal web page, then click PrintPure.');
  }

  const article = await extractArticleFromTab(extractionTab.id, extractionTab.url);
  await storeArticlePayload({
    article,
    sourceTabId: extractionTab.id,
    sourceUrl: extractionTab.url
  });

  await openOrUpdatePreviewTab();
  await pushArticleToPreview(article);
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await handleExtractAndOpen(tab);
  } catch (error) {
    console.warn('PrintPure:', getErrorMessage(error, 'Failed to extract article.'));
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'REPARSE_ARTICLE') {
    (async () => {
      const sourceTab = await getStoredSourceTab();

      if (!sourceTab?.id || !sourceTab.url) {
        sendResponse({ success: false, error: 'No source tab available.' });
        return;
      }

      try {
        const article = await extractArticleFromTab(sourceTab.id, sourceTab.url);
        await storeArticlePayload({
          article,
          sourceTabId: sourceTab.id,
          sourceUrl: sourceTab.url
        });

        await pushArticleToPreview(article);

        sendResponse({ success: true, article });
      } catch (error) {
        sendResponse({ success: false, error: getErrorMessage(error, 'Failed to reparse.') });
      }
    })();

    return true;
  }

  if (message?.type === 'GET_ARTICLE') {
    (async () => {
      const { articleData } = await chrome.storage.session.get('articleData');
      if (articleData) {
        sendResponse({ success: true, article: articleData });
        return;
      }

      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const extractionTab = await resolveExtractionTab(activeTab);
        if (!extractionTab?.id || !extractionTab.url) {
          sendResponse({ success: false, error: 'No eligible active tab found.' });
          return;
        }

        const article = await extractArticleFromTab(extractionTab.id, extractionTab.url);
        await storeArticlePayload({
          article,
          sourceTabId: extractionTab.id,
          sourceUrl: extractionTab.url
        });
        await pushArticleToPreview(article);
        sendResponse({ success: true, article });
      } catch (error) {
        sendResponse({ success: false, error: getErrorMessage(error, 'Failed to extract article.') });
      }
    })();

    return true;
  }

  return false;
});
