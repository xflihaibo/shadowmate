// popup.js - 处理伴影历史轨迹展示

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  initSettings();
  loadClipboardHistory();
  updateDailyMotto();
  updateDailyQuote();
  
  // 清空所有按钮事件
  const clearAllBtn = document.getElementById('clipboard-clear-all');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await clearAllClipboardHistory();
    });
  }
  
  // 实时监听存储变化并刷新 UI
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.browsingData) {
        loadDashboardData();
      }
      if (changes.clipboardHistory || changes.clipboardEnabled) {
        loadClipboardHistory();
      }
    }
  });
});

// 根据日期生成稳定的随机数（同一天显示相同的内容）
function getDailyIndex(seed, arrayLength) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % arrayLength;
}

// 每日激励词（标题）
function updateDailyMotto() {
  const mottoEl = document.getElementById('daily-motto');
  if (!mottoEl) return;
  
  const mottos = [
    'Shadow Mate · 始终守护',
    'Shadow Mate · 温柔陪伴',
    'Shadow Mate · 静默记录',
    'Shadow Mate · 数字归航',
    'Shadow Mate · 时光见证',
    'Shadow Mate · 温暖如初',
    'Shadow Mate · 默默守护',
    'Shadow Mate · 记录美好',
    'Shadow Mate · 陪伴每一天',
    'Shadow Mate · 温柔以待',
    'Shadow Mate · 静候归航',
    'Shadow Mate · 时光印记',
    'Shadow Mate · 温暖守护',
    'Shadow Mate · 记录足迹',
    'Shadow Mate · 温柔如影',
    'Shadow Mate · 静默陪伴',
    'Shadow Mate · 数字记忆',
    'Shadow Mate · 温暖如光',
    'Shadow Mate · 默默记录',
    'Shadow Mate · 温柔守护',
    'Shadow Mate · 时光见证者',
    'Shadow Mate · 温暖陪伴',
    'Shadow Mate · 静候归来',
    'Shadow Mate · 记录时光',
    'Shadow Mate · 温柔如你',
    'Shadow Mate · 默默陪伴',
    'Shadow Mate · 数字守护',
    'Shadow Mate · 温暖如影',
    'Shadow Mate · 静默见证',
    'Shadow Mate · 温柔记录'
  ];
  
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const index = getDailyIndex(dateStr, mottos.length);
  mottoEl.textContent = mottos[index];
}

