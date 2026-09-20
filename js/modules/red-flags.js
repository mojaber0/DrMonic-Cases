// ════════════════════════════════════════════════
//  RED FLAGS CHECKLIST
//  Simple localStorage CRUD: { id, symptom, flags: [string...], notes }
// ════════════════════════════════════════════════
const RF_KEY = 'drmonic_redflags';
let rfData = [];
function rfLoad() {
  try { rfData = JSON.parse(localStorage.getItem(RF_KEY)) || []; } catch (e) { rfData = []; }
}
function rfSave() { safeLocalSet(RF_KEY, JSON.stringify(rfData)); }

function showRedFlagsView() {
  hideAllViews();
  document.getElementById('redFlagsView').classList.add('active');
  rfLoad();
  rfShowList();
}
function rfShowList() {
  document.getElementById('rfFormArea').style.display = 'none';
  document.getElementById('rfDetailArea').style.display = 'none';
  const grid = document.getElementById('rfListArea');
  grid.style.display = 'grid';
  if (!rfData.length) {
    grid.innerHTML = `<div class="gam-empty" style="grid-column:1/-1;">🚩 ما أضفت أي عرض بعد — اضغط "➕ إضافة عرض جديد" (مثلاً: ألم صدر، صداع، ألم بطن...)</div>`;
    return;
  }
  grid.innerHTML = rfData.map(r => `
    <div class="rf-card" onclick="rfOpenDetail('${r.id}')">
      <div class="rf-card-title">🚩 ${esc(r.symptom)}</div>
      <div class="rf-card-count">${(r.flags || []).length} علامة خطر</div>
    </div>`).join('');
}
function rfOpenDetail(id) {
  const r = rfData.find(x => x.id === id);
  if (!r) return;
  document.getElementById('rfListArea').style.display = 'none';
  document.getElementById('rfFormArea').style.display = 'none';
  const area = document.getElementById('rfDetailArea');
  area.style.display = 'block';
  area.innerHTML = `
    <div class="pharma-box pharma-box-visual">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;">🚩 ${esc(r.symptom)}</h3>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-ghost btn-sm" onclick="rfOpenForm('${r.id}')">✏️ تعديل</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red);" onclick="rfDelete('${r.id}')">🗑️ حذف</button>
        </div>
      </div>
      ${(r.flags || []).map(f => `<div class="rf-flag-item"><span class="dot">🔴</span><span>${esc(f)}</span></div>`).join('') || '<div class="gam-empty">ما في علامات خطر مسجّلة</div>'}
      ${r.notes ? `<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);color:var(--text2);font-size:0.88rem;">📝 ${esc(r.notes)}</div>` : ''}
    </div>
    <button class="btn btn-ghost btn-sm" style="margin-top:14px;" onclick="rfShowList()">← رجوع للقائمة</button>`;
}
function rfOpenForm(id) {
  const editing = id ? rfData.find(x => x.id === id) : null;
  document.getElementById('rfListArea').style.display = 'none';
  document.getElementById('rfDetailArea').style.display = 'none';
  const area = document.getElementById('rfFormArea');
  area.style.display = 'block';
  area.innerHTML = `
    <div class="pharma-box pharma-box-visual">
      <div class="ecg-field"><label class="ecg-label">🚩 العرض / الشكوى</label>
        <input class="form-input" id="rfFormSymptom" placeholder="مثلاً: ألم صدر" value="${editing ? esc(editing.symptom) : ''}" />
      </div>
      <div class="ecg-field"><label class="ecg-label">🔴 علامات الخطر (سطر لكل علامة)</label>
        <textarea class="form-textarea" id="rfFormFlags" rows="6" placeholder="مثلاً:&#10;ألم يمتد للذراع أو الفك&#10;تعرّق وضيق تنفس مرافق&#10;هبوط ضغط">${editing ? esc((editing.flags || []).join('\n')) : ''}</textarea>
      </div>
      <div class="ecg-field"><label class="ecg-label">📝 ملاحظات إضافية (اختياري)</label>
        <textarea class="form-textarea" id="rfFormNotes" rows="2">${editing ? esc(editing.notes || '') : ''}</textarea>
      </div>
      <div class="hx-save-bar">
        <button class="btn btn-ghost" onclick="rfShowList()">إلغاء</button>
        <button class="btn btn-primary" onclick="rfSaveForm('${editing ? editing.id : ''}')">💾 حفظ</button>
      </div>
    </div>`;
}
function rfSaveForm(id) {
  const symptom = document.getElementById('rfFormSymptom').value.trim();
  const flags = document.getElementById('rfFormFlags').value.split('\n').map(s => s.trim()).filter(Boolean);
  const notes = document.getElementById('rfFormNotes').value.trim();
  if (!symptom) { showToast('⚠️ لازم تكتب اسم العرض'); return; }
  if (id) {
    const entry = rfData.find(x => x.id === id);
    Object.assign(entry, { symptom, flags, notes });
  } else {
    rfData.push({ id: genId(), symptom, flags, notes });
  }
  rfSave();
  showToast('✅ تم الحفظ');
  rfShowList();
}
function rfDelete(id) {
  if (!confirm('متأكد إنك بدك تحذف هاد العرض؟')) return;
  rfData = rfData.filter(x => x.id !== id);
  rfSave();
  showToast('🗑️ تم الحذف');
  rfShowList();
}

