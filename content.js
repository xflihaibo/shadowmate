// Content Script for 伴影 (Shadow Mate)
console.log('伴影 (Shadow Mate) 的影子正在静默守护...');

let stats = {
  clicks: 0, scrollDistance: 0, keywords: [], charsTyped: 0, searchQuery: null, activeDuration: 0
};

let isRitualShown = false; 
let localGhostClosed = false; // 当前 Tab 的关闭状态

function isContextValid() {
  return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
}

// 监听存储变化，实现多 Tab 同步关闭
if (isContextValid()) {
  chrome.storage.onChanged.addListener((changes) => {
    const today = new Date().toDateString();
    
    // 监听仪式（幽灵）关闭
    if (changes.isGhostClosedToday && changes.isGhostClosedToday.newValue === today) {
      document.querySelectorAll('.shadow-mate-ghost, .shadow-mate-card').forEach(el => {
        if (el.dataset.type !== 'hint') el.remove();
      });
      document.getElementById('shadow-mate-sunset-overlay')?.remove();
    }
    
    // 监听提示（蜡烛）关闭
    if (changes.isHintClosedToday && changes.isHintClosedToday.newValue === today) {
      document.querySelectorAll('.shadow-mate-ghost').forEach(el => {
        if (el.querySelector('span')?.textContent === '🕯️') el.remove();
      });
      document.getElementById('shadow-mate-sunset-overlay')?.remove();
    }
  });
}

async function checkGhostClosed() {
  if (!isContextValid()) return true;
  const res = await chrome.storage.local.get({ isGhostClosedToday: '' });
  return res.isGhostClosedToday === new Date().toDateString();
}

// 0. 活跃时长心跳
const heartbeatInterval = setInterval(() => {
  if (!isContextValid()) { clearInterval(heartbeatInterval); return; }
  checkEnabled(() => {
    if (document.visibilityState === 'visible') stats.activeDuration++;
  });
}, 1000);

// 1. 物理统计事件
window.addEventListener('click', () => {
  if (!isContextValid()) return;
  checkEnabled(() => { stats.clicks++; });
});

window.addEventListener('input', (e) => {
  if (!isContextValid()) return;
  checkEnabled(() => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      stats.charsTyped++;
    }
  });
}, true);

let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  if (!isContextValid()) return;
  checkEnabled(() => {
    const currentScrollY = window.scrollY;
    stats.scrollDistance += Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;
  });
}, { passive: true });

function checkEnabled(callback) {
  if (!isContextValid()) return;
  try {
    chrome.storage.local.get({ isEnabled: true }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res && res.isEnabled && callback) callback();
    });
  } catch (e) {}
}

function extractKeywords() {
  const metaKeywords = document.querySelector('meta[name="keywords"]')?.content;
  const h1Text = document.querySelector('h1')?.innerText;
  const title = document.title;
  try {
    const url = new URL(window.location.href);
    if (url.hostname.includes('google') || url.hostname.includes('baidu') || url.hostname.includes('bing')) {
      const q = url.searchParams.get('q') || url.searchParams.get('wd');
      if (q) stats.searchQuery = q;
    }
  } catch(e) {}
  const keywords = [];
  if (title) keywords.push(...cleanText(title));
  if (h1Text) keywords.push(...cleanText(h1Text));
  if (metaKeywords) keywords.push(...metaKeywords.split(/[,，]/).map(s => s.trim()));
  return [...new Set(keywords)].filter(k => k.length > 1 && k.length < 20).slice(0, 10);
}

function cleanText(text) {
  return text.split(/[_\-|—]/).map(s => s.trim()).filter(s => s.length > 1);
}

function safeSendMessage(message, callback) {
  if (!isContextValid()) return;
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError || !callback) return;
      callback(response);
    });
  } catch (e) {}
}

