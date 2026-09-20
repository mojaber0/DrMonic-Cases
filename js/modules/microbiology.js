// ════════════════════════════════════════════════
//  MICROBIOLOGY INTERACTIVE FLOWCHART TREE
//  Dynamic parent_id schema: nodes = {id, parent_id, name, node_type}
//  node_type ∈ category | lab_test | bacteria_bug. Clicking a bacteria_bug
//  node opens a detail panel (tricks, affects-who, famous disease,
//  first/second-line antibiotics, image, visual mnemonic link).
//  The tree grows incrementally — add one node at a time forever,
//  or bulk-merge via JSON upload matching the same schema.
// ════════════════════════════════════════════════
// Wraps localStorage.setItem so quota/storage failures surface as a visible
// toast instead of silently failing while the in-memory data looks fine.
function safeLocalSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error('localStorage save failed for', key, e);
    showToast('⚠️ فشل حفظ البيانات (خزين المتصفح ممتلئ على الأغلب) — التغيير الأخير قد لا يبقى بعد التحديث');
    return false;
  }
}
const MICRO_STORAGE_KEY = 'drmonic_micro_tree';
let microData = { nodes: [] };
let microExpanded = new Set();
let microAdminEditId = null;
let microPendingImage = null;

function microLoadData() {
  try { microData = JSON.parse(localStorage.getItem(MICRO_STORAGE_KEY)) || { nodes: [] }; }
  catch (e) { microData = { nodes: [] }; }
  if (!Array.isArray(microData.nodes)) microData.nodes = [];
}
function microSaveData() {
  return safeLocalSet(MICRO_STORAGE_KEY, JSON.stringify(microData));
}

function showMicroTreeView() {
  hideAllViews();
  document.getElementById('microTreeView').classList.add('active');
  microLoadData();
  renderMicroTree();
}

function microChildren(parentId) {
  return microData.nodes.filter(n => (n.parent_id || null) === (parentId || null));
}

function microDescendantIds(id) {
  const result = new Set();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    microChildren(cur).forEach(c => { if (!result.has(c.id)) { result.add(c.id); stack.push(c.id); } });
  }
  return result;
}

function microSubtreeHasMatch(id, q, memo) {
  if (memo.has(id)) return memo.get(id);
  const node = microData.nodes.find(n => n.id === id);
  let match = !!(node && node.name.toLowerCase().includes(q));
  if (!match) {
    for (const child of microChildren(id)) { if (microSubtreeHasMatch(child.id, q, memo)) { match = true; break; } }
  }
  memo.set(id, match);
  return match;
}

const MICRO_TYPE_META = {
  category: { icon: '📁', label: 'تصنيف' },
  lab_test: { icon: '🧪', label: 'اختبار مخبري' },
  bacteria_bug: { icon: '🦠', label: 'اضغط للتفاصيل' },
};

// Organism type badges (Bacteria / Virus / Fungi / Parasite)
const BUG_TYPE_META = {
  bacteria: { cls: 'bt-bacteria', icon: '🦠', label: 'Bacteria' },
  virus:    { cls: 'bt-virus',    icon: '🧬', label: 'Virus' },
  fungi:    { cls: 'bt-fungi',    icon: '🍄', label: 'Fungi' },
  parasite: { cls: 'bt-parasite', icon: '🪱', label: 'Parasite' },
};
function microNormalizeBugType(t) {
  const s = (t || '').toString().trim().toLowerCase();
  if (s.startsWith('vir')) return 'virus';
  if (s.startsWith('fun')) return 'fungi';
  if (s.startsWith('par')) return 'parasite';
  return 'bacteria';
}
function microBugBadgeHtml(bugType) {
  if (!bugType) return '';
  const meta = BUG_TYPE_META[microNormalizeBugType(bugType)];
  return `<span class="mm-bug-badge ${meta.cls}">${meta.icon} ${meta.label}</span>`;
}

let microMapScale = 1;
let microMapPanBound = false;