// 每日励志/温馨文案（副标题）
function updateDailyQuote() {
  const quoteEl = document.getElementById('daily-quote');
  if (!quoteEl) return;
  
  const quotes = [
    '每一天的努力，都是未来的自己',
    '温柔对待自己，也温柔对待世界',
    '小小的坚持，会带来大大的改变',
    '今天的你，比昨天更好了',
    '累了就休息，但不要放弃',
    '每一个瞬间，都值得被记录',
    '慢慢来，比较快',
    '你值得被温柔对待',
    '生活很累，但也很美',
    '今天的你，辛苦了',
    '做自己的光，照亮前路',
    '时间会见证你的成长',
    '每一步都算数',
    '保持热爱，奔赴山海',
    '简单生活，温柔待人',
    '今天的努力，是明天的底气',
    '累了就停一停，但别忘记前行',
    '你比自己想象的更强大',
    '每一个今天，都是新的开始',
    '慢慢来，一切都会好的',
    '生活不易，但你很勇敢',
    '今天的你，值得被表扬',
    '保持初心，继续前行',
    '每一天都是新的机会',
    '温柔的力量，最强大',
    '你正在成为更好的自己',
    '累了就休息，但别停下',
    '今天的努力，不会白费',
    '保持微笑，继续前行',
    '你值得拥有美好的一切',
    '慢慢来，时间会给你答案',
    '今天的你，很棒',
    '保持热爱，保持前行',
    '每一个努力，都有意义',
    '生活很苦，但你很甜',
    '今天的你，比昨天更优秀',
    '保持初心，温柔前行',
    '每一天都是新的起点',
    '你正在闪闪发光',
    '今天的坚持，是明天的收获',
    '保持微笑，生活会更美好',
    '你值得被爱，也值得被珍惜',
    '慢慢来，一切都会如你所愿',
    '今天的你，辛苦了，但很值得',
    '保持热爱，生活会给你惊喜',
    '每一个瞬间，都是珍贵的',
    '你比自己想象的更优秀',
    '今天的努力，会开出花来',
    '保持初心，温柔对待自己'
  ];
  
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-quote`;
  const index = getDailyIndex(dateStr, quotes.length);
  quoteEl.textContent = quotes[index];
}

async function initSettings() {
  const settings = await chrome.storage.local.get({ 
    sunsetTime: '18:00',
    isEnabled: true,
    clipboardEnabled: true  // 剪贴板功能默认开启
  });
  
  // 初始化时间
  const timeInput = document.getElementById('sunset-time');
  timeInput.value = settings.sunsetTime;
  timeInput.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ sunsetTime: e.target.value });
  });

  // 初始化主开关
  const masterSwitch = document.getElementById('master-switch');
  masterSwitch.checked = settings.isEnabled;
  masterSwitch.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    await chrome.storage.local.set({ isEnabled });
    // 通知所有页面状态改变
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'STATE_CHANGED', isEnabled }).catch(()=>{});
      });
    });
  });

  // 初始化剪贴板开关
  const clipboardSwitch = document.getElementById('clipboard-switch');
  clipboardSwitch.checked = settings.clipboardEnabled !== false; // 默认 true
  clipboardSwitch.addEventListener('change', async (e) => {
    const clipboardEnabled = e.target.checked;
    await chrome.storage.local.set({ clipboardEnabled });
    // 通知所有页面剪贴板功能状态改变
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'CLIPBOARD_STATE_CHANGED', clipboardEnabled }).catch(()=>{});
      });
    });
    // 如果关闭，可以选择清空历史（可选）
    // if (!clipboardEnabled) {
    //   await chrome.storage.local.set({ clipboardHistory: [] });
    //   loadClipboardHistory();
    // }
  });
}

async function loadDashboardData() {
  const result = await chrome.storage.local.get({ browsingData: [] });
  const today = new Date().toDateString();
  
  // 过滤出今天的记录
  const todayData = result.browsingData.filter(r => 
    new Date(r.visitTime).toDateString() === today
  );

  // 1. 更新今日统计
  updateStats(todayData);

  // 2. 渲染历史列表
  renderHistory(todayData);
}

// 3. 处理调试/重置功能
document.getElementById('btn-reset-ritual').addEventListener('click', async () => {
  await chrome.storage.local.remove('lastShownDate');
  
  // 主动通知当前活跃标签页立即检查并触发归航仪式
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TRIGGER_SUNSET' }).catch(() => {
        alert('重置成功！请刷新页面以看到效果。');
      });
    }
  });
  
  const btn = document.getElementById('btn-reset-ritual');
  btn.textContent = '✅ 已重置并尝试触发';
  setTimeout(() => { btn.textContent = '重置今日提示状态'; }, 2000);
});

function updateStats(todayData) {
  const sitesCount = new Set(todayData.map(r => {
    try { return new URL(r.url).hostname; } catch(e) { return r.url; }
  })).size;
  
  const totalDuration = todayData.reduce((sum, r) => sum + (r.activeDuration || 0), 0);
  const totalClicks = todayData.reduce((sum, r) => sum + (r.clicks || 0), 0);
  const totalScroll = todayData.reduce((sum, r) => sum + (r.scrollDistance || 0), 0);
  const totalChars = todayData.reduce((sum, r) => sum + (r.charsTyped || 0), 0);

  // 渲染汇总数据
  document.getElementById('today-duration').textContent = formatSimpleDuration(totalDuration);
  document.getElementById('today-clicks').textContent = totalClicks;
  document.getElementById('today-scroll').textContent = Math.round(totalScroll / 1000) + 'm';
  document.getElementById('today-chars').textContent = totalChars;
  
  // 渲染足迹标题旁的站点数
  document.getElementById('today-sites-count').textContent = `(${sitesCount}个站点)`;
}

// 辅助：用于 2x2 网格的简短时长展示
function formatSimpleDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h${remainingMins}m`;
}

