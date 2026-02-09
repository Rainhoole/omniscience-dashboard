/**
 * Activity Reporter — Bot 上报插件
 * 
 * 自动上报 AI bot 的活动到 Mission Control。
 * 上报失败不阻塞主任务，支持批量上报，一行调用。
 * 
 * 用法：
 *   import { report, reportFileOps, reportWebSearch, reportApiCall, reportMessage, reportCommand } from './activity-reporter';
 *   
 *   // 通用一行调用
 *   report('file_ops', 'Read config.json', 'success', 'Alpha', { path: '/etc/config.json' });
 *   
 *   // 快捷方法
 *   reportFileOps('Created user-profile.tsx', 'success', 'Gamma', { path: 'src/user-profile.tsx', op: 'create' });
 *   reportWebSearch('Searched React docs', 'success', 'Beta', { query: 'useEffect cleanup' });
 *   reportApiCall('POST /users', 'success', 'Alpha', { status: 201 });
 *   reportMessage('Sent summary to user', 'success', 'Alpha');
 *   reportCommand('npm run build', 'success', 'Gamma', { exitCode: 0 });
 */

const ACTIVITY_API = '/api/activities';
const BATCH_INTERVAL_MS = 2000;
const BATCH_MAX_SIZE = 20;

let _token = '';
let _queue = [];
let _timer = null;

// ─── 配置 ────────────────────────────────────────────

export function configure({ token, endpoint, batchInterval, batchMaxSize } = {}) {
  if (token) _token = token;
  if (endpoint) _config.endpoint = endpoint;
  if (batchInterval) _config.batchInterval = batchInterval;
  if (batchMaxSize) _config.batchMaxSize = batchMaxSize;
}

const _config = {
  endpoint: ACTIVITY_API,
  batchInterval: BATCH_INTERVAL_MS,
  batchMaxSize: BATCH_MAX_SIZE,
};

// ─── 核心上报 ─────────────────────────────────────────

/**
 * 一行上报。失败静默，不阻塞主流程。
 * 
 * @param {'file_ops'|'web_search'|'api_call'|'message'|'command'} type
 * @param {string} description
 * @param {'success'|'pending'|'error'} status
 * @param {string} source - bot 标识，如 'Alpha', 'Beta', 'Gamma'
 * @param {object} [metadata] - 附加信息
 * @returns {void}
 */
export function report(type, description, status, source, metadata = {}) {
  const activity = {
    type,
    description,
    status,
    source,
    metadata,
    timestamp: new Date().toISOString(),
  };

  _queue.push(activity);

  if (_queue.length >= _config.batchMaxSize) {
    _flushNow();
  } else if (!_timer) {
    _timer = setTimeout(_flushNow, _config.batchInterval);
  }
}

// ─── 快捷方法 ─────────────────────────────────────────

export const reportFileOps = (desc, status, source, meta) =>
  report('file_ops', desc, status, source, meta);

export const reportWebSearch = (desc, status, source, meta) =>
  report('web_search', desc, status, source, meta);

export const reportApiCall = (desc, status, source, meta) =>
  report('api_call', desc, status, source, meta);

export const reportMessage = (desc, status, source, meta) =>
  report('message', desc, status, source, meta);

export const reportCommand = (desc, status, source, meta) =>
  report('command', desc, status, source, meta);

// ─── 批量发送 ─────────────────────────────────────────

function _flushNow() {
  if (_timer) {
    clearTimeout(_timer);
    _timer = null;
  }

  if (_queue.length === 0) return;

  const batch = _queue.splice(0, _config.batchMaxSize);

  _sendBatch(batch).catch(() => {
    // 上报失败静默吞掉，不影响主任务
  });
}

async function _sendBatch(batch) {
  const payload = batch.length === 1 ? batch[0] : { activities: batch };

  const res = await fetch(_config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ..._token ? { Authorization: `Bearer ${_token}` } : {},
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.warn(`[activity-reporter] 上报失败: ${res.status}`);
  }
}

/**
 * 手动立即 flush 队列（用于页面卸载等场景）。
 */
export function flush() {
  _flushNow();
}

// ─── 页面卸载时兜底发送 ──────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && _queue.length > 0) {
      const batch = _queue.splice(0);
      const payload = batch.length === 1 ? batch[0] : { activities: batch };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const headers = { type: 'application/json' };
      if (_token) headers['Authorization'] = `Bearer ${_token}`;
      navigator.sendBeacon(_config.endpoint, blob);
    }
  });
}

// ─── React Hook（可选）────────────────────────────────

/**
 * React hook，在组件内包裹操作并自动上报。
 * 
 * const track = useActivityReporter('Alpha');
 * await track('file_ops', 'Saved draft', async () => { ... });
 */
export function useActivityReporter(source) {
  return async function track(type, description, fn, metadata = {}) {
    report(type, description, 'pending', source, metadata);
    try {
      const result = await fn();
      report(type, description, 'success', source, metadata);
      return result;
    } catch (err) {
      report(type, description, 'error', source, { ...metadata, error: err.message });
      throw err;
    }
  };
}
