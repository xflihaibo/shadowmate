// popup.js - 处理伴影历史轨迹展示

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  initSettings();
  loadClipboardHistory();
  
  // 实时监听存储变化并刷新 UI
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.browsingData) {
        loadDashboardData();
      }
      if (changes.clipboardHistory) {
        loadClipboardHistory();
      }
    }
  });
});

async function initSettings() {
  const settings = await chrome.storage.local.get({ 
    sunsetTime: '18:00',
    isEnabled: true 
  });
  
  // 初始化时间
  const timeInput = document.getElementById('sunset-time');
  timeInput.value = settings.sunsetTime;
  timeInput.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ sunsetTime: e.target.value });
  });

  // 初始化开关
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
    const result = await chrome.storage.local.get({ clipboardHistory: [] });
    const history = result.clipboardHistory || [];
    renderClipboardHistory(history);
  } catch (e) {
    console.error('加载剪贴板历史失败', e);
  }
}

function renderClipboardHistory(history) {
  const clipboardList = document.getElementById('clipboard-list');
  
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
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'clipboard-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = '删除';
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteClipboardItem(index);
    });
    
    itemEl.appendChild(contentEl);
    itemEl.appendChild(deleteBtn);
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