const syncInterval = setInterval(() => {
  if (!isContextValid()) { clearInterval(syncInterval); return; }
  checkEnabled(() => {
    if (stats.clicks > 0 || stats.scrollDistance > 0 || stats.charsTyped > 0 || stats.activeDuration > 0) {
      stats.keywords = extractKeywords();
      safeSendMessage({ type: 'UPDATE_STATS', data: stats });
      stats.clicks = 0; stats.scrollDistance = 0; stats.charsTyped = 0; stats.activeDuration = 0;
    }
  });
}, 5000);

// --- 仪式感逻辑 ---

async function updateGoldenHourEffect() {
  if (!isContextValid()) return;
  
  try {
    const res = await chrome.storage.local.get({ 
      sunsetTime: '18:00', 
      lastRitualDate: '',
      isGhostClosedToday: '',
      isHintClosedToday: ''
    });
    
    const now = new Date();
    const today = now.toDateString();
    const isGhostClosed = res.isGhostClosedToday === today;
    const isHintClosed = res.isHintClosedToday === today;
    
    const [sh, sm] = res.sunsetTime.split(':').map(Number);
    const totalMins = now.getHours() * 60 + now.getMinutes();
    const sunsetMins = sh * 60 + sm;
    const startMins = sunsetMins - 30;

    let overlay = document.getElementById('shadow-mate-sunset-overlay');
    
    // 1. 到达或超过下班时间
    if (totalMins >= sunsetMins) {
      if (isGhostClosed) {
        document.querySelectorAll('.shadow-mate-ghost, .shadow-mate-card').forEach(el => el.remove());
        document.getElementById('shadow-mate-sunset-overlay')?.remove();
        return;
      }

      if (overlay) overlay.style.background = `rgba(255, 140, 0, 0.05)`;
      
      const ghost = document.querySelector('.shadow-mate-ghost');
      const isCandle = ghost && ghost.querySelector('span')?.textContent === '🕯️';
      
      if (!isRitualShown || isCandle) {
        showSunsetRitual(true); 
      }
      return;
    }

    // 2. 余晖时间 (下班前 30 分钟)
    if (totalMins >= startMins && totalMins < sunsetMins) {
      if (isHintClosed) {
        document.querySelectorAll('.shadow-mate-ghost').forEach(el => {
          if (el.querySelector('span')?.textContent === '🕯️') el.remove();
        });
        document.getElementById('shadow-mate-sunset-overlay')?.remove();
        return;
      }

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'shadow-mate-sunset-overlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999; transition: background 2s ease; mix-blend-mode: multiply;`;
        document.body.appendChild(overlay);
      }
      const progress = (totalMins - startMins) / (sunsetMins - startMins);
      overlay.style.background = `rgba(255, 140, 0, ${progress * 0.05})`;
      
      if (!document.querySelector('.shadow-mate-ghost')) {
        injectStyles();
        createGhostUI(null);
      }
      const ghost = document.querySelector('.shadow-mate-ghost');
      if (ghost) {
        ghost.classList.add('active');
        ghost.querySelector('span').textContent = '🕯️';
      }
    } else if (overlay) {
      overlay.remove();
    }
  } catch (e) {}
}

setInterval(() => { if (isContextValid()) updateGoldenHourEffect(); }, 10000);
updateGoldenHourEffect();

if (isContextValid()) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TRIGGER_SUNSET') {
      isRitualShown = false;
      // 重置所有关闭状态，强制触发
      chrome.storage.local.set({ isGhostClosedToday: '', isHintClosedToday: '' }, () => {
        checkEnabled(() => showSunsetRitual(true));
      });
    } else if (message.type === 'STATE_CHANGED') {
      if (!message.isEnabled) {
        document.getElementById('shadow-mate-sunset-overlay')?.remove();
        document.querySelectorAll('.shadow-mate-ghost, .shadow-mate-card').forEach(el => el.remove());
      } else {
        updateGoldenHourEffect(); checkTimeAndShow();
      }
    }
  });
}

