// ============================================================
// LittleSU TV 应用内更新模块
//  - 桌面端：Tauri updater 插件（检查 → 下载进度 → 安装 → 重启）
//  - 安卓端：比对 GitHub 最新 Release → 打开系统浏览器下载 APK
//  - 网页模式：跳过
// ============================================================

(function () {
  'use strict';

  const REPO = 'xiaowulai-s/LittleSU-TV-App';
  const CHECK_DELAY_MS = 5000;

  const tauri = window.__TAURI__ || null;
  const isTauri = !!(tauri && tauri.core && tauri.core.invoke);
  const isAndroid = isTauri && /android/i.test(navigator.userAgent || '');

  function currentVersion() {
    try {
      if (isTauri && tauri.app && tauri.app.getVersion) return tauri.app.getVersion();
    } catch (e) { /* ignore */ }
    return window.APP_VERSION || '0.0.0';
  }

  function cmpVersion(a, b) {
    const pa = String(a).split('.').map(Number);
    const pb = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d !== 0) return d;
    }
    return 0;
  }

  // ---------- 更新弹窗 UI ----------

  function ensureModalStyles() {
    if (document.getElementById('lsu-update-style')) return;
    const st = document.createElement('style');
    st.id = 'lsu-update-style';
    st.textContent = `
      #lsu-update-overlay { position: fixed; inset: 0; z-index: 10000; display: flex;
        align-items: center; justify-content: center; background: rgba(5,8,14,.72); }
      #lsu-update-card { width: min(420px, 88vw); background: #101725; border: 1px solid rgba(129,140,248,.35);
        border-radius: 16px; padding: 22px; color: #e5eaf3; font-family: system-ui, sans-serif;
        box-shadow: 0 24px 60px -20px rgba(99,102,241,.55); }
      #lsu-update-card h3 { margin: 0 0 10px; font-size: 17px; color: #a5b4fc; }
      #lsu-update-card .lsu-notes { font-size: 13px; line-height: 1.6; color: #b6c2d4;
        max-height: 180px; overflow: auto; white-space: pre-wrap; word-break: break-word;
        background: rgba(255,255,255,.04); border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; }
      #lsu-update-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,.08);
        overflow: hidden; margin: 12px 0 6px; display: none; }
      #lsu-update-fill { height: 100%; width: 0%; border-radius: 4px;
        background: linear-gradient(90deg, #818cf8, #c084fc); transition: width .3s ease; }
      #lsu-update-status { font-size: 12px; color: #98a6ba; margin: 6px 0 0; }
      #lsu-update-actions { display: flex; gap: 10px; margin-top: 14px; }
      #lsu-update-actions button { flex: 1; padding: 10px 0; border-radius: 10px; font-size: 14px;
        cursor: pointer; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06);
        color: #e5eaf3; transition: background .2s ease; }
      #lsu-update-actions button:hover { background: rgba(129,140,248,.18); }
      #lsu-update-actions button.primary { background: linear-gradient(120deg, #6366f1, #a855f7);
        border: none; font-weight: 600; }
    `;
    document.head.appendChild(st);
  }

  function showUpdateModal(opts) {
    ensureModalStyles();
    const old = document.getElementById('lsu-update-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'lsu-update-overlay';
    overlay.innerHTML = `
      <div id="lsu-update-card">
        <h3>发现新版本 v${opts.version}</h3>
        ${opts.notes ? `<div class="lsu-notes">${opts.notes}</div>` : ''}
        <div id="lsu-update-bar"><div id="lsu-update-fill"></div></div>
        <p id="lsu-update-status">${opts.statusText || ''}</p>
        <div id="lsu-update-actions">
          <button id="lsu-update-later">稍后再说</button>
          <button id="lsu-update-go" class="primary">${opts.buttonText || '立即更新'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#lsu-update-later').onclick = () => overlay.remove();
    return {
      overlay,
      go: overlay.querySelector('#lsu-update-go'),
      fill: overlay.querySelector('#lsu-update-fill'),
      bar: overlay.querySelector('#lsu-update-bar'),
      status: overlay.querySelector('#lsu-update-status'),
    };
  }

  // ---------- 桌面端：updater 插件全流程 ----------

  async function desktopUpdate() {
    const { invoke, Channel } = tauri;
    const m = await invoke('plugin:updater|check');
    if (!m || !m.available) return;

    const modal = showUpdateModal({
      version: m.version,
      notes: (m.body || '').slice(0, 800),
      statusText: '当前版本 v' + (m.currentVersion || currentVersion()),
      buttonText: '立即更新',
    });

    modal.go.onclick = async () => {
      modal.go.disabled = true;
      modal.bar.style.display = 'block';
      try {
        const channel = new Channel();
        channel.onmessage = (event) => {
          if (event.event === 'Started') {
            modal.status.textContent = '开始下载…';
            if (event.data && event.data.contentLength) {
              modal.bar.dataset.total = event.data.contentLength;
            }
          } else if (event.event === 'Progress') {
            const total = Number(modal.bar.dataset.total || 0);
            modal.fill.dataset.downloaded = Number(modal.fill.dataset.downloaded || 0) + (event.data.chunkLength || 0);
            if (total > 0) {
              modal.fill.style.width = Math.min(100, (Number(modal.fill.dataset.downloaded) / total) * 100) + '%';
            }
            modal.status.textContent = '下载中… ' + Math.round(Number(modal.fill.dataset.downloaded) / 1048576) + ' MB';
          } else if (event.event === 'Finished') {
            modal.fill.style.width = '100%';
            modal.status.textContent = '安装中，完成后应用将自动重启…';
          }
        };
        await invoke('plugin:updater|download_and_install', { onEvent: channel, rid: m.rid });
        modal.status.textContent = '更新完成，正在重启…';
        setTimeout(() => { invoke('plugin:process|restart'); }, 800);
      } catch (err) {
        modal.status.textContent = '更新失败：' + (err && err.message ? err.message : err);
        modal.go.disabled = false;
      }
    };
  }

  // ---------- 安卓端：引导到系统浏览器下载 APK ----------

  async function androidUpdate() {
    const resp = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!resp.ok) return;
    const release = await resp.json();
    const latest = String(release.tag_name || '').replace(/^v/, '');
    if (!latest || cmpVersion(latest, currentVersion()) <= 0) return;

    const apk = (release.assets || []).find(a => /android.*\.apk$/i.test(a.name));
    if (!apk) return;

    const modal = showUpdateModal({
      version: latest,
      notes: (release.body || '').slice(0, 800),
      statusText: '将跳转到浏览器下载新版本安装包',
      buttonText: '下载更新',
    });

    modal.go.onclick = async () => {
      try {
        await tauri.core.invoke('plugin:opener|open_url', { url: apk.browser_download_url });
        modal.status.textContent = '已跳转下载，完成后在通知栏点击安装。';
      } catch (e) {
        // 兜底：直接整页跳转
        window.location.href = apk.browser_download_url;
      }
    };
  }

  // ---------- 入口 ----------

  async function run() {
    try {
      if (!isTauri) return;               // 网页模式不做应用内更新
      if (isAndroid) await androidUpdate();
      else await desktopUpdate();
    } catch (err) {
      console.warn('[LittleSU 更新检查失败]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, CHECK_DELAY_MS));
  } else {
    setTimeout(run, CHECK_DELAY_MS);
  }
})();
