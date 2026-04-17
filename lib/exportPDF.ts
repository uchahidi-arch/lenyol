import type { Person, Union } from './types';

interface ExportContext {
  getPersonById: (id: string) => Person | null;
  getParentUnionOf: (personId: string) => Union | null;
  fetchPerson: (id: string) => Promise<Person | null>;
  fetchParentUnionOf: (id: string) => Promise<Union | null>;
}

function buildCardHTML(person: Person | null, roleColor: string): string {
  if (!person) return `<div style="width:148px;height:62px;visibility:hidden;"></div>`;

  const initial = (person.prenom || '?').charAt(0).toUpperCase();
  const photo = person.photo_url
    ? `<img src="${person.photo_url}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid ${roleColor};flex-shrink:0;" crossorigin="anonymous">`
    : `<div style="width:34px;height:34px;border-radius:50%;background:${roleColor};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">${initial}</div>`;

  const nom = person.nom
    ? `<div style="font-size:9px;color:#57534E;font-weight:800;text-transform:uppercase;margin-top:1px;line-height:1.1;">${person.nom}</div>`
    : '';

  let meta = '';
  if (person.localite) meta += `<div style="font-size:8px;color:#1A5C3E;margin-top:2px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📍 ${person.localite}</div>`;
  if (person.clan)     meta += `<div style="font-size:7.5px;color:#78716C;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${person.prefix_lignee || 'Lenyol'} ${person.clan}</div>`;

  return `
    <div style="border:2px solid ${roleColor};border-radius:10px;padding:5px 8px;width:148px;height:62px;background:#fff;display:flex;align-items:center;gap:7px;box-shadow:0 2px 6px rgba(0,0,0,0.08);z-index:2;box-sizing:border-box;">
      ${photo}
      <div style="flex:1;overflow:hidden;text-align:left;line-height:1.2;">
        <div style="font-weight:800;font-size:11px;color:#1C1917;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;">${person.prenom}</div>
        ${nom}
        ${meta}
      </div>
    </div>
  `;
}

function buildTreeHTML(
  personId: string | null,
  level: number,
  roleColor: string,
  cache: { persons: Map<string, Person>; unions: Map<string, Union> }
): string {
  const person = personId ? (cache.persons.get(personId) ?? null) : null;
  const card = buildCardHTML(person, roleColor);

  if (level >= 3) {
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;width:100%;">${card}</div>`;
  }

  const u = personId ? (cache.unions.get(personId) ?? null) : null;
  const pereId = u?.pere_id ?? null;
  const mereId = u?.mere_id ?? null;

  let horizLine = '';
  if (pereId && mereId) horizLine = `<div style="position:absolute;bottom:0;left:25%;right:25%;height:2px;background:#C4B9B0;"></div>`;
  else if (pereId)      horizLine = `<div style="position:absolute;bottom:0;left:25%;right:50%;height:2px;background:#C4B9B0;"></div>`;
  else if (mereId)      horizLine = `<div style="position:absolute;bottom:0;left:50%;right:25%;height:2px;background:#C4B9B0;"></div>`;

  return `
    <div style="display:flex;flex-direction:column;align-items:center;flex:1;width:100%;">
      <div style="display:flex;width:100%;position:relative;flex:1;">
        ${horizLine}
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
          ${buildTreeHTML(pereId, level + 1, '#475569', cache)}
          <div style="width:2px;height:16px;background:#C4B9B0;${pereId ? '' : 'visibility:hidden;'}"></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
          ${buildTreeHTML(mereId, level + 1, '#9d174d', cache)}
          <div style="width:2px;height:16px;background:#C4B9B0;${mereId ? '' : 'visibility:hidden;'}"></div>
        </div>
      </div>
      <div style="width:2px;height:16px;background:#C4B9B0;${personId && (pereId || mereId) ? '' : 'visibility:hidden;'}"></div>
      ${card}
    </div>
  `;
}

async function getPerson(id: string, cache: Map<string, Person>, ctx: ExportContext): Promise<Person | null> {
  if (cache.has(id)) return cache.get(id)!;
  const p = ctx.getPersonById(id) ?? await ctx.fetchPerson(id);
  if (p) cache.set(id, p);
  return p ?? null;
}

async function getParentUnion(personId: string, unionCache: Map<string, Union>, ctx: ExportContext): Promise<Union | null> {
  if (unionCache.has(personId)) return unionCache.get(personId)!;
  const u = ctx.getParentUnionOf(personId) ?? await ctx.fetchParentUnionOf(personId);
  if (u) unionCache.set(personId, u);
  return u ?? null;
}

export async function exportPersonPDF(
  personId: string,
  scope: 'ma' | 'reg',
  ctx: ExportContext
): Promise<void> {
  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf'),
  ]);

  // Caches locaux — indépendants du snapshot React
  const personCache = new Map<string, Person>();
  const unionCache  = new Map<string, Union>();

  // Charger la personne principale
  const p = await getPerson(personId, personCache, ctx);
  if (!p) throw new Error('Personne introuvable');

  // Pré-charger récursivement 3 niveaux d'ancêtres
  let currentIds = [personId];
  for (let lvl = 0; lvl < 3; lvl++) {
    if (!currentIds.length) break;
    const unions = await Promise.all(currentIds.map(id => getParentUnion(id, unionCache, ctx)));
    const nextIds: string[] = [];
    for (const u of unions) {
      if (!u) continue;
      if (u.pere_id) nextIds.push(u.pere_id);
      if (u.mere_id) nextIds.push(u.mere_id);
    }
    const unique = [...new Set(nextIds)];
    await Promise.all(unique.map(id => getPerson(id, personCache, ctx)));
    currentIds = unique;
  }

  const cache = { persons: personCache, unions: unionCache };

  const PAGE_W = 1587;
  const PAGE_H = 1122;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:-9999px;left:0;z-index:-1;pointer-events:none;';
  document.body.appendChild(wrapper);

  const el = document.createElement('div');
  el.style.cssText = `width:${PAGE_W}px;height:${PAGE_H}px;padding:36px 50px;background:#FFFDF8;font-family:'Outfit',sans-serif;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;overflow:hidden;`;

  el.innerHTML = `
    <div style="text-align:center;width:100%;margin-bottom:28px;flex-shrink:0;">
      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;color:#1A5C3E;font-size:38px;margin:0;font-weight:700;">
        Arbre d'ascendance de ${p.prenom} ${p.nom || ''}
      </h2>
      <div style="height:2px;width:130px;background:#DFBF68;margin:10px auto;border-radius:1px;"></div>
      <p style="font-size:14px;color:#78716C;margin:0;">Document généré sur Lenyol · Registre Généalogique Sénégalais</p>
    </div>
    <div style="width:100%;flex:1;display:flex;justify-content:center;align-items:center;">
      <div style="width:100%;display:flex;justify-content:center;align-items:flex-end;">
        ${buildTreeHTML(p.id, 0, '#1A5C3E', cache)}
      </div>
    </div>
    <div style="width:100%;display:flex;justify-content:center;gap:32px;margin-top:16px;flex-shrink:0;font-size:11px;color:#78716C;">
      <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#1A5C3E;"></span> Sujet principal</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#475569;"></span> Lignée paternelle</span>
      <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#9d174d;"></span> Lignée maternelle</span>
    </div>
  `;

  wrapper.appendChild(el);

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      windowWidth: PAGE_W,
      windowHeight: PAGE_H,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
    pdf.save(`Lenyol_${p.prenom}_${p.nom || ''}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}