async function checkTimeAndShow() {
  if (!isContextValid()) return;
  try {
    const res = await chrome.storage.local.get({ isEnabled: true, sunsetTime: '18:00' });
    if (!res.isEnabled) return;
    const [sh, sm] = res.sunsetTime.split(':').map(Number);
    const now = new Date();
    if ((now.getHours() * 60 + now.getMinutes()) >= (sh * 60 + sm)) {
      showSunsetRitual();
    } else {
      updateGoldenHourEffect();
    }
    safeSendMessage({ type: 'GET_PAGE_MEMORY' }, (memory) => {
      if (memory && (Date.now() - memory.visitTime > 1000 * 60 * 60 * 12)) showMemoryGhost(memory);
    });
  } catch(e) {}
}

async function showMemoryGhost(memory) {
  if (!isContextValid()) return;
  const isClosed = await checkGhostClosed();
  if (isClosed) return;

  const msg = `嗨，我们在 ${new Date(memory.visitTime).toLocaleDateString()} 见过。当时你在这里留下了 ${memory.charsTyped || 0} 个字，思考得真认真呢。✨`;
  injectStyles();
  const ghost = document.createElement('div');
  ghost.className = 'shadow-mate-ghost active';
  ghost.style.bottom = '120px';
  ghost.innerHTML = `<div class="shadow-mate-ghost-close" title="再见">×</div><div class="shadow-mate-bubble" style="opacity:1; transform:translateY(0) scale(1);">${msg}</div><span style="font-size: 24px;">💭</span>`;
  document.body.appendChild(ghost);
  ghost.addEventListener('click', (e) => { 
    if (e.target.classList.contains('shadow-mate-ghost-close')) { 
      ghost.remove(); 
      chrome.storage.local.set({ isGhostClosedToday: new Date().toDateString() });
    } 
  });
}

checkTimeAndShow();

async function showSunsetRitual(force = false) {
  if (!isContextValid()) return;
  const isClosed = await checkGhostClosed();
  if (isClosed && !force) return;

  // 如果已经显示了幽灵（不是蜡烛），则不再重复触发
  const existingGhost = document.querySelector('.shadow-mate-ghost');
  if (existingGhost && existingGhost.querySelector('span')?.textContent === '👻' && isRitualShown) {
    return;
  }

  if (isRitualShown && !force) return;
  
  // 防止在请求过程中多次触发
  if (showSunsetRitual.isFetching) return;
  showSunsetRitual.isFetching = true;

  safeSendMessage({ type: 'GET_TODAY_SUMMARY' }, (summary) => {
    showSunsetRitual.isFetching = false;
    if (!summary || !isContextValid()) return;
    
    // 如果是自动触发，则记录今天已触发（全局记录）
    if (!force) {
      chrome.storage.local.set({ lastRitualDate: new Date().toDateString() });
    }
    
    isRitualShown = true;
    injectStyles();
    document.querySelectorAll('.shadow-mate-ghost').forEach(el => el.remove());
    createGhostUI(summary);
    const ghost = document.querySelector('.shadow-mate-ghost');
    if (ghost) {
      ghost.dataset.ritual = "true";
      ghost.classList.add('active');
      ghost.querySelector('span').textContent = '👻';
    }
  });
}