function microMapApplyZoom() {
  const inner = document.getElementById('microMapInner');
  if (inner) inner.style.transform = `scale(${microMapScale})`;
  const label = document.getElementById('microZoomLabel');
  if (label) label.textContent = Math.round(microMapScale * 100) + '%';
}
function microMapZoom(delta) {
  microMapScale = Math.min(1.4, Math.max(0.5, +(microMapScale + delta).toFixed(2)));
  microMapApplyZoom();
}
function microMapZoomReset() {
  microMapScale = 1;
  microMapApplyZoom();
  const canvas = document.getElementById('microTreeArea');
  if (canvas) { canvas.scrollLeft = 0; canvas.scrollTop = 0; }
}
// سحب الخريطة بالماوس (Pan) من أي مكان فاضي بالكانفس
function microMapBindPan() {
  const canvas = document.getElementById('microTreeArea');
  if (!canvas || microMapPanBound) return;
  microMapPanBound = true;
  let start = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.mm-node')) return;
    start = { x: e.clientX, y: e.clientY, l: canvas.scrollLeft, t: canvas.scrollTop };
    canvas.classList.add('panning');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!start) return;
    canvas.scrollLeft = start.l - (e.clientX - start.x);
    canvas.scrollTop = start.t - (e.clientY - start.y);
  });
  const endPan = () => { start = null; canvas.classList.remove('panning'); };
  canvas.addEventListener('pointerup', endPan);
  canvas.addEventListener('pointerleave', endPan);
}

function renderMicroTree() {
  const area = document.getElementById('microTreeArea');
  const countEl = document.getElementById('microTreeCount');
  countEl.textContent = `${microData.nodes.length} عنصر بالشجرة`;
  if (!microData.nodes.length) {
    area.innerHTML = `<div class="notes-empty"><div class="icon">🦠</div><h3>الشجرة فاضية لسا</h3><p>اضغط "⚙️ إدارة البيانات" لإضافة أول تصنيف (مثلاً Gram+ / Gram-)</p></div>`;
    return;
  }
  const q = (document.getElementById('microSearchInput')?.value || '').trim().toLowerCase();
  const memo = new Map();

  function buildHtml(parentId, depth) {
    let items = microChildren(parentId);
    if (q) items = items.filter(n => microSubtreeHasMatch(n.id, q, memo));
    if (!items.length) return '';
    return `<ul class="${depth === 0 ? 'mm-tree' : 'mm-children'}">${items.map(n => {
      const kids = microChildren(n.id);
      const hasChildren = kids.length > 0;
      const isExpanded = q ? true : microExpanded.has(n.id);
      const childrenHtml = hasChildren ? buildHtml(n.id, depth + 1) : '';
      const nameMatches = q && n.name.toLowerCase().includes(q);
      const meta = MICRO_TYPE_META[n.node_type] || MICRO_TYPE_META.category;
      const isBug = n.node_type === 'bacteria_bug';
      const clickAction = isBug ? `microOpenNodeDetail('${n.id}')` : (hasChildren ? `microToggleNode('${n.id}')` : `microOpenNodeDetail('${n.id}')`);
      const metaText = isBug ? meta.label : (hasChildren ? `${kids.length} فرع` : meta.label);
      return `<li class="mm-item">
        <div class="mm-node t-${n.node_type} ${depth === 0 ? 'is-root' : ''} ${nameMatches ? 'is-match' : ''}"
             role="button" tabindex="0" onclick="${clickAction}"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${clickAction}}">
          <span class="mm-node-icon" aria-hidden="true">${meta.icon}</span>
          <span class="mm-node-text">
            <span class="mm-node-name">${esc(n.name)}${isBug ? microBugBadgeHtml(n.bug_type) : ''}</span>
            <span class="mm-node-meta">${metaText}</span>
          </span>
          ${hasChildren ? `<button class="mm-toggle" title="${isExpanded ? 'طي الفروع' : 'فرد الفروع'}" onclick="event.stopPropagation();microToggleNode('${n.id}')">${isExpanded ? '−' : '+' + kids.length}</button>` : ''}
          <span class="mm-node-actions">
            <button class="mm-act" title="تعديل" onclick="event.stopPropagation();microOpenAdmin('${n.id}')">✏️</button>
            <button class="mm-act danger" title="حذف" onclick="event.stopPropagation();microDeleteNode('${n.id}')">🗑️</button>
          </span>
        </div>
        ${hasChildren && isExpanded ? childrenHtml : ''}
      </li>`;
    }).join('')}</ul>`;
  }

  const html = buildHtml(null, 0);
  area.innerHTML = html
    ? `<div class="micro-mm-inner" id="microMapInner">${html}</div>`
    : `<div class="notes-empty"><div class="icon">🔎</div><h3>لا نتائج</h3><p>جرب كلمة بحث أخرى</p></div>`;
  microMapApplyZoom();
  microMapBindPan();
}