function renderHistory(todayData) {
  const historyList = document.getElementById('history-list');
  
  if (todayData.length === 0) {
    historyList.innerHTML = '<div class="empty-state">今天还没留下足迹呢 👻</div>';
    return;
  }

  // 按时间倒序排列
  const sortedData = [...todayData].sort((a, b) => b.visitTime - a.visitTime);

  historyList.innerHTML = ''; // 清空加载状态

  sortedData.forEach(item => {
    const timeStr = formatVisitTime(item.visitTime);
    const domain = getDomain(item.url);
    
    const itemEl = document.createElement('div');
    itemEl.className = 'history-item';
    itemEl.title = `跳转至: ${item.url}`;
    itemEl.addEventListener('click', () => {
      chrome.tabs.create({ url: item.url });
    });
    
    // 创建图标
    const iconEl = document.createElement('img');
    iconEl.className = 'site-icon';
    iconEl.src = item.icon || 'icons/logo.png';
    iconEl.onerror = () => { iconEl.src = 'icons/logo.png'; }; // 安全的错误处理方式

    // 创建内容容器
    const infoEl = document.createElement('div');
    infoEl.className = 'site-info';
    infoEl.innerHTML = `
      <div class="site-title">${item.title || domain}</div>
      <div class="site-meta">
        <span class="site-time">${timeStr}</span>
        <span>🕒 ${formatDuration(item.activeDuration || 0)}</span>
        <span>🖱️ ${item.clicks || 0}</span>
        <span>📏 ${Math.round((item.scrollDistance || 0) / 1000)}m</span>
        ${item.charsTyped ? `<span>✍️ ${item.charsTyped}</span>` : ''}
      </div>
    `;

    itemEl.appendChild(iconEl);
    itemEl.appendChild(infoEl);
    historyList.appendChild(itemEl);
  });
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function formatVisitTime(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getDomain(urlStr) {
  try {
    return new URL(urlStr).hostname;
  } catch (e) {
    return urlStr;
  }
}

// 剪贴板历史管理
async function loadClipboardHistory() {
  try {
    const result = await chrome.storage.local.get({ 
      clipboardHistory: [],
      clipboardEnabled: true 
    });
    
    // 如果剪贴板功能关闭，显示提示
    if (result.clipboardEnabled === false) {
      renderClipboardHistory([], true);
      return;
    }
    
    const history = result.clipboardHistory || [];
    renderClipboardHistory(history);
  } catch (e) {
    console.error('加载剪贴板历史失败', e);
  }
}

function renderClipboardHistory(history, isDisabled = false) {
  const clipboardList = document.getElementById('clipboard-list');
  const clipboardCount = document.getElementById('clipboard-count');
  const clearAllBtn = document.getElementById('clipboard-clear-all');
  const clipboardHint = document.getElementById('clipboard-hint');
  
  // 如果功能已关闭
  if (isDisabled) {
    clipboardList.innerHTML = '<div class="clipboard-empty">剪贴板功能已关闭</div>';
    clipboardCount.textContent = '(0/10)';
    clearAllBtn.style.display = 'none';
    clipboardHint.style.display = 'none';
    return;
  }
  
  const historyLength = history ? history.length : 0;
  
  // 更新记录数量显示
  clipboardCount.textContent = `(${historyLength}/10)`;
  
  // 显示/隐藏清空按钮和快捷键提示
  if (historyLength > 0) {
    clearAllBtn.style.display = 'block';
    clipboardHint.style.display = 'block';
  } else {
    clearAllBtn.style.display = 'none';
    clipboardHint.style.display = 'none';
  }
  
  if (!history || history.length === 0) {
    clipboardList.innerHTML = '<div class="clipboard-empty">暂无复制记录</div>';
    return;
  }

  // 只显示最多10条
  const displayHistory = history.slice(0, 10);
  clipboardList.innerHTML = '';

  displayHistory.forEach((item, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'clipboard-item';
    
    const contentEl = document.createElement('div');
    contentEl.className = 'clipboard-content';
    contentEl.textContent = item.text || '';
    contentEl.title = item.text || ''; // 鼠标悬停显示完整内容
    
    // 操作按钮容器
    const actionsEl = document.createElement('div');
    actionsEl.className = 'clipboard-actions';
    
    // 复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'clipboard-copy';
    copyBtn.textContent = '⎘';
    copyBtn.title = '复制';
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await copyClipboardItem(item.text);
      // 复制成功提示
      copyBtn.textContent = '✓';
      copyBtn.style.background = '#2ecc71';
      copyBtn.style.color = 'white';
      setTimeout(() => {
        copyBtn.textContent = '⎘';
        copyBtn.style.background = 'rgba(46, 204, 113, 0.1)';
        copyBtn.style.color = '#2ecc71';
      }, 1000);
    });
    
    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'clipboard-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = '删除';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteClipboardItem(index);
    });
    
    actionsEl.appendChild(copyBtn);
    actionsEl.appendChild(deleteBtn);
    
    itemEl.appendChild(contentEl);
    itemEl.appendChild(actionsEl);
    clipboardList.appendChild(itemEl);
  });
}

async function deleteClipboardItem(index) {
  try {
    const result = await chrome.storage.local.get({ clipboardHistory: [] });
    let history = result.clipboardHistory || [];
    
    // 删除指定索引的项
    history.splice(index, 1);
    
    await chrome.storage.local.set({ clipboardHistory: history });
    // loadClipboardHistory 会通过 onChanged 监听自动触发
  } catch (e) {
    console.error('删除剪贴板项失败', e);
  }
}

// 复制剪贴板项
async function copyClipboardItem(text) {
  try {
    // 使用 Clipboard API 复制
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      console.log('已复制到剪贴板:', text.substring(0, 30) + '...');
    } else {
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('已复制到剪贴板（降级方案）:', text.substring(0, 30) + '...');
    }
  } catch (e) {
    console.error('复制剪贴板项失败', e);
    alert('复制失败，请重试');
  }
}

// 清空所有剪贴板历史
async function clearAllClipboardHistory() {
  if (!confirm('确定要清空所有复制记录吗？此操作不可恢复。')) {
    return;
  }
  
  try {
    await chrome.storage.local.set({ clipboardHistory: [] });
    // loadClipboardHistory 会通过 onChanged 监听自动触发
  } catch (e) {
    console.error('清空剪贴板历史失败', e);
    alert('清空失败，请重试');
  }
}
