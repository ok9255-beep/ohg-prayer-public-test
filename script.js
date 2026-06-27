document.addEventListener('DOMContentLoaded', () => {
  loadToday();
});

function loadToday() {
  const apiUrl = window.OHG_API_URL;

  if (!apiUrl || apiUrl === 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
    showError('config.js에 Apps Script Web App URL을 입력해 주세요.');
    return;
  }

  document.getElementById('content').innerHTML = `
    <div class="loading">오늘의 기도 제단을 준비하고 있습니다...</div>
  `;

  jsonp(`${apiUrl}?action=today`)
    .then(renderToday)
    .catch(showError);
}

function renderToday(data) {
  if (!data || data.ok === false) {
    showError(data && data.error ? data.error : '데이터를 불러오지 못했습니다.');
    return;
  }

  const prayerItems = data.prayerItems || [];

  document.getElementById('content').innerHTML = `
    <section class="entrance-head">
      <div class="entrance-date">${esc(data.displayDate)} · ${esc(data.koreanDay || data.dayEn)}</div>
      <div class="entrance-kicker">One Holy Groove Prayer</div>
      <h1 class="entrance-title">오늘의 기도</h1>
      <div class="entrance-topic">${esc(data.topic || '기도 주제')}</div>
      <div class="entrance-summary">
        아래에서 오늘의 말씀과 기도제목을 읽고, 각자의 자리에서 기도로 응답합니다.
      </div>
    </section>

    ${buildDirectionCard(data.foundation, 'foundation', '기도의 능력')}
    ${buildDirectionCard(data.direction, '', '오늘의 말씀')}

    <h2 class="section-title">오늘의 기도제목</h2>

    <section class="prayer-list">
      ${buildPrayerItems(prayerItems)}
    </section>

    <div class="footer-note">
      One Holy Groove Prayer<br>
      작은 불씨가 오늘의 제단 위에서 타오르게 하소서.
    </div>
  `;
}

function buildDirectionCard(direction, extraClass, label) {
  if (!direction) return '';

  return `
    <section class="card ${extraClass || ''}">
      <div class="card-title">
        <span class="icon">${esc(direction.Icon || '🔥')}</span>
        <span>${esc(label)}</span>
      </div>

      <div class="bible-ref">${esc(direction.BibleRef || '')}</div>

      <div class="summary">
        <strong>${esc(direction.KoreanTitle || '')}</strong><br>
        ${esc(direction.KoreanSummary || '')}
      </div>

      ${direction.KoreanVerse ? `
        <div class="korean-verse">${esc(direction.KoreanVerse)}</div>
      ` : ''}

      ${direction.EnglishVerse ? `
        <details>
          <summary>영어 KJV 보기</summary>
          <div class="verse">${esc(direction.EnglishVerse)}</div>
        </details>
      ` : ''}
    </section>
  `;
}

function buildPrayerItems(items) {
  if (!items.length) {
    return `
      <div class="empty">
        오늘 표시할 기도제목이 아직 없습니다.<br>
        PrayerItems 시트에서 오늘 요일과 주차의 기도제목을 입력해 주세요.
      </div>
    `;
  }

  return items.map(item => {
    return `
      <article class="prayer-item">
        <div class="item-category">${esc(item.Category || '기도')}</div>
        <div class="item-title">${esc(item.PrayerTitle || '')}</div>
        <div class="item-text">${esc(item.PrayerText || '')}</div>
      </article>
    `;
  }).join('');
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `ohgCallback_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const separator = url.indexOf('?') >= 0 ? '&' : '?';
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Apps Script API 응답 시간이 초과되었습니다.'));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = data => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Apps Script API를 불러오지 못했습니다.'));
    };

    script.src = `${url}${separator}callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

function showError(error) {
  document.getElementById('content').innerHTML = `
    <div class="error">
      앱을 불러오는 중 문제가 생겼습니다.<br><br>
      ${esc(error && error.message ? error.message : error)}
    </div>
  `;
}

function esc(value) {
  const div = document.createElement('div');
  div.textContent = value === null || value === undefined ? '' : String(value);
  return div.innerHTML;
}