function microToggleNode(id) {
  if (microExpanded.has(id)) microExpanded.delete(id); else microExpanded.add(id);
  renderMicroTree();
}
function microExpandAll() { microData.nodes.forEach(n => microExpanded.add(n.id)); renderMicroTree(); }
function microCollapseAll() { microExpanded.clear(); renderMicroTree(); }

let microSidePanelEscHandler = null;

function microCloseSidePanel() {
  const panel = document.getElementById('microSidePanel');
  const backdrop = document.getElementById('microSidePanelBackdrop');
  if (panel) { panel.classList.remove('open'); setTimeout(() => panel.remove(), 260); }
  if (backdrop) {
    backdrop.classList.remove('show');
    backdrop.classList.add('closing');
    setTimeout(() => backdrop.remove(), 260);
  }
  if (microSidePanelEscHandler) {
    document.removeEventListener('keydown', microSidePanelEscHandler);
    microSidePanelEscHandler = null;
  }
}

function microOpenNodeDetail(id) {
  microCloseSidePanel();
  const node = microData.nodes.find(n => n.id === id);
  if (!node) return;
  const yt = node.visual_link ? extractYoutubeId(node.visual_link) : null;
  const dr = (!yt && node.visual_link) ? extractDriveFileId(node.visual_link) : null;
  const box = (cls, title, body) => body ? `<div class="pharma-box ${cls}"><div class="pharma-box-title">${title}</div><div class="pharma-box-body" dir="auto">${body}</div></div>` : '';
  const mediaBody = (node.image || yt || dr) ? `
      ${node.image ? `<img src="${node.image}" style="width:100%;border-radius:12px;cursor:pointer;margin-bottom:${(yt || dr) ? '10px' : '0'};" onclick="openLightbox('${node.image}')" alt="" />` : ''}
      ${yt ? `<iframe class="note-youtube-embed" src="https://www.youtube.com/embed/${yt}?rel=0" allowfullscreen></iframe>` : ''}
      ${dr ? `<iframe class="note-youtube-embed" src="https://drive.google.com/file/d/${dr}/preview" allowfullscreen></iframe>` : ''}` : '';

  const cardsHtml = [
    box('pharma-box-tricks', '🎯 التريك الذهبي (MCQ Buzzword)', node.tricks ? hl(esc(node.tricks)) : ''),
    box('pharma-box-case', '🧍 بتصيب مين؟', node.affects ? esc(node.affects) : ''),
    box('pharma-box-indication', '🦠 أشهر مرض', node.famous_disease ? esc(node.famous_disease) : ''),
    box('pharma-box-moa', '💊 المضاد الحيوي الأول', node.first_line ? esc(node.first_line) : ''),
    box('pharma-box-side', '💊 المضاد الحيوي البديل', node.second_line ? esc(node.second_line) : ''),
    box('pharma-box-visual', '🎨 الرسمة البصرية والفيديو', mediaBody),
  ].join('');

  if (!cardsHtml.trim()) { showToast('ما في تفاصيل مسجّلة لهاد العنصر بعد — اضغط ✏️ للإضافة'); return; }
  gamNotifyMicroBranchOpened(node.id);

  const backdrop = document.createElement('div');
  backdrop.id = 'microSidePanelBackdrop';
  backdrop.className = 'micro-sidepanel-backdrop';
  // إغلاق بالضغط برا اللوحة — بضغطة مقصودة فقط (مش أثناء سحب أو تحديد نص)
  let pressPoint = null;
  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target !== backdrop) { pressPoint = null; return; }
    pressPoint = { x: e.clientX, y: e.clientY };
  });
  backdrop.addEventListener('pointerup', (e) => {
    if (!pressPoint || e.target !== backdrop) { pressPoint = null; return; }
    const moved = Math.hypot(e.clientX - pressPoint.x, e.clientY - pressPoint.y);
    pressPoint = null;
    if (moved <= 8) microCloseSidePanel();
  });
  document.body.appendChild(backdrop);

  const panel = document.createElement('div');
  panel.id = 'microSidePanel';
  panel.className = 'micro-sidepanel';
  panel.innerHTML = `
    <div class="micro-sidepanel-header">
      <div class="micro-sidepanel-title">🦠 ${esc(node.name)}${microBugBadgeHtml(node.bug_type)}</div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
        <button class="btn btn-ghost btn-sm" style="padding:5px 10px;font-size:0.78rem;" onclick="microCloseSidePanel();microOpenAdmin('${node.id}')">✏️ تعديل</button>
        <button class="micro-sidepanel-close" aria-label="إغلاق اللوحة" title="إغلاق" onclick="microCloseSidePanel()">&times;</button>
      </div>
    </div>
    <div class="micro-sidepanel-body">${cardsHtml}</div>`;
  document.body.appendChild(panel);

  microSidePanelEscHandler = (e) => { if (e.key === 'Escape') microCloseSidePanel(); };
  document.addEventListener('keydown', microSidePanelEscHandler);

  requestAnimationFrame(() => {
    backdrop.classList.add('show');
    panel.classList.add('open');
  });
}