function injectStyles() {
  if (document.getElementById('shadow-mate-styles')) return;
  const style = document.createElement('style');
  style.id = 'shadow-mate-styles';
  style.textContent = `
    .shadow-mate-ghost { position: fixed; right: -100px; bottom: 50px; width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10000; transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.3); animation: shadow-float 3s ease-in-out infinite; opacity: 0; pointer-events: none; }
    .shadow-mate-ghost.active { right: 30px; opacity: 1; pointer-events: auto; }
    @keyframes shadow-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .shadow-mate-ghost span { font-size: 28px; animation: shadow-breath 2s ease-in-out infinite; }
    @keyframes shadow-breath { 0%, 100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
    
    .shadow-mate-ghost-close { position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; background: #ff5f56; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; cursor: pointer; opacity: 0; transition: 0.3s; border: 1.5px solid white; z-index: 10005; box-shadow: 0 2px 5px rgba(0,0,0,0.2); padding-bottom: 2px; }
    .shadow-mate-ghost:hover .shadow-mate-ghost-close { opacity: 1; }
    
    .shadow-mate-bubble { position: absolute; right: 75px; bottom: 10px; background: rgba(255, 255, 255, 0.95); padding: 12px 18px; border-radius: 20px 20px 0 20px; white-space: nowrap; box-shadow: 0 8px 25px rgba(0,0,0,0.1); opacity: 0; transform: translateY(20px) scale(0.8); transition: all 0.4s ease; pointer-events: none; color: #444; font-size: 14px; font-weight: 500; border: 1px solid rgba(0,0,0,0.05); }
    .shadow-mate-ghost.active .shadow-mate-bubble { opacity: 1; transform: translateY(0) scale(1); }
    
    .shadow-mate-card { position: fixed; right: 30px; bottom: 120px; width: 340px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); border-radius: 24px; padding: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); z-index: 10001; display: none; border: 1px solid rgba(255,255,255,0.5); color: #333; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .shadow-mate-card.show { display: block; animation: fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    
    .shadow-mate-card-close { position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; background: rgba(0,0,0,0.05); color: #888; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; cursor: pointer; transition: 0.3s; z-index: 10010; pointer-events: auto !important; user-select: none; line-height: 1; padding-bottom: 4px; }
    .shadow-mate-card-close:hover { background: #ff5f56; color: white; transform: rotate(90deg); padding-bottom: 4px; }
    
    .shadow-mate-narrative { line-height: 1.6; color: #555; font-size: 15px; margin-bottom: 20px; font-style: italic; padding-left: 15px; border-left: 3px solid #f39c12; }
    .shadow-mate-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .shadow-mate-stat-box { background: rgba(0,0,0,0.03); padding: 10px; border-radius: 12px; font-size: 12px; }
    .shadow-mate-stat-label { color: #888; margin-bottom: 4px; display: block; }
    .shadow-mate-stat-value { font-weight: bold; color: #333; font-size: 14px; }
    .shadow-mate-timeline { margin-top: 20px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 15px; }
    .shadow-mate-timeline-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
    .shadow-mate-timeline-time { font-size: 11px; color: #999; width: 45px; flex-shrink: 0; }
    .shadow-mate-timeline-content { flex-grow: 1; padding-left: 10px; border-left: 2px solid #eee; position: relative; }
    .shadow-mate-timeline-content::after { content: ''; position: absolute; left: -5px; top: 5px; width: 8px; height: 8px; border-radius: 50%; background: #ddd; }
    .shadow-mate-timeline-item.active .shadow-mate-timeline-content { border-left-color: #f39c12; }
    .shadow-mate-timeline-item.active .shadow-mate-timeline-content::after { background: #f39c12; }
    .shadow-mate-timeline-tags { font-size: 10px; color: #777; margin-top: 2px; }
    .shadow-mate-keywords { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 15px; }
    .shadow-mate-keyword { background: rgba(243, 156, 18, 0.1); color: #d35400; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; }
  `;
  document.head.appendChild(style);
}

