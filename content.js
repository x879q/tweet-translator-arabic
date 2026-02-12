const TRANSLATE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`;

// Floating tooltip system
const floatingTip = document.createElement("div");
floatingTip.id = "tweet-translator-tooltip";
floatingTip.style.cssText = `
  position: fixed;
  display: none;
  background: #000;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  z-index: 2147483647;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  direction: rtl;
`;
document.body.appendChild(floatingTip);

function showTooltip(btn, text) {
  const rect = btn.getBoundingClientRect();
  floatingTip.textContent = text;
  floatingTip.style.display = "block";
  const tipRect = floatingTip.getBoundingClientRect();
  floatingTip.style.left = (rect.left + rect.width / 2 - tipRect.width / 2) + "px";
  floatingTip.style.top = (rect.top - tipRect.height - 8) + "px";
}

function hideTooltip() {
  floatingTip.style.display = "none";
}

async function translateText(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data[0].map(chunk => chunk[0]).join("");
}

function createTranslateButton() {
  const btn = document.createElement("button");
  btn.className = "tweet-translate-btn";
  btn.innerHTML = TRANSLATE_SVG;
  btn.setAttribute("data-translate-btn", "true");
  btn.setAttribute("data-tip", "ترجم إلى العربية");
  btn.addEventListener("mouseenter", () => showTooltip(btn, btn.getAttribute("data-tip")));
  btn.addEventListener("mouseleave", hideTooltip);
  return btn;
}

function getTweetTextElement(tweetArticle) {
  return tweetArticle.querySelector('[data-testid="tweetText"]');
}

function addTranslateButton(tweetArticle) {
  if (tweetArticle.querySelector('[data-translate-btn]')) return;

  const tweetTextEl = getTweetTextElement(tweetArticle);
  if (!tweetTextEl) return;

  const caretBtn = tweetArticle.querySelector('[data-testid="caret"]');
  if (!caretBtn) return;

  const btn = createTranslateButton();
  let isTranslated = false;
  let originalHTML = "";

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (btn.classList.contains("translating")) return;

    if (isTranslated) {
      tweetTextEl.innerHTML = originalHTML;
      tweetTextEl.style.direction = "";
      tweetTextEl.style.textAlign = "";
      btn.classList.remove("done");
      btn.setAttribute("data-tip", "ترجم إلى العربية");
      isTranslated = false;
      return;
    }

    originalHTML = tweetTextEl.innerHTML;
    const originalText = tweetTextEl.innerText;

    if (!originalText.trim()) return;

    btn.classList.add("translating");
    btn.setAttribute("data-tip", "جارٍ الترجمة...");

    try {
      const translated = await translateText(originalText);
      tweetTextEl.innerHTML = "";
      tweetTextEl.style.direction = "rtl";
      tweetTextEl.style.textAlign = "right";
      tweetTextEl.innerText = translated;
      btn.classList.remove("translating");
      btn.classList.add("done");
      btn.setAttribute("data-tip", "عرض الأصلي");
      isTranslated = true;
    } catch (err) {
      console.error("Translation error:", err);
      btn.classList.remove("translating");
      btn.setAttribute("data-tip", "خطأ، حاول مرة أخرى");
    }
  });

  // Place next to the ⋯ (more) button
  const caretContainer = caretBtn.closest('[role="button"]') || caretBtn.parentElement;
  caretContainer.parentElement.insertBefore(btn, caretContainer);
}

function scanTweets() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  tweets.forEach(addTranslateButton);
}

// Initial scan
scanTweets();

// Watch for new tweets loaded dynamically
const observer = new MutationObserver(() => {
  scanTweets();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