function microParentOptionsHtml(excludeId, selectedId) {
  const excluded = new Set();

  if (excludeId) { microDescendantIds(excludeId).forEach(id => excluded.add(id)); excluded.add(excludeId); }
  let html = `<option value="">(بدون أب — تصنيف رئيسي)</option>`;
  function walk(parentId, depth) {
    microChildren(parentId).forEach(n => {
      if (excluded.has(n.id)) return;
      html += `<option value="${n.id}" ${selectedId === n.id ? 'selected' : ''}>${'— '.repeat(depth)}${esc(n.name)}</option>`;
      walk(n.id, depth + 1);
    });
  }
  walk(null, 0);
  return html;
}

function microUpdateAdminTypeFields() {
  const type = document.getElementById('microFormType')?.value;
  const wrap = document.getElementById('microDetailFieldsWrap');
  if (wrap) wrap.style.display = (type === 'bacteria_bug') ? 'block' : 'none';
}

function microBuildAdminListHtml() {
  if (!microData.nodes.length) return '<div style="color:var(--text2);">لا توجد عناصر بعد</div>';
  function walk(parentId, depth) {
    return microChildren(parentId).map(n => {
      const meta = MICRO_TYPE_META[n.node_type] || MICRO_TYPE_META.category;
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 4px;border-bottom:1px solid var(--border);padding-inline-start:${depth * 18 + 4}px;">
        <span style="display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;">
          <span class="micro-tree-dot ${meta.dot}" style="flex-shrink:0;"></span>
          <span>${meta.icon}</span>
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(n.name)}</span>
        </span>
        <span style="display:flex;gap:4px;flex-shrink:0;">
          <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.72rem;" onclick="microOpenAdmin('${n.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:0.72rem;color:var(--red);" onclick="microDeleteNode('${n.id}')">🗑️</button>
        </span>
      </div>` + walk(n.id, depth + 1);
    }).join('');
  }
  return walk(null, 0);
}

function microOpenAdmin(editId) {
  microAdminEditId = editId || null;
  const editingNode = editId ? microData.nodes.find(n => n.id === editId) : null;
  microPendingImage = editingNode?.image || null;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.classList.add('open');
  modal.innerHTML = `
    <div class="modal-box" style="max-width:680px;max-height:88vh;overflow-y:auto;">
      <h3 style="margin-bottom:14px;">⚙️ ${editingNode ? 'تعديل عقدة' : 'إضافة عقدة جديدة للشجرة'}</h3>

      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div class="ecg-field" style="flex:1;min-width:200px;">
          <label class="ecg-label">📂 العقدة الأب (Parent)</label>
          <select class="form-input" id="microFormParent">${microParentOptionsHtml(editId, editingNode?.parent_id || null)}</select>
        </div>
        <div class="ecg-field" style="flex:1;min-width:160px;">
          <label class="ecg-label">🧩 نوع العقدة</label>
          <select class="form-input" id="microFormType" onchange="microUpdateAdminTypeFields()">
            <option value="category" ${(!editingNode || editingNode.node_type === 'category') ? 'selected' : ''}>📁 Category</option>
            <option value="lab_test" ${editingNode?.node_type === 'lab_test' ? 'selected' : ''}>🧪 Lab Test</option>
            <option value="bacteria_bug" ${editingNode?.node_type === 'bacteria_bug' ? 'selected' : ''}>🦠 Bacteria</option>
          </select>
        </div>
      </div>
      <div class="ecg-field"><label class="ecg-label">🏷️ الاسم</label>
        <input class="form-input" id="microFormName" placeholder="مثال: Staph aureus" value="${editingNode ? esc(editingNode.name).replace(/"/g,'&quot;') : ''}" />
      </div>

      <div id="microDetailFieldsWrap" class="pharma-box pharma-box-visual" style="display:none;">
        <div class="pharma-box-title">🦠 تفاصيل البكتيريا</div>
        <div class="ecg-field"><label class="ecg-label">🏷️ نوع الميكروب</label>
          <select class="form-input" id="microFormBugType">
            <option value="bacteria" ${(!editingNode || microNormalizeBugType(editingNode.bug_type) === 'bacteria') ? 'selected' : ''}>🦠 Bacteria</option>
            <option value="virus" ${editingNode && microNormalizeBugType(editingNode.bug_type) === 'virus' ? 'selected' : ''}>🧬 Virus</option>
            <option value="fungi" ${editingNode && microNormalizeBugType(editingNode.bug_type) === 'fungi' ? 'selected' : ''}>🍄 Fungi</option>
            <option value="parasite" ${editingNode && microNormalizeBugType(editingNode.bug_type) === 'parasite' ? 'selected' : ''}>🪱 Parasite</option>
          </select>
        </div>
        <div class="ecg-field"><label class="ecg-label">🎯 التريك الذهبي للامتحان</label>
          <textarea class="form-textarea" id="microFormTricks" rows="2">${editingNode ? esc(editingNode.tricks || '') : ''}</textarea>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="ecg-field" style="flex:1;min-width:200px;"><label class="ecg-label">🧍 بتصيب مين؟</label>
            <input class="form-input" id="microFormAffects" value="${editingNode ? esc(editingNode.affects || '').replace(/"/g,'&quot;') : ''}" />
          </div>
          <div class="ecg-field" style="flex:1;min-width:200px;"><label class="ecg-label">🦠 أشهر مرض</label>
            <input class="form-input" id="microFormDisease" value="${editingNode ? esc(editingNode.famous_disease || '').replace(/"/g,'&quot;') : ''}" />
          </div>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="ecg-field" style="flex:1;min-width:200px;"><label class="ecg-label">💊 First-line Antibiotic</label>
            <input class="form-input" id="microFormFirstLine" value="${editingNode ? esc(editingNode.first_line || '').replace(/"/g,'&quot;') : ''}" />
          </div>
          <div class="ecg-field" style="flex:1;min-width:200px;"><label class="ecg-label">💊 Second-line / Alternative</label>
            <input class="form-input" id="microFormSecondLine" value="${editingNode ? esc(editingNode.second_line || '').replace(/"/g,'&quot;') : ''}" />
          </div>
        </div>
        <div class="ecg-field"><label class="ecg-label">🎨 رابط يوتيوب أو Google Drive (Visual Mnemonic)</label>
          <input class="form-input" id="microFormVisualLink" value="${editingNode ? esc(editingNode.visual_link || '').replace(/"/g,'&quot;') : ''}" />
        </div>
        <div class="ecg-field" style="margin-bottom:0;"><label class="ecg-label">🖼️ صورة (اختياري)</label>
          <input type="file" id="microImageFile" accept="image/*" style="display:none;" onchange="microHandleImageUpload(this.files)" />
          <div id="microImagePreviewWrap">
            ${microPendingImage
              ? `<img class="ecg-image-preview" src="${microPendingImage}" onclick="document.getElementById('microImageFile').click()" alt="" />`
              : `<div class="ecg-image-drop" onclick="document.getElementById('microImageFile').click()">📁 اضغط لرفع صورة، أو الصقها (Ctrl+V)</div>`}
          </div>
        </div>
      </div>

      <div class="hx-save-bar">
        <button class="btn btn-primary" onclick="microSaveNode()">💾 ${editingNode ? 'حفظ التعديل' : 'إضافة للشجرة'}</button>
        <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove();renderMicroTree();">${editingNode ? 'إلغاء' : 'إغلاق'}</button>
      </div>

      ${!editingNode ? `
      <div class="ecg-field" style="margin-top:18px;"><label class="ecg-label">📁 استيراد JSON دفعة وحدة (id / parent_id / name / node_type)</label>
        <input type="file" accept=".json" onchange="microHandleJsonImport(this.files)" />
      </div>
      <h4 style="margin-top:16px;margin-bottom:8px;">🌳 كل عناصر الشجرة (${microData.nodes.length})</h4>
      <div id="microAdminNodesList" style="max-height:220px;overflow-y:auto;">${microBuildAdminListHtml()}</div>` : ''}
    </div>`;
  document.body.appendChild(modal);
  microUpdateAdminTypeFields();
}

function microHandleImageUpload(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => microSetPendingImage(e.target.result);
  reader.readAsDataURL(file);
}
function microSetPendingImage(dataUrl) {
  compressImageDataUrl(dataUrl, compressed => {
    microPendingImage = compressed;
    const wrap = document.getElementById('microImagePreviewWrap');
    if (wrap) wrap.innerHTML = `<img class="ecg-image-preview" src="${compressed}" onclick="document.getElementById('microImageFile').click()" alt="" />`;
  }, 1200, 0.8);
}
document.addEventListener('paste', (e) => {
  const wrap = document.getElementById('microImagePreviewWrap');
  if (!wrap) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = ev => microSetPendingImage(ev.target.result);
      reader.readAsDataURL(file);
      break;
    }
  }
});

function microSaveNode() {
  const name = document.getElementById('microFormName').value.trim();
  if (!name) { showToast('⚠️ لازم تكتب اسم'); return; }
  const parent_id = document.getElementById('microFormParent').value || null;
  const node_type = document.getElementById('microFormType').value;
  const id = microAdminEditId || genId();
  const node = { id, parent_id, name, node_type };
  if (node_type === 'bacteria_bug') {
    node.bug_type = document.getElementById('microFormBugType').value;
    node.tricks = document.getElementById('microFormTricks').value.trim();
    node.affects = document.getElementById('microFormAffects').value.trim();
    node.famous_disease = document.getElementById('microFormDisease').value.trim();
    node.first_line = document.getElementById('microFormFirstLine').value.trim();
    node.second_line = document.getElementById('microFormSecondLine').value.trim();
    node.visual_link = document.getElementById('microFormVisualLink').value.trim();
    node.image = microPendingImage || '';
  }
  const idx = microData.nodes.findIndex(n => n.id === id);
  const previousNode = idx >= 0 ? microData.nodes[idx] : null;
  if (idx >= 0) microData.nodes[idx] = node; else microData.nodes.push(node);
  const ok = microSaveData();
  if (!ok) {
    // Roll back so the tree doesn't show a node that isn't actually persisted
    if (previousNode) microData.nodes[idx] = previousNode;
    else microData.nodes.pop();
    alert('⚠️ ما قدر يحفظ العقدة! خزين المتصفح ممتلئ على الأغلب — جرب صورة أصغر حجمًا أو احذف صور قديمة من عقد تانية.');
    return;
  }
  microExpanded.add(parent_id);

  if (microAdminEditId) {
    document.querySelector('.modal-overlay')?.remove();
    showToast('✅ تم حفظ التعديل');
  } else {
    showToast('✅ أضيفت العقدة — تقدر تضيف المزيد');
    document.getElementById('microFormName').value = '';
    ['microFormTricks', 'microFormAffects', 'microFormDisease', 'microFormFirstLine', 'microFormSecondLine', 'microFormVisualLink'].forEach(fid => {
      const el = document.getElementById(fid); if (el) el.value = '';
    });
    const bugTypeSel = document.getElementById('microFormBugType');
    if (bugTypeSel) bugTypeSel.value = 'bacteria';
    microPendingImage = null;
    const prevWrap = document.getElementById('microImagePreviewWrap');
    if (prevWrap) prevWrap.innerHTML = `<div class="ecg-image-drop" onclick="document.getElementById('microImageFile').click()">📁 اضغط لرفع صورة، أو الصقها (Ctrl+V)</div>`;
    const parentSel = document.getElementById('microFormParent');
    if (parentSel) parentSel.innerHTML = microParentOptionsHtml(null, id); // default: next entry nests under what you just added
    const typeSel = document.getElementById('microFormType');
    if (typeSel) { typeSel.value = 'category'; microUpdateAdminTypeFields(); }
    const listEl = document.getElementById('microAdminNodesList');
    if (listEl) listEl.innerHTML = microBuildAdminListHtml();
    document.getElementById('microFormName')?.focus();
  }
  renderMicroTree();
}

function microDeleteNode(id) {
  const node = microData.nodes.find(n => n.id === id);
  if (!node) return;
  const descendants = microDescendantIds(id);
  const total = descendants.size + 1;
  if (!confirm(`حذف "${node.name}"${descendants.size ? ' وكل ' + descendants.size + ' عنصر تحته' : ''}؟ (${total} عنصر إجمالي)`)) return;
  microData.nodes = microData.nodes.filter(n => n.id !== id && !descendants.has(n.id));
  microSaveData();
  renderMicroTree();
  const listEl = document.getElementById('microAdminNodesList');
  if (listEl) listEl.innerHTML = microBuildAdminListHtml();
  showToast('🗑️ تم الحذف');
}

function microNormalizeType(t) {
  const s = (t || '').toString().trim().toLowerCase().replace(/[\s_-]+/g, '_');
  if (s.includes('bacteria') || s.includes('bug')) return 'bacteria_bug';
  if (s.includes('lab') || s.includes('test')) return 'lab_test';
  return 'category';
}

// Accepts either our own field names or the common alternate schema:
// mcq_trick / target_population / most_common_disease / first_line_abx /
// second_line_abx / image_url / youtube_url
function microMapDetailFields(n, node) {
  const pick = (...keys) => { for (const k of keys) { if (n[k]) return n[k]; } return ''; };
  const tricks = pick('tricks', 'mcq_trick');
  const affects = pick('affects', 'target_population');
  const famous_disease = pick('famous_disease', 'most_common_disease');
  const first_line = pick('first_line', 'first_line_abx');
  const second_line = pick('second_line', 'second_line_abx');
  const visual_link = pick('visual_link', 'youtube_url');
  const image = pick('image', 'image_url');
  if (tricks) node.tricks = tricks;
  if (affects) node.affects = affects;
  if (famous_disease) node.famous_disease = famous_disease;
  if (first_line) node.first_line = first_line;
  if (second_line) node.second_line = second_line;
  if (visual_link) node.visual_link = visual_link;
  if (image) node.image = image;
  const rawType = pick('bug_type', 'type');
  if (rawType) node.bug_type = microNormalizeBugType(rawType);
}

// Converts the "Clinical Microbiology Tree" schema:
// { organ_systems: [ { system_name_ar/en, clinical_syndromes: [ { syndrome_name_ar/en,
//   organisms: [ { name_en, type, mcq_trick, target_population, most_common_disease,
//   first_line_treatment, second_line_treatment } ] } ] } ] }
// into our flat {id, parent_id, name, node_type} node list (category -> category -> bacteria_bug).
function microConvertClinicalSchema(obj) {
  const nodes = [];
  (obj.organ_systems || []).forEach(system => {
    const sysId = genId();
    const sysName = system.system_name_ar && system.system_name_en
      ? `${system.system_name_en} — ${system.system_name_ar}`
      : (system.system_name_en || system.system_name_ar || 'System');
    nodes.push({ id: sysId, parent_id: null, name: sysName, node_type: 'category' });

    (system.clinical_syndromes || []).forEach(syndrome => {
      const synId = genId();
      const synName = syndrome.syndrome_name_ar && syndrome.syndrome_name_en
        ? `${syndrome.syndrome_name_en} — ${syndrome.syndrome_name_ar}`
        : (syndrome.syndrome_name_en || syndrome.syndrome_name_ar || 'Syndrome');
      nodes.push({ id: synId, parent_id: sysId, name: synName, node_type: 'category' });

      (syndrome.organisms || []).forEach(org => {
        const orgId = genId();
        const node = {
          id: orgId, parent_id: synId,
          name: org.name_en || org.name || 'Organism',
          node_type: 'bacteria_bug',
        };
        microMapDetailFields(org, node); // maps mcq_trick/target_population/etc. + type -> bug_type
        nodes.push(node);
      });
    });
  });
  return nodes;
}

function microHandleJsonImport(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      let list;
      if (obj && Array.isArray(obj.organ_systems)) {
        // New Clinical Microbiology Tree schema — replaces the whole tree
        // since it's a complete, self-contained hierarchy (systems -> syndromes -> organisms).
        list = microConvertClinicalSchema(obj);
        if (confirm(`هاد ملف شجرة سريرية كاملة (${obj.organ_systems.length} أجهزة). استيراده رح "يستبدل" الشجرة الحالية بالكامل. تأكيد؟`)) {
          microData.nodes = [];
        } else {
          showToast('↩️ تم الإلغاء');
          return;
        }
      } else {
        list = Array.isArray(obj) ? obj : (obj.nodes || []);
      }
      let imported = 0;
      list.forEach(n => {
        if (!n.name || !n.node_type) return;
        const id = n.id || genId();
        const idx = microData.nodes.findIndex(x => x.id === id);
        const node_type = microNormalizeType(n.node_type);
        const node = { id, parent_id: n.parent_id || null, name: n.name, node_type };
        if (node_type === 'bacteria_bug') {
          if (n.bug_type) node.bug_type = microNormalizeBugType(n.bug_type);
          microMapDetailFields(n, node);
        }
        if (idx >= 0) microData.nodes[idx] = node; else microData.nodes.push(node);
        imported++;
      });
      microSaveData();
      showToast(`✅ تم استيراد ${imported} عنصر للشجرة`);
      document.querySelector('.modal-overlay')?.remove();
      renderMicroTree();
    } catch (err) {
      showToast('⚠️ تعذّرت قراءة الملف — تأكد من صيغة الـ JSON');
    }
  };
  reader.readAsText(file);
}