function getWarmGreeting(summary) {
  if (!summary) return "余晖升起，离归航不远了...";
  const pool = [
    `今日辛苦啦！敲击了 ${summary.totalChars} 个字，休息一下吧 ✨`,
    "伴影提醒：金色时刻到了，该下班了 ✨",
    "夕阳很美，别让屏幕遮住了你的眼睛 🌇",
    "影子守望者提醒：工作是做不完的，休息可以现在开始。",
    "代码写不完，快乐可以自己找，下班啦！"
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateShadowNarrative(summary) {
  const { mainCategory, topSiteTitle, totalDuration, totalChars, totalClicks, totalScroll, peakHour } = summary;
  const hours = Math.round(totalDuration / 3600 * 10) / 10;
  const categoryNames = { work: '航行在代码海洋', study: '漫步在知识森林', social: '在数字广场交汇', video: '驻足在光影之间', other: '静静探索角落' };
  
  const scrollMeters = Math.round(totalScroll / 1000);
  
  return `今天，你 ${categoryNames[mainCategory] || '度过了充实的一天'}。你似乎在 ${topSiteTitle} 停留了很久，留下了深刻的足迹。你敲下了 ${totalChars} 个思考的碎片，指尖在屏幕上轻快地跳了 ${totalClicks} 次舞，并在数字的峰峦间翻越了 ${scrollMeters} 米。在 ${peakHour}点 左右，是你灵魂最活跃的时刻。你在数字世界已经停留了 ${hours} 小时。`;
}

function createGhostUI(summary) {
  if (!isContextValid()) return;
  const ghost = document.createElement('div');
  ghost.className = 'shadow-mate-ghost';
  
  // 气泡温馨提示
  const greeting = getWarmGreeting(summary);
  ghost.innerHTML = `<div class="shadow-mate-ghost-close">×</div><div class="shadow-mate-bubble">${greeting}</div><span>👻</span>`;
  document.body.appendChild(ghost);

    const ghostClose = ghost.querySelector('.shadow-mate-ghost-close');
    ghostClose.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const isHint = ghost.querySelector('span')?.textContent === '🕯️';
      ghost.remove(); 
      document.querySelector('.shadow-mate-card')?.remove(); 
      document.getElementById('shadow-mate-sunset-overlay')?.remove(); 
      
      const today = new Date().toDateString();
      if (isHint) {
        // 仅关闭提前提示（蜡烛）
        chrome.storage.local.set({ isHintClosedToday: today });
      } else {
        // 关闭正式仪式（幽灵）
        chrome.storage.local.set({ isGhostClosedToday: today });
      }
    });

  if (summary) {
    const narrative = generateShadowNarrative(summary);
    const card = document.createElement('div');
    card.className = 'shadow-mate-card';
    card.innerHTML = `
      <div class="shadow-mate-card-close">×</div>
      <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #f39c12;">伴影 · 私语</h3>
      <div class="shadow-mate-narrative">“${narrative}”</div>
      
      <div class="shadow-mate-stats-grid">
        <div class="shadow-mate-stat-box"><span class="shadow-mate-stat-label">活跃时长</span><span class="shadow-mate-stat-value">${Math.round(summary.totalDuration/60)} 分钟</span></div>
        <div class="shadow-mate-stat-box"><span class="shadow-mate-stat-label">点击频率</span><span class="shadow-mate-stat-value">${summary.totalClicks} 次</span></div>
        <div class="shadow-mate-stat-box"><span class="shadow-mate-stat-label">滚动距离</span><span class="shadow-mate-stat-value">${Math.round(summary.totalScroll/1000)} 米</span></div>
        <div class="shadow-mate-stat-box"><span class="shadow-mate-stat-label">键入文字</span><span class="shadow-mate-stat-value">${summary.totalChars} 个</span></div>
      </div>

      <div class="shadow-mate-timeline">
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #666;">今日轨迹时间轴</div>
        ${['morning', 'afternoon', 'evening'].map(period => {
          const tags = summary.timeline[period];
          const periodName = { morning: '上午', afternoon: '下午', evening: '傍晚' }[period];
          return `
            <div class="shadow-mate-timeline-item ${tags.length > 0 ? 'active' : ''}">
              <div class="shadow-mate-timeline-time">${periodName}</div>
              <div class="shadow-mate-timeline-content">
                <div class="shadow-mate-timeline-tags">${tags.length > 0 ? tags.join(' · ') : '静候开启...'}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="font-size: 12px; font-weight: bold; margin-top: 20px; color: #666;">今日关键词</div>
      <div class="shadow-mate-keywords">
        ${summary.keywords.map(k => `<span class="shadow-mate-keyword">${k}</span>`).join('')}
      </div>

      <div style="margin-top:25px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 15px;">
        —— 辛苦了，现在的你值得被温柔对待 ✨
      </div>
    `;
    document.body.appendChild(card);
    const closeBtn = card.querySelector('.shadow-mate-card-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); 
      card.classList.remove('show');
      // 仅隐藏卡片，保留幽灵和滤镜，让用户可以再次点击幽灵打开
    });
    // 确保不再有覆盖气泡文字的逻辑
    ghost.onclick = () => card.classList.toggle('show');
  }
}
