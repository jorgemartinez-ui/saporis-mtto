
// ================================================================
// DB
// ================================================================
function loadDB(k,def){try{const v=localStorage.getItem('sap4_'+k);return v?JSON.parse(v):def;}catch(e){return def;}}

function saveDB(k,v){try{localStorage.setItem('sap4_'+k,JSON.stringify(v));}catch(e){}}

const DEFAULT_USERS=[
  {id:'u_adm1',username:'jorgemartinez',nombre:'Jorge Martínez',password:'JM2026',rol:'admin'},
  {id:'u_adm2',username:'mauriciorangel',nombre:'Mauricio Rangel',password:'MR2026',rol:'admin'},
  {id:'u_t1',username:'cesararreola',nombre:'César Arreola',password:'CA2026',rol:'tecnico'},
  {id:'u_t2',username:'anthonchavez',nombre:'Anthon Chávez',password:'AC2026',rol:'tecnico'},
  {id:'u_t3',username:'marcodiaz',nombre:'Marco Díaz',password:'MD2026',rol:'tecnico'},
  {id:'u_t4',username:'angelmuratalla',nombre:'Ángel Muratalla',password:'AM2026',rol:'tecnico'},
  {id:'u_t5',username:'urielnavarrete',nombre:'Uriel Navarrete',password:'UN2026',rol:'tecnico'},
  {id:'u_t6',username:'eduardoorozco',nombre:'Eduardo Orozco',password:'EO2026',rol:'tecnico'},
  {id:'u_t7',username:'lisandrotorres',nombre:'Lisandro Torres',password:'LT2026',rol:'tecnico'},
  {id:'u_t8',username:'alanzurita',nombre:'Alan Zurita',password:'AZ2026',rol:'tecnico'},
  {id:'u_op1',username:'operador',nombre:'Operador General',password:'fabrica2026',rol:'operador'},
  {id:'u_l1',username:'ericknogueira',nombre:'Erick Nogueira',password:'EN2026',rol:'lider'},
  {id:'u_l2',username:'brunodiaz',nombre:'Bruno Díaz',password:'BD2026',rol:'lider'},
  {id:'u_l3',username:'jessicaheredia',nombre:'Jessica Heredia',password:'JH2026',rol:'lider'},
];
let USERS=loadDB('users',DEFAULT_USERS);
let ORDENES=loadDB('ordenes',[]);
let REFACCIONES=loadDB('refacciones',[]);
let CONSUMO_REF=loadDB('consumo_ref',[]);
let PM03_PLAN=loadDB('pm03_plan',[]);
let MTBF_DATA=loadDB('mtbf_data',[]);
let GASTO_DATA=loadDB('gasto_data',[]);
let INSPECCIONES=loadDB('inspecciones',[]);

const DEFAULT_LISTAS={
  lineas_proceso:['Cocedor 1','Cocedor 2','TQA3','Planta 2 (Mayonesa)','Planta 1','Ósmosis','Tanque B2','Tanque B1','Tanque A5','Tanque G2','Tanque M1C','Tanque A1','Tanque A2','Tanque A3','Tanque A6','Tanque A7','Tanque C1','Tanque C2','Tanque Almidón','Tanque Bluecheese','Tanque Estadía','CIP'],
  lineas_envasado:['Doypack 1','Doypack 2','L-Tarro','L-Squeez','Domber 1','Domber 2','Waldo','Garrafa','Cubeta','Galón 1','Galón 2','TIMSA','Aceite','Hojuela de Papa','Cuerno Mayonesa'],
  lineas_servicios:['Caldera','Pozo','Fase 1','Fase 2','Compresor de Aire 1','Compresor de Aire 2','Subestación Eléctrica','CCM1','CCM2','UMA'],
  lineas_bodega:['Nave 1','Nave 2','Nave 3','Nave 4','Nave 5','Patio Maniobras','Tanque Aceite','Tanque Fructosa','Tanque Ácido Acético','Rampa 1','Rampa 2','Rampa 3','Andén','Cuarto Pesado 1 (Alérgenos)','Cuarto Pesado 2 No Alérgenos','Cámara Fría'],
  tipos_anormalidad:['Seguridad','Calidad','5s','Condición Básica','LDA','FDS','Paro Menor'],
};
let LISTAS=loadDB('listas',DEFAULT_LISTAS);
function saveListas(){saveDB('listas',LISTAS);}

const CHECKLIST_PUNTOS=[
  'Tinacos agua de red/pozo',
  'Clorador de tinacos',
  'Bomba de pozo trabajando en automático',
  'Caldera trabajando correctamente a 6 kg',
  'Purgar 3 válvulas de agua en caldera',
  'Nivel de cisterna 1 correcto',
  'Nivel de cisterna 2 correcto',
  'Bombas trabajando correctamente (cisterna)',
  'Sistema de filtración fase 1 funcionando',
  'Hidroneumático funcionando correctamente',
  'Compresor de aire trabajando correctamente a 6 kg',
  'Chiller trabajando correctamente',
  'Presiones de refrigerantes adecuadas',
  'Bombas trabajando correctamente (refrigeración)',
  'Nivel de agua correcto en tanque llegada fase 2',
  'Nivel de agua correcto en 4 tanques negros para filtrar',
  'Sistema de filtración fase 2 trabajando correctamente',
  'Lámpara UV trabajando correctamente',
  'Bombas trabajando correctamente (fase 2)',
  'Bomba relleno de agua sistemas de calentamiento correctamente',
];

const TURNOS=[
  {id:'A',label:'Turno A (6:30 – 14:30)'},
  {id:'B',label:'Turno B (14:30 – 22:30)'},
  {id:'C',label:'Turno C (22:30 – 6:30)'},
];

let currentUser=null;
let detalleBackScreen='screen-ordenes';
let pmState={};let pmStepNum=0;let pmTipo='';
let atencionState={};let atencionStepNum=0;
let otCerrandoId=null;let reasignandoId=null;
let filtrosConsulta={tipo:'todas',estado:'todos',color:'todos',prio:'todas'};
let filtrosPend={estado:'todos',tipo:'todas',color:'todos',prio:'todas'};
// Inspección state
let inspeccionActual=null;
let puntoRojoIdx=-1;

// ================================================================
// UTILS
// ================================================================
function genID(tipo){const d=new Date();const s=String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');return tipo+'-'+s+'-'+(Math.floor(Math.random()*9000)+1000);}
function fmtDate(ts){if(!ts)return'—';return new Date(ts).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'});}
function fmtTime(ts){if(!ts)return'—';return new Date(ts).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});}
function fmtDateTime(ts){if(!ts)return'—';return fmtDate(ts)+' '+fmtTime(ts);}
function fmtDateTimeNow(){return fmtDateTime(Date.now());}
function getTurno(){
  const h=new Date().getHours()*60+new Date().getMinutes();
  if(h>=390&&h<870)return'A'; // 6:30-14:30
  if(h>=870&&h<1350)return'B'; // 14:30-22:30
  return'C';
}
function showAlert(msg,tipo='success'){const el=document.getElementById('global-alert');el.textContent=msg;el.className='alert alert-'+tipo;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),3000);}
function cerrarModal(id){document.getElementById(id).classList.add('hidden');}
function showModal(id){document.getElementById(id).classList.remove('hidden');}
function goBack(){showScreen(detalleBackScreen);}
function goMenu(){showScreen('screen-menu');}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));const el=document.getElementById(id);if(el)el.classList.add('active');window.scrollTo(0,0);}
function getWeekNumber(d){d=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));return Math.ceil((((d-y)/86400000)+1)/7);}
function currentWeek(){return getWeekNumber(new Date());}
function currentYear(){return new Date().getFullYear();}
function getWeeksInMonth(y,m){const w=new Set();const d=new Date(y,m-1,1);while(d.getMonth()===m-1){w.add(getWeekNumber(new Date(d)));d.setDate(d.getDate()+1);}return[...w].sort((a,b)=>a-b);}
function diffMin(a,b){if(!a||!b)return null;const pa=a.split(':').map(Number),pb=b.split(':').map(Number);let d=(pb[0]*60+pb[1])-(pa[0]*60+pa[1]);if(d<0)d+=1440;return d;}
function comprimirImagen(file,cb){
  const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const M=800;let w=img.width,h=img.height;if(w>M){h=Math.round(h*M/w);w=M;}if(h>M){w=Math.round(w*M/h);h=M;}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/jpeg',.6));};img.src=e.target.result;};r.readAsDataURL(file);
}
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

// ================================================================
// LOGIN
// ================================================================
function doLogin(){
  const u=document.getElementById('inp-user').value.trim().toLowerCase();
  const p=document.getElementById('inp-pass').value.trim();
  const errEl=document.getElementById('login-error');
  if(u==='superusuario'&&p===SUPER_PWD){
    currentUser={id:'u_super',username:'superusuario',nombre:'Super Usuario',rol:'super'};
    saveDB('session',{id:'u_super',rol:'super',nombre:'Super Usuario'});
    renderMenu();showScreen('screen-menu');return;
  }
  const found=USERS.find(x=>x.username.toLowerCase()===u&&x.password===p&&x.rol!=='super');
  if(!found){errEl.textContent='Usuario o contraseña incorrectos.';errEl.classList.remove('hidden');return;}
  errEl.classList.add('hidden');
  currentUser=found;saveDB('session',{id:found.id,rol:found.rol});
  renderMenu();showScreen('screen-menu');
  setTimeout(syncSupabase,500);
}
document.getElementById('inp-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
function doLogout(){currentUser=null;saveDB('session',null);document.getElementById('inp-user').value='';document.getElementById('inp-pass').value='';showScreen('screen-login');}

// ================================================================
// MENÚ
// ================================================================
function renderMenu(){
  if(!currentUser)return;
  const roles={admin:'Administrador',tecnico:'Técnico',operador:'Operador',lider:'Líder Producción',super:'⚡ Super Usuario'};
  document.getElementById('user-pill').textContent='👤 '+currentUser.nombre+' | '+roles[currentUser.rol];
  const r=currentUser.rol;
  document.getElementById('menu-operador').classList.toggle('hidden',r!=='operador');
  document.getElementById('menu-lider').classList.toggle('hidden',r!=='lider');
  document.getElementById('menu-tecnico').classList.toggle('hidden',!(r==='tecnico'||r==='admin'||r==='super'));
  document.getElementById('menu-admin-extra').classList.toggle('hidden',!(r==='admin'||r==='super'));
}

// ================================================================
// AREAS
// ================================================================
const PM_AREAS=[
  {id:'proceso',label:'Producción — Proceso',icon:'⚗️'},
  {id:'envasado',label:'Producción — Envasado',icon:'📦'},
  {id:'servicios',label:'Servicios Industriales',icon:'⚙️'},
  {id:'bodega',label:'Bodega',icon:'📦'},
  {id:'administrativo',label:'Administrativo',icon:'🏢'},
  {id:'otras',label:'Otras Áreas',icon:'📍'},
];
function getLineasPorArea(a){
  if(a==='proceso')return LISTAS.lineas_proceso||[];
  if(a==='envasado')return LISTAS.lineas_envasado||[];
  if(a==='servicios')return LISTAS.lineas_servicios||[];
  if(a==='bodega')return LISTAS.lineas_bodega;
  return[];
}
function esProd(a){return a==='proceso'||a==='envasado';}

// ================================================================
// WIZARD PM — STEPS:
// PM02 productiva: 0=color, 1=area, 2=linea, 3=componente, 4=prioridad, 5=tipo, 6=detalle+foto, 7=tecnico
// PM02 otras: 0=area, 1=color(SKIP), 2=linea, ...
// PM01/PM04: 0=area, 1=linea, 2=componente, 3=prioridad, 4=tipo, 5=detalle+foto, 6=tecnico
// LÓGICA: color solo si PM02 Y area=productiva, y aparece DESPUÉS de area (paso 1 real)
// ================================================================
function iniciarPM(tipo){
  pmTipo=tipo;pmStepNum=0;
  pmState={tipo,levantadoPor:currentUser.nombre,levantadoId:currentUser.id,ts:Date.now(),foto:null};
  document.getElementById('pm-topbar-title').textContent='Nueva '+tipo;
  document.getElementById('pm-topbar-sub').textContent=tipo==='PM01'?'Avería':tipo==='PM02'?'Anormalidad':'Apoyo a Producción';
  renderPMStep();showScreen('screen-pm');
}

// Steps definition depends on tipo and area selection
function getPMStepList(){
  // Always: area (0), linea (1), componente (2), prioridad (3), tipo_anom (4), detalle (5), tecnico (6)
  // Insert color AFTER area if PM02 and productiva
  const base=['area','linea','componente','prioridad','tipo_anom','detalle','tecnico'];
  if(pmTipo==='PM02'&&(pmState.area==='proceso'||pmState.area==='envasado')){
    return['area','color','linea','componente','prioridad','tipo_anom','detalle','tecnico'];
  }
  return base;
}

function renderPMStep(){
  const steps=getPMStepList();
  const total=steps.length;
  document.getElementById('pm-step-badge').textContent=(pmStepNum+1)+'/'+total;
  document.getElementById('pm-btn-back').style.display=pmStepNum===0?'none':'';
  document.getElementById('pm-btn-next').style.display='';
  document.getElementById('pm-btn-next').textContent=pmStepNum===total-1?'💾 Guardar':'Siguiente →';
  const stepName=steps[pmStepNum];
  const c=document.getElementById('pm-wizard-container');
  const prod=esProd(pmState.area);

  if(stepName==='area'){
    c.innerHTML=`<div class="wizard-title">📍 Área</div><div class="wizard-sub">¿En qué área se encuentra la anormalidad?</div>
    <div class="option-list">${PM_AREAS.map(a=>`<button class="option-btn ${pmState.area===a.id?'selected':''}" onclick="pmSelectArea('${a.id}',this)"><span class="opt-icon">${a.icon}</span>${a.label}</button>`).join('')}</div>`;
  }
  else if(stepName==='color'){
    c.innerHTML=`<div class="wizard-title">🎨 Clasificar Anormalidad</div>
    <div class="wizard-sub">¿Quién debe resolver esta anormalidad?</div>
    <div style="display:flex;flex-direction:column;gap:16px;margin-top:8px">
      <button class="btn btn-azul-ot" style="padding:22px;font-size:17px;border-radius:14px;border:${pmState.colorOT==='azul'?'4px solid #0D47A1':'2px solid var(--az)'}" onclick="pmState.colorOT='azul';renderPMStep()">🔵 AZUL — La resuelve el Operador</button>
      <button class="btn btn-rojo-ot" style="padding:22px;font-size:17px;border-radius:14px;color:#000;border:${pmState.colorOT==='rojo'?'4px solid #B71C1C':'2px solid var(--rj)'}" onclick="pmState.colorOT='rojo';renderPMStep()">🔴 ROJO — La resuelve Mantenimiento</button>
    </div>
    ${pmState.colorOT?`<div style="margin-top:16px;padding:12px;border-radius:10px;background:${pmState.colorOT==='azul'?'var(--az3)':'var(--rj3)'};font-size:13px;font-weight:700;color:${pmState.colorOT==='azul'?'var(--az4)':'var(--rj)'}">Seleccionado: ${pmState.colorOT==='azul'?'🔵 AZUL — Operador':'🔴 ROJO — Mantenimiento'}</div>`:''}`;
  }
  else if(stepName==='linea'){
    const lineas=getLineasPorArea(pmState.area);
    const lbl=prod?'Línea / Equipo':'Área / Zona';
    c.innerHTML=`<div class="wizard-title">🏭 ${lbl}</div><div class="wizard-sub">Selecciona ${prod?'la línea':'la zona'}</div>
    <div class="form-group"><label class="form-label">${lbl}</label>
      <select class="form-control" id="sel-linea" onchange="onLineaChange(this)">
        <option value="">-- Selecciona --</option>
        ${lineas.map(l=>`<option value="${l}" ${pmState.linea===l?'selected':''}>${l}</option>`).join('')}
        <option value="otra" ${pmState.linea==='otra'?'selected':''}>Otra</option>
      </select></div>
    <div id="linea-otra-w" class="${pmState.linea==='otra'?'':'hidden'} form-group">
      <label class="form-label">Especifica</label>
      <input type="text" class="form-control" id="inp-linea-otra" value="${pmState.lineaOtra||''}" placeholder="${prod?'Nombre de la línea':'Nombre del área'}...">
    </div>`;
  }
  else if(stepName==='componente'){
    const lbl=prod?'🔩 Componente':'🔩 Zona / Equipo específico';
    const ph=prod?'Ej: Motor principal, sensor temperatura...':'Ej: Rack, escalera, puerta...';
    c.innerHTML=`<div class="wizard-title">${lbl}</div><div class="wizard-sub">${prod?'Indica el subcomponente o parte específica':'Indica la zona o equipo específico'}</div>
    <div class="form-group"><input type="text" class="form-control" id="inp-componente" placeholder="${ph}" value="${pmState.componente||''}"></div>`;
  }
  else if(stepName==='prioridad'){
    c.innerHTML=`<div class="wizard-title">⚡ Prioridad</div><div class="wizard-sub">¿Qué tan urgente es?</div>
    <div class="option-list">
      ${[{id:'A',label:'Prioridad A — Máx 48 hrs',icon:'🔴'},{id:'B',label:'Prioridad B — Máx 20 días',icon:'🟠'},{id:'C',label:'Prioridad C — Más de 20 días',icon:'🟢'}].map(p=>`<button class="option-btn ${pmState.prioridad===p.id?'selected':''}" onclick="pmSelect('prioridad','${p.id}',this)"><span class="opt-icon">${p.icon}</span>${p.label}</button>`).join('')}
    </div>`;
  }
  else if(stepName==='tipo_anom'){
    const tipos=[...LISTAS.tipos_anormalidad,'Otra'];
    c.innerHTML=`<div class="wizard-title">📌 Tipo de Anormalidad</div>
    <div class="form-group"><select class="form-control" id="sel-tipo-anom" onchange="onTipoAnomChange(this)">
      <option value="">-- Selecciona --</option>${tipos.map(t=>`<option value="${t}" ${pmState.tipoAnormalidad===t?'selected':''}>${t}</option>`).join('')}
    </select></div>
    <div id="tipo-otra-w" class="${pmState.tipoAnormalidad==='Otra'?'':'hidden'} form-group">
      <label class="form-label">Especifica el tipo</label>
      <input type="text" class="form-control" id="inp-tipo-otra" value="${pmState.tipoAnormalidadOtra||''}" placeholder="Describe...">
    </div>`;
  }
  else if(stepName==='detalle'){
    const dup=checkDuplicado();
    c.innerHTML=`${dup?`<div class="dup-warn">⚠️ Posible duplicado detectado (${dup}). Puedes continuar de todas formas.</div>`:''}
    <div class="wizard-title">📝 Detalle y Fotografía</div>
    <div class="form-group"><textarea class="form-control" id="inp-detalle" placeholder="Describe qué está pasando..." style="min-height:110px">${pmState.detalle||''}</textarea></div>
    <div class="form-group"><label class="form-label">📷 Fotografía (opcional)</label>
      <div style="display:flex;gap:8px;margin-bottom:8px"><button class="btn btn-outline" style="flex:1;padding:12px" onclick="document.getElementById('foto-input-camara').click()">📷 Cámara</button><button class="btn btn-outline" style="flex:1;padding:12px" onclick="document.getElementById('foto-input-galeria').click()">🖼️ Galería</button></div>
      <input type="file" id="foto-input-camara" accept="image/*" capture="environment" style="display:none" onchange="procesarFoto(this)"><input type="file" id="foto-input-galeria" accept="image/*" style="display:none" onchange="procesarFoto(this)">
      ${pmState.foto?`<div style="position:relative"><img src="${pmState.foto}" class="foto-preview"><button type="button" onclick="pmBorrarFoto()" style="display:block;margin-top:6px;background:#fee2e2;color:#dc2626;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;width:100%">🗑️ Borrar foto</button></div>`:''}
    </div>`;
  }
  else if(stepName==='tecnico'){
    const isOp=currentUser.rol==='operador';
    if(isOp&&!pmState.tecnicoAsignado){pmState.tecnicoAsignado=currentUser.id;pmState.tecnicoNombre=currentUser.nombre;}
    const isTec=currentUser.rol==='tecnico';
    const assignable=isOp?USERS.filter(u=>u.rol!=='admin'&&u.rol!=='lider'&&u.rol!=='super'):USERS.filter(u=>u.rol==='tecnico');
    // Pre-select current user if tecnico and no assignment yet
    if(isTec&&!pmState.tecnicoAsignado){pmState.tecnicoAsignado=currentUser.id;pmState.tecnicoNombre=currentUser.nombre;}
    c.innerHTML=`<div class="wizard-title">👨‍🔧 Asignar a</div>
    <div class="wizard-sub">${(isOp||isTec)?'Por defecto se asigna a ti. Puedes cambiarla si aplica.':'¿A qué técnico le estás avisando?'}</div>
    <div class="form-group"><select class="form-control" id="sel-tecnico">
      <option value="">-- Sin asignar --</option>
      ${(isOp||isTec)?`<option value="${currentUser.id}" ${pmState.tecnicoAsignado===currentUser.id?'selected':''}>✅ Yo mismo (${currentUser.nombre})</option>`:''}
      ${assignable.filter(u=>u.id!==currentUser.id).map(t=>`<option value="${t.id}" ${pmState.tecnicoAsignado===t.id?'selected':''}>${t.nombre} (${t.rol})</option>`).join('')}
    </select></div>`;
  }
}

function pmSelectArea(val,btn){
  const old=pmState.area;pmState.area=val;
  btn.closest('.option-list').querySelectorAll('.option-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  // If area changes, reset color
  if(old!==val)pmState.colorOT=null;
}
function pmSelect(field,val,btn){pmState[field]=val;btn.closest('.option-list').querySelectorAll('.option-btn').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');}
function onLineaChange(sel){pmState.linea=sel.value;const w=document.getElementById('linea-otra-w');if(w)w.classList.toggle('hidden',sel.value!=='otra');}
function onTipoAnomChange(sel){pmState.tipoAnormalidad=sel.value;const w=document.getElementById('tipo-otra-w');if(w)w.classList.toggle('hidden',sel.value!=='Otra');}
function procesarFoto(input){
  const f=input.files[0];if(!f)return;
  // Save current text values BEFORE processing
  const det=document.getElementById('inp-detalle');if(det)pmState.detalle=det.value;
  const comp=document.getElementById('inp-componente');if(comp)pmState.componente=comp.value;
  comprimirImagen(f,function(b64){
    pmState.foto=b64;
    // Update preview without re-rendering (preserves text inputs)
    var preview=document.querySelector('.foto-preview');
    var container=document.querySelector('#foto-input-camara')?.parentElement||document.querySelector('#foto-input-galeria')?.parentElement;
    if(preview){preview.src=b64;}
    else{
      // No preview yet — just update without full re-render
      var noFotoDiv=document.querySelector('[style*="Sin foto"]');
      if(noFotoDiv){
        noFotoDiv.outerHTML='<div style="position:relative"><img src="'+b64+'" class="foto-preview"><div style="font-size:12px;color:var(--vd);font-weight:700;margin-top:4px">✅ Foto cargada</div></div>';
      } else {
        renderPMStep(); // fallback only
      }
    }
  });
}

function pmStep(dir){
  const steps=getPMStepList();
  const stepName=steps[pmStepNum];
  // Save current step values
  if(stepName==='linea'){
    const s=document.getElementById('sel-linea');if(s)pmState.linea=s.value;
    const o=document.getElementById('inp-linea-otra');if(o)pmState.lineaOtra=o.value.trim();
    pmState.lineaDisplay=pmState.linea==='otra'?pmState.lineaOtra:pmState.linea;
  }
  if(stepName==='componente'){const i=document.getElementById('inp-componente');if(i)pmState.componente=i.value.trim();}
  if(stepName==='tipo_anom'){
    const s=document.getElementById('sel-tipo-anom');if(s)pmState.tipoAnormalidad=s.value;
    const o=document.getElementById('inp-tipo-otra');if(o)pmState.tipoAnormalidadOtra=o.value.trim();
    pmState.tipoAnormalidadDisplay=pmState.tipoAnormalidad==='Otra'?pmState.tipoAnormalidadOtra:pmState.tipoAnormalidad;
  }
  if(stepName==='detalle'){const t=document.getElementById('inp-detalle');if(t)pmState.detalle=t.value.trim();}
  if(stepName==='tecnico'){const s=document.getElementById('sel-tecnico');if(s){pmState.tecnicoAsignado=s.value;pmState.tecnicoNombre=s.options[s.selectedIndex]?.text||'';}}

  if(dir===1){
    // Validations
    if(stepName==='area'&&!pmState.area){showAlert('Selecciona un área','error');return;}
    if(stepName==='color'&&pmTipo==='PM02'&&!pmState.colorOT){showAlert('Selecciona Azul o Rojo para continuar','error');return;}
    if(stepName==='linea'&&!pmState.linea){showAlert('Selecciona una opción','error');return;}
    if(stepName==='linea'&&pmState.linea==='otra'&&!pmState.lineaOtra){showAlert('Especifica la línea','error');return;}
    if(stepName==='prioridad'&&!pmState.prioridad){showAlert('Selecciona prioridad','error');return;}
    if(stepName==='detalle'&&!pmState.detalle){showAlert('Escribe el detalle','error');return;}
    if(pmStepNum===steps.length-1){mostrarOpcionGuardado();return;}
    pmStepNum++;
  } else {
    if(pmStepNum===0){goMenu();return;}
    pmStepNum--;
  }
  // Recalculate steps in case area changed
  const newSteps=getPMStepList();
  if(pmStepNum>=newSteps.length)pmStepNum=newSteps.length-1;
  renderPMStep();window.scrollTo(0,0);
}
function backFromPM(){if(pmStepNum===0)goMenu();else{pmStepNum--;renderPMStep();}}

function checkDuplicado(){
  if(!pmState.area||!pmState.linea)return null;
  const r=ORDENES.filter(o=>o.area===pmState.area&&o.linea===pmState.lineaDisplay&&o.tipoAnormalidad===pmState.tipoAnormalidadDisplay&&o.estado!=='cerrada'&&(Date.now()-o.ts)<7*86400000);
  if(r.length&&pmState.detalle){const sim=r.find(o=>{if(!o.detalle||!pmState.detalle)return false;const a=o.detalle.toLowerCase(),b=pmState.detalle.toLowerCase();return a.split(/\s+/).filter(p=>p.length>3&&b.split(/\s+/).includes(p)).length>=3;});if(sim)return sim.id;}
  return null;
}

function guardarOT(){
  const id=genID(pmTipo);
  let tecId=pmState.tecnicoAsignado||'',tecNom=pmState.tecnicoNombre||'Sin asignar';
  // Auto-assign to self if tecnico is raising the order
  if(currentUser&&currentUser.rol==='tecnico'&&!tecId){
    tecId=currentUser.id;tecNom=currentUser.nombre;
  }
  if(pmTipo==='PM02'&&pmState.colorOT==='azul'){tecId=currentUser.id;tecNom=currentUser.nombre;}
  const ot={
    id,tipo:pmTipo,area:pmState.area,linea:pmState.lineaDisplay||pmState.linea,
    componente:pmState.componente||'—',prioridad:pmState.prioridad,
    tipoAnormalidad:pmState.tipoAnormalidadDisplay||pmState.tipoAnormalidad||'—',
    detalle:pmState.detalle,foto:pmState.foto||null,
    tecnicoAsignado:tecId,tecnicoNombre:tecNom,
    levantadoPor:currentUser.nombre,levantadoId:currentUser.id,
    ts:(function(){var f=document.getElementById('pm-fecha-orden');if(f&&f.value&&f.value!==todayStr()){return new Date(f.value+'T12:00:00').getTime();}return Date.now();})(),horaCreacion:new Date().toISOString(),estado:(pmState.resuelta?'cerrada':'abierta'),semana:currentWeek(),año:currentYear(),
    colorOT:pmTipo==='PM02'?(pmState.colorOT||null):null,
    observacionesCierre:'',horasCierre:pmState.horasCierre||0,cerradaTs:pmState.resuelta?Date.now():null,cerradaPor:pmState.resuelta?currentUser.nombre:'',
    historialReasignacion:[],historialModificacion:[]
  };
  if(pmState.trabajoDias) ot.trabajoDias = pmState.trabajoDias;
  if(pmState.esTrabajoVariosDias) ot.esTrabajoVariosDias = true;
  ORDENES.push(ot);saveDB('ordenes',ORDENES);saveOrdenSupa(ot);
  showAlert('✅ Orden '+id+' creada');goMenu();
}

// ================================================================
// ATENCIÓN A LÍNEA
// ================================================================
function showAtencionLinea(){atencionState={levantadoPor:currentUser.nombre,levantadoId:currentUser.id,fecha:todayStr()};atencionStepNum=0;renderAtencionStep();showScreen('screen-atencion');}

function renderAtencionStep(){
  const c=document.getElementById('atencion-content');
  document.getElementById('atc-btn-next').textContent=atencionStepNum===5?'💾 Guardar':'Siguiente →';
  if(atencionStepNum===0){
    c.innerHTML=`<div class="wizard-title">📞 Hora de Llamado</div><div class="wizard-sub">Registra la hora y fecha exactas del aviso</div>
    <div class="form-group"><label class="form-label">Fecha</label><input type="date" class="form-control" id="atc-fecha" value="${atencionState.fecha||todayStr()}"></div>
    <button class="timer-btn ${atencionState.horaLlamado?'recorded':''}" onclick="registrarHora('llamado')">⏱️ ${atencionState.horaLlamado?'✅ '+fmtTime(atencionState.horaLlamado):'Registrar Hora de Llamado'}</button>`;
  }
  else if(atencionStepNum===1){
    c.innerHTML=`<div class="wizard-title">🚀 Inicio de Atención</div>
    <button class="timer-btn ${atencionState.horaInicio?'recorded':''}" onclick="registrarHora('inicio')">🔧 ${atencionState.horaInicio?'✅ '+fmtTime(atencionState.horaInicio):'Registrar Inicio de Atención'}</button>`;
  }
  else if(atencionStepNum===2){
    c.innerHTML=`<div class="wizard-title">✅ Entrega a Producción</div>
    <button class="timer-btn ${atencionState.horaEntrega?'recorded':''}" onclick="registrarHora('entrega')">🏁 ${atencionState.horaEntrega?'✅ '+fmtTime(atencionState.horaEntrega):'Registrar Hora de Entrega'}</button>`;
  }
  else if(atencionStepNum===3){
    c.innerHTML=`<div class="wizard-title">🔍 Falla Detectada</div>
    <div class="form-group"><textarea class="form-control" id="atc-falla" placeholder="¿Qué encontraste al llegar?" style="min-height:100px">${atencionState.falla||''}</textarea></div>`;
  }
  else if(atencionStepNum===4){
    c.innerHTML=`<div class="wizard-title">💡 Causa Raíz y Acciones</div>
    <div class="form-group"><textarea class="form-control" id="atc-causa" placeholder="Causa raíz y acciones ejecutadas..." style="min-height:120px">${atencionState.causaRaiz||''}</textarea></div>`;
  }
  else if(atencionStepNum===5){
    const lineas=(LISTAS.lineas_proceso||[]).concat(LISTAS.lineas_envasado||[]);
    const isPM04=(atencionState.tipoPM==='PM04');
    c.innerHTML=`<div class="wizard-title">📂 Clasificar y Registrar</div>
    <div class="form-group"><label class="form-label">Tipo de orden</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${['PM01','PM02','PM03','PM04'].map(t=>`<button class="option-btn ${atencionState.tipoPM===t?'selected':''}" style="flex:1;min-width:100px;padding:10px 8px" onclick="atcSetTipo('${t}',this)">${t}</button>`).join('')}</div>
    </div>

    <div class="form-group"><label class="form-label">Línea / Equipo</label>
      <select class="form-control" id="atc-linea-sel" onchange="onAtcLineaChange(this)">
        <option value="">-- Selecciona --</option>${lineas.map(l=>`<option value="${l}" ${atencionState.linea===l?'selected':''}>${l}</option>`).join('')}<option value="otra">Otra</option>
      </select></div>
    <div id="atc-otra-w" class="${atencionState.linea==='otra'?'':'hidden'} form-group">
      <input type="text" class="form-control" id="atc-linea-otra" value="${atencionState.lineaOtra||''}" placeholder="Nombre de la línea..."></div>
    <div class="form-group"><label class="form-label">Especifica componente</label>
      <input type="text" class="form-control" id="atc-componente" value="${atencionState.componente||''}" placeholder="Ej: Motor, bomba, sensor, válvula..."></div>
    <div id="pm04-lider-wrap" class="${isPM04?'':'hidden'} form-group">
      <label class="form-label">Líder u Oficial A en turno (PM04)</label>
      <input type="text" class="form-control" id="atc-lider-pm04" value="${atencionState.liderPM04||''}" placeholder="Nombre del líder u oficial A...">
    </div>
    <div class="form-group"><label class="form-label">Refacciones utilizadas</label>
      <input type="text" class="form-control" id="atc-refacciones" value="${atencionState.refacciones||''}" placeholder="Código o descripción..."></div>
    <div class="form-group"><label class="form-label">📷 Fotografía (opcional)</label>
      <div class="foto-btn" onclick="document.getElementById('atc-foto-input').click()">${atencionState.foto?'✅ Foto cargada':'📷 Agregar foto'}</div>
      <input type="file" id="atc-foto-input" accept="image/*" accept="image/*" style="display:none" onchange="procesarFotoAtc(this)">
      ${atencionState.foto?`<img src="${atencionState.foto}" class="foto-preview">`:''}
    </div>`;
  }
}

function atcSetTipo(t,btn){
  atencionState.tipoPM=t;
  btn.closest('div').querySelectorAll('.option-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  // Show/hide PM04 lider field
  const w=document.getElementById('pm04-lider-wrap');
  if(w)w.classList.toggle('hidden',t!=='PM04');
}
function onAtcLineaChange(sel){atencionState.linea=sel.value;const w=document.getElementById('atc-otra-w');if(w)w.classList.toggle('hidden',sel.value!=='otra');}
function procesarFotoAtc(input){const f=input.files[0];if(!f)return;comprimirImagen(f,b64=>{atencionState.foto=b64;renderAtencionStep();});}
function registrarHora(tipo){const a=Date.now();if(tipo==='llamado')atencionState.horaLlamado=a;else if(tipo==='inicio')atencionState.horaInicio=a;else atencionState.horaEntrega=a;renderAtencionStep();}

function atencionStep(dir){
  // Save current slot state
  if(currentSlot&&ATENCION_SLOTS[currentSlot]){ATENCION_SLOTS[currentSlot]={...atencionState,step:atencionStepNum};}
  if(atencionStepNum===0){const fd=document.getElementById('atc-fecha');if(fd)atencionState.fecha=fd.value;}
  if(atencionStepNum===3){const t=document.getElementById('atc-falla');if(t)atencionState.falla=t.value.trim();}
  if(atencionStepNum===4){const t=document.getElementById('atc-causa');if(t)atencionState.causaRaiz=t.value.trim();}
  if(atencionStepNum===5){
    const ls=document.getElementById('atc-linea-sel');if(ls)atencionState.linea=ls.value;
    const lo=document.getElementById('atc-linea-otra');if(lo)atencionState.lineaOtra=lo.value.trim();
    atencionState.lineaDisplay=atencionState.linea==='otra'?atencionState.lineaOtra:atencionState.linea;
    const comp=document.getElementById('atc-componente');if(comp)atencionState.componente=comp.value.trim();
    const lp=document.getElementById('atc-lider-pm04');if(lp)atencionState.liderPM04=lp.value.trim();
    const r=document.getElementById('atc-refacciones');if(r)atencionState.refacciones=r.value.trim();
  }
  if(dir===1){
    if(atencionStepNum===0&&!atencionState.horaLlamado){showAlert('Registra la hora de llamado','error');return;}
    if(atencionStepNum===1&&!atencionState.horaInicio){showAlert('Registra la hora de inicio','error');return;}
    if(atencionStepNum===2&&!atencionState.horaEntrega){showAlert('Registra la hora de entrega','error');return;}
    if(atencionStepNum===3&&!atencionState.falla){showAlert('Describe la falla','error');return;}
    if(atencionStepNum===4&&!atencionState.causaRaiz){showAlert('Describe la causa raíz','error');return;}
    if(atencionStepNum===5){
      if(!atencionState.tipoPM){showAlert('Selecciona el tipo PM','error');return;}
      if(!atencionState.linea){showAlert('Selecciona la línea','error');return;}
      guardarAtencion();return;
    }
    atencionStepNum++;
  } else {
    if(atencionStepNum===0){goMenu();return;}
    atencionStepNum--;
  }
  renderAtencionStep();window.scrollTo(0,0);
}

function guardarAtencion(){
  const tipo=atencionState.tipoPM||'PM01';
  const id=genID(tipo);
  let tr=null,mttr=null;
  if(atencionState.horaLlamado&&atencionState.horaInicio)tr=Math.round((atencionState.horaInicio-atencionState.horaLlamado)/60000);
  if(atencionState.horaInicio&&atencionState.horaEntrega)mttr=Math.round((atencionState.horaEntrega-atencionState.horaInicio)/60000);
  const ot={
    id,tipo,area:'productiva',linea:atencionState.lineaDisplay||'—',
    componente:atencionState.componente||'—',prioridad:'A',tipoAnormalidad:'Paro Menor',colorOT:tipo==='PM02'?'rojo':null,
    detalle:atencionState.falla||'Atención a línea',causaRaiz:atencionState.causaRaiz,foto:atencionState.foto||null,
    tecnicoAsignado:currentUser.id,tecnicoNombre:currentUser.nombre,
    levantadoPor:currentUser.nombre,levantadoId:currentUser.id,
    ts:Date.now(),fecha:atencionState.fecha||todayStr(),esAtencion:true,turno:getTurno(),
    estado:'cerrada',semana:currentWeek(),año:currentYear(),
    horaLlamado:atencionState.horaLlamado,horaInicio:atencionState.horaInicio,horaEntrega:atencionState.horaEntrega,
    tiempoRespuesta:tr,mttr,
    liderPM04:atencionState.liderPM04||null,
    refaccionesUsadas:atencionState.refacciones||'',
    observacionesCierre:atencionState.causaRaiz,horasCierre:atencionState.horaLlamado&&atencionState.horaEntrega?parseFloat(((atencionState.horaEntrega-atencionState.horaLlamado)/3600000).toFixed(2)):mttr?parseFloat((mttr/60).toFixed(2)):0,
    cerradaTs:Date.now(),cerradaPor:currentUser.nombre,
    historialReasignacion:[],historialModificacion:[]
  };
  ORDENES.push(ot);saveDB('ordenes',ORDENES);saveOrdenSupa(ot);
  if(atencionState.refacciones){CONSUMO_REF.push({ts:Date.now(),otId:id,tecnico:currentUser.nombre,descripcion:atencionState.refacciones,semana:currentWeek(),año:currentYear()});saveDB('consumo_ref',CONSUMO_REF);}
  showAlert('✅ Atención registrada: '+id);goMenu();
  // Reset slot so next use starts fresh
  if(currentSlot){ATENCION_SLOTS[currentSlot]=null;updateSlotPreview();atencionState=initSlot(currentSlot);atencionStepNum=0;}
}

// ================================================================
// MIS ÓRDENES
// ================================================================
function showMisOrdenes(){detalleBackScreen='screen-ordenes';renderMisOrdenes();showScreen('screen-ordenes');}

function buildFiltrosPendientes(){
  const isAdmin=currentUser.rol==='admin';
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  return`<div class="filter-row"><div class="filter-chip active" onclick="setFP('estado','todos',this)">Todos</div><div class="filter-chip" onclick="setFP('estado','abierta',this)">Abiertas</div><div class="filter-chip" onclick="setFP('estado','cerrada',this)">Cerradas</div></div>
  <div class="filter-row"><div class="filter-chip active" onclick="setFP('tipo','todas',this)">Todos tipos</div><div class="filter-chip" onclick="setFP('tipo','PM01',this)">PM01</div><div class="filter-chip" onclick="setFP('tipo','PM02',this)">PM02</div><div class="filter-chip" onclick="setFP('tipo','PM03',this)">PM03</div><div class="filter-chip" onclick="setFP('tipo','PM04',this)">PM04</div></div>
  <div class="filter-row"><div class="filter-chip active" onclick="setFP('color','todos',this)">Todos colores</div><div class="filter-chip" onclick="setFP('color','azul',this)">🔵 Azul</div><div class="filter-chip" onclick="setFP('color','rojo',this)">🔴 Rojo</div></div>
  <div class="filter-row"><div class="filter-chip active" onclick="setFP('prio','todas',this)">Toda prioridad</div><div class="filter-chip" onclick="setFP('prio','A',this)">Prio A</div><div class="filter-chip" onclick="setFP('prio','B',this)">Prio B</div><div class="filter-chip" onclick="setFP('prio','C',this)">Prio C</div></div>
  ${isAdmin?`<div class="form-group mb8"><label class="form-label">Por técnico</label><select class="form-control" id="fpen-tecnico" onchange="aplicarFiltrosPendientes()"><option value="">Todos los técnicos</option>${tecs.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')}</select></div>`:''}`;
}
function renderOTCard(o){
  const pB={A:'badge-pA',B:'badge-pB',C:'badge-pC'};
  const cc=o.colorOT?`color-${o.colorOT}`:'';
  return`<div class="ot-card ${o.tipo.toLowerCase()} ${cc}" onclick="showDetalle('${o.id}')">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
      <span style="font-size:11px;color:var(--txt3);font-weight:700">${o.id}</span>
      <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
        <span class="badge badge-${o.tipo.toLowerCase()}">${o.tipo}</span>
        ${o.colorOT?`<span class="badge badge-${o.colorOT}">${o.colorOT==='azul'?'🔵':'🔴'} ${o.colorOT}</span>`:''}
        ${o.prioridad?`<span class="badge ${pB[o.prioridad]||'badge-pB'}">P${o.prioridad}</span>`:''}
        <span class="badge badge-${o.estado}">${o.estado}</span>
      </div>
    </div>
    <div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:800;margin:2px 0 4px">${o.linea} — ${o.componente}</div>
    <div style="font-size:12px;color:var(--txt2)">${o.area||''} · ${o.tipoAnormalidad||''}</div>
    <div style="font-size:12px;color:var(--txt2);margin-top:2px">${(o.detalle||'').substring(0,80)}${(o.detalle||'').length>80?'...':''}</div>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--txt3)">
      <span>👤 ${o.levantadoPor}</span><span>📅 ${fmtDate(o.ts)}</span>
    </div>
  </div>`;
}

// ================================================================
// DETALLE OT
// ================================================================
function showDetalle(id){
  const o=ORDENES.find(x=>x.id===id);
  if(!o){const p=PM03_PLAN.find(x=>x.id===id);if(p){showDetallePM03(id);return;}return;}
  otCerrandoId=id;
  document.getElementById('detalle-topbar').textContent=id;
  const r=currentUser.rol;
  const canClose=(r==='tecnico'||r==='admin')&&o.estado!=='cerrada';
  const canCloseAzul=r==='operador'&&o.colorOT==='azul'&&o.levantadoId===currentUser.id&&o.estado!=='cerrada';
  const canReasign=(r==='tecnico'||r==='admin'||r==='lider')&&o.estado!=='cerrada';
  const canEditOwn=r==='operador'&&o.levantadoId===currentUser.id&&o.estado!=='cerrada';
  const pC={A:'var(--rj)',B:'var(--am2)',C:'var(--vd2)'};
  let hist='';
  if(o.historialReasignacion?.length)hist+=`<div class="card"><div class="card-title">🔄 Reasignaciones</div>${o.historialReasignacion.map(h=>`<div class="traza-box">📅 ${fmtDateTime(h.ts)}<br>Por: <b>${h.cambiadoPor}</b> | De: ${h.de} → ${h.a}<br>Motivo: ${h.motivo}</div>`).join('')}</div>`;
  if(o.historialModificacion?.length)hist+=`<div class="card"><div class="card-title">✏️ Modificaciones</div>${o.historialModificacion.map(h=>`<div class="traza-box">📅 ${fmtDateTime(h.ts)}<br>Por: <b>${h.por}</b> | ${h.campo}: ${h.de} → ${h.a}</div>`).join('')}</div>`;
  document.getElementById('detalle-content').innerHTML=`
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      <span class="badge badge-${o.tipo.toLowerCase()}">${o.tipo}</span>
      ${o.colorOT?`<span class="badge badge-${o.colorOT}">${o.colorOT==='azul'?'🔵 Azul':'🔴 Rojo'}</span>`:''}
      ${o.prioridad?`<span class="badge" style="background:${pC[o.prioridad]||'var(--gr3)'};color:#fff">Prioridad ${o.prioridad}</span>`:''}
      <span class="badge badge-${o.estado}">${o.estado}</span>
    </div>
    <div class="card">${row('🏭 Área',o.area)}${row('📍 Línea',o.linea)}${row('🔩 Componente',o.componente)}${row('📌 Tipo',o.tipoAnormalidad)}${row('👤 Levantado por',o.levantadoPor)}${row('👨‍🔧 Técnico',o.tecnicoNombre||'Sin asignar')}${row('📅 Fecha',fmtDateTime(o.ts))}${o.turno?row('⏰ Turno','Turno '+o.turno):''}${o.horaLlamado?row('📞 Hora llamado',fmtTime(o.horaLlamado)):''}${o.tiempoRespuesta!=null?row('⏱️ T. Respuesta',o.tiempoRespuesta+' min'):''}${o.mttr!=null?row('🔧 MTTR',o.mttr+' min'):''}${o.liderPM04?row('👷 Líder/Oficial A',o.liderPM04):''}</div>
    <div class="card"><div class="card-title">📝 Detalle</div><p style="font-size:14px;color:var(--txt2);line-height:1.6">${o.detalle}</p>${o.causaRaiz?`<div style="margin-top:10px;font-weight:700;font-size:13px">💡 Causa raíz:</div><p style="font-size:13px;color:var(--txt2);margin-top:4px">${o.causaRaiz}</p>`:''}${o.foto?`<div style="margin-top:10px;font-weight:700;font-size:13px">📷 Foto:</div><img src="${o.foto}" class="foto-preview mt4">`:''}
    </div>
    ${o.estado==='cerrada'?`<div class="card"><div class="card-title">✅ Cierre</div>${row('📅 Cerrada',fmtDateTime(o.cerradaTs))}${row('👤 Por',o.cerradaPor)}${row('⏱️ Horas',o.horasCierre+' h')}${o.observacionesCierre?`<p style="font-size:13px;color:var(--txt2);margin-top:8px">${o.observacionesCierre}</p>`:''}${o.refaccionesUsadas?row('🔩 Refacciones',o.refaccionesUsadas):''}</div>`:''}
    ${hist}
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
      ${canClose?`<button class="btn btn-success" onclick="abrirCierre('${o.id}')">✅ Cerrar Orden</button>`:''}
      ${canCloseAzul?`<button class="btn btn-azul-ot" onclick="abrirCierreAzul('${o.id}')">🔵 Marcar resuelta</button>`:''}
      ${canReasign?`<button class="btn btn-warning" onclick="abrirReasignacion('${o.id}')">🔄 Reasignar</button>`:''}
      ${canEditOwn?`<button class="btn btn-outline" onclick="editarDetalleOp('${o.id}')">✏️ Editar mi aviso</button>`:''}
      ${r==='admin'||r==='super'?`<button class="btn btn-outline" style="border-color:#7c3aed;color:#7c3aed" onclick="abrirEditarOTAdmin('${o.id}')">✏️ Editar Estado / Tipo</button>`:''}
    </div>`;
  showScreen('screen-detalle');
}
function row(k,v){return v&&v!=='—'?`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gr4);font-size:13px"><span style="color:var(--txt3)">${k}</span><span style="font-weight:600;max-width:60%;text-align:right">${v}</span></div>`:'';}
function abrirCierre(id){
  otCerrandoId=id;
  const o=ORDENES.find(x=>x.id===id)||PM03_PLAN.find(x=>x.id===id);
  document.getElementById('cierre-obs').value='';
  document.getElementById('cierre-horas').value='';
  document.getElementById('cierre-refacciones').value='';
  document.getElementById('cierre-ref-wrap').classList.remove('hidden');
  const el_i=document.getElementById('cierre-hora-inicio');
  const el_f=document.getElementById('cierre-hora-fin');
  const el_c=document.getElementById('cierre-tiempo-calc');
  if(el_i)el_i.value=''; if(el_f)el_f.value=''; if(el_c)el_c.textContent='';
  const tipo=o?.tipo||'PM03';
  const showTime=['PM01','PM03','PM04'].includes(tipo);
  const wrap=document.getElementById('cierre-tiempo-wrap');
  if(wrap)wrap.classList.toggle('hidden',!showTime);
  showModal('modal-cierre');
}
function abrirCierreAzul(id){otCerrandoId=id;document.getElementById('cierre-obs').value='';document.getElementById('cierre-horas').value='0';document.getElementById('cierre-refacciones').value='';document.getElementById('cierre-ref-wrap').classList.add('hidden');showModal('modal-cierre');}
function confirmarCierre(){
  const o=ORDENES.find(x=>x.id===otCerrandoId);if(!o)return;
  const obs=document.getElementById('cierre-obs').value.trim();
  if(!obs){showAlert('Escribe las observaciones','error');return;}
  const horas=parseFloat(document.getElementById('cierre-horas').value)||0;
  const refs=document.getElementById('cierre-refacciones').value.trim();
  const horaIni=document.getElementById('cierre-hora-inicio')?.value||null;
  const horaFin=document.getElementById('cierre-hora-fin')?.value||null;
  o.estado='cerrada';o.observacionesCierre=obs;o.horasCierre=horas;o.refaccionesUsadas=refs;
  o.cerradaTs=Date.now();o.cerradaPor=currentUser.nombre;
  if(horaIni)o.horaInicioTrabajo=horaIni; if(horaFin)o.horaFinTrabajo=horaFin;
  if(refs){refs.split(',').map(s=>s.trim()).forEach(cod=>{const ref=REFACCIONES.find(r=>r.codigo===cod||r.descripcion.toLowerCase().includes(cod.toLowerCase()));if(ref&&ref.cantidad>0)ref.cantidad--;CONSUMO_REF.push({ts:Date.now(),otId:otCerrandoId,tecnico:currentUser.nombre,codigo:cod,descripcion:cod,semana:currentWeek(),año:currentYear()});});saveDB('refacciones',REFACCIONES);saveDB('consumo_ref',CONSUMO_REF);}
  saveDB('ordenes',ORDENES);saveOrdenSupa(o);cerrarModal('modal-cierre');showAlert('✅ Orden cerrada');showDetalle(otCerrandoId);
}
function abrirReasignacion(id){
  reasignandoId=id;
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  document.getElementById('reasig-sel').innerHTML=`<option value="">Sin asignar</option>${tecs.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')}`;
  document.getElementById('reasig-motivo').value='';showModal('modal-reasignar');
}
function confirmarReasignacion(){
  const o=ORDENES.find(x=>x.id===reasignandoId);if(!o)return;
  const sel=document.getElementById('reasig-sel');const motivo=document.getElementById('reasig-motivo').value.trim();
  const nuevoId=sel.value,nuevoNom=sel.options[sel.selectedIndex]?.text||'Sin asignar';
  if(!o.historialReasignacion)o.historialReasignacion=[];
  o.historialReasignacion.push({ts:Date.now(),cambiadoPor:currentUser.nombre,de:o.tecnicoNombre||'Sin asignar',a:nuevoNom,motivo:motivo||'Sin motivo'});
  o.tecnicoAsignado=nuevoId;o.tecnicoNombre=nuevoNom;
  saveDB('ordenes',ORDENES);cerrarModal('modal-reasignar');showAlert('✅ Reasignado');showDetalle(reasignandoId);
}
function editarDetalleOp(id){
  const o=ORDENES.find(x=>x.id===id);if(!o)return;
  const nuevo=prompt('Edita el detalle de tu aviso:',o.detalle);
  if(!nuevo||nuevo===o.detalle)return;
  if(!o.historialModificacion)o.historialModificacion=[];
  o.historialModificacion.push({ts:Date.now(),por:currentUser.nombre,campo:'Detalle',de:o.detalle,a:nuevo});
  o.detalle=nuevo;saveDB('ordenes',ORDENES);showAlert('✅ Aviso actualizado');showDetalle(id);
}

// ================================================================
// CONSULTA OT
// ================================================================
function showConsultaOT(){
  detalleBackScreen='screen-consulta';
  const sel=document.getElementById('filtro-tecnico');
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  sel.innerHTML=`<option value="">Todos los técnicos</option>${tecs.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')}`;
  filtrosConsulta={tipo:'todas',estado:'todos',color:'todos',prio:'todas'};
  renderResumenConsulta();
  // Add semana/año filter if not present
  setTimeout(function(){
    if(!document.getElementById('filtro-semana-consulta')){
      var filterArea = document.querySelector('#screen-consulta .scroll-content');
      var semDiv = document.createElement('div');
      semDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap';
      semDiv.innerHTML = '<div style="flex:1;min-width:120px"><label class="form-label">Semana</label><select class="form-control" id="filtro-semana-consulta" onchange="filtrarOrdenes()" style="padding:8px"><option value="">Todas</option>'
        + Array.from({length:52},function(_,i){return '<option value="'+(i+1)+'"'+(i+1===currentWeek()?' selected':'')+'>Sem '+(i+1)+'</option>';}).join('')
        + '</select></div>'
        + '<div style="flex:1;min-width:80px"><label class="form-label">Año</label><select class="form-control" id="filtro-año-consulta" onchange="filtrarOrdenes()" style="padding:8px">'
        + [currentYear()-1,currentYear(),currentYear()+1].map(function(a){return '<option value="'+a+'"'+(a===currentYear()?' selected':'')+'>'+a+'</option>';}).join('')
        + '</select></div>';
      if(filterArea){var s=filterArea.querySelector('.search-box');if(s)filterArea.insertBefore(semDiv,s);}
    }
  },50);
  filtrarOrdenes();showScreen('screen-consulta');
}
function setFiltro(tipo,val,btn){filtrosConsulta[tipo]=val;const row=btn.closest('.filter-row');if(row)row.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));btn.classList.add('active');filtrarOrdenes();}
// ================================================================
// PM03
// ================================================================
function showPM03(){renderPM03();showScreen('screen-pm03');}
function renderPM03(){
  const cont=document.getElementById('pm03-content');
  const sw=currentWeek(),isAdmin=currentUser.rol==='admin';
  const misPlan=PM03_PLAN.filter(p=>p.semana===sw&&p.año===currentYear()&&(p.tecnicoId===currentUser.id||isAdmin));
  const todas=PM03_PLAN.filter(p=>p.semana===sw&&p.año===currentYear());
  cont.innerHTML=`<div class="kpi-grid"><div class="kpi-card" style="border-top:3px solid var(--mo)"><div class="kpi-num" style="color:var(--mo)">${todas.length}</div><div class="kpi-label">Sem ${sw} — Total</div></div><div class="kpi-card" style="border-top:3px solid var(--vd)"><div class="kpi-num" style="color:var(--vd)">${todas.filter(p=>p.estado==='cerrada').length}</div><div class="kpi-label">Ejecutadas</div></div></div>
  <div class="card">${misPlan.length===0?'<p style="color:var(--txt3);font-size:13px">Sin actividades asignadas esta semana.</p>':misPlan.map(p=>`<div class="ot-card pm03" onclick="showDetallePM03('${p.id}')"><div style="display:flex;justify-content:space-between"><span style="font-size:11px;color:var(--txt3);font-weight:700">${p.id}</span><span class="badge badge-${p.estado||'abierta'}">${p.estado||'abierta'}</span></div><div style="font-family:'Nunito',sans-serif;font-size:15px;font-weight:800;margin:2px 0 4px">${p.linea}</div><div style="font-size:12px;color:var(--txt2)">${p.componente} — ${p.actividad}</div>${p.horaInicio&&p.horaFin?`<div style="font-size:11px;color:var(--vd);margin-top:4px">⏱️ ${p.horaInicio} – ${p.horaFin}</div>`:''}${p.esInspeccion?`<div style="font-size:11px;color:var(--mo);margin-top:2px">✅ Inspección de turno</div>`:''}<div style="font-size:11px;color:var(--txt3);margin-top:4px">Sem ${p.semana} · ${p.tecnicoNombre||'Sin asignar'}</div></div>`).join('')}</div>
  ${isAdmin?`<button class="btn btn-outline mt8" onclick="showAdmin();setAdminTab('pm03carga',null)">⚙️ Gestionar Plan PM03</button>`:''}`;
}
function showDetallePM03(id){
  const p=PM03_PLAN.find(x=>x.id===id);if(!p)return;
  otCerrandoId=id;document.getElementById('detalle-topbar').textContent=p.id;detalleBackScreen='screen-pm03';
  const canClose=(currentUser.rol==='tecnico'||currentUser.rol==='admin')&&p.estado!=='cerrada';
  document.getElementById('detalle-content').innerHTML=`<div class="card"><div class="card-title">${p.esInspeccion?'✅ Inspección de Turno':'📅 '+p.linea}</div>${row('🔩 Componente',p.componente)}${row('🔧 Actividad',p.actividad)}${row('📅 Semana',p.semana+' / '+p.año)}${row('👤 Técnico',p.tecnicoNombre||'Sin asignar')}${row('📋 Estado',p.estado||'abierta')}${p.horaInicio?row('🕐 Inicio',p.horaInicio):''}${p.horaFin?row('🕐 Fin',p.horaFin):''}${p.horaInicio&&p.horaFin?row('⏱️ Tiempo',diffMin(p.horaInicio,p.horaFin)+' min'):''}</div>
  ${p.observacionesCierre?`<div class="card"><div class="card-title">✅ Cierre</div><p style="font-size:13px;color:var(--txt2)">${p.observacionesCierre}</p>${row('⏱️ Horas',p.horasCierre+' h')}${row('Por',p.cerradaPor)}</div>`:''}
  ${canClose?`<button class="btn btn-success" onclick="abrirCierrePM03('${id}')">✅ Marcar ejecutada</button>`:''}`;
  showScreen('screen-detalle');
}
function abrirCierrePM03(id){
  const p=PM03_PLAN.find(x=>x.id===id);if(!p)return;
  const hi=prompt('Hora de inicio (HH:MM):');if(!hi||!hi.match(/^\d{1,2}:\d{2}$/)){showAlert('Hora inválida','error');return;}
  const hf=prompt('Hora de fin (HH:MM):');if(!hf||!hf.match(/^\d{1,2}:\d{2}$/)){showAlert('Hora inválida','error');return;}
  const obs=prompt('Observaciones (opcional):');
  p.estado='cerrada';p.horaInicio=hi;p.horaFin=hf;p.horasCierre=parseFloat((diffMin(hi,hf)/60).toFixed(2));p.observacionesCierre=obs||'';p.cerradaTs=Date.now();p.cerradaPor=currentUser.nombre;
  saveDB('pm03_plan',PM03_PLAN);
  // Save to Supabase
  supaUpsert('pm03_plan',{id:p.id,linea:p.linea,componente:p.componente||null,actividad:p.actividad,area:p.area||null,semana:p.semana,anio:p.año||2026,tecnico_id:p.tecnicoId||null,tecnico_nombre:p.tecnicoNombre||null,estado:p.estado,fuente_excel:p.fuenteExcel||false,horas_cierre:p.horasCierre||0,observaciones_cierre:p.observacionesCierre||null,cerrada_ts:p.cerradaTs||null,cerrada_por:p.cerradaPor||null,generado_por:p.generadoPor||null,ts:p.ts||Date.now()}).catch(function(e){console.error('Error sync PM03:',e);showAlert('⚠️ Sin conexión - PM03 guardada localmente, se sincronizará al reconectar','warning');});
  showAlert('✅ PM03 cerrada y sincronizada');showDetallePM03(id);
}

// ================================================================
// INSPECCIONES CADA TURNO
// ================================================================
function showInspeccion(){
  const turnoActual=getTurno();
  const hoy=todayStr();
  // Buscar inspección activa (pausada) del técnico en turno actual
  const existente=INSPECCIONES.find(i=>i.tecnicoId===currentUser.id&&i.fecha===hoy&&i.turno===turnoActual&&i.estado!=='cerrada');
  if(existente){
    inspeccionActual=existente;
  } else {
    inspeccionActual={
      id:genID('INSP'),tecnicoId:currentUser.id,tecnicoNombre:currentUser.nombre,
      fecha:hoy,turno:turnoActual,
      momentoInspeccion:null,// 'inicio' or 'medio'
      estado:'en_progreso',
      puntos:CHECKLIST_PUNTOS.map(p=>({nombre:p,estado:null,hora:null,comentario:''})),
      tsInicio:Date.now(),tsUltimo:Date.now()
    };
  }
  renderInspeccion();showScreen('screen-inspeccion');
}

function renderInspeccion(){
  const cont=document.getElementById('inspeccion-content');
  const i=inspeccionActual;
  const verde=i.puntos.filter(p=>p.estado==='verde').length;
  const rojo=i.puntos.filter(p=>p.estado==='rojo').length;
  const noAplica=i.puntos.filter(p=>p.estado==='no_aplica').length;
  const total=i.puntos.length;
  const aplicables=total-noAplica;
  const pct=aplicables>0?Math.round(((verde+rojo)/aplicables)*100):100;

  cont.innerHTML=`
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div><div style="font-family:'Nunito',sans-serif;font-weight:800;font-size:15px">Turno ${i.turno} — ${i.fecha}</div>
        <div style="font-size:12px;color:var(--txt3)">${TURNOS.find(t=>t.id===i.turno)?.label||''}</div></div>
        <div style="text-align:right"><span class="badge" style="background:${pct===100?'var(--vd3)':'var(--am3)'};color:${pct===100?'var(--vd)':'var(--am)'}">${verde+rojo}/${total}</span></div>
      </div>
      ${!i.momentoInspeccion?`<div class="form-group"><label class="form-label">¿Es inspección de inicio o medio turno?</label>
        <div style="display:flex;gap:8px"><button class="btn btn-outline btn-sm" style="flex:1" onclick="setMomentoInsp('inicio')">🌅 Inicio de turno</button><button class="btn btn-outline btn-sm" style="flex:1" onclick="setMomentoInsp('medio')">⏰ Medio turno</button></div></div>`:
        `<div style="font-size:13px;font-weight:700;color:var(--mo);margin-bottom:6px">${i.momentoInspeccion==='inicio'?'🌅 Inicio de turno':'⏰ Medio turno'}</div>`}
      <div style="background:var(--gr3);border-radius:6px;height:8px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${pct===100?'var(--vd)':'var(--mo)'};border-radius:6px;transition:width .3s"></div></div>
      <div style="font-size:11px;color:var(--txt3);margin-top:4px">${pct}% completado · ${verde} ✅ verde · ${rojo} 🔴 rojo · ${noAplica} ⬛ no aplica</div>
    </div>
    ${i.puntos.map((p,idx)=>`
      <button class="chk-btn ${p.estado||''}" onclick="togglePunto(${idx})">
        <div style="flex:1;text-align:left">
          <div style="font-size:14px">${p.nombre}</div>
          ${p.hora?`<div style="font-size:11px;margin-top:3px;opacity:.8">⏱️ ${p.hora}${p.comentario?` — ${p.comentario.substring(0,40)}...`:''}</div>`:''}
        </div>
        <div class="chk-status ${p.estado||''}">${p.estado==='verde'?'✓':p.estado==='rojo'?'✗':'○'}</div>
      </button>`).join('')}
    <div style="height:16px"></div>`;
}

function setMomentoInsp(m){inspeccionActual.momentoInspeccion=m;renderInspeccion();}

function togglePunto(idx){
  if(!inspeccionActual.momentoInspeccion){showAlert('Selecciona inicio o medio turno primero','error');return;}
  const p=inspeccionActual.puntos[idx];
  const estado=p.estado;
  if(!estado||estado==='no_aplica'){
    // Null/no_aplica → verde
    p.estado='verde';p.hora=fmtTime(Date.now());p.comentario='';
    renderInspeccion();
  } else if(estado==='verde'){
    // verde → rojo (pedir comentario)
    puntoRojoIdx=idx;
    document.getElementById('modal-punto-nombre').textContent=p.descripcion||p.nombre||'';
    document.getElementById('modal-comentario-input').value='';
    showModal('modal-comentario-rojo');
  } else if(estado==='rojo'){
    // rojo → no_aplica
    p.estado='no_aplica';p.hora=fmtTime(Date.now());p.comentario='';
    renderInspeccion();
  }
}
function cancelarComentarioRojo(){cerrarModal('modal-comentario-rojo');puntoRojoIdx=-1;}
function confirmarComentarioRojo(){
  const obs=document.getElementById('modal-comentario-input').value.trim();
  if(!obs){showAlert('Describe el problema','error');return;}
  const p=inspeccionActual.puntos[puntoRojoIdx];
  p.estado='rojo';p.hora=fmtTime(Date.now());p.comentario=obs;
  cerrarModal('modal-comentario-rojo');puntoRojoIdx=-1;renderInspeccion();
}

function marcarNoAplica(){
  if(puntoRojoIdx<0)return;
  const p=inspeccionActual.puntos[puntoRojoIdx];
  p.estado='no_aplica';p.hora=fmtTime(Date.now());p.comentario='';
  cerrarModal('modal-comentario-rojo');
  puntoRojoIdx=-1;
  renderInspeccion();
}

function pausarInspeccion(){
  inspeccionActual.estado='pausada';inspeccionActual.tsUltimo=Date.now();
  const idx=INSPECCIONES.findIndex(i=>i.id===inspeccionActual.id);
  if(idx>=0)INSPECCIONES[idx]=inspeccionActual;else INSPECCIONES.push(inspeccionActual);
  saveDB('inspecciones',INSPECCIONES);showAlert('⏸️ Inspección pausada — puedes continuarla después','info');goMenu();
}

function guardarInspeccion(){
  if(!inspeccionActual.momentoInspeccion){showAlert('Selecciona inicio o medio turno','error');return;}
  const incompletos=inspeccionActual.puntos.filter(p=>!p.estado).length;
  if(incompletos>0){if(!confirm(`Hay ${incompletos} punto(s) sin revisar. ¿Deseas guardar de todas formas?`))return;}
  inspeccionActual.estado='cerrada';inspeccionActual.tsCierre=Date.now();inspeccionActual.semana=currentWeek();inspeccionActual.año=currentYear();inspeccionActual.tecnico=currentUser.nombre;inspeccionActual.tecnicoNombre=currentUser.nombre;inspeccionActual.tecnicoId=currentUser.id;inspeccionActual.levantadoPor=currentUser.nombre;
  inspeccionActual.tsFin=fmtTime(Date.now());
  const idx=INSPECCIONES.findIndex(i=>i.id===inspeccionActual.id);
  if(idx>=0)INSPECCIONES[idx]=inspeccionActual;else INSPECCIONES.push(inspeccionActual);
  saveDB('inspecciones',INSPECCIONES);supaUpsert('inspecciones',{
    id:inspeccionActual.id,
    tipo:inspeccionActual.tipo||'inspeccion',
    area:inspeccionActual.area||'',
    turno:inspeccionActual.turno||'',
    momento:inspeccionActual.momentoInspeccion||'',
    estado:inspeccionActual.estado||'cerrada',
    semana:inspeccionActual.semana||currentWeek(),
    anio:inspeccionActual.año||currentYear(),
    tecnico:inspeccionActual.tecnico||currentUser.nombre,
    tecnico_id:inspeccionActual.tecnicoId||currentUser.id,
    levantado_por:currentUser.nombre,
    ts:inspeccionActual.tsCierre||Date.now(),
    puntos_total:inspeccionActual.puntos?inspeccionActual.puntos.length:0,
    puntos_verde:inspeccionActual.puntos?inspeccionActual.puntos.filter(function(p){return p.estado==='verde';}).length:0,
    puntos_rojo:inspeccionActual.puntos?inspeccionActual.puntos.filter(function(p){return p.estado==='rojo';}).length:0
  }).catch(function(){});
  // Registrar como PM03
  const pmId=genID('PM03');
  const verde=inspeccionActual.puntos.filter(p=>p.estado==='verde').length;
  const rojo=inspeccionActual.puntos.filter(p=>p.estado==='rojo').length;
  PM03_PLAN.push({
    id:pmId,linea:'Servicios Industriales',componente:'Checklist turno',
    actividad:`Inspección ${inspeccionActual.momentoInspeccion==='inicio'?'inicio':'medio'} turno ${inspeccionActual.turno} — ${verde} OK / ${rojo} en rojo`,
    semana:(function(){var f=document.getElementById('pm-fecha-orden');if(f&&f.value){return getWeekNumber(new Date(f.value));}return currentWeek();})(),año:(function(){var f=document.getElementById('pm-fecha-orden');if(f&&f.value){return new Date(f.value).getFullYear();}return currentYear();})(),tecnicoId:currentUser.id,tecnicoNombre:currentUser.nombre,
    estado:'cerrada',esInspeccion:true,inspeccionId:inspeccionActual.id,
    horaInicio:fmtTime(inspeccionActual.tsInicio),horaFin:inspeccionActual.tsFin,
    horasCierre:parseFloat(((inspeccionActual.tsCierre-inspeccionActual.tsInicio)/3600000).toFixed(2)),
    cerradaTs:Date.now(),cerradaPor:currentUser.nombre,ts:Date.now(),
    observacionesCierre:`${verde}/${inspeccionActual.puntos.length} puntos OK. ${rojo} puntos en rojo.`
  });
  saveDB('pm03_plan',PM03_PLAN);
  // ── Guardar también en ORDENES para aparecer en Consultar OT ──
  var verde2=inspeccionActual.puntos?inspeccionActual.puntos.filter(function(p){return p.estado==='verde';}).length:0;
  var rojo2=inspeccionActual.puntos?inspeccionActual.puntos.filter(function(p){return p.estado==='rojo';}).length:0;
  var na2=inspeccionActual.puntos?inspeccionActual.puntos.filter(function(p){return p.estado==='no_aplica';}).length:0;
  var tot2=inspeccionActual.puntos?inspeccionActual.puntos.length:0;
  var pct2=(tot2-na2)>0?Math.round((verde2/(tot2-na2))*100):100;
  var inspOT={
    id:genID('PM03'),
    tipo:'PM03',
    area:inspeccionActual.area||'servicios',
    linea:'Inspección Turno '+(inspeccionActual.turno||''),
    componente:inspeccionActual.tipo||'Inspección de Turno',
    prioridad:'B',
    tipoAnormalidad:'Inspección',
    detalle:'Turno '+(inspeccionActual.turno||'')+' — '+verde2+' ✅ / '+rojo2+' 🔴 / '+na2+' ⬛ — '+pct2+'% cumplimiento',
    foto:null,
    tecnicoAsignado:currentUser.id,
    tecnicoNombre:currentUser.nombre,
    levantadoPor:currentUser.nombre,
    levantadoId:currentUser.id,
    ts:Date.now(),
    horaCreacion:new Date().toISOString(),
    estado:'cerrada', // Inspecciones siempre cerradas
    semana:currentWeek(),
    año:currentYear(),
    colorOT:rojo2>0?'rojo':'azul',
    observacionesCierre:'Inspeccion: '+verde2+' verde, '+rojo2+' rojo, '+na2+' no aplica. '+pct2+'% cumplimiento.',
    horasCierre:parseFloat(((inspeccionActual.tsCierre-inspeccionActual.tsInicio)/3600000).toFixed(2))||0,
    cerradaTs:rojo2===0?Date.now():null,
    cerradaPor:rojo2===0?currentUser.nombre:null,
    esInspeccion:true,
    inspeccionId:inspeccionActual.id||null
  };
  ORDENES.push(inspOT);
  saveDB('ordenes',ORDENES);
  saveOrdenSupa(inspOT);
  showAlert('✅ Inspección guardada como PM03');goMenu();
}

// ================================================================
// GESTIÓN DE LÍNEA (ADMIN)
// ================================================================
function showGestionLinea(){if(currentUser.rol!=='admin'){showAlert('Sin permisos','error');return;}renderGestionLinea();showScreen('screen-gestion');}

function aplicarGestion(){
  const fecha=document.getElementById('gl-fecha').value;
  const turno=document.getElementById('gl-turno').value;
  const mes=parseInt(document.getElementById('gl-mes').value)||0;
  const año=parseInt(document.getElementById('gl-año').value)||currentYear();
  const tecId=document.getElementById('gl-tecnico').value;
  const linea=document.getElementById('gl-linea').value;

  let ots=ORDENES.filter(o=>o.estado==='cerrada'&&(o.horaLlamado||o.horaInicio));
  if(fecha)ots=ots.filter(o=>o.fecha===fecha||(o.ts&&fmtDate(o.ts).includes(fecha.split('-')[2])));
  if(turno)ots=ots.filter(o=>o.turno===turno);
  if(mes)ots=ots.filter(o=>{const d=new Date(o.ts);return d.getMonth()+1===mes&&d.getFullYear()===año;});
  if(tecId)ots=ots.filter(o=>o.tecnicoAsignado===tecId);
  if(linea)ots=ots.filter(o=>o.linea===linea);
  ots=ots.sort((a,b)=>b.ts-a.ts);

  const cont=document.getElementById('gestion-resultados');
  if(!ots.length){cont.innerHTML=`<div class="card text-center" style="padding:32px"><div style="font-size:40px">📭</div><div style="font-weight:700;margin-top:8px">Sin registros con estos filtros</div></div>`;return;}

  // Carga por técnico
  const cargaPorTec={};ots.forEach(o=>{const n=o.tecnicoNombre||'Sin asignar';if(!cargaPorTec[n])cargaPorTec[n]=0;cargaPorTec[n]++;});
  const totalOts=ots.length;
  const mttrProm=ots.filter(o=>o.mttr!=null).reduce((s,o,i,a)=>s+o.mttr/(a.length),0)||0;
  const trProm=ots.filter(o=>o.tiempoRespuesta!=null).reduce((s,o,i,a)=>s+o.tiempoRespuesta/(a.length),0)||0;

  cont.innerHTML=`
    <div class="card"><div class="card-title mb8">📊 Resumen del período</div>
      <div class="kpi-grid" style="margin-bottom:8px">
        <div class="kpi-card" style="border-top:3px solid var(--mo)"><div class="kpi-num" style="color:var(--mo)">${totalOts}</div><div class="kpi-label">Atenciones</div></div>
        <div class="kpi-card" style="border-top:3px solid var(--az)"><div class="kpi-num" style="color:var(--az)">${Math.round(mttrProm)}</div><div class="kpi-label">MTTR prom (min)</div></div>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--txt2);margin-bottom:8px">Carga por técnico:</div>
      ${Object.entries(cargaPorTec).sort((a,b)=>b[1]-a[1]).map(([nom,cnt])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gr4);font-size:13px"><span>${nom}</span><span class="badge badge-pm01">${cnt} atenciones</span></div>`).join('')}
    </div>
    <div class="card"><div class="card-title mb8">📋 Detalle de atenciones (${ots.length})</div>
      <div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Técnico</th><th>Línea</th><th>Turno</th><th>MTTR</th><th>T.Resp</th></tr></thead><tbody>
        ${ots.map(o=>`<tr><td>${fmtDate(o.ts)}</td><td>${o.tecnicoNombre||'—'}</td><td>${o.linea||'—'}</td><td>${o.turno?'T'+o.turno:'—'}</td><td>${o.mttr!=null?o.mttr+' min':'—'}</td><td>${o.tiempoRespuesta!=null?o.tiempoRespuesta+' min':'—'}</td></tr>`).join('')}
      </tbody></table></div>
    </div>
    ${ots.filter(o=>o.liderPM04).length?`<div class="card"><div class="card-title mb8">🤝 PM04 — Líderes/Oficiales que más piden apoyo</div>
      ${(()=>{const m={};ots.filter(o=>o.liderPM04).forEach(o=>{if(!m[o.liderPM04])m[o.liderPM04]=0;m[o.liderPM04]++;});return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([nom,cnt])=>`<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gr4);font-size:13px"><span>${nom}</span><span class="badge badge-pm04">${cnt} veces</span></div>`).join('');})()}</div>`:''}`;
}

// ================================================================
// KPIs
// ================================================================
function showKPIs(){
  showScreen('screen-kpis');
  // Use setTimeout to ensure DOM is ready
  setTimeout(function(){
    initKPISelectors();
    reloadKPIs();
  }, 50);
}

function renderKPIs(modo,kpiSem,kpiAño){
  var cont=document.getElementById('kpis-content');
  if(!cont)return;
  var sw=typeof kpiSem==='number'?kpiSem:currentWeek();
  var ano=kpiAño||currentYear();
  var todoElAnio=(kpiSem===0||kpiSem===''||kpiSem===null||kpiSem===undefined);
  var todoElAño=(kpiAño===0||kpiAño==='0'||kpiAño===null||kpiAño===undefined);
  if(todoElAño){ano=currentYear();} // default to current year if all

  function byPeriod(arr){
    return arr.filter(function(o){
      var oA=o.año||o.anio||new Date(o.ts||0).getFullYear();
      if(todoElAnio)return oA===ano;
      return o.semana===sw&&oA===ano;
    });
  }

  var otsAll=byPeriod(ORDENES);
  var pm02All=otsAll.filter(function(o){return o.tipo==='PM02';});
  var pm02Az=pm02All.filter(function(o){return o.colorOT==='azul';});
  var pm02Ro=pm02All.filter(function(o){return o.colorOT==='rojo';});
  var pm03List=byPeriod(PM03_PLAN).filter(function(p){return !p.esInspeccion;});
  var pm03Eje=pm03List.filter(function(p){return p.estado==='cerrada';}).length;
  var pm03Total=pm03List.length;
  var hoy=new Date();
  var diaSem=hoy.getDay()===0?5:Math.min(hoy.getDay()-1,5);
  var dias=['Lun','Mar','Mie','Jue','Vie','Sab'];
  var metaHoy=pm03Total>0?Math.round((pm03Total/6)*(diaSem+1)):0;
  var pctAvance=metaHoy>0?Math.min(100,Math.round((pm03Eje/metaHoy)*100)):0;
  var pctSem=pm03Total>0?Math.round((pm03Eje/pm03Total)*100):0;
  var colAv=pctAvance>=90?'var(--vd)':pctAvance>=50?'var(--am2)':'var(--rj)';
  var pm02Abi=pm02All.filter(function(o){return o.estado!=='cerrada';}).length;
  var pm02Cer=pm02All.filter(function(o){return o.estado==='cerrada';}).length;
  var pm02AzAbi=pm02Az.filter(function(o){return o.estado!=='cerrada';}).length;
  var pm02AzCer=pm02Az.filter(function(o){return o.estado==='cerrada';}).length;
  var pm02RoAbi=pm02Ro.filter(function(o){return o.estado!=='cerrada';}).length;
  var pm02RoCer=pm02Ro.filter(function(o){return o.estado==='cerrada';}).length;
  var pm02PctCie=pm02All.length?Math.round((pm02Cer/pm02All.length)*100):0;
  // MTTR: solo PM01 cerradas (atención a línea y PM01 wizard)
  // Fuente 1: OTs con campo mttr (registradas por botón Atención a Línea como PM01)
  // Fuente 2: OTs tipo PM01 cerradas con horaInicio y horaFin de trabajo registradas
  var mttrVals=otsAll.filter(function(o){
    if(o.tipo!=='PM01') return false;
    if(o.estado!=='cerrada') return false;
    // Tiene mttr calculado directamente (Atención a Línea)
    if(o.mttr!=null&&o.mttr>0) return true;
    // Tiene hora inicio y fin de trabajo registradas (PM01 wizard con tiempo)
    if(o.horaInicioTrabajo&&o.horaFinTrabajo) return true;
    return false;
  }).map(function(o){
    if(o.mttr!=null&&o.mttr>0) return o.mttr;
    // Calcular de horaInicioTrabajo / horaFinTrabajo (formato HH:MM)
    var parts1=(o.horaInicioTrabajo||'').split(':').map(Number);
    var parts2=(o.horaFinTrabajo||'').split(':').map(Number);
    if(parts1.length===2&&parts2.length===2){
      var mins=(parts2[0]*60+parts2[1])-(parts1[0]*60+parts1[1]);
      if(mins<0) mins+=1440;
      return mins;
    }
    return null;
  }).filter(function(v){return v!==null&&v>0&&v<1440;});
  var mttrProm=mttrVals.length?Math.round(mttrVals.reduce(function(a,b){return a+b;},0)/mttrVals.length):0;
  var mttrObj=loadDB('mttr_objetivo',45);

  // Tiempo de Atención: SOLO de los 3 botones de Atención a Línea (esAtencion=true)
  var atenVals=otsAll.filter(function(o){
    return (o.esAtencion||o.horaLlamado)&&(o.tiempoRespuesta||(o.horaLlamado&&o.horaInicio));
  }).map(function(o){
    if(o.tiempoRespuesta&&o.tiempoRespuesta>0) return o.tiempoRespuesta;
    var diff=Number(o.horaInicio)-Number(o.horaLlamado);
    return diff>0?Math.round(diff/60000):null;
  }).filter(function(v){return v!==null&&v>0&&v<480;});
  var atenTotal=otsAll.filter(function(o){return o.tipo==='PM01'||o.tipo==='PM04';}).length;
  var atenProm=atenVals.length?Math.round(atenVals.reduce(function(a,b){return a+b;},0)/atenVals.length):null;
  var tecs=(USERS||[]).filter(function(u){return u.rol==='tecnico';});
  var pm02A=pm02All.filter(function(o){return o.prioridad==='A';});
  var pm02B=pm02All.filter(function(o){return o.prioridad==='B';});
  var pm02C=pm02All.filter(function(o){return o.prioridad==='C';});
  var periodLabel=todoElAnio?('Año '+ano):('Semana '+sw+'/'+ano);

  if(modo==='lider'){
    cont.innerHTML='<p style="font-size:13px;font-weight:700;color:var(--mo);margin-bottom:12px">KPI Anormalidades — '+periodLabel+'</p>'
      +'<div class="kpi-grid">'
      +'<div class="kpi-card" style="border-top:4px solid var(--az)"><div class="kpi-num" style="color:var(--az)">'+pm02Az.length+'</div><div class="kpi-label">Azules</div><div style="font-size:11px;color:var(--vd)">'+pm02AzCer+' cer.</div><div style="font-size:11px;color:var(--am2)">'+pm02AzAbi+' ab.</div></div>'
      +'<div class="kpi-card" style="border-top:4px solid var(--rj)"><div class="kpi-num" style="color:var(--rj)">'+pm02Ro.length+'</div><div class="kpi-label">Rojas</div><div style="font-size:11px;color:var(--vd)">'+pm02RoCer+' cer.</div><div style="font-size:11px;color:var(--am2)">'+pm02RoAbi+' ab.</div></div>'
      +'</div>';
    return;
  }

  var h='<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.7);background:var(--mo);padding:6px 14px;border-radius:8px;display:inline-block;margin-bottom:14px">'+periodLabel+'</div>';

  // KPI 1: PM03
  var colPm3=pctSem>=80?'var(--vd)':pctSem>=50?'var(--am2)':'var(--rj)';
  h+='<div class="chart-wrap"><div class="chart-title">1. Mantenimiento Planeado (PM03)</div>'
    +'<div class="kpi-grid mb8">'
    +'<div class="kpi-card" style="border-top:3px solid var(--az)"><div class="kpi-num" style="color:var(--az)">'+pm03Total+'</div><div class="kpi-label">Planeadas</div></div>'
    +'<div class="kpi-card" style="border-top:3px solid var(--vd)"><div class="kpi-num" style="color:var(--vd)">'+pm03Eje+'</div><div class="kpi-label">Ejecutadas</div></div>'
    +'</div>';
  if(!todoElAnio){
    h+='<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">'
      +'<span style="font-weight:700">Meta hoy ('+dias[diaSem]+'): '+metaHoy+'</span>'
      +'<span style="font-weight:800;color:'+colAv+'">'+pm03Eje+'/'+metaHoy+' ('+pctAvance+'%)</span></div>'
      +'<div style="background:var(--gr3);border-radius:8px;height:18px;overflow:hidden;margin-bottom:8px">'
      +'<div style="width:'+pctAvance+'%;height:100%;background:'+colAv+';border-radius:8px"></div></div>';
  }
  h+='<div style="text-align:center;font-size:28px;font-weight:800;color:'+colPm3+'">'+pctSem+'% semana</div></div>';

  // KPI 2: PM02
  var colCie=pm02PctCie>=80?'var(--vd)':pm02PctCie>=50?'var(--am2)':'var(--rj)';
  var pm02SC=pm02All.filter(function(o){return !o.colorOT||o.colorOT==='';});
  h+='<div class="chart-wrap"><div class="chart-title">2. PM02 / Anormalidades — '+periodLabel+'</div>'
    +'<div class="kpi-grid mb8">'
    +'<div class="kpi-card" style="border-top:3px solid var(--mo)"><div class="kpi-num" style="color:var(--mo)">'+pm02All.length+'</div><div class="kpi-label">Generadas</div></div>'
    +'<div class="kpi-card" style="border-top:3px solid var(--am2)"><div class="kpi-num" style="color:var(--am2)">'+pm02Abi+'</div><div class="kpi-label">Abiertas</div></div>'
    +'<div class="kpi-card" style="border-top:3px solid var(--vd)"><div class="kpi-num" style="color:var(--vd)">'+pm02Cer+'</div><div class="kpi-label">Cerradas</div></div>'
    +'</div>'
    +'<div class="kpi-grid mb8">'
    +'<div class="kpi-card" style="border-top:3px solid var(--az)"><div class="kpi-num" style="color:var(--az)">'+pm02Az.length+'</div><div class="kpi-label">Azules</div><div style="font-size:10px;color:var(--vd)">'+pm02AzCer+' cer.</div><div style="font-size:10px;color:var(--am2)">'+pm02AzAbi+' ab.</div></div>'
    +'<div class="kpi-card" style="border-top:3px solid var(--rj)"><div class="kpi-num" style="color:var(--rj)">'+pm02Ro.length+'</div><div class="kpi-label">Rojas</div><div style="font-size:10px;color:var(--vd)">'+pm02RoCer+' cer.</div><div style="font-size:10px;color:var(--am2)">'+pm02RoAbi+' ab.</div></div>'
    +(pm02SC.length?'<div class="kpi-card" style="border-top:3px solid var(--gr4)"><div class="kpi-num" style="color:var(--txt3)">'+pm02SC.length+'</div><div class="kpi-label">Sin color</div><div style="font-size:10px;color:var(--txt3)">Pendiente clasificar</div></div>':'')+'</div>'
    +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>% Cierre</span><span style="font-weight:800;color:'+colCie+'">'+pm02PctCie+'%</span></div>'
    +'<div style="background:var(--gr3);border-radius:8px;height:12px;overflow:hidden"><div style="width:'+pm02PctCie+'%;height:100%;background:'+colCie+';border-radius:8px"></div></div>'
    +'</div>';

  // KPI 3: MTTR
  var colMT=mttrProm<=mttrObj?'var(--vd)':'var(--rj)';
  h+='<div class="chart-wrap"><div class="chart-title">3. MTTR — Tiempo Medio de Reparacion</div>'
    +'<div style="text-align:center;font-size:40px;font-weight:800;color:'+colMT+'">'+mttrProm+' <span style="font-size:16px">min</span></div>'
    +'<div style="text-align:center;font-size:12px;font-weight:700;color:'+colMT+'">'+(mttrProm<=mttrObj?'En objetivo':'Sobre objetivo')+' (obj: '+mttrObj+' min)</div>'
    +'</div>';

  // KPI 4: Tiempo atencion — con desglose por técnico
  var atenPorTec4=[];
  tecs.forEach(function(t){
    var n=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&(o.esAtencion||o.horaLlamado);}).length;
    if(n>0) atenPorTec4.push({nombre:t.nombre.split(' ')[0],n:n});
  });
  var atenDetalle='';
  if(atenPorTec4.length){
    atenDetalle='<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px">';
    atenPorTec4.forEach(function(x){
      atenDetalle+='<div style="background:var(--mo3);border-radius:8px;padding:6px 10px;text-align:center">'
        +'<div style="font-size:16px;font-weight:800;color:var(--mo)">'+x.n+'</div>'
        +'<div style="font-size:10px;color:var(--txt2)">'+x.nombre+'</div></div>';
    });
    atenDetalle+='</div>';
  }
  h+='<div class="chart-wrap"><div class="chart-title">4. Tiempo Medio de Atencion (Llamado a Inicio)</div>'
    +(atenProm!==null
      ?'<div style="text-align:center;font-size:40px;font-weight:800;color:var(--mo)">'+atenProm+' <span style="font-size:16px">min</span></div><div style="text-align:center;font-size:12px;color:var(--txt2)">'+atenVals.length+' atenciones</div>'+atenDetalle
      :'<div style="text-align:center;padding:20px;color:var(--txt3)">Sin atenciones registradas</div>'
    )+'</div>';

  // KPI 5: MTBF
  h+='<div class="chart-wrap"><div class="chart-title">5. MTBF — Tiempo Medio Antes de Falla</div><canvas id="chart-mtbf" height="160"></canvas></div>';

  // KPI 6: Horas por tecnico
  h+='<div class="chart-wrap"><div class="chart-title">6. Horas Invertidas por Tecnico</div>'
    +'<div class="table-wrap"><table><thead><tr><th>Tecnico</th><th>PM01</th><th>PM02</th><th>PM03</th><th>PM04</th><th>Total</th></tr></thead><tbody>';
  tecs.forEach(function(t){
    var h01=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&(o.tipo==='PM01'||o.tipo==='PM04')&&o.estado==='cerrada';}).reduce(function(s,o){return s+(o.horasCierre||0);},0);
    var h04=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&o.tipo==='PM04'&&o.estado==='cerrada';}).reduce(function(s,o){return s+(o.horasCierre||0);},0);
    h01=h01-h04; // Subtract PM04 already counted separately
    var h02=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&o.tipo==='PM02'&&o.estado==='cerrada';}).reduce(function(s,o){return s+(o.horasCierre||0);},0);
    var h03=byPeriod(PM03_PLAN).filter(function(p){return p.tecnicoId===t.id&&p.estado==='cerrada';}).reduce(function(s,p){return s+(p.horasCierre||0);},0);
    var h04=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&o.tipo==='PM04'&&o.estado==='cerrada';}).reduce(function(s,o){return s+(o.horasCierre||0);},0);
    var tot=h01+h02+h03+h04;
    var n01=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&o.tipo==='PM01'&&o.estado==='cerrada';}).length;
    var n02=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&o.tipo==='PM02'&&o.estado==='cerrada';}).length;
    var n04=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&o.tipo==='PM04'&&o.estado==='cerrada';}).length;
    h+='<tr><td style="font-size:12px;font-weight:700">'+t.nombre.split(' ')[0]+'</td><td style="text-align:center;font-size:12px">'+h01.toFixed(1)+'h<br><span style="font-size:9px;color:var(--txt3)">'+n01+' OTs</span></td><td style="text-align:center;font-size:12px">'+h02.toFixed(1)+'h<br><span style="font-size:9px;color:var(--txt3)">'+n02+' OTs</span></td><td style="text-align:center;font-size:12px">'+h03.toFixed(1)+'h</td><td style="text-align:center;font-size:12px">'+h04.toFixed(1)+'h<br><span style="font-size:9px;color:var(--txt3)">'+n04+' OTs</span></td><td style="font-weight:800;color:var(--mo);text-align:center">'+tot.toFixed(1)+'h</td></tr>';
  });
  h+='</tbody></table></div></div>';

  // KPI 7: Comparativo 8 semanas
  h+='<div class="chart-wrap"><div class="chart-title">7. Comparativo Ultimas 8 Semanas</div><canvas id="chart-comp8" height="160"></canvas></div>';

  // KPI 8: Azul vs Rojo
  h+='<div class="chart-wrap"><div class="chart-title">8. Anormalidades Azul vs Rojo</div>'
    +'<div class="kpi-grid">'
    +'<div class="kpi-card" style="border-top:4px solid var(--az)"><div class="kpi-num" style="color:var(--az)">'+pm02Az.length+'</div><div class="kpi-label">Azules</div><div style="font-size:10px;color:var(--vd)">'+pm02AzCer+' cer.</div><div style="font-size:10px;color:var(--am2)">'+pm02AzAbi+' ab.</div></div>'
    +'<div class="kpi-card" style="border-top:4px solid var(--rj)"><div class="kpi-num" style="color:var(--rj)">'+pm02Ro.length+'</div><div class="kpi-label">Rojas</div><div style="font-size:10px;color:var(--vd)">'+pm02RoCer+' cer.</div><div style="font-size:10px;color:var(--am2)">'+pm02RoAbi+' ab.</div></div>'
    +'</div>'
    +'<canvas id="chart-azul-rojo" height="130" style="max-height:130px"></canvas></div>';

  // KPI 9: Anormalidades por prioridad
  h+='<div class="chart-wrap"><div class="chart-title">9. Anormalidades por Prioridad</div>'
    +'<div class="kpi-grid">'
    +'<div class="kpi-card" style="border-left:4px solid var(--rj)"><div class="kpi-num" style="color:var(--rj)">'+pm02A.length+'</div><div class="kpi-label">Prio A</div><div style="font-size:10px;color:var(--vd)">'+pm02A.filter(function(o){return o.estado==='cerrada';}).length+' cer.</div><div style="font-size:10px;color:var(--am2)">'+pm02A.filter(function(o){return o.estado!=='cerrada';}).length+' ab.</div></div>'
    +'<div class="kpi-card" style="border-left:4px solid var(--am2)"><div class="kpi-num" style="color:var(--am2)">'+pm02B.length+'</div><div class="kpi-label">Prio B</div><div style="font-size:10px;color:var(--vd)">'+pm02B.filter(function(o){return o.estado==='cerrada';}).length+' cer.</div><div style="font-size:10px;color:var(--am2)">'+pm02B.filter(function(o){return o.estado!=='cerrada';}).length+' ab.</div></div>'
    +'<div class="kpi-card" style="border-left:4px solid var(--vd)"><div class="kpi-num" style="color:var(--vd)">'+pm02C.length+'</div><div class="kpi-label">Prio C</div><div style="font-size:10px;color:var(--vd)">'+pm02C.filter(function(o){return o.estado==='cerrada';}).length+' cer.</div><div style="font-size:10px;color:var(--am2)">'+pm02C.filter(function(o){return o.estado!=='cerrada';}).length+' ab.</div></div>'
    +'</div></div>';

  // KPI 10: Atenciones por tecnico
  h+='<div class="chart-wrap"><div class="chart-title">Atenciones a Linea por Tecnico</div><div id="kpi-atenciones-list"></div></div>';

  // KPI 11: Inspecciones
  h+='<div class="chart-wrap"><div class="chart-title">Inspecciones de Turno</div><div id="kpi-insp-list"></div></div>';

  // KPI 12: Gasto
  h+='<div class="chart-wrap"><div class="chart-title">Gasto de Mantenimiento</div><canvas id="chart-gasto" height="160"></canvas><div id="kpi-gasto-resumen" style="margin-top:12px"></div></div>';

  cont.innerHTML=h;

  setTimeout(function(){
    // Azul vs rojo
    var elAR=document.getElementById('chart-azul-rojo');
    if(elAR&&window.Chart)new Chart(elAR,{type:'doughnut',data:{labels:['Azules','Rojas'],datasets:[{data:[pm02Az.length||0,pm02Ro.length||0],backgroundColor:['#1565C0','#C62828']}]},options:{plugins:{legend:{position:'bottom'}},cutout:'60%'}});

    // MTBF
    renderChartMTBF();

    // Comparativo 8 sem
    var elC=document.getElementById('chart-comp8');
    if(elC&&window.Chart){
      var sems=getUltimas8Semanas();
      new Chart(elC,{type:'bar',data:{labels:sems.map(function(s){return 'S'+s.sem;}),datasets:[
        {label:'PM01',data:sems.map(function(s){return ORDENES.filter(function(o){return o.tipo==='PM01'&&o.semana===s.sem;}).length;}),backgroundColor:'#C62828'},
        {label:'PM02',data:sems.map(function(s){return ORDENES.filter(function(o){return o.tipo==='PM02'&&o.semana===s.sem;}).length;}),backgroundColor:'#F57C00'},
        {label:'PM03',data:sems.map(function(s){return PM03_PLAN.filter(function(p){return p.semana===s.sem&&!p.esInspeccion;}).length;}),backgroundColor:'#1565C0'}
      ]},options:{plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}});
    }

    // Atenciones
    var atEl=document.getElementById('kpi-atenciones-list');
    if(atEl){
      var atH='<div class="kpi-grid">';
      tecs.forEach(function(t){
        var n=otsAll.filter(function(o){return o.tecnicoAsignado===t.id&&(o.esAtencion||o.tipo==='PM01'||o.tipo==='PM04');}).length;
        atH+='<div class="kpi-card"><div class="kpi-num" style="color:var(--mo)">'+n+'</div><div class="kpi-label" style="font-size:10px">'+t.nombre.split(' ')[0]+'</div></div>';
      });
      atEl.innerHTML=atH+'</div>';
    }

    // Inspecciones por tecnico — con meta programada y botón detalle
    var inEl=document.getElementById('kpi-insp-list');
    if(inEl){
      // Meta semanal fija por técnico
      var INSP_META={
        'César Arreola':12,'Angel Muratalla':12,'Ángel Muratalla':12,
        'Marco Díaz':12,'Anthon Chávez':12
      };
      // Para la meta de Anthon son 4/semana; ajustar
      INSP_META['Anthon Chávez']=4;

      var inspF=INSPECCIONES.filter(function(i){
        var iAno=i.año||i.anio||new Date(i.ts||i.tsCierre||0).getFullYear();
        var iSem=i.semana||0;
        if(!iSem&&i.tsCierre){var d=new Date(i.tsCierre);iSem=getWeekNumber(d);}
        if(todoElAnio) return iAno===ano;
        return iSem===sw;
      });

      // También buscar en ORDENES las inspecciones (esInspeccion=true)
      var inspOTs=otsAll.filter(function(o){return o.esInspeccion;});

      // Contar por técnico usando INSPECCIONES
      var porTec={};
      inspF.forEach(function(i){
        var n=i.tecnico||i.tecnicoNombre||i.levantadoPor||'N/A';
        porTec[n]=(porTec[n]||0)+1;
      });
      // Complementar con OTs de inspección si INSPECCIONES está vacío
      if(!inspF.length){
        inspOTs.forEach(function(o){
          var n=o.tecnicoNombre||'N/A';
          porTec[n]=(porTec[n]||0)+1;
        });
      }

      var totalReal=inspF.length||inspOTs.length;
      var totalMeta=todoElAnio?0:Object.values(INSP_META).reduce(function(s,v){return s+v;},0);
      var pctGlobal=totalMeta>0?Math.min(100,Math.round((totalReal/totalMeta)*100)):0;
      var colG=pctGlobal>=80?'var(--vd)':pctGlobal>=50?'var(--am2)':'var(--rj)';

      var iH='';
      // Barra global
      if(!todoElAnio){
        iH+='<div style="margin-bottom:10px">'
          +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">'
          +'<span style="font-weight:700">Total semana</span>'
          +'<span style="font-weight:800;color:'+colG+'">'+totalReal+'/'+totalMeta+' ('+pctGlobal+'%)</span></div>'
          +'<div style="background:var(--gr3);border-radius:6px;height:12px;overflow:hidden">'
          +'<div style="width:'+pctGlobal+'%;height:100%;background:'+colG+';border-radius:6px"></div></div></div>';
      }

      // Por técnico con meta
      iH+='<div style="display:flex;flex-direction:column;gap:8px">';
      var tecsMeta=['César Arreola','Ángel Muratalla','Marco Díaz','Anthon Chávez'];
      tecsMeta.forEach(function(nombre){
        var meta=INSP_META[nombre]||0;
        var real=porTec[nombre]||porTec[nombre.replace('Á','A')]||0;
        // Buscar variaciones del nombre
        Object.keys(porTec).forEach(function(k){
          if(k.toLowerCase().indexOf(nombre.split(' ')[0].toLowerCase())>=0) real=Math.max(real,porTec[k]);
        });
        if(todoElAnio){ if(real===0) return; }
        var pct=meta>0?Math.min(100,Math.round((real/meta)*100)):0;
        var col=pct>=80?'var(--vd)':pct>=50?'var(--am2)':'var(--rj)';
        iH+='<div style="background:#fff;border-radius:8px;padding:8px 10px;border-left:3px solid '+col+'">'
          +'<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">'
          +'<span style="font-weight:700">'+nombre.split(' ')[0]+'</span>'
          +'<span style="font-weight:800;color:'+col+'">'+real+(meta>0?'/'+meta:'')+'</span></div>'
          +(meta>0?'<div style="background:var(--gr3);border-radius:4px;height:8px;overflow:hidden">'
          +'<div style="width:'+pct+'%;height:100%;background:'+col+';border-radius:4px"></div></div>':'')
          +'</div>';
      });
      // Otros técnicos que hayan hecho inspecciones
      Object.keys(porTec).forEach(function(n){
        var esMeta=tecsMeta.some(function(m){return m.toLowerCase().indexOf(n.split(' ')[0].toLowerCase())>=0||n.toLowerCase().indexOf(m.split(' ')[0].toLowerCase())>=0;});
        if(!esMeta&&porTec[n]>0){
          iH+='<div style="background:#fff;border-radius:8px;padding:8px 10px;border-left:3px solid var(--mo)">'
            +'<div style="display:flex;justify-content:space-between;font-size:12px">'
            +'<span style="font-weight:700">'+n.split(' ')[0]+'</span>'
            +'<span style="font-weight:800;color:var(--mo)">'+porTec[n]+'</span></div></div>';
        }
      });
      iH+='</div>';
      iH+='<div style="margin-top:10px">'
        +'<button onclick="showDetalleInspecciones()" style="width:100%;padding:10px;background:#1a3c5e;color:#fff;border:none;border-radius:9px;font-size:.88rem;font-weight:700;cursor:pointer">🔍 Ver Detalle de Inspecciones</button>'
        +'</div>';
      inEl.innerHTML=iH;
    }

    // Gasto
    var gEl=document.getElementById('chart-gasto');
    if(gEl&&window.Chart&&GASTO_DATA&&GASTO_DATA.length){
      var gd=GASTO_DATA.filter(function(g){return (g.año||g.anio)===ano;}).sort(function(a,b){return a.semana-b.semana;}).slice(-8);
      if(gd.length){
        new Chart(gEl,{type:'bar',data:{labels:gd.map(function(g){return 'S'+g.semana;}),datasets:[{label:'Planeado',data:gd.map(function(g){return g.planeado||0;}),backgroundColor:'rgba(21,101,192,.7)'},{label:'Real',data:gd.map(function(g){return g.real||0;}),backgroundColor:'rgba(198,40,40,.7)'}]},options:{plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}});
        var totP=gd.reduce(function(s,g){return s+(g.planeado||0);},0);
        var totR=gd.reduce(function(s,g){return s+(g.real||0);},0);
        var ok=totR<=totP;
        var gR=document.getElementById('kpi-gasto-resumen');
        if(gR)gR.innerHTML='<div class="kpi-grid"><div class="kpi-card" style="border-top:3px solid var(--az)"><div class="kpi-num" style="color:var(--az);font-size:18px">$'+totP.toFixed(0)+'</div><div class="kpi-label">Planeado</div></div><div class="kpi-card" style="border-top:3px solid '+(ok?'var(--vd)':'var(--rj)')+'"><div class="kpi-num" style="color:'+(ok?'var(--vd)':'var(--rj)')+';font-size:18px">$'+totR.toFixed(0)+'</div><div class="kpi-label">Real</div></div></div><div style="text-align:center;font-size:12px;font-weight:700;margin-top:4px;color:'+(ok?'var(--vd)':'var(--rj))')+'">'+(ok?'Dentro del presupuesto':'Sobre presupuesto')+'</div>';
      }
    }
  },80);
}



function getUltimas8Semanas(){
  var r=[];var sw=currentWeek();var ay=currentYear();
  for(var i=7;i>=0;i--){
    var s=sw-i;var y=ay;
    if(s<=0){s+=52;y=ay-1;}
    r.push({sem:s,año:y});
  }
  return r;
}
function renderChartMTBF(){
  const el=document.getElementById('chart-mtbf');if(!el)return;
  const lineas=[...new Set(MTBF_DATA.map(d=>d.linea))].slice(0,8);
  if(!lineas.length){el.insertAdjacentHTML('beforebegin','<p style="font-size:13px;color:var(--txt3)">Sin datos MTBF.</p>');return;}
  const sems=[...new Set(MTBF_DATA.map(d=>'S'+d.semana))].slice(-8);
  const cols=['#3D2F8F','#E53935','#00B4A0','#F57C00','#7B1FA2','#00838F','#37474F','#795548'];
  new Chart(el,{type:'line',data:{labels:sems,datasets:lineas.map((l,i)=>({label:l,data:sems.map(s=>{const d=MTBF_DATA.find(x=>x.linea===l&&'S'+x.semana===s);return d?d.mtbf:null;}),borderColor:cols[i%cols.length],tension:.3,spanGaps:true}))},options:{plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true,title:{display:true,text:'Horas'}}}}});
}
function renderChartGasto(){
  const el=document.getElementById('chart-gasto');if(!el)return;
  const gastos=GASTO_DATA.slice(-12);
  if(!gastos.length){el.insertAdjacentHTML('beforebegin','<p style="font-size:13px;color:var(--txt3)">Sin datos de gasto.</p>');return;}
  new Chart(el,{type:'bar',data:{labels:gastos.map(g=>'S'+g.semana+'/'+String(g.año).slice(2)),datasets:[{label:'Planeado',data:gastos.map(g=>g.planeado),backgroundColor:'rgba(61,47,143,.4)',borderColor:'#3D2F8F',borderWidth:2,borderRadius:4},{label:'Real',data:gastos.map(g=>g.real),backgroundColor:gastos.map(g=>g.real<=g.planeado?'rgba(0,180,160,.6)':'rgba(198,40,40,.6)'),borderColor:gastos.map(g=>g.real<=g.planeado?'#00B4A0':'#C62828'),borderWidth:2,borderRadius:4}]},options:{plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}});
}

// ================================================================
// ALMACÉN (condensed)
// ================================================================
function showAlmacen(){renderAlmacen();showScreen('screen-almacen');}
function renderAlmacen(){
  const cont=document.getElementById('almacen-content');
  const isAdmin=currentUser.rol==='admin';
  if(!isAdmin){
    cont.innerHTML=`<div class="card"><div class="card-title mb8">🔍 Buscar Refacción</div><input type="text" class="search-box" id="ref-search" placeholder="Código, nombre..."><button class="btn btn-primary btn-sm" style="width:auto" onclick="buscarRef()">Buscar</button><div id="ref-resultado" class="mt12"></div></div>
    <div class="card mt12"><div class="card-title mb8">📦 Catálogo (${REFACCIONES.filter(r=>r.cantidad>0).length} con stock)</div>${REFACCIONES.filter(r=>r.cantidad>0).slice(0,30).map(r=>`<div style="padding:8px 0;border-bottom:1px solid var(--gr4)"><div style="display:flex;justify-content:space-between"><span style="font-size:13px;font-weight:600">${r.descripcion}</span><span class="badge badge-pm03">${r.cantidad} uds</span></div><div style="font-size:11px;color:var(--txt3);margin-top:2px">${r.codigo} · ${r.ubicacion||'—'}</div></div>`).join('')}</div>`;
  } else {
    cont.innerHTML=`<div class="card"><div class="card-title mb8">🔍 Buscar</div><input type="text" class="search-box" id="ref-search" placeholder="Código, nombre..."><button class="btn btn-primary btn-sm" style="width:auto" onclick="buscarRef()">Buscar</button><div id="ref-resultado" class="mt12"></div></div>
    <div class="card mt12"><div class="card-title mb8">➕ Agregar Refacción</div>
      <div class="form-group"><label class="form-label">Línea</label><select class="form-control" id="ref-linea">${['CC1','CC2','TQA3','General','Eléctrico','Mecánico','Tubería','Especial'].map(l=>`<option>${l}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Categoría</label><select class="form-control" id="ref-cat"><option value="MEC">Mecánica</option><option value="ELE">Eléctrica</option><option value="TUB">Tubería</option><option value="GEN">General</option><option value="ESP">Especial</option></select></div>
      <div class="form-group"><label class="form-label">Código personalizado (opcional)</label><input type="text" class="form-control" id="ref-codigo-manual" placeholder="Ej: REF-CC1-MEC-001 o tu código..."></div>
      <div class="form-group"><label class="form-label">Descripción</label><input type="text" class="form-control" id="ref-desc" placeholder="Descripción..."></div>
      <div class="form-group"><label class="form-label">Cantidad</label><input type="number" class="form-control" id="ref-qty" value="1" min="0"></div>
      <div class="form-group"><label class="form-label">Costo ($)</label><input type="number" class="form-control" id="ref-costo" value="0" step="0.01"></div>
      <div class="form-group"><label class="form-label">Ubicación</label><input type="text" class="form-control" id="ref-ubi" placeholder="Estante A-3, Cajón 12..."></div>
      <button class="btn btn-primary" onclick="agregarRef()">➕ Agregar</button></div>
    <div class="card mt12"><div class="card-title mb8">📦 Inventario (${REFACCIONES.length})</div><div class="table-wrap"><table><thead><tr><th>Código</th><th>Descripción</th><th>Qty</th><th>Ubicación</th></tr></thead><tbody>${REFACCIONES.map(r=>`<tr><td>${r.codigo}</td><td>${r.descripcion}</td><td style="color:${r.cantidad>0?'var(--vd)':'var(--rj)'};font-weight:700">${r.cantidad}</td><td>${r.ubicacion||'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
}
function buscarRef(){const q=(document.getElementById('ref-search')?.value||'').toLowerCase().trim();const res=document.getElementById('ref-resultado');if(!q){res.innerHTML='';return;}const found=REFACCIONES.filter(r=>r.descripcion.toLowerCase().includes(q)||r.codigo.toLowerCase().includes(q));res.innerHTML=found.length?found.map(r=>`<div style="background:var(--vd3);border:2px solid var(--vd);border-radius:10px;padding:14px;margin-bottom:8px"><div style="font-weight:700">${r.descripcion}</div><div style="font-size:13px;margin-top:4px">Código: <b>${r.codigo}</b> · Stock: <b style="color:${r.cantidad>0?'var(--vd)':'var(--rj)'}">${r.cantidad} uds</b></div><div style="font-size:13px">Ubicación: <b>${r.ubicacion||'No registrada'}</b></div></div>`).join(''):`<div style="background:var(--rj3);border:2px solid var(--rj);border-radius:10px;padding:14px;color:var(--rj);font-weight:700">❌ No encontrada en inventario.</div>`;}
function agregarRef(){const linea=(document.getElementById('ref-linea')?.value||'GEN').substring(0,8).toUpperCase().replace(/\s/g,'');const cat=document.getElementById('ref-cat')?.value||'GEN';const desc=document.getElementById('ref-desc')?.value?.trim();if(!desc){showAlert('Escribe la descripción','error');return;}const qty=parseInt(document.getElementById('ref-qty')?.value)||0;const costo=parseFloat(document.getElementById('ref-costo')?.value)||0;const ubi=document.getElementById('ref-ubi')?.value?.trim();const codigoManual=(document.getElementById('ref-codigo-manual')?.value||'').trim();
  let codigo;
  if(codigoManual){if(REFACCIONES.find(r=>r.codigo===codigoManual)){showAlert('Ese código ya existe','error');return;}codigo=codigoManual;}else{const idx=REFACCIONES.filter(r=>r.codigo.startsWith('REF-'+linea)).length+1;codigo='REF-'+linea+'-'+cat+'-'+String(idx).padStart(3,'0');}REFACCIONES.push({id:'r'+Date.now(),codigo,descripcion:desc,cantidad:qty,costo,ubicacion:ubi||'',ts:Date.now()});saveDB('refacciones',REFACCIONES);showAlert('✅ '+codigo+' agregada');renderAlmacen();}

// ================================================================
// DESEMPEÑO
// ================================================================
function showDesempeno(){if(currentUser.rol!=='admin'){showAlert('Sin permisos','error');return;}renderDesempeno();showScreen('screen-desempeno');}
function renderDesempeno(){
  const año=currentYear();const meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  document.getElementById('desempeno-content').innerHTML=`<div class="card"><div class="card-title mb8">🔍 Filtrar período</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <select class="form-control" id="desemp-año" style="flex:1;min-width:90px">${[año-1,año,año+1].map(a=>`<option value="${a}" ${a===año?'selected':''}>${a}</option>`).join('')}</select>
      <select class="form-control" id="desemp-periodo" style="flex:1;min-width:110px"><option value="semana">Semana</option><option value="mes">Mes</option><option value="año">Año</option></select>
      <select class="form-control" id="desemp-mes" style="flex:1;min-width:110px">${meses.map((m,i)=>`<option value="${i+1}" ${i+1===new Date().getMonth()+1?'selected':''}>${m}</option>`).join('')}</select>
      <input type="number" class="form-control" id="desemp-sem" value="${currentWeek()}" min="1" max="52" style="flex:1;min-width:80px">
    </div>
    <button class="btn btn-primary" onclick="calcularDesempeno()">📊 Ver indicadores</button></div>
  <div id="desempeno-resultados" class="mt12"></div>`;
}
function calcularDesempeno(){
  const año=parseInt(document.getElementById('desemp-año').value);
  const periodo=document.getElementById('desemp-periodo').value;
  const mes=parseInt(document.getElementById('desemp-mes').value);
  const semNum=parseInt(document.getElementById('desemp-sem').value);
  function enPer(o){if(o.año!==año)return false;if(periodo==='semana')return o.semana===semNum;if(periodo==='mes'){const d=new Date(o.ts);return d.getMonth()+1===mes&&d.getFullYear()===año;}return true;}
  function enPerPM03(p){if(p.año!==año)return false;if(periodo==='semana')return p.semana===semNum;if(periodo==='mes')return getWeeksInMonth(año,mes).includes(p.semana);return true;}
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  const cargas=tecs.map(t=>ORDENES.filter(o=>o.tecnicoAsignado===t.id&&enPer(o)).length+PM03_PLAN.filter(p=>p.tecnicoId===t.id&&enPerPM03(p)).length);
  const maxC=Math.max(...cargas,1);
  const cols=['#3D2F8F','#E53935','#00B4A0','#F57C00','#7B1FA2','#00838F','#37474F','#795548'];
  const cP=p=>p===null?'var(--gr)':p>=80?'var(--vd)':p>=50?'var(--am2)':'var(--rj)';
  const inspSem=INSPECCIONES.filter(i=>{if(periodo==='semana')return getWeekNumber(new Date(i.fecha+'T12:00'))===semNum&&new Date(i.fecha+'T12:00').getFullYear()===año;if(periodo==='mes'){const d=new Date(i.fecha+'T12:00');return d.getMonth()+1===mes&&d.getFullYear()===año;}return new Date(i.fecha+'T12:00').getFullYear()===año;});
  const lbl=periodo==='semana'?'Semana '+semNum:periodo==='mes'?['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][mes-1]:'Año completo';
  let html=`<div style="font-size:13px;font-weight:700;color:var(--mo);margin-bottom:12px">Período: ${lbl} ${año}</div>`;
  tecs.forEach((tec,idx)=>{
    const ots=ORDENES.filter(o=>o.tecnicoAsignado===tec.id&&enPer(o));
    const pm01=ots.filter(o=>o.tipo==='PM01'),pm02=ots.filter(o=>o.tipo==='PM02'),pm04=ots.filter(o=>o.tipo==='PM04');
    const pm02Az=pm02.filter(o=>o.colorOT==='azul'),pm02Ro=pm02.filter(o=>o.colorOT==='rojo');
    const pm03a=PM03_PLAN.filter(p=>p.tecnicoId===tec.id&&enPerPM03(p)&&!p.esInspeccion);
    const pm02C=pm02.filter(o=>o.estado==='cerrada').length,pm03C=pm03a.filter(p=>p.estado==='cerrada').length;
    const total=ots.length+pm03a.length,totalC=ots.filter(o=>o.estado==='cerrada').length+pm03C;
    const pPM02=pm02.length?Math.round((pm02C/pm02.length)*100):null;
    const pPM03=pm03a.length?Math.round((pm03C/pm03a.length)*100):null;
    const pGlobal=total?Math.round((totalC/total)*100):null;
    const cR=Math.round((total/maxC)*100);
    const inspTec=inspSem.filter(i=>i.tecnicoId===tec.id&&i.estado==='cerrada').length;
    html+=`<div class="tec-perf-card" style="border-top-color:${cols[idx%cols.length]}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="width:42px;height:42px;border-radius:50%;background:${cols[idx%cols.length]};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;flex-shrink:0">${tec.nombre.split(' ').map(p=>p[0]).slice(0,2).join('')}</div>
        <div><div style="font-weight:700;font-size:15px">${tec.nombre}</div><div style="font-size:11px;color:var(--txt3)">Carga: ${total} órdenes · Inspecciones: ${inspTec}</div></div>
        <div style="margin-left:auto;text-align:right"><div style="font-size:22px;font-weight:800;color:${cP(pGlobal)}">${pGlobal!==null?pGlobal+'%':'—'}</div><div style="font-size:11px;color:var(--txt3)">Cierre global</div></div>
      </div>
      <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:var(--txt3)">Carga relativa</span><span style="font-weight:700">${cR}%</span></div><div class="perf-bar-wrap"><div class="perf-bar" style="width:${cR}%;background:${cols[idx%cols.length]}"></div></div></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">
        <div style="background:var(--rj3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--rj)">${pm01.length}</div><div style="font-size:10px;color:var(--rj);font-weight:700">PM01</div><div style="font-size:11px">${pm01.filter(o=>o.estado==='cerrada').length} cerr.</div></div>
        <div style="background:var(--am3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--am)">${pm02.length}</div><div style="font-size:10px;color:var(--am);font-weight:700">PM02</div><div style="font-size:10px">🔵${pm02Az.length} 🔴${pm02Ro.length}</div><div style="font-size:11px">${pm02C} cerr.${pPM02!==null?' ('+pPM02+'%)':''}</div></div>
        <div style="background:var(--vd3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--vd)">${pm03a.length}</div><div style="font-size:10px;color:var(--vd);font-weight:700">PM03</div><div style="font-size:11px">${pm03C} cerr.${pPM03!==null?' ('+pPM03+'%)':''}</div></div>
        <div style="background:var(--az3);border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:var(--az)">${pm04.length}</div><div style="font-size:10px;color:var(--az);font-weight:700">PM04</div><div style="font-size:11px">${pm04.filter(o=>o.estado==='cerrada').length} cerr.</div></div>
      </div>
      <div style="border-top:1px solid var(--gr4);padding-top:10px;font-size:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:var(--txt3)">% Cierre PM02</span><span style="font-weight:700;color:${cP(pPM02)}">${pPM02!==null?pPM02+'%':'Sin PM02'}</span></div>
        <div class="perf-bar-wrap mb8"><div class="perf-bar" style="width:${pPM02||0}%;background:${cP(pPM02)}"></div></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:var(--txt3)">% Cierre PM03</span><span style="font-weight:700;color:${cP(pPM03)}">${pPM03!==null?pPM03+'%':'Sin PM03'}</span></div>
        <div class="perf-bar-wrap mb8"><div class="perf-bar" style="width:${pPM03||0}%;background:${cP(pPM03)}"></div></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:var(--txt3)">✅ Inspecciones realizadas</span><span style="font-weight:700;color:${inspTec>0?'var(--vd)':'var(--rj)'}">${inspTec}</span></div>
        ${total>0?`<div style="margin-top:8px;padding:8px;border-radius:8px;background:${pGlobal>=80?'var(--vd3)':pGlobal>=50?'var(--am3)':'var(--rj3)'};font-size:12px;font-weight:700;color:${cP(pGlobal)}">${pGlobal>=80?'✅ Desempeño satisfactorio':pGlobal>=50?'⚠️ Con oportunidades':'🔴 Requiere atención'} — ${totalC}/${total}</div>`:'<div style="color:var(--txt3);font-size:12px;margin-top:6px;font-style:italic">Sin órdenes en este período</div>'}
      </div></div>`;
  });
  document.getElementById('desempeno-resultados').innerHTML=html;
}

// ================================================================
// ADMIN
// ================================================================
function showAdmin(){if(currentUser.rol!=='admin'){showAlert('Sin permisos','error');return;}renderAdminTab('usuarios');showScreen('screen-admin');}
function setAdminTab(tab,btn){if(btn){document.querySelectorAll('#admin-tabs .tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}renderAdminTab(tab);}
function renderAdminTab(tab){
  const cont=document.getElementById('admin-content');
  if(tab==='usuarios')renderAdminUs(cont);
  else if(tab==='pm03carga')renderAdminPM03(cont);
  else if(tab==='mtbf')renderAdminMTBF(cont);
  else if(tab==='gasto')renderAdminGasto(cont);
  else if(tab==='listas')renderAdminListas(cont);
}
function renderAdminUs(cont){
  cont.innerHTML=`<div class="card"><div class="card-title mb8">👥 Usuarios (${USERS.length})</div><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Clave</th><th>Rol</th></tr></thead><tbody>${USERS.map(u=>`<tr><td>${u.nombre}</td><td>${u.username}</td><td style="font-family:monospace;font-size:12px">${u.password}</td><td><span class="badge badge-${u.rol}">${u.rol}</span></td></tr>`).join('')}</tbody></table></div></div>
  <div class="card mt12"><div class="card-title mb8">➕ Agregar Usuario</div>
    <div class="form-group"><label class="form-label">Nombre completo</label><input type="text" class="form-control" id="nu-nombre" placeholder="Ej: Juan García López"></div>
    <div class="form-group"><label class="form-label">Usuario</label><input type="text" class="form-control" id="nu-user" placeholder="juangarcia"></div>
    <div class="form-group"><label class="form-label">Contraseña (vacío = iniciales+2026)</label><input type="text" class="form-control" id="nu-pass" placeholder="Auto-generar"></div>
    <div class="form-group"><label class="form-label">Rol</label><select class="form-control" id="nu-rol"><option value="operador">Operador</option><option value="lider">Líder Producción</option><option value="tecnico">Técnico</option><option value="admin">Administrador</option></select></div>
    <button class="btn btn-primary" onclick="agregarUsuario()">➕ Agregar</button></div>`;
}
function agregarUsuario(){
  const nombre=document.getElementById('nu-nombre')?.value?.trim();
  const username=document.getElementById('nu-user')?.value?.trim().toLowerCase().replace(/\s/g,'');
  const rol=document.getElementById('nu-rol')?.value;
  let pass=document.getElementById('nu-pass')?.value?.trim();
  if(!nombre||!username){showAlert('Nombre y usuario requeridos','error');return;}
  if(USERS.find(u=>u.username===username)){showAlert('Ese usuario ya existe','error');return;}
  if(!pass)pass=nombre.split(' ').map(p=>p[0].toUpperCase()).join('')+'2026';
  USERS.push({id:'u_'+Date.now(),username,nombre,password:pass,rol});
  saveDB('users',USERS);showAlert('✅ Usuario creado. Clave: '+pass);renderAdminUs(document.getElementById('admin-content'));
}
function agregarPM03(){
  const linea=document.getElementById('p3-linea')?.value,act=document.getElementById('p3-act')?.value?.trim(),comp=document.getElementById('p3-comp')?.value?.trim();
  const sem=parseInt(document.getElementById('p3-sem')?.value);
  const tecSel=document.getElementById('p3-tec');const tecId=tecSel?.value,tecNom=tecId?(tecSel.options[tecSel.selectedIndex]?.text||''):'Sin asignar';
  const pasos=document.getElementById('p3-pasos')?.value?.trim();
  if(!linea||!act){showAlert('Línea y actividad requeridos','error');return;}
  PM03_PLAN.push({id:genID('PM03'),linea,componente:comp||'—',actividad:act,semana:sem,año:currentYear(),tecnicoId:tecId||'',tecnicoNombre:tecNom,estado:'abierta',pasoAPaso:pasos||'',generadoPor:currentUser.nombre,ts:Date.now(),horaCreacion:new Date().toISOString()});
  saveDB('pm03_plan',PM03_PLAN);savePM03Supa(PM03_PLAN[PM03_PLAN.length-1]);showAlert('PM03 agregada');renderAdminPM03(document.getElementById('admin-content'));
}
function renderAdminMTBF(cont){
  const lineasAll=(LISTAS.lineas_proceso||[]).concat(LISTAS.lineas_envasado||[]).concat(LISTAS.lineas_servicios||[]);
  const años=[currentYear()-1,currentYear(),currentYear()+1];
  cont.innerHTML=`<div class="card"><div class="card-title mb8">📊 Registrar MTBF</div>
    <div class="form-group"><label class="form-label">Línea</label><select class="form-control" id="mtbf-linea">${lineasAll.map(l=>`<option>${l}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Año</label><select class="form-control" id="mtbf-año">${años.map(a=>`<option value="${a}" ${a===currentYear()?'selected':''}>${a}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Semana</label><select class="form-control" id="mtbf-sem">${Array.from({length:52},(_,i)=>i+1).map(s=>`<option value="${s}" ${s===currentWeek()?'selected':''}>Semana ${s}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Horas de producción</label><input type="number" class="form-control" id="mtbf-horas" min="0" step="0.5"></div>
    <div class="form-group"><label class="form-label">Número de fallas</label><input type="number" class="form-control" id="mtbf-fallas" min="0"></div>
    <button class="btn btn-primary" onclick="guardarMTBF()">💾 Guardar</button></div>
  <div class="card mt12"><div class="card-title mb8">📋 Historial</div><div class="table-wrap"><table><thead><tr><th>Año</th><th>Sem</th><th>Línea</th><th>Horas</th><th>Fallas</th><th>MTBF</th></tr></thead><tbody>${MTBF_DATA.slice(-15).reverse().map(d=>`<tr><td>${d.año}</td><td>S${d.semana}</td><td>${d.linea}</td><td>${d.horas}h</td><td>${d.fallas}</td><td>${d.mtbf?d.mtbf.toFixed(1)+' h':'—'}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function guardarMTBF(){
  const linea=document.getElementById('mtbf-linea')?.value,sem=parseInt(document.getElementById('mtbf-sem')?.value),año=parseInt(document.getElementById('mtbf-año')?.value)||currentYear();
  const horas=parseFloat(document.getElementById('mtbf-horas')?.value)||0,fallas=parseInt(document.getElementById('mtbf-fallas')?.value)||0;
  if(!linea||!horas){showAlert('Completa los campos','error');return;}
  const mtbf=fallas>0?parseFloat((horas/fallas).toFixed(2)):null;
  const idx=MTBF_DATA.findIndex(d=>d.linea===linea&&d.semana===sem&&d.año===año);
  const entry={linea,semana:sem,año,horas,fallas,mtbf,ts:Date.now()};
  if(idx>=0)MTBF_DATA[idx]=entry;else MTBF_DATA.push(entry);
  saveDB('mtbf_data',MTBF_DATA);showAlert('✅ MTBF guardado');renderAdminMTBF(document.getElementById('admin-content'));
}
function renderAdminGasto(cont){
  const años=[currentYear()-1,currentYear(),currentYear()+1];
  const meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  cont.innerHTML=`<div class="card"><div class="card-title mb8">💰 Semana individual</div>
    <div class="form-group"><label class="form-label">Año</label><select class="form-control" id="gas-año">${años.map(a=>`<option value="${a}" ${a===currentYear()?'selected':''}>${a}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Semana</label><select class="form-control" id="gas-sem">${Array.from({length:52},(_,i)=>i+1).map(s=>`<option value="${s}" ${s===currentWeek()?'selected':''}>Semana ${s}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Planeado ($)</label><input type="number" class="form-control" id="gas-plan" step="0.01"></div>
    <div class="form-group"><label class="form-label">Real ($)</label><input type="number" class="form-control" id="gas-real" step="0.01"></div>
    <button class="btn btn-primary" onclick="guardarGastoS()">💾 Guardar</button></div>
  <div class="card mt12"><div class="card-title mb8">📅 Mes completo</div>
    <div class="form-group"><label class="form-label">Año</label><select class="form-control" id="gas-año-b">${años.map(a=>`<option value="${a}" ${a===currentYear()?'selected':''}>${a}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Mes</label><select class="form-control" id="gas-mes-b">${meses.map((m,i)=>`<option value="${i+1}" ${i+1===new Date().getMonth()+1?'selected':''}>${m}</option>`).join('')}</select></div>
    <button class="btn btn-outline" onclick="cargarSemanasDelMes()">📋 Cargar semanas del mes</button>
    <div id="gas-semanas-mes" class="mt12"></div></div>
  <div class="card mt12"><div class="card-title mb8">📋 Historial</div><div class="table-wrap"><table><thead><tr><th>Año</th><th>Sem</th><th>Planeado</th><th>Real</th><th>Dif</th></tr></thead><tbody>${GASTO_DATA.slice(-15).reverse().map(g=>`<tr><td>${g.año}</td><td>S${g.semana}</td><td>$${Number(g.planeado).toFixed(2)}</td><td>$${Number(g.real).toFixed(2)}</td><td style="color:${g.real<=g.planeado?'var(--vd)':'var(--rj)'}">$${(g.real-g.planeado).toFixed(2)}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function guardarGastoS(){const sem=parseInt(document.getElementById('gas-sem')?.value),año=parseInt(document.getElementById('gas-año')?.value)||currentYear(),plan=parseFloat(document.getElementById('gas-plan')?.value)||0,real=parseFloat(document.getElementById('gas-real')?.value)||0;const idx=GASTO_DATA.findIndex(g=>g.semana===sem&&g.año===año);const e={semana:sem,año,planeado:plan,real,ts:Date.now()};if(idx>=0)GASTO_DATA[idx]=e;else GASTO_DATA.push(e);saveDB('gasto_data',GASTO_DATA);showAlert('✅ Guardado');renderAdminGasto(document.getElementById('admin-content'));}
function cargarSemanasDelMes(){const año=parseInt(document.getElementById('gas-año-b')?.value)||currentYear();const mes=parseInt(document.getElementById('gas-mes-b')?.value)||1;const semanas=getWeeksInMonth(año,mes);const cont=document.getElementById('gas-semanas-mes');cont.innerHTML=semanas.map(s=>{const ex=GASTO_DATA.find(g=>g.semana===s&&g.año===año);return`<div class="card" style="padding:12px;margin-bottom:8px"><div style="font-weight:700;font-size:13px;margin-bottom:8px">Semana ${s}</div><div style="display:flex;gap:8px"><div style="flex:1"><label class="form-label" style="font-size:11px">Planeado ($)</label><input type="number" class="form-control" id="bp-${s}" value="${ex?ex.planeado:''}" step="0.01"></div><div style="flex:1"><label class="form-label" style="font-size:11px">Real ($)</label><input type="number" class="form-control" id="br-${s}" value="${ex?ex.real:''}" step="0.01"></div></div></div>`;}).join('')+'<button class="btn btn-success" onclick="guardarBulk('+año+',['+semanas.join(',')+'])">💾 Guardar todas las semanas</button>';}
function guardarBulk(año,sems){sems.forEach(s=>{const p=parseFloat(document.getElementById('bp-'+s)?.value)||0,r=parseFloat(document.getElementById('br-'+s)?.value)||0;if(p>0||r>0){const idx=GASTO_DATA.findIndex(g=>g.semana===s&&g.año===año);const e={semana:s,año,planeado:p,real:r,ts:Date.now()};if(idx>=0)GASTO_DATA[idx]=e;else GASTO_DATA.push(e);}});saveDB('gasto_data',GASTO_DATA);showAlert('✅ Mes guardado');renderAdminGasto(document.getElementById('admin-content'));}
function renderAdminListas(cont){cont.innerHTML=`<div class="card"><div class="card-title mb12">📋 Editar Listas</div>${renderListaEd('Líneas Proceso','lineas_proceso')+renderListaEd('Líneas Envasado','lineas_envasado')}${renderListaEd('Servicios Industriales','lineas_servicios')}${renderListaEd('Bodega','lineas_bodega')}${renderListaEd('Tipos de Anormalidad','tipos_anormalidad')}</div>`;}
function renderListaEd(titulo,key){return`<div style="margin-bottom:20px"><div style="font-weight:700;margin-bottom:8px">${titulo}</div><div style="max-height:120px;overflow-y:auto;border:1px solid var(--gr4);border-radius:8px;padding:8px;margin-bottom:8px">${(LISTAS[key]||[]).map((item,i)=>`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>${item}</span><button onclick="eliminarLI('${key}',${i})" style="background:none;border:none;color:var(--rj);cursor:pointer;font-size:16px">🗑️</button></div>`).join('')}</div><div style="display:flex;gap:8px"><input type="text" class="form-control" id="add-${key}" placeholder="Nueva opción..." style="flex:1"><button class="btn btn-primary btn-sm" style="width:auto;padding:8px 16px" onclick="agregarLI('${key}')">+</button></div></div>`;}
function agregarLI(key){const inp=document.getElementById('add-'+key);const val=inp?.value?.trim();if(!val){showAlert('Escribe el valor','error');return;}if(!LISTAS[key])LISTAS[key]=[];LISTAS[key].push(val);saveListas();inp.value='';renderAdminListas(document.getElementById('admin-content'));showAlert('✅ Opción agregada');}
function eliminarLI(key,idx){if(!confirm('¿Eliminar?'))return;LISTAS[key].splice(idx,1);saveListas();renderAdminListas(document.getElementById('admin-content'));}

// ================================================================
// INIT
// ================================================================
(function(){
  try{
    var sess=loadDB('session',null);
    if(sess&&sess.id){
      if(sess.rol==='super'){currentUser={id:'u_super',username:'superusuario',nombre:'Super Usuario',rol:'super'};}
      else{currentUser=USERS.find(function(x){return x.id===sess.id;})||null;}
    }
    if(currentUser){renderMenu();showScreen('screen-menu');}
    else showScreen('screen-login');
    setTimeout(syncSupabase,800);
  }catch(e){console.error('Init:',e);showScreen('screen-login');}
})();

// ─── Mostrar opciones al guardar PM ───
function mostrarOpcionGuardado(){
  const t=document.getElementById('inp-detalle');if(t)pmState.detalle=t.value.trim();
  if(!pmState.detalle){showAlert('Escribe el detalle primero','error');return;}
  const cont=document.getElementById('pm-wizard-container');
  var showVariosDias = pmTipo==='PM02'||pmTipo==='PM03';
  cont.innerHTML=`<div class="wizard-title">💾 Guardar Orden</div>
  <div class="form-group" style="margin-bottom:12px">
    <label class="form-label" style="font-size:12px">📅 Fecha de la orden</label>
    <input type="date" class="form-control" id="pm-fecha-orden" value="${todayStr()}" style="padding:8px">
    <div style="font-size:11px;color:var(--txt3);margin-top:2px">Cámbiala si estás cargando una PM de un día anterior</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
    <button class="btn btn-primary" style="padding:18px" onclick="pmState.resuelta=false;guardarOT()">
      📋 Guardar como Abierta<br><span style="font-size:12px;font-weight:400;opacity:.85">Se asignará al técnico para resolver</span>
    </button>
    <button class="btn btn-success" style="padding:18px" onclick="mostrarFormTiempoResolucion()">
      ✅ Resuelta al Momento<br><span style="font-size:12px;font-weight:400;opacity:.85">Registra inicio y fin</span>
    </button>
    ${showVariosDias?`<button class="btn" style="padding:18px;border:2px solid #6A1B9A;background:linear-gradient(135deg,#fff,#F3E5F5)" onclick="mostrarFormVariosDias()">
      📅 Trabajo de Varios Días<br><span style="font-size:12px;font-weight:400;opacity:.85;color:#6A1B9A">Registra horas por día (hasta 10 días)</span>
    </button>`:''}
  </div>`;
  document.getElementById('pm-btn-back').style.display='';
  document.getElementById('pm-btn-next').style.display='none';
}

function mostrarFormTiempoResolucion(){
  const cont=document.getElementById('pm-wizard-container');
  cont.innerHTML=`<div class="wizard-title">⏱️ Tiempo Invertido</div>
  <div class="wizard-sub">Registra el tiempo que tomó resolver esta pauta</div>
  <div style="background:var(--az3);border-radius:10px;padding:14px;margin-bottom:16px">
    <div style="display:flex;gap:10px;margin-bottom:10px">
      <div style="flex:1"><label class="form-label" style="font-size:11px">Hora inicio (24h)</label>
        <input type="time" class="form-control" id="res-ini" onchange="calcResTime()"></div>
      <div style="flex:1"><label class="form-label" style="font-size:11px">Hora fin (24h)</label>
        <input type="time" class="form-control" id="res-fin" onchange="calcResTime()"></div>
    </div>
    <div id="res-tiempo-calc" style="text-align:center;font-size:14px;font-weight:700;color:var(--mo)"></div>
  </div>
  <button class="btn btn-success" onclick="confirmarResolucion()">✅ Guardar como Resuelta</button>
  <button class="btn btn-gray mt8" onclick="pmState.resuelta=false;guardarOT()">📋 Guardar solo como Abierta</button>`;
  document.getElementById('pm-btn-next').style.display='none';
}

function calcResTime(){
  const ini=document.getElementById('res-ini')?.value;
  const fin=document.getElementById('res-fin')?.value;
  const div=document.getElementById('res-tiempo-calc');
  if(!ini||!fin||!div)return;
  const [ih,im]=ini.split(':').map(Number);
  const [fh,fm]=fin.split(':').map(Number);
  let mins=(fh*60+fm)-(ih*60+im);
  if(mins<0)mins+=1440;
  const h=Math.floor(mins/60),m=mins%60;
  div.textContent='⏱️ '+h+'h '+m+'m = '+parseFloat((h+m/60).toFixed(2))+' hrs';
  pmState.tiempoHoras=parseFloat((h+m/60).toFixed(2));
  pmState.horaInicioTrabajo=ini; pmState.horaFinTrabajo=fin;
}

function confirmarResolucion(){
  // Read time inputs and set horasCierre
  calcResTime();
  if(pmState.tiempoHoras && pmState.tiempoHoras > 0){
    pmState.horasCierre = pmState.tiempoHoras;
  } else {
    // Try reading directly from inputs
    var ini = document.getElementById('res-ini');
    var fin = document.getElementById('res-fin');
    if(ini && fin && ini.value && fin.value){
      var parts1 = ini.value.split(':').map(Number);
      var parts2 = fin.value.split(':').map(Number);
      var mins = (parts2[0]*60+parts2[1]) - (parts1[0]*60+parts1[1]);
      if(mins < 0) mins += 1440;
      pmState.horasCierre = parseFloat((mins/60).toFixed(2));
    }
  }
  pmState.resuelta = true;
  guardarOT();
}

// ─── guardarOT with resuelta flag ───
const _origGuardarOT=guardarOT;
// Override guardarOT to handle resuelta
const guardarOT_orig=guardarOT;

// ─── calcularTiempoCierre ───
function calcularTiempoCierre(){
  const ini=document.getElementById('cierre-hora-inicio')?.value;
  const fin=document.getElementById('cierre-hora-fin')?.value;
  const calc=document.getElementById('cierre-tiempo-calc');
  if(!ini||!fin||!calc)return;
  const [ih,im]=ini.split(':').map(Number);
  const [fh,fm]=fin.split(':').map(Number);
  let mins=(fh*60+fm)-(ih*60+im);
  if(mins<0)mins+=1440;
  const h=Math.floor(mins/60),m=mins%60;
  const hDec=parseFloat((h+m/60).toFixed(2));
  calc.textContent='⏱️ '+h+'h '+m+'m ('+hDec+' hrs)';
  document.getElementById('cierre-horas').value=hDec;
}

// ─── Filtrar ordenes (new version with all filters) ───
function filtrarOrdenes(){
  const q=(document.getElementById('consulta-search')?.value||'').toLowerCase();
  const tecF=document.getElementById('filtro-tecnico')?.value||'';
  const levF=document.getElementById('filtro-levantado')?.value||'';
  let lista=[...ORDENES].sort((a,b)=>b.ts-a.ts);
  if(filtrosConsulta.tipo&&filtrosConsulta.tipo!=='todas') lista=lista.filter(o=>o.tipo===filtrosConsulta.tipo);
  if(filtrosConsulta.estado&&filtrosConsulta.estado!=='todos') lista=lista.filter(o=>o.estado===filtrosConsulta.estado);
  if(filtrosConsulta.color&&filtrosConsulta.color!=='todos') lista=lista.filter(o=>o.colorOT===filtrosConsulta.color);
  if(filtrosConsulta.prio&&filtrosConsulta.prio!=='todas') lista=lista.filter(o=>o.prioridad===filtrosConsulta.prio);
  if(filtrosConsulta.anom&&filtrosConsulta.anom!=='todas') lista=lista.filter(o=>o.tipoAnormalidad===filtrosConsulta.anom);
  if(tecF) lista=lista.filter(o=>o.tecnicoAsignado===tecF);
  if(levF) lista=lista.filter(o=>o.levantadoPor===levF);
  if(q) lista=lista.filter(o=>(o.id||'').toLowerCase().includes(q)||(o.linea||'').toLowerCase().includes(q)||(o.detalle||'').toLowerCase().includes(q)||(o.levantadoPor||'').toLowerCase().includes(q)||(o.tecnicoNombre||'').toLowerCase().includes(q)||(o.tipoAnormalidad||'').toLowerCase().includes(q));
  const cont=document.getElementById('consulta-list');
  const canAdmin=currentUser&&(currentUser.rol==='admin'||currentUser.rol==='super');
  const pB={A:'badge-pA',B:'badge-pB',C:'badge-pC'};
  cont.innerHTML=lista.length?
    `<p style="font-size:13px;color:var(--txt3);margin-bottom:8px">${lista.length} orden(es)</p>`+
    lista.map(o=>`<div class="ot-card ${o.tipo.toLowerCase()} ${o.colorOT?'color-'+o.colorOT:''}" onclick="showDetalle('${o.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <span style="font-size:11px;color:var(--txt3);font-weight:700">${o.id}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
          <span class="badge badge-${o.tipo.toLowerCase()}">${o.tipo}</span>
          ${o.colorOT?`<span class="badge badge-${o.colorOT}">${o.colorOT==='azul'?'🔵':'🔴'}</span>`:''}
          ${o.prioridad?`<span class="badge ${pB[o.prioridad]||'badge-pB'}">P${o.prioridad}</span>`:''}
          <span class="badge badge-${o.estado}">${o.estado}</span>
        </div>
      </div>
      <div style="font-family:Nunito,sans-serif;font-size:15px;font-weight:800;margin:2px 0 4px">${o.linea} — ${o.componente}</div>
      <div style="font-size:12px;color:var(--txt2)">${o.area||''} · ${o.tipoAnormalidad||''}</div>
      <div style="font-size:12px;color:var(--txt2);margin-top:2px">${(o.detalle||'').substring(0,80)}${(o.detalle||'').length>80?'...':''}</div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--txt3)">
        <span>👤 ${o.levantadoPor}</span><span>👨‍🔧 ${o.tecnicoNombre||'Sin asignar'}</span><span>📅 ${fmtDate(o.ts)}</span>
      </div>
      ${canAdmin&&o.estado!=='cerrada'?`<div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn btn-warning btn-sm" style="font-size:12px;padding:5px 10px;flex:1" onclick="event.stopPropagation();abrirReasignacion('${o.id}')">🔄 Reasignar</button>
        <button class="btn btn-danger btn-sm" style="font-size:12px;padding:5px 10px;width:auto" onclick="event.stopPropagation();eliminarOT('${o.id}')">🗑️</button>
      </div>`:''}
    </div>`).join('')
    :`<div class="card text-center" style="padding:32px"><div style="font-size:40px">📭</div><div style="font-weight:700;margin-top:8px">Sin resultados</div></div>`;
}

function eliminarOT(id){
  if(currentUser.rol!=='admin'&&currentUser.rol!=='super'){showAlert('Sin permisos','error');return;}
  if(!confirm('¿Eliminar esta orden permanentemente?\nEsta acción no se puede deshacer.')) return;
  const idx=ORDENES.findIndex(x=>x.id===id);
  if(idx>=0){ORDENES.splice(idx,1);saveDB('ordenes',ORDENES);deleteOrdenSupa(id);showAlert('Orden eliminada','warning');filtrarOrdenes();renderResumenConsulta();}
}

// ─── renderResumenConsulta (visual with %) ───
function renderResumenConsulta(){
  const ots=ORDENES,total=ots.length;
  const sol=ots.filter(o=>o.estado==='cerrada').length,ab=total-sol;
  const pctSol=total?Math.round((sol/total)*100):0,pctAb=total?Math.round((ab/total)*100):0;
  const pA=ots.filter(o=>o.prioridad==='A'),pB=ots.filter(o=>o.prioridad==='B'),pC=ots.filter(o=>o.prioridad==='C');
  function ps(arr){const t=arr.length,s=arr.filter(o=>o.estado==='cerrada').length,a=t-s,pct=t?Math.round((s/t)*100):0;return{t,s,a,pct};}
  const sA=ps(pA),sB=ps(pB),sC=ps(pC);
  function bc(p){return p>=80?'var(--vd)':p>=50?'var(--am2)':'var(--rj)';}
  document.getElementById('consulta-resumen').innerHTML=`
  <div style="font-family:Nunito,sans-serif;font-size:14px;font-weight:800;color:var(--mo);margin-bottom:10px">📊 Resumen de Órdenes de Trabajo</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
    <div style="background:rgba(255,255,255,.7);border-radius:10px;padding:10px;text-align:center">
      <div style="font-size:26px;font-weight:800;color:var(--mo)">${total}</div>
      <div style="font-size:10px;font-weight:700;color:var(--txt2)">TOTAL OT</div>
    </div>
    <div style="background:rgba(255,255,255,.7);border-radius:10px;padding:10px;text-align:center">
      <div style="font-size:24px;font-weight:800;color:var(--vd)">${sol}</div>
      <div style="font-size:10px;font-weight:700;color:var(--vd)">SOLUCIONADAS</div>
      <div style="font-size:13px;font-weight:800;color:var(--vd)">${pctSol}%</div>
      <div style="background:rgba(0,0,0,.1);border-radius:4px;height:5px;margin-top:3px;overflow:hidden"><div style="width:${pctSol}%;height:100%;background:var(--vd);border-radius:4px"></div></div>
    </div>
    <div style="background:rgba(255,255,255,.7);border-radius:10px;padding:10px;text-align:center">
      <div style="font-size:24px;font-weight:800;color:var(--am2)">${ab}</div>
      <div style="font-size:10px;font-weight:700;color:var(--am2)">ABIERTAS</div>
      <div style="font-size:13px;font-weight:800;color:var(--am2)">${pctAb}%</div>
      <div style="background:rgba(0,0,0,.1);border-radius:4px;height:5px;margin-top:3px;overflow:hidden"><div style="width:${pctAb}%;height:100%;background:var(--am2);border-radius:4px"></div></div>
    </div>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,.4);padding-top:8px">
    <div style="font-size:11px;font-weight:700;color:var(--txt2);margin-bottom:6px">POR PRIORIDAD</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
      ${[{l:'Prioridad A',s:sA,col:'var(--rj)'},{l:'Prioridad B',s:sB,col:'var(--am2)'},{l:'Prioridad C',s:sC,col:'var(--vd)'}].map(p=>`
      <div style="background:rgba(255,255,255,.6);border-radius:8px;padding:8px;border-left:3px solid ${p.col}">
        <div style="font-size:9px;font-weight:800;color:${p.col};margin-bottom:3px">${p.l}</div>
        <div style="font-size:11px">Total: <b>${p.s.t}</b></div>
        <div style="font-size:11px;color:var(--vd)">Sol: <b>${p.s.s}</b></div>
        <div style="font-size:11px;color:var(--am2)">Ab: <b>${p.s.a}</b></div>
        <div style="font-size:12px;font-weight:800;color:${bc(p.s.pct)}">${p.s.pct}%</div>
        <div style="background:rgba(0,0,0,.1);border-radius:3px;height:4px;margin-top:2px;overflow:hidden"><div style="width:${p.s.pct}%;height:100%;background:${bc(p.s.pct)};border-radius:3px"></div></div>
      </div>`).join('')}
    </div>
  </div>`;
}

// ─── descargarOTExcel ───
function descargarOTExcel(){
  var ots=[...ORDENES].sort(function(a,b){return b.ts-a.ts;});
  if(!ots.length){showAlert('Sin ordenes','error');return;}
  var hdrs=['ID','Tipo','Estado','Color OT','Área','Línea','Componente','Prioridad','Tipo Anormalidad','Detalle','Levantado Por','Técnico','Fecha','Semana','Año','Hora Inicio','Hora Fin','Horas Invertidas','Cerrada Por','Fecha Cierre','Refacciones','Observaciones Cierre','Causa Raíz'];
  var rows=ots.map(function(o){return[o.id,o.tipo,o.estado,o.colorOT||'',o.area||'',o.linea||'',o.componente||'',o.prioridad||'',o.tipoAnormalidad||'',o.detalle||'',o.levantadoPor||'',o.tecnicoNombre||'',fmtDate(o.ts),o.semana||'',o.año||'',o.horaInicioTrabajo||'',o.horaFinTrabajo||'',o.horasCierre||0,o.cerradaPor||'',o.cerradaTs?fmtDate(o.cerradaTs):'',o.refaccionesUsadas||'',o.observacionesCierre||'',o.causaRaiz||''];});
  generarExcelXML(hdrs, rows, 'Saporis_OT_'+new Date().toISOString().slice(0,10)+'.xls', 'Órdenes de Trabajo');
  showAlert('Descargadas '+ots.length+' ordenes en Excel');
}

// ─── guardarMTTRObjetivo ───
function guardarMTTRObjetivo(){
  const v=parseInt(document.getElementById('mttr-obj-val')?.value)||45;
  saveDB('mttr_objetivo',v);showAlert('Objetivo MTTR: '+v+' min');
}

// ─── calcularTiempoJustificado ───
function calcularTiempoJustificado(){
  const per=document.getElementById('tj-periodo')?.value||'semana';
  const tur=document.getElementById('tj-turno')?.value||'';
  const cont=document.getElementById('tj-resultados');if(!cont)return;
  const hoy=new Date();
  function enPer(o){const d=new Date(o.ts||o.cerradaTs||0);
    if(per==='hoy')return d.toDateString()===hoy.toDateString();
    if(per==='semana')return getWeekNumber(d)===currentWeek()&&d.getFullYear()===currentYear();
    if(per==='mes')return d.getMonth()===hoy.getMonth()&&d.getFullYear()===currentYear();
    return d.getFullYear()===currentYear();}
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  let html='<div class="table-wrap"><table><thead><tr><th>Técnico</th><th>PM01</th><th>PM02</th><th>PM03</th><th>PM04</th><th style="color:var(--mo)">Total</th></tr></thead><tbody>';
  tecs.forEach(t=>{
    const h={};['PM01','PM02','PM03','PM04'].forEach(tp=>{
      const ots=ORDENES.filter(o=>o.tecnicoAsignado===t.id&&o.tipo===tp&&o.estado==='cerrada'&&o.horasCierre>0&&enPer(o)&&(!tur||o.turno===tur));
      const pm3=tp==='PM03'?PM03_PLAN.filter(p=>p.tecnicoId===t.id&&p.estado==='cerrada'&&p.horasCierre>0&&enPer({ts:p.cerradaTs||p.ts})).reduce((s,p)=>s+p.horasCierre,0):0;
      h[tp]=tp==='PM03'?pm3:ots.reduce((s,o)=>s+o.horasCierre,0);
    });
    const tot=Object.values(h).reduce((a,b)=>a+b,0);
    html+=`<tr><td style="font-size:12px;font-weight:700">${t.nombre.split(' ')[0]}</td>${['PM01','PM02','PM03','PM04'].map(tp=>`<td style="text-align:center;font-size:12px">${h[tp].toFixed(1)}h</td>`).join('')}<td style="font-weight:800;color:var(--mo);text-align:center">${tot.toFixed(1)}h</td></tr>`;
  });
  html+='</tbody></table></div>';
  cont.innerHTML=html;
}

// ─── reprogramarPM03 ───
function reprogramarPM03(id){
  const p=PM03_PLAN.find(x=>x.id===id);if(!p)return;
  const sig=p.semana>=52?1:p.semana+1,añoSig=p.semana>=52?p.año+1:p.año;
  if(!confirm('Reprogramar '+p.linea+' de Sem '+p.semana+' a Sem '+sig+'/'+añoSig+'?\n\nLa semana '+p.semana+' quedará como NO EJECUTADA.'))return;
  const newId=genID('PM03');
  PM03_PLAN.push({...p,id:newId,semana:sig,año:añoSig,tecnicoId:'',tecnicoNombre:'Sin asignar',estado:'abierta',reprogramadaDe:id,ts:Date.now()});
  p.reprogramada=true;p.reprogramadaA=newId;
  saveDB('pm03_plan',PM03_PLAN);
  showAlert('Reprogramada a Semana '+sig+'. Original queda abierta en KPIs.');
  aplicarFiltrosPendientes();
}

// ─── aplicarFiltrosPendientes (full version) ───
function aplicarFiltrosPendientes(){updatePendChart();
  const lDiv=document.getElementById('mis-ordenes-list');
  const r=currentUser.rol;
  const isAdmin=r==='admin'||r==='super';
  const tecFiltro=document.getElementById('fpen-tecnico')?.value||'';
  const semFiltro=parseInt(document.getElementById('fp-semana')?.value)||0;
  const añoFiltro=parseInt(document.getElementById('fp-año')?.value)||currentYear();

  let ots=[...ORDENES].sort((a,b)=>b.ts-a.ts);
  if(r==='tecnico') ots=ots.filter(o=>o.tecnicoAsignado===currentUser.id);
  if(filtrosPend.estado!=='todos') ots=ots.filter(o=>o.estado===filtrosPend.estado);
  if(filtrosPend.tipo!=='todas'&&filtrosPend.tipo!=='PM03') ots=ots.filter(o=>o.tipo===filtrosPend.tipo);
  if(filtrosPend.tipo==='PM03') ots=[];
  if(filtrosPend.color!=='todos') ots=ots.filter(o=>o.colorOT===filtrosPend.color);
  if(filtrosPend.prio!=='todas') ots=ots.filter(o=>o.prioridad===filtrosPend.prio);
  if(tecFiltro) ots=ots.filter(o=>o.tecnicoAsignado===tecFiltro);
  if(semFiltro>0) ots=ots.filter(o=>o.semana===semFiltro&&(o.año||currentYear())===añoFiltro);

  let pm03List=[];
  if(filtrosPend.tipo==='todas'||filtrosPend.tipo==='PM03'){
    pm03List=[...PM03_PLAN].filter(p=>{
      if(p.año!==añoFiltro) return false;
      if(semFiltro>0&&p.semana!==semFiltro) return false;
      if(r==='tecnico'&&p.tecnicoId&&p.tecnicoId!==currentUser.id) return false;
      if(filtrosPend.estado==='cerrada'&&p.estado!=='cerrada') return false;
      if(filtrosPend.estado==='abierta'&&p.estado==='cerrada') return false;
      if(tecFiltro&&p.tecnicoId!==tecFiltro) return false;
      return true;
    }).sort((a,b)=>a.semana-b.semana);
  }

  const total=ots.length+pm03List.length;
  if(!total){lDiv.innerHTML='<div class="card text-center" style="padding:32px"><div style="font-size:40px">📭</div><div style="font-weight:700;margin-top:8px">Sin resultados</div></div>';return;}

  let html=`<div style="font-size:13px;font-weight:700;color:var(--txt2);margin-bottom:8px">${total} orden(es) — ${ots.length} OT + ${pm03List.length} PM03</div>`;
  pm03List.forEach(p=>{
    html+=`<div class="ot-card pm03" style="border-left-color:${p.estado==='cerrada'?'var(--vd2)':'var(--am2)'}" onclick="showDetallePM03('${p.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <span style="font-size:11px;color:var(--txt3);font-weight:700">${p.id}</span>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <span class="badge badge-pm03">PM03</span>
          <span class="badge badge-${p.estado||'abierta'}">${p.estado||'abierta'}</span>
          ${!p.tecnicoId?'<span class="badge" style="background:#FFF9C4;color:#F57F17">⚠️ Sin asignar</span>':''}
        </div>
      </div>
      <div style="font-family:Nunito,sans-serif;font-size:15px;font-weight:800;margin:2px 0 4px">${p.linea}</div>
      <div style="font-size:12px;color:var(--txt2)">${p.actividad||''}</div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--txt3)">
        <span>👨‍🔧 ${p.tecnicoNombre||'Sin asignar'}</span><span>📅 Semana ${p.semana}/${p.año}</span>
      </div>
      <div style="font-size:11px;color:var(--txt3);margin-top:2px">Generó: ${p.generadoPor||'Sistema'}</div>
      ${isAdmin&&p.estado!=='cerrada'?`<button class="btn btn-outline btn-sm mt8" style="font-size:12px;padding:5px 12px" onclick="event.stopPropagation();reprogramarPM03('${p.id}')">📅 Reprogramar</button>`:''}
    </div>`;
  });
  html+=ots.map(o=>renderOTCard(o)).join('');
  lDiv.innerHTML=html;
}

// ─── Excel plan PM03 ───
const PM03_PLAN_EXCEL=[{"area":"envasado","l":"TARRO","w":[4,16,28,40,52]},{"area":"envasado","l":"WALDO","w":[2,8,14,20,26,32,38,44,50]},{"area":"envasado","l":"GALON 1","w":[3,8,13,18,23,28,33,38,43,48]},{"area":"envasado","l":"GALON 2","w":[2,7,12,17,22,27,32,37,42,47]},{"area":"envasado","l":"CUBETA","w":[4,16,28,40,52]},{"area":"envasado","l":"GARRAFA","w":[4,16,28,40,52]},{"area":"envasado","l":"HOJUELA","w":[6,18,30,42]},{"area":"envasado","l":"ACEITE","w":[10,36]},{"area":"envasado","l":"TIMSA","w":[1,5,9,13,17,21,25,29,33,37,41,45,49]},{"area":"envasado","l":"DOMBER 1","w":[11,38]},{"area":"envasado","l":"DOMBER 2","w":[11,38]},{"area":"envasado","l":"SQUEEZE","w":[4,9,14,19,24,29,34,39,44,49]},{"area":"envasado","l":"DOYPACK 1","w":[2,7,12,17,22,27,32,37,42,47,52]},{"area":"envasado","l":"DOYPACK 2","w":[2,7,12,17,22,27,32,37,42,47,52]},{"area":"proceso","l":"MEZCLADOR 1","w":[4,20,36,52]},{"area":"proceso","l":"COCEDOR 1","w":[2,7,12,17,22,28,33,38,43,48]},{"area":"proceso","l":"COCEDOR 2","w":[3,8,13,18,23,29,34,39,44,49]},{"area":"proceso","l":"CIP","w":[5,11,16,21,26,32,37,42,47]},{"area":"proceso","l":"PASTA DE TOMATE","w":[4,31]},{"area":"proceso","l":"BASES PREPARADAS","w":[6,22,41]},{"area":"proceso","l":"BASES COCINADAS","w":[1,17,33,49]},{"area":"proceso","l":"ALMACENAMIENTO SALSAS","w":[3,20,36,52]},{"area":"proceso","l":"ALMACENAMIENTO JARABES Y ESPECIAS","w":[2,18,34,50]},{"area":"proceso","l":"MÁQUINA MAX D-700","w":[4,12,20,28,36,44,52]},{"area":"servicios","l":"CALDERA","w":[3,7,11,15,19,23,27,31,35,39,43,47,51]},{"area":"servicios","l":"COMPRESOR DE AIRE COMPRIMIDO 3","w":[4,16,28,40,52]},{"area":"servicios","l":"COMPRESOR DE AIRE COMPRIMIDO 4","w":[2,14,26,38,50]},{"area":"servicios","l":"CHILLER","w":[1,6,11,16,21,26,31,36,41,46,51]},{"area":"servicios","l":"HIDRONEUMATICO","w":[5,17,29,41]},{"area":"servicios","l":"GRANELES DE ACEITE, FRUCTOSA Y ACETICO","w":[5,31]},{"area":"servicios","l":"SISTEMA DE FILTRACION DE AGUA 1","w":[3,8,13,18,23,28,33,38,43,48]},{"area":"servicios","l":"SISTEMA DE FILTRACION DE AGUA 2","w":[2,7,12,17,22,27,32,37,42,47,52]},{"area":"servicios","l":"TORRE DE ENFRIAMIENTO","w":[6,14,22,30,38,46]},{"area":"servicios","l":"BOMBA CONDENSADOS","w":[5,31]},{"area":"servicios","l":"CISTERNAS Y TANQUES DE ALMACENAMIENTO","w":[9,35]},{"area":"servicios","l":"MANEJADORA DE AIRE","w":[1,17,35,51]},{"area":"servicios","l":"CAMARA FRIA","w":[4,24,44]},{"area":"instalaciones","l":"LÍNEAS DE VAPOR","w":[2,20,38]},{"area":"instalaciones","l":"LÍNEAS DE AIRE","w":[4,22,40]},{"area":"instalaciones","l":"LÍNEAS DE AGUA","w":[3,15,27,39,51]},{"area":"instalaciones","l":"MALLA PERIMETRAL, SISTEMA MECÁNICO Y ELECTRICO","w":[8,34]},{"area":"instalaciones","l":"OFICINAS FINANZAS","w":[18,44]},{"area":"instalaciones","l":"OFICINAS OPERACIONES","w":[18,44]},{"area":"instalaciones","l":"DRENAJES","w":[6,23,40]},{"area":"instalaciones","l":"TECHOS DE NAVES","w":[24]},{"area":"instalaciones","l":"ILUMINACIÓN","w":[5,31]},{"area":"instalaciones","l":"EDIFICIOS Y NAVES","w":[13,39]},{"area":"instalaciones","l":"HIDRANTE","w":[11,37]}];

function importarPlanExcel(){
  if(!confirm('Importar plan de mantenimiento 2026?\n\n48 equipos con sus semanas programadas.\nSe cargarán como PM03 sin técnico asignado.\nLas ya importadas NO se duplicarán.')) return;
  let importadas=0,omitidas=0;
  PM03_PLAN_EXCEL.forEach(eq=>{
    eq.w.forEach(semana=>{
      const existe=PM03_PLAN.find(p=>p.linea===eq.l&&p.semana===semana&&p.año===2026&&p.fuenteExcel);
      if(existe){omitidas++;return;}
      PM03_PLAN.push({id:genID('PM03'),linea:eq.l,componente:'Ver plan preventivo',actividad:'Mantenimiento preventivo — '+eq.l,semana,año:2026,area:eq.area,tecnicoId:'',tecnicoNombre:'Sin asignar',estado:'abierta',fuenteExcel:true,ts:Date.now(),horaCreacion:new Date().toISOString(),generadoPor:'Importación Excel',generadoId:'sistema'});
      importadas++;
    });
  });
  saveDB('pm03_plan',PM03_PLAN);
  showAlert('Importadas: '+importadas+' | Ya existían: '+omitidas);
  renderAdminTab('pm03carga');
}

function verPlanExcel(){
  const cont=document.getElementById('admin-content');
  const byArea={};PM03_PLAN_EXCEL.forEach(e=>{if(!byArea[e.area])byArea[e.area]=[];byArea[e.area].push(e);});
  let html=`<button class="btn btn-gray btn-sm" style="width:auto;margin-bottom:12px" onclick="renderAdminTab('pm03carga')">← Regresar</button><div class="card"><div class="card-title mb8">Plan 2026 — ${PM03_PLAN_EXCEL.length} equipos</div>`;
  Object.entries(byArea).forEach(([area,equips])=>{
    html+=`<div style="margin-bottom:12px"><div style="font-weight:800;font-size:13px;color:var(--mo);margin-bottom:4px">${area} (${equips.length})</div>`;
    equips.forEach(e=>{html+=`<div style="font-size:12px;padding:3px 0;border-bottom:1px solid var(--gr4);display:flex;justify-content:space-between"><span>${e.l}</span><span style="color:var(--txt3);font-size:11px">${e.w.length} sem</span></div>`;});
    html+=`</div>`;
  });
  html+=`</div>`;cont.innerHTML=html;
}

function asignarMasivoPM03(){
  const linea=document.getElementById('bulk-linea')?.value;
  const tecSel=document.getElementById('bulk-tecnico');
  if(!linea){showAlert('Selecciona una línea','error');return;}
  if(!tecSel?.value){showAlert('Selecciona un técnico','error');return;}
  const tecId=tecSel.value,tecNom=tecSel.options[tecSel.selectedIndex].text;
  let count=0;
  PM03_PLAN.forEach(p=>{if(p.linea===linea&&!p.tecnicoId){p.tecnicoId=tecId;p.tecnicoNombre=tecNom;count++;}});
  saveDB('pm03_plan',PM03_PLAN);PM03_PLAN.filter(function(p){return p.linea===linea&&p.tecnicoId===tecId;}).forEach(savePM03Supa);showAlert('Asignadas: '+count+' de '+linea+' a '+tecNom);renderAdminTab('pm03carga');
}

function asignarMultiLineas(){
  const tecSel=document.getElementById('bulk-tec-multi');
  if(!tecSel?.value){showAlert('Selecciona un técnico','error');return;}
  const tecId=tecSel.value,tecNom=tecSel.options[tecSel.selectedIndex].text;
  const checked=[...document.querySelectorAll('.bulk-line-check:checked')].map(cb=>cb.value);
  if(!checked.length){showAlert('Selecciona al menos una línea','error');return;}
  let count=0;
  PM03_PLAN.forEach(p=>{if(checked.includes(p.linea)&&!p.tecnicoId){p.tecnicoId=tecId;p.tecnicoNombre=tecNom;count++;}});
  saveDB('pm03_plan',PM03_PLAN);PM03_PLAN.filter(function(p){return checked.includes(p.linea)&&p.tecnicoId===tecId;}).forEach(savePM03Supa);showAlert('Asignadas: '+count+' a '+tecNom);renderAdminTab('pm03carga');
}

function reasignarPM03Item(id){
  const p=PM03_PLAN.find(x=>x.id===id);if(!p)return;
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  const opc=tecs.map((t,i)=>(i+1)+'. '+t.nombre).join('\n');
  const sel=prompt('Reasignar: '+p.linea+' Sem '+p.semana+'\n\n'+opc+'\n\nEscribe número:');
  const idx=parseInt(sel)-1;
  if(idx>=0&&idx<tecs.length){p.tecnicoId=tecs[idx].id;p.tecnicoNombre=tecs[idx].nombre;saveDB('pm03_plan',PM03_PLAN);savePM03Supa(p);showAlert('Asignado a '+tecs[idx].nombre);renderAdminTab('pm03carga');}
}

function filtPM03(f,btn){
  document.querySelectorAll('#admin-content .filter-chip').forEach(c=>{if(c.getAttribute('onclick')?.includes('filtPM03'))c.classList.remove('active');});
  if(btn)btn.classList.add('active');
  const semVal=parseInt(document.getElementById('pm03-filtro-semana')?.value)||0;
  let lista=PM03_PLAN.slice().reverse();
  if(f==='sinAsig') lista=lista.filter(p=>!p.tecnicoId);
  else if(f==='abierta') lista=lista.filter(p=>p.estado!=='cerrada');
  else if(f==='cerrada') lista=lista.filter(p=>p.estado==='cerrada');
  if(semVal>0) lista=lista.filter(p=>p.semana===semVal);
  const tbody=document.querySelector('#pm03-admin-tabla tbody');if(!tbody)return;
  tbody.innerHTML=lista.slice(0,60).map(p=>`<tr>
    <td style="font-size:12px;font-weight:600">${p.linea}</td>
    <td style="font-size:11px">${(p.actividad||'').substring(0,30)}...</td>
    <td style="font-weight:700">${p.semana}</td>
    <td style="font-size:12px;color:${p.tecnicoId?'var(--vd)':'var(--rj)'};font-weight:700">${p.tecnicoId?p.tecnicoNombre:'⚠️ Sin asignar'}</td>
    <td><span class="badge badge-${p.estado||'abierta'}">${p.estado||'abierta'}</span></td>
    <td style="font-size:11px;color:var(--txt3)">${p.generadoPor||'—'}</td>
    <td><button class="btn btn-gray btn-sm" style="padding:3px 8px;font-size:11px;width:auto" onclick="reasignarPM03Item('${p.id}')">✏️</button></td>
  </tr>`).join('');
}

// ─── renderAdminPM03 (full with bulk assign) ───
function renderAdminPM03(cont){
  const sems=Array.from({length:52},(_,i)=>i+1);
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  const sinAsig=PM03_PLAN.filter(p=>!p.tecnicoId&&p.estado!=='cerrada');
  const lineasSinAsig=[...new Set(sinAsig.map(p=>p.linea))].sort();
  cont.innerHTML=`
  <div class="card" style="border:2px solid var(--vd);background:linear-gradient(135deg,var(--vd3),var(--az3));margin-bottom:12px">
    <div class="card-title mb8" style="color:var(--vd)">📥 Plan 2026 — ${PM03_PLAN_EXCEL.length} equipos listos</div>
    <div class="btn-row">
      <button class="btn btn-success btn-sm" onclick="importarPlanExcel()">📥 Importar plan</button>
      <button class="btn btn-outline btn-sm" onclick="verPlanExcel()">👁 Ver equipos</button>
      <button class="btn btn-gray btn-sm" onclick="descargarPM03Excel()">⬇️ Descargar PM03</button>
    </div>
  </div>
  ${sinAsig.length>0?`
  <div class="card" style="border:2px solid var(--am2);margin-bottom:12px">
    <div class="card-title mb8" style="color:var(--am)">⚠️ ${sinAsig.length} actividades sin técnico</div>
    <div style="border-bottom:1px solid var(--gr4);padding-bottom:14px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">📌 Por línea</div>
      <div class="form-group"><label class="form-label">Línea</label>
        <select class="form-control" id="bulk-linea">
          <option value="">-- Selecciona --</option>
          ${lineasSinAsig.map(l=>`<option value="${l}">${l} (${PM03_PLAN.filter(p=>p.linea===l&&!p.tecnicoId).length} sin asignar)</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Técnico</label>
        <select class="form-control" id="bulk-tecnico"><option value="">-- Selecciona --</option>${tecs.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')}</select></div>
      <button class="btn btn-warning" onclick="asignarMasivoPM03()">✅ Asignar todas de esta línea</button>
    </div>
    <div>
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">👨‍🔧 Múltiples líneas a un técnico</div>
      <div class="form-group"><label class="form-label">Técnico</label>
        <select class="form-control" id="bulk-tec-multi"><option value="">-- Selecciona --</option>${tecs.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')}</select></div>
      <div style="border:2px solid var(--gr4);border-radius:10px;padding:10px;max-height:200px;overflow-y:auto;margin-bottom:10px">
        ${lineasSinAsig.map(l=>`<label style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--gr4);font-size:13px;cursor:pointer"><input type="checkbox" class="bulk-line-check" value="${l}" style="width:17px;height:17px"><span><b>${l}</b> — ${PM03_PLAN.filter(p=>p.linea===l&&!p.tecnicoId).length} act.</span></label>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button class="btn btn-gray btn-sm" style="width:auto;padding:7px 14px" onclick="document.querySelectorAll('.bulk-line-check').forEach(c=>c.checked=true)">Todas</button>
        <button class="btn btn-gray btn-sm" style="width:auto;padding:7px 14px" onclick="document.querySelectorAll('.bulk-line-check').forEach(c=>c.checked=false)">Ninguna</button>
      </div>
      <button class="btn btn-primary" onclick="asignarMultiLineas()">✅ Asignar seleccionadas</button>
    </div>
  </div>`:'<div class="card" style="border:2px solid var(--vd);text-align:center;padding:16px;margin-bottom:12px"><div style="font-size:24px">🎉</div><div style="font-weight:700;color:var(--vd);margin-top:6px">Todas con técnico asignado</div></div>'}
  <div class="card mt12">
    <div class="card-title mb8">➕ Agregar PM03 manual</div>
    <div class="form-group"><label class="form-label">Línea</label>
      <select class="form-control" id="p3-linea"><option value="">--</option>
        <optgroup label="⚗️ Proceso">${(LISTAS.lineas_proceso||[]).map(l=>`<option>${l}</option>`).join('')}</optgroup>
        <optgroup label="📦 Envasado">${(LISTAS.lineas_envasado||[]).map(l=>`<option>${l}</option>`).join('')}</optgroup>
        <optgroup label="⚙️ Servicios">${(LISTAS.lineas_servicios||[]).map(l=>`<option>${l}</option>`).join('')}</optgroup>
      </select></div>
    <div class="form-group"><label class="form-label">Componente</label><input type="text" class="form-control" id="p3-comp"></div>
    <div class="form-group"><label class="form-label">Actividad</label><textarea class="form-control" id="p3-act"></textarea></div>
    <div class="form-group"><label class="form-label">Semana</label><select class="form-control" id="p3-sem">${sems.map(s=>`<option value="${s}" ${s===currentWeek()?'selected':''}>Semana ${s}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Técnico</label><select class="form-control" id="p3-tec"><option value="">Sin asignar</option>${tecs.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Paso a paso (opcional)</label><textarea class="form-control" id="p3-pasos"></textarea></div>
    <button class="btn btn-success" onclick="agregarPM03()">📅 Agregar</button>
  </div>
  <div class="card mt12">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div class="card-title" style="margin-bottom:0">📋 Plan PM03 (${PM03_PLAN.length})</div>
      <div style="font-size:12px;color:${sinAsig.length>0?'var(--rj)':'var(--vd)'};font-weight:700">${sinAsig.length} sin asignar</div>
    </div>
    <div class="filter-row">
      <div class="filter-chip active" onclick="filtPM03('todos',this)">Todos</div>
      <div class="filter-chip" onclick="filtPM03('sinAsig',this)" style="color:var(--rj);border-color:var(--rj)">⚠️ Sin asignar</div>
      <div class="filter-chip" onclick="filtPM03('abierta',this)">Abiertos</div>
      <div class="filter-chip" onclick="filtPM03('cerrada',this)">Cerrados</div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <label style="font-size:12px;font-weight:700;color:var(--txt2);white-space:nowrap">📅 Semana:</label>
      <select class="form-control" id="pm03-filtro-semana" onchange="filtPM03('semana',null)" style="max-width:180px;padding:8px 12px">
        <option value="">Todas</option>
        ${sems.map(s=>`<option value="${s}" ${s===currentWeek()?'selected':''}>Semana ${s}</option>`).join('')}
      </select>
    </div>
    <div id="pm03-admin-tabla"><div class="table-wrap"><table><thead><tr><th>Línea</th><th>Actividad</th><th>Sem</th><th>Técnico</th><th>Estado</th><th>Generó</th><th></th></tr></thead><tbody>
      ${PM03_PLAN.slice(-60).reverse().map(p=>`<tr>
        <td style="font-size:12px;font-weight:600">${p.linea}</td>
        <td style="font-size:11px">${(p.actividad||'').substring(0,30)}...</td>
        <td style="font-weight:700">${p.semana}</td>
        <td style="font-size:12px;color:${p.tecnicoId?'var(--vd)':'var(--rj)'};font-weight:700">${p.tecnicoId?p.tecnicoNombre:'⚠️'}</td>
        <td><span class="badge badge-${p.estado||'abierta'}">${p.estado||'abierta'}</span></td>
        <td style="font-size:11px;color:var(--txt3)">${p.generadoPor||'—'}</td>
        <td><button class="btn btn-gray btn-sm" style="padding:3px 8px;font-size:11px;width:auto" onclick="reasignarPM03Item('${p.id}')">✏️</button></td>
      </tr>`).join('')}
    </tbody></table></div></div>
  </div>`;
}

// ─── renderMisOrdenes (full) ───
function renderMisOrdenes(){
  const fDiv=document.getElementById('ordenes-filtros');
  const lDiv=document.getElementById('mis-ordenes-list');
  const r=currentUser.rol;
  if(r==='operador'){
    fDiv.innerHTML='';
    const mias=ORDENES.filter(o=>o.levantadoId===currentUser.id&&o.colorOT==='azul'&&o.estado!=='cerrada');
    lDiv.innerHTML=mias.length?mias.sort((a,b)=>b.ts-a.ts).map(o=>renderOTCard(o)).join(''):'<div class="card text-center" style="padding:40px"><div style="font-size:48px">🎉</div><div style="font-weight:700;margin-top:12px">Sin pendientes azules</div></div>';
    return;
  }
  if(r==='lider'){
    fDiv.innerHTML='';
    const mias=ORDENES.filter(o=>o.levantadoId===currentUser.id&&o.estado!=='cerrada');
    lDiv.innerHTML=mias.length?mias.sort((a,b)=>b.ts-a.ts).map(o=>renderOTCard(o)).join(''):'<p style="color:var(--txt3);font-size:13px">Sin pendientes propios.</p>';
    return;
  }
  const isAdmin=r==='admin'||r==='super';
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  const años=[currentYear()-1,currentYear(),currentYear()+1];
  fDiv.innerHTML=`
    <div class="filter-row"><div class="filter-chip active" onclick="setFP('estado','todos',this)">Todos</div><div class="filter-chip" onclick="setFP('estado','abierta',this)">Abiertas</div><div class="filter-chip" onclick="setFP('estado','cerrada',this)">Cerradas</div></div>
    <div class="filter-row"><div class="filter-chip active" onclick="setFP('tipo','todas',this)">Todos tipos</div><div class="filter-chip" onclick="setFP('tipo','PM01',this)">PM01</div><div class="filter-chip" onclick="setFP('tipo','PM02',this)">PM02</div><div class="filter-chip" onclick="setFP('tipo','PM03',this)">PM03</div><div class="filter-chip" onclick="setFP('tipo','PM04',this)">PM04</div></div>
    <div class="filter-row"><div class="filter-chip active" onclick="setFP('color','todos',this)">Todos colores</div><div class="filter-chip" onclick="setFP('color','azul',this)">🔵 Azul</div><div class="filter-chip" onclick="setFP('color','rojo',this)">🔴 Rojo</div></div>
    <div class="filter-row"><div class="filter-chip active" onclick="setFP('prio','todas',this)">Toda prioridad</div><div class="filter-chip" onclick="setFP('prio','A',this)">Prio A</div><div class="filter-chip" onclick="setFP('prio','B',this)">Prio B</div><div class="filter-chip" onclick="setFP('prio','C',this)">Prio C</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <div style="flex:1;min-width:120px"><label style="font-size:12px;font-weight:700;color:var(--txt2);display:block;margin-bottom:4px">📅 Semana</label>
        <select class="form-control" id="fp-semana" onchange="aplicarFiltrosPendientes()" style="padding:8px 12px">
          <option value="">Todas</option>${Array.from({length:52},(_,i)=>i+1).map(s=>`<option value="${s}" ${s===currentWeek()?'selected':''}>Sem ${s}</option>`).join('')}
        </select></div>
      <div style="flex:1;min-width:100px"><label style="font-size:12px;font-weight:700;color:var(--txt2);display:block;margin-bottom:4px">Año</label>
        <select class="form-control" id="fp-año" onchange="aplicarFiltrosPendientes()" style="padding:8px 12px">
          ${años.map(a=>`<option value="${a}" ${a===currentYear()?'selected':''}>${a}</option>`).join('')}
        </select></div>
    </div>
    ${isAdmin?`<div class="form-group mb8"><label class="form-label">Por técnico</label><select class="form-control" id="fpen-tecnico" onchange="aplicarFiltrosPendientes()"><option value="">Todos</option>${tecs.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')}</select></div>`:''}`;
  aplicarFiltrosPendientes();
}

// ─── setFP ───

function setFP(k,v,btn){filtrosPend[k]=v;btn.closest('.filter-row').querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));btn.classList.add('active');aplicarFiltrosPendientes();}

// ─── renderGestionLinea ───
function renderGestionLinea(){
  const cont=document.getElementById('gestion-content');
  const hoy=todayStr();const año=currentYear();
  const meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const tecs=USERS.filter(u=>u.rol==='tecnico');
  cont.innerHTML=`<div class="card"><div class="card-title mb8">🔍 Filtros</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div><label class="form-label">Fecha</label><input type="date" class="form-control" id="gl-fecha" value="${hoy}"></div>
      <div><label class="form-label">Turno</label><select class="form-control" id="gl-turno"><option value="">Todos</option>${TURNOS.map(t=>`<option value="${t.id}">Turno ${t.id}</option>`).join('')}</select></div>
      <div><label class="form-label">Mes</label><select class="form-control" id="gl-mes"><option value="">Todos</option>${meses.map((m,i)=>`<option value="${i+1}" ${i+1===new Date().getMonth()+1?'selected':''}>${m}</option>`).join('')}</select></div>
      <div><label class="form-label">Año</label><select class="form-control" id="gl-año">${[año-1,año,año+1].map(a=>`<option value="${a}" ${a===año?'selected':''}>${a}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label class="form-label">Técnico</label><select class="form-control" id="gl-tecnico"><option value="">Todos</option>${tecs.map(t=>`<option value="${t.id}">${t.nombre}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">Línea</label><select class="form-control" id="gl-linea"><option value="">Todas</option>${(LISTAS.lineas_proceso||[]).concat(LISTAS.lineas_envasado||[]).map(l=>`<option value="${l}">${l}</option>`).join('')}</select></div>
    <button class="btn btn-primary" onclick="aplicarGestion()">🔍 Buscar</button>
  </div>
  <div id="gestion-resultados" class="mt12"><div class="card text-center" style="padding:32px;color:var(--txt3)"><div style="font-size:40px">📡</div><div style="font-weight:700">Cargando datos de hoy...</div></div></div>`;
  setTimeout(()=>aplicarGestion(),100);
}




// ================================================================
// SUPABASE INTEGRATION
// ================================================================
var SUPA_URL='https://bwjvmtwkgvyewyjfazou.supabase.co';
var SUPA_KEY='sb_publishable_bMC14dd2RT3n0Ka3Mwb8Yg_JRXlz-OE';
var SUPER_PWD='Apocalipsis$2016';

function supaFetch(t,m,b,p){var url=SUPA_URL+'/rest/v1/'+t+(p?'?'+p:'');var o={method:m||'GET',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':m==='POST'?'return=representation':''}};if(b)o.body=JSON.stringify(b);return fetch(url,o).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});}
function supaUpsert(t,b){window._supaUpsert=supaUpsert;return fetch(SUPA_URL+'/rest/v1/'+t,{method:'POST',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(b)}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});}

function syncSupabase(){
  supaFetch('usuarios','GET',null,'activo=eq.true').then(function(rows){
    if(!rows||!rows.length){supaUpsert('usuarios',DEFAULT_USERS.filter(function(u){return u.rol!=='super';}).map(function(u){return{id:u.id,username:u.username,nombre:u.nombre,password_hash:u.password,rol:u.rol,activo:true};})  ).catch(function(){});return;}
    USERS=rows.map(function(r){return{id:r.id,username:r.username,nombre:r.nombre,password:r.password_hash,rol:r.rol}});saveDB('users',USERS);
  }).catch(function(){});
  supaFetch('ordenes','GET',null,'order=ts.desc&limit=500').then(function(rows){
    if(!rows)return;
    ORDENES=rows.map(function(r){return{id:r.id,tipo:r.tipo,area:r.area,linea:r.linea,componente:r.componente,prioridad:r.prioridad,tipoAnormalidad:r.tipo_anormalidad,detalle:r.detalle,foto:r.foto,tecnicoAsignado:r.tecnico_asignado,tecnicoNombre:r.tecnico_nombre,levantadoPor:r.levantado_por,levantadoId:r.levantado_id,estado:r.estado,colorOT:r.color_ot,semana:r.semana,año:r.anio,ts:r.ts,observacionesCierre:r.observaciones_cierre,horasCierre:r.horas_cierre||0,horaInicioTrabajo:r.hora_inicio_trabajo,horaFinTrabajo:r.hora_fin_trabajo,cerradaTs:r.cerrada_ts,cerradaPor:r.cerrada_por,refaccionesUsadas:r.refacciones_usadas,causaRaiz:r.causa_raiz,horaLlamado:r.hora_llamado,horaInicio:r.hora_inicio,horaEntrega:r.hora_entrega,tiempoRespuesta:r.tiempo_respuesta,mttr:r.mttr,turno:r.turno,liderPM04:r.lider_pm04,historialReasignacion:r.historial_reasignacion||[],historialModificacion:r.historial_modificacion||[]}});saveDB('ordenes',ORDENES);
  }).catch(function(){});
  supaFetch('pm03_plan','GET',null,'order=semana.asc&limit=1000').then(function(rows){
    if(!rows)return;
    var localPM03=loadDB('pm03_plan',[]);
    PM03_PLAN=rows.map(function(r){
      // Preserve local cerrada state if Supabase has it as abierta (sync lag)
      var local=localPM03.find(function(l){return l.id===r.id;});
      var estadoFinal=r.estado;
      if(local&&local.estado==='cerrada'&&r.estado==='abierta'){
        estadoFinal='cerrada';
        supaUpsert('pm03_plan',{id:r.id,estado:'cerrada',horas_cierre:local.horasCierre||0,observaciones_cierre:local.observacionesCierre||null,cerrada_ts:local.cerradaTs||null,cerrada_por:local.cerradaPor||null,tecnico_id:local.tecnicoId||null,tecnico_nombre:local.tecnicoNombre||null}).catch(function(){});
      }
      // Also: if Supabase has cerrada_ts but estado=abierta, fix it
      if(r.cerrada_ts&&r.estado==='abierta'){
        estadoFinal='cerrada';
        supaUpsert('pm03_plan',{id:r.id,estado:'cerrada'}).catch(function(){});
      }
      return {id:r.id,linea:r.linea,componente:r.componente,actividad:r.actividad,area:r.area,semana:r.semana,año:r.anio,tecnicoId:r.tecnico_id,tecnicoNombre:r.tecnico_nombre,estado:estadoFinal,fuenteExcel:r.fuente_excel,esInspeccion:r.es_inspeccion,horasCierre:estadoFinal==='cerrada'&&local?local.horasCierre||r.horas_cierre||0:r.horas_cierre||0,observacionesCierre:estadoFinal==='cerrada'&&local?local.observacionesCierre||r.observaciones_cierre:r.observaciones_cierre,cerradaTs:estadoFinal==='cerrada'&&local?local.cerradaTs||r.cerrada_ts:r.cerrada_ts,cerradaPor:estadoFinal==='cerrada'&&local?local.cerradaPor||r.cerrada_por:r.cerrada_por,generadoPor:r.generado_por,ts:r.ts};
    });
    saveDB('pm03_plan',PM03_PLAN);
  }).catch(function(){});
  supaFetch('refacciones','GET',null,'order=codigo.asc').then(function(rows){if(rows&&rows.length){REFACCIONES=rows;saveDB('refacciones',REFACCIONES);}}).catch(function(){});
  supaFetch('mtbf_data','GET',null,'order=anio.desc,semana.desc').then(function(rows){if(rows&&rows.length){MTBF_DATA=rows;saveDB('mtbf_data',MTBF_DATA);}}).catch(function(){});
  supaFetch('gasto_data','GET',null,'order=anio.asc,semana.asc').then(function(rows){if(rows&&rows.length){GASTO_DATA=rows;saveDB('gasto_data',GASTO_DATA);}}).catch(function(){});
  supaFetch('inspecciones','GET',null,'order=created_at.desc&limit=200').then(function(rows){if(rows&&rows.length){INSPECCIONES=rows;saveDB('inspecciones',INSPECCIONES);}}).catch(function(){});
  // Process offline queue
  setTimeout(processSyncQueue, 2000);
}

function saveOrdenSupa(o){supaUpsert('ordenes',{id:o.id,tipo:o.tipo,area:o.area,linea:o.linea,componente:o.componente,prioridad:o.prioridad,tipo_anormalidad:o.tipoAnormalidad,detalle:o.detalle,foto:o.foto||null,tecnico_asignado:o.tecnicoAsignado||null,tecnico_nombre:o.tecnicoNombre||null,levantado_por:o.levantadoPor,levantado_id:o.levantadoId,estado:o.estado,color_ot:o.colorOT||null,semana:o.semana,anio:o.año,ts:o.ts,observaciones_cierre:o.observacionesCierre||null,horas_cierre:o.horasCierre||0,hora_inicio_trabajo:o.horaInicioTrabajo||null,hora_fin_trabajo:o.horaFinTrabajo||null,cerrada_ts:o.cerradaTs||null,cerrada_por:o.cerradaPor||null,refacciones_usadas:o.refaccionesUsadas||null,causa_raiz:o.causaRaiz||null,hora_llamado:o.horaLlamado||null,hora_inicio:o.horaInicio||null,hora_entrega:o.horaEntrega||null,tiempo_respuesta:o.tiempoRespuesta||null,mttr:o.mttr||null,turno:o.turno||null,lider_pm04:o.liderPM04||null,hora_llamado:o.horaLlamado||null,hora_inicio:o.horaInicio||null,hora_entrega:o.horaEntrega||null,causa_raiz:o.causaRaiz||null,es_trabajo_varios_dias:o.esTrabajoVariosDias||false,trabajo_dias:o.trabajoDias||[],historial_reasignacion:o.historialReasignacion||[],historial_modificacion:o.historialModificacion||[]}).catch(function(){});}
function savePM03Supa(p){supaUpsert('pm03_plan',{id:p.id,linea:p.linea,componente:p.componente||null,actividad:p.actividad,area:p.area||null,semana:p.semana,anio:p.año||2026,tecnico_id:p.tecnicoId||null,tecnico_nombre:p.tecnicoNombre||null,estado:p.estado||'abierta',fuente_excel:p.fuenteExcel||false,horas_cierre:p.horasCierre||0,observaciones_cierre:p.observacionesCierre||null,cerrada_ts:p.cerradaTs||null,cerrada_por:p.cerradaPor||null,generado_por:p.generadoPor||null,ts:p.ts||Date.now()}).catch(function(){});}
function deleteOrdenSupa(id){fetch(SUPA_URL+'/rest/v1/ordenes?id=eq.'+id,{method:'DELETE',headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}}).catch(function(){});}

// PM03 Excel Plan






// Monthly gasto summary
function calcResumenMes(anioVal,semanasArr){
  var gs=GASTO_DATA.filter(function(g){return semanasArr.includes(g.semana)&&g.año===anioVal;});
  if(!gs.length)return '';
  var tp=gs.reduce(function(s,g){return s+(g.planeado||0);},0);
  var tr=gs.reduce(function(s,g){return s+(g.real||0);},0);
  var ok=tr<=tp,pct=tp>0?Math.min(100,Math.round(tr/tp*100)):0;
  var col=ok?'#2E7D32':'#C62828';
  return '<div style="border:2px solid '+col+';background:'+(ok?'#E8F5E9':'#FFEBEE')+';border-radius:12px;padding:14px;margin-bottom:12px">'
    +'<div style="font-weight:800;font-size:14px;color:'+col+';margin-bottom:8px">'+(ok?'✅':'🔴')+' Resumen del mes</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:8px">'
    +'<div style="flex:1;background:rgba(255,255,255,.7);border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:#1565C0">$'+tp.toFixed(0)+'</div><div style="font-size:10px;font-weight:700">PLANEADO</div></div>'
    +'<div style="flex:1;background:rgba(255,255,255,.7);border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px;font-weight:800;color:'+col+'">$'+tr.toFixed(0)+'</div><div style="font-size:10px;font-weight:700">REAL</div></div>'
    +'</div><div style="background:rgba(0,0,0,.1);border-radius:6px;height:14px;overflow:hidden;margin-bottom:6px">'
    +'<div style="width:'+pct+'%;height:100%;background:'+col+';border-radius:6px"></div></div>'
    +'<div style="text-align:center;font-size:13px;font-weight:700;color:'+col+'">'+pct+'% — '+(ok?'Dentro del presupuesto':'Sobre presupuesto $'+Math.abs(tr-tp).toFixed(0))+'</div></div>';
}

function descargarPM03Excel(){
  if(!PM03_PLAN.length){showAlert('Sin PM03','error');return;}
  var hdrs=['ID','Línea','Componente','Actividad','Área','Semana','Año','Técnico','Estado','Generado Por','Horas','Cerrada Por','Fecha Cierre','Fuente Excel'];
  var rows=PM03_PLAN.map(function(p){return[p.id,p.linea||'',p.componente||'',p.actividad||'',p.area||'',p.semana||'',p.año||'',p.tecnicoNombre||'Sin asignar',p.estado||'abierta',p.generadoPor||'',p.horasCierre||0,p.cerradaPor||'',p.cerradaTs?fmtDate(p.cerradaTs):'',p.fuenteExcel?'Si':'No'];});
  generarExcelXML(hdrs, rows, 'Saporis_PM03_'+new Date().toISOString().slice(0,10)+'.xlsx', 'PM03');
  showAlert('Descargadas '+PM03_PLAN.length+' actividades PM03');
}

// ================================================================
// TRIPLE ATENCIÓN A LÍNEA — 3 slots independientes
// ================================================================
var ATENCION_SLOTS = {
  1: null,
  2: null, 
  3: null
};
var currentSlot = 1;

function initSlot(num){
  return {
    slot: num,
    levantadoPor: currentUser.nombre,
    levantadoId: currentUser.id,
    fecha: todayStr(),
    horaLlamado: null,
    horaInicio: null,
    horaEntrega: null,
    falla: '',
    causaRaiz: '',
    tipoPM: null,
    linea: '',
    lineaOtra: '',
    lineaDisplay: '',
    componente: '',
    liderPM04: '',
    refacciones: '',
    foto: null,
    step: 0
  };
}

function updateSlotPreview(){
  for(var i=1;i<=3;i++){
    var s = ATENCION_SLOTS[i];
    var desc = document.getElementById('slot-desc-'+i);
    if(!desc) continue;
    if(!s){
      desc.textContent = 'Disponible';
      desc.style.color = '';
    } else if(s.horaEntrega){
      desc.textContent = '✅ Completada';
      desc.style.color = '#2E7D32';
    } else if(s.horaInicio){
      desc.textContent = '🔧 En reparación — '+(s.lineaDisplay||'');
      desc.style.color = '#E65100';
    } else if(s.horaLlamado){
      desc.textContent = '📞 Llamado registrado — '+(s.lineaDisplay||'');
      desc.style.color = '#1565C0';
    } else {
      desc.textContent = '⏳ En progreso — '+(s.lineaDisplay||'');
      desc.style.color = '#6A1B9A';
    }
  }
}

function showAtencionSlots(){
  // Show slot selector
  var cont = document.getElementById('atencion-content');
  showScreen('screen-atencion');
  document.querySelector('#screen-atencion .topbar-title').textContent = '⚡ Atención a Línea';
  document.getElementById('atc-btn-next').style.display='none';
  document.querySelector('#screen-atencion .fixed-bar').style.display='none';
  
  var html = '<div style="padding:16px"><div class="wizard-title">⚡ Selecciona un slot de atención</div><div class="wizard-sub">Puedes tener hasta 3 atenciones simultáneas. Cada una guarda su progreso independientemente.</div>';
  html += '<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">';
  
  for(var i=1;i<=3;i++){
    var s = ATENCION_SLOTS[i];
    var statusColor = !s ? 'var(--gr4)' : s.horaEntrega ? 'var(--vd)' : s.horaInicio ? 'var(--am2)' : s.horaLlamado ? 'var(--az)' : 'var(--mo)';
    var statusText = !s ? 'Disponible' : s.horaEntrega ? '✅ Completada — '+fmtTime(s.horaEntrega) : s.horaInicio ? '🔧 En reparación desde '+fmtTime(s.horaInicio) : s.horaLlamado ? '📞 Llamado registrado '+fmtTime(s.horaLlamado) : '⏳ Iniciada';
    var statusBg = !s ? 'var(--gr3)' : s.horaEntrega ? 'var(--vd3)' : s.horaInicio ? 'var(--am3)' : s.horaLlamado ? 'var(--az3)' : 'var(--mo3)';
    
    html += '<div style="background:#fff;border-radius:14px;padding:16px;box-shadow:var(--shadow);border-left:5px solid '+statusColor+';cursor:pointer" onclick="abrirSlot('+i+')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<div><div style="font-family:Nunito,sans-serif;font-size:17px;font-weight:800">Atención '+i+'</div>';
    if(s && s.lineaDisplay) html += '<div style="font-size:13px;color:var(--txt2);margin-top:2px">'+s.lineaDisplay+'</div>';
    html += '</div>';
    html += '<div style="background:'+statusBg+';padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;color:'+statusColor+'">'+statusText+'</div>';
    html += '</div>';
    if(s && s.horaLlamado && !s.horaEntrega){
      html += '<div style="display:flex;gap:8px;margin-top:10px;font-size:12px;color:var(--txt3)">';
      if(s.horaLlamado) html += '<span>📞 '+fmtTime(s.horaLlamado)+'</span>';
      if(s.horaInicio) html += '<span>🔧 '+fmtTime(s.horaInicio)+'</span>';
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div></div>';
  cont.innerHTML = html;
}

function abrirSlot(num){
  // Permisivo: slot 2 requiere que slot 1 haya sido iniciado alguna vez
  // Una vez desbloqueado, permanece accesible aunque el anterior se haya cerrado
  if(num===2 && !ATENCION_SLOTS[1] && !loadDB('slot2_desbloqueado',false)){
    showAlert('Primero registra la hora de llamado en Atención 1','error');return;
  }
  if(num===3 && !ATENCION_SLOTS[2] && !loadDB('slot3_desbloqueado',false)){
    showAlert('Primero registra la hora de llamado en Atención 2','error');return;
  }
  // Mark as unlocked permanently once accessed
  if(num===2) saveDB('slot2_desbloqueado',true);
  if(num===3) saveDB('slot3_desbloqueado',true);
  currentSlot = num;
  if(!ATENCION_SLOTS[num]){
    ATENCION_SLOTS[num] = initSlot(num);
  }
  atencionState = ATENCION_SLOTS[num];
  atencionStepNum = 0; // Always start at step 0
  var titleEl = document.getElementById('atc-topbar-title');
  if(titleEl) titleEl.textContent = '⚡ Atención ' + num;
  var nextBtn = document.getElementById('atc-btn-next');
  if(nextBtn) nextBtn.style.display = '';
  var bar = document.getElementById('atc-fixed-bar');
  if(bar) bar.style.display = '';
  showScreen('screen-atencion');
  renderAtencionStep();
}

function saveCurrentSlot(){
  if(currentSlot && ATENCION_SLOTS[currentSlot]){
    ATENCION_SLOTS[currentSlot] = {...atencionState, step: atencionStepNum};
    updateSlotPreview();
  }
}

// Save slot state wrapper - called by abrirSlot before navigation

// Update back button to return to slot selector
function atencionBackToSlots(){
  saveCurrentSlot();
  showAtencionSlots();
  document.getElementById('atc-btn-next').style.display='none';
  var bar = document.querySelector('#screen-atencion .fixed-bar');
  if(bar) bar.style.display='none';
}

// Triple atencion - slot state saved in atencionStep

function initKPISelectors(){
  var semSel=document.getElementById('kpi-sem-sel');
  var añoSel=document.getElementById('kpi-año-sel');
  if(!semSel||!añoSel)return;
  // Always rebuild to ensure options are populated
  var años=[currentYear()-1,currentYear(),currentYear()+1];
  añoSel.innerHTML='<option value="0">Todos los años</option>'+años.map(function(a){return '<option value="'+a+'"'+(a===currentYear()?' selected':'')+'>'+a+'</option>';}).join('');
  var semOpts='<option value="0">Todas las semanas</option><option value="">Actual (Sem '+currentWeek()+')</option>';
  for(var i=1;i<=52;i++){
    semOpts+='<option value="'+i+'"'+(i===currentWeek()?' selected':'')+'>Semana '+i+'</option>';
  }
  semSel.innerHTML=semOpts;
}

function reloadKPIs(){
  var semSel = document.getElementById('kpi-sem-sel');
  var añoSel = document.getElementById('kpi-año-sel');
  var semRaw = semSel ? semSel.value : '';
  var sem = semRaw===''?currentWeek():parseInt(semRaw)||0;
  var año = añoSel ? (parseInt(añoSel.value)||currentYear()) : currentYear();
  renderKPIs('tecnico', sem, año);
}

function updatePendChart(){
  var wrap = document.getElementById('pend-chart-wrap');
  if(!wrap) return;
  var semSel = document.getElementById('fp-semana');
  var añoSel = document.getElementById('fp-año');
  var tecSel = document.getElementById('fpen-tecnico');
  var sem = semSel ? parseInt(semSel.value)||0 : 0;
  var año = añoSel ? parseInt(añoSel.value)||currentYear() : currentYear();
  var tecId = tecSel ? tecSel.value : '';
  
  // Get PM03 matching filters
  var r=currentUser.rol;
  var pm03List = PM03_PLAN.filter(function(p){
    if(p.esInspeccion) return false;
    if(sem > 0 && p.semana !== sem) return false;
    if(p.año !== año) return false;
    if(tecId && p.tecnicoId !== tecId) return false;
    // For tecnico: only their assigned PM03
    if(r==='tecnico' && !tecId && p.tecnicoId && p.tecnicoId!==currentUser.id) return false;
    return true;
  });
  // Also include PM02 and PM04 for the chart
  var otsList = ORDENES.filter(function(o){
    if(o.tipo!=='PM02'&&o.tipo!=='PM04') return false;
    if(sem > 0 && o.semana !== sem) return false;
    if(tecId && o.tecnicoAsignado !== tecId) return false;
    if(r==='tecnico' && !tecId && o.tecnicoAsignado && o.tecnicoAsignado!==currentUser.id) return false;
    return true;
  });
  var allItems = pm03List.concat(otsList);
  
  if(!pm03List.length){wrap.style.display='none';return;}
  wrap.style.display='block';
  
  var total = allItems.length;
  var cerradas = allItems.filter(function(p){return (p.estado||'')=='cerrada';}).length;
  var pct = total > 0 ? Math.round((cerradas/total)*100) : 0;
  
  var color = pct <= 50 ? '#E53935' : pct <= 80 ? '#FFB300' : '#43A047';
  var emoji = pct > 80 ? '👏' : '';
  
  document.getElementById('pend-chart-pct').textContent = pct + '%';
  document.getElementById('pend-chart-pct').style.color = color;
  document.getElementById('pend-chart-emoji').textContent = emoji;
  document.getElementById('pend-chart-legend').innerHTML =
    '<div>📋 Total PM03: <b>' + total + '</b></div>' +
    '<div style="color:#43A047">✅ Cerradas: <b>' + cerradas + '</b></div>' +
    '<div style="color:#E53935">🔴 Abiertas: <b>' + (total-cerradas) + '</b></div>' +
    '<div style="color:'+color+';font-weight:800;font-size:14px;margin-top:4px">Cumplimiento: ' + pct + '%</div>';
  
  // Draw chart
  var canvas = document.getElementById('chart-pend-cumpl');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  var cx=W/2, cy=H/2, r=Math.min(W,H)/2-6, thickness=18;
  // Background circle
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle='#ECEFF1';ctx.lineWidth=thickness;ctx.stroke();
  // Progress arc
  if(pct > 0){
    var startAngle = -Math.PI/2;
    var endAngle = startAngle + (pct/100)*Math.PI*2;
    ctx.beginPath();ctx.arc(cx,cy,r,startAngle,endAngle);
    ctx.strokeStyle=color;ctx.lineWidth=thickness;
    ctx.lineCap='round';ctx.stroke();
  }
}






// ================================================================
// HISTORIAL DE MÁQUINAS
// ================================================================
var histFiltros = {estado:'todas',tipo:'todas',prio:'todas',color:'todos'};

function showHistorial(){
  showScreen('screen-historial');
  var semSel=document.getElementById('hist-sem');
  if(semSel&&semSel.options.length<=1){
    for(var i=1;i<=52;i++){
      var o=document.createElement('option');
      o.value=i;o.textContent='Sem '+i;
      if(i===currentWeek())o.selected=true;
      semSel.appendChild(o);
    }
  }
  var linSel=document.getElementById('hist-linea');
  if(linSel&&linSel.options.length<=1){
    var todas=(LISTAS.lineas_proceso||[]).concat(LISTAS.lineas_envasado||[]).concat(LISTAS.lineas_servicios||[]).concat(LISTAS.lineas_bodega||[]);
    todas.forEach(function(l){var o=document.createElement('option');o.value=l;o.textContent=l;linSel.appendChild(o);});
  }
}

function setHistFiltro(tipo,val,btn){
  histFiltros[tipo]=val;
  var row=btn.closest('.filter-row');
  if(row)row.querySelectorAll('.filter-chip').forEach(function(c){c.classList.remove('active');});
  btn.classList.add('active');
}

function buscarHistorial(){
  var linea=document.getElementById('hist-linea').value;
  if(!linea){showAlert('Selecciona una línea primero','error');return;}
  var sem=parseInt(document.getElementById('hist-sem').value)||0;
  var mes=parseInt(document.getElementById('hist-mes').value)||0;
  var ano=parseInt(document.getElementById('hist-año').value)||currentYear();
  var cont=document.getElementById('hist-results');

  var ots=ORDENES.filter(function(o){
    if(o.linea!==linea)return false;
    if(histFiltros.estado!=='todas'&&o.estado!==histFiltros.estado)return false;
    if(histFiltros.tipo!=='todas'&&o.tipo!==histFiltros.tipo)return false;
    if(histFiltros.prio!=='todas'&&o.prioridad!==histFiltros.prio)return false;
    if(histFiltros.color!=='todos'&&o.colorOT!==histFiltros.color)return false;
    if(sem>0&&o.semana!==sem)return false;
    if(mes>0){var d=new Date(o.ts);if(d.getMonth()+1!==mes||d.getFullYear()!==ano)return false;}
    else if(o.año&&o.año!==ano)return false;
    return true;
  }).sort(function(a,b){return b.ts-a.ts;});

  var pm03s=PM03_PLAN.filter(function(p){
    if(p.linea!==linea)return false;
    if(histFiltros.tipo!=='todas'&&histFiltros.tipo!=='PM03')return false;
    if(histFiltros.estado!=='todas'&&p.estado!==histFiltros.estado)return false;
    if(sem>0&&p.semana!==sem)return false;
    if(p.año&&p.año!==ano)return false;
    return true;
  });

  var total=ots.length+pm03s.length;
  if(!total){
    cont.innerHTML='<div class="card text-center" style="padding:32px"><div style="font-size:40px">📭</div><div style="font-weight:700;margin-top:8px">Sin registros para esta línea</div></div>';
    return;
  }

  var cerradas=ots.filter(function(o){return o.estado==='cerrada';}).length+pm03s.filter(function(p){return p.estado==='cerrada';}).length;
  var abiertas=total-cerradas;

  var html='<div style="font-size:13px;font-weight:700;color:var(--txt2);margin-bottom:10px">'+total+' registro(s) — <b>'+linea+'</b></div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">'
    +'<div class="kpi-card" style="border-top:3px solid var(--mo)"><div class="kpi-num" style="color:var(--mo)">'+total+'</div><div class="kpi-label">Total</div></div>'
    +'<div class="kpi-card" style="border-top:3px solid var(--vd)"><div class="kpi-num" style="color:var(--vd)">'+cerradas+'</div><div class="kpi-label">Cerradas</div></div>'
    +'<div class="kpi-card" style="border-top:3px solid var(--am2)"><div class="kpi-num" style="color:var(--am2)">'+abiertas+'</div><div class="kpi-label">Abiertas</div></div>'
    +'</div>';

  pm03s.forEach(function(p){
    html+='<div class="ot-card pm03"><div style="display:flex;justify-content:space-between"><span style="font-weight:700">'+(p.actividad||p.linea||'')+'</span><span class="badge badge-'+(p.estado||'abierta')+'">'+(p.estado||'abierta')+'</span></div><div style="font-size:12px;color:var(--txt2);margin-top:4px">Sem '+p.semana+'/'+p.año+' - '+(p.tecnicoNombre||'Sin asignar')+'</div></div>';
  });

  ots.forEach(function(o){
    var ic=o.esTrabajoVariosDias?'📅 ':'';
    html+='<div class="ot-card '+(o.tipo||'').toLowerCase()+' '+(o.colorOT?'color-'+o.colorOT:'')+'">'
      +'<div style="display:flex;justify-content:space-between"><span style="font-size:11px;color:var(--txt3)">'+ic+o.id+'</span>'
      +'<div style="display:flex;gap:4px"><span class="badge badge-'+(o.tipo||'').toLowerCase()+'">'+(o.tipo||'')+'</span>'
      +'<span class="badge badge-'+(o.estado||'')+'">'+(o.estado||'')+'</span></div></div>'
      +'<div style="font-weight:700;margin-top:4px">'+(o.componente||o.linea||'')+'</div>'
      +'<div style="font-size:12px;color:var(--txt2)">'+(fmtDate(o.ts)||'')+' - '+(o.tecnicoNombre||'Sin asignar')+'</div></div>';
  });

  cont.innerHTML=html;
}

// ================================================================
// ACTIVOS
// ================================================================
function showActivos(){
  showScreen('screen-activos');
}

// ================================================================
// MANUALES Y ENTRENAMIENTO
// ================================================================
var MANUALES_DATA={};
var currentManualCat='';

var MANUAL_CATS=[
  {id:'capacitaciones_generales',label:'Capacitaciones Generales',icon:'🎓'},
  {id:'instalaciones',label:'Instalaciones',icon:'🏗️'},
  {id:'areas_comunes',label:'Áreas Comunes',icon:'🏢'},
  {id:'conocimiento_general',label:'Conocimiento General',icon:'📖'},
  {id:'servicios',label:'Servicios',icon:'⚙️'},
  {id:'envasado',label:'Envasado',icon:'📦'},
  {id:'proceso',label:'Proceso',icon:'⚗️'}
];

function showManuales(){
  showScreen('screen-manuales');
  var cont=document.getElementById('manuales-content');
  var html='<div class="wizard-title" style="margin-bottom:16px">📚 Manuales y Entrenamiento</div><div style="display:flex;flex-direction:column;gap:10px">';
  MANUAL_CATS.forEach(function(cat){
    var count=(MANUALES_DATA[cat.id]||[]).length;
    var btn=document.createElement('div');
    btn.className='card';
    btn.style.cssText='padding:14px;cursor:pointer;display:flex;align-items:center;gap:14px';
    btn.dataset.catid=cat.id;
    btn.dataset.catlabel=cat.label;
    btn.onclick=function(){showManualCat(this.dataset.catid,this.dataset.catlabel);};
    btn.innerHTML='<div style="font-size:32px">'+cat.icon+'</div>'
      +'<div style="flex:1"><div style="font-weight:800;font-size:15px">'+cat.label+'</div>'
      +'<div style="font-size:12px;color:var(--txt2)">'+count+' documento(s)</div></div>'
      +'<div style="color:var(--txt3);font-size:20px">›</div>';
    cont.innerHTML=html+'</div>';
    cont.appendChild ? null : null;
  });
  // Build with DOM instead of innerHTML to avoid quote issues
  cont.innerHTML='';
  var titleDiv=document.createElement('div');
  titleDiv.className='wizard-title';
  titleDiv.style.marginBottom='16px';
  titleDiv.textContent='📚 Manuales y Entrenamiento';
  cont.appendChild(titleDiv);
  var listDiv=document.createElement('div');
  listDiv.style.cssText='display:flex;flex-direction:column;gap:10px';
  MANUAL_CATS.forEach(function(cat){
    var count=(MANUALES_DATA[cat.id]||[]).length;
    var card=document.createElement('div');
    card.className='card';
    card.style.cssText='padding:14px;cursor:pointer;display:flex;align-items:center;gap:14px';
    card.dataset.catid=cat.id;
    card.dataset.catlabel=cat.label;
    card.onclick=function(){showManualCat(this.dataset.catid,this.dataset.catlabel);};
    card.innerHTML='<div style="font-size:32px">'+cat.icon+'</div>'
      +'<div style="flex:1"><div style="font-weight:800;font-size:15px">'+cat.label+'</div>'
      +'<div style="font-size:12px;color:var(--txt2)">'+count+' documento(s)</div></div>'
      +'<div style="color:var(--txt3);font-size:20px">›</div>';
    listDiv.appendChild(card);
  });
  cont.appendChild(listDiv);
}

function showManualCat(catId,catLabel){
  currentManualCat=catId;
  var titleEl=document.getElementById('manual-cat-title');
  if(titleEl)titleEl.textContent=catLabel;
  showScreen('screen-manual-cat');
  renderManualCat(catId);
}

function renderManualCat(catId){
  var list=document.getElementById('manual-cat-list');
  var docs=MANUALES_DATA[catId]||[];
  var isAdmin=currentUser&&(currentUser.rol==='admin'||currentUser.rol==='super');
  list.innerHTML='';

  if(isAdmin){
    var addBtn=document.createElement('button');
    addBtn.className='btn btn-primary';
    addBtn.style.marginBottom='12px';
    addBtn.textContent='📤 Agregar documento';
    addBtn.onclick=function(){document.getElementById('manual-upload-wrap').classList.remove('hidden');};
    list.appendChild(addBtn);
  }

  if(!docs.length){
    var empty=document.createElement('div');
    empty.className='card text-center';
    empty.style.padding='32px';
    empty.innerHTML='<div style="font-size:40px">📂</div><div style="font-weight:700;margin-top:8px">Sin documentos aún</div>'+(isAdmin?'<div style="font-size:13px;color:var(--txt2);margin-top:4px">Toca Agregar documento para subir el primero</div>':'');
    list.appendChild(empty);
  } else {
    docs.forEach(function(doc){
      var icon=doc.archivo_tipo&&doc.archivo_tipo.includes('pdf')?'📄':doc.archivo_tipo&&doc.archivo_tipo.includes('image')?'🖼️':doc.archivo_tipo&&doc.archivo_tipo.includes('video')?'🎥':'📎';
      var card=document.createElement('div');
      card.className='card';
      card.style.cssText='padding:14px;margin-bottom:8px';
      var inner='<div style="display:flex;align-items:center;gap:12px"><div style="font-size:32px">'+icon+'</div>'
        +'<div style="flex:1"><div style="font-weight:700">'+(doc.titulo||'')+'</div>'
        +(doc.descripcion?'<div style="font-size:12px;color:var(--txt2)">'+(doc.descripcion||'')+'</div>':'')
        +'</div></div>';
      if(doc.archivo_url){inner+='<a href="'+doc.archivo_url+'" target="_blank" class="btn btn-outline btn-sm" style="margin-top:10px;font-size:12px">👁 Ver documento</a>';}
      card.innerHTML=inner;
      if(isAdmin){
        var delBtn=document.createElement('button');
        delBtn.className='btn btn-danger btn-sm';
        delBtn.style.cssText='font-size:11px;padding:4px 8px;margin-top:8px;margin-left:8px';
        delBtn.textContent='🗑️';
        delBtn.dataset.catid=catId;
        delBtn.dataset.docid=doc.id;
        delBtn.onclick=function(){eliminarManual(this.dataset.catid,this.dataset.docid);};
        card.appendChild(delBtn);
      }
      list.appendChild(card);
    });
  }
}

function subirManual(){
  var titulo=document.getElementById('manual-titulo').value.trim();
  var desc=document.getElementById('manual-desc').value.trim();
  var fileInput=document.getElementById('manual-file');
  if(!titulo){showAlert('Escribe un título','error');return;}
  if(!fileInput.files.length){showAlert('Selecciona un archivo','error');return;}
  var file=fileInput.files[0];
  var reader=new FileReader();
  reader.onload=function(e){
    var doc={id:genID('DOC'),categoria:currentManualCat,titulo:titulo,descripcion:desc,archivo_nombre:file.name,archivo_tipo:file.type,archivo_url:e.target.result,subido_por:currentUser.nombre,ts:Date.now()};
    if(!MANUALES_DATA[currentManualCat])MANUALES_DATA[currentManualCat]=[];
    MANUALES_DATA[currentManualCat].push(doc);
    saveDB('manuales_'+currentManualCat,MANUALES_DATA[currentManualCat]);
    supaUpsert('manuales',{id:doc.id,categoria:doc.categoria,titulo:doc.titulo,descripcion:doc.descripcion,archivo_nombre:doc.archivo_nombre,archivo_tipo:doc.archivo_tipo,subido_por:doc.subido_por,ts:doc.ts}).catch(function(){});
    document.getElementById('manual-upload-wrap').classList.add('hidden');
    document.getElementById('manual-titulo').value='';
    document.getElementById('manual-desc').value='';
    fileInput.value='';
    renderManualCat(currentManualCat);
    showAlert('Documento subido: '+titulo);
  };
  reader.readAsDataURL(file);
}

function eliminarManual(catId,docId){
  if(!confirm('Eliminar este documento?'))return;
  MANUALES_DATA[catId]=(MANUALES_DATA[catId]||[]).filter(function(d){return d.id!==docId;});
  saveDB('manuales_'+catId,MANUALES_DATA[catId]);
  renderManualCat(catId);
  showAlert('Documento eliminado','warning');
}

function loadManualesLocal(){
  MANUAL_CATS.forEach(function(cat){
    MANUALES_DATA[cat.id]=loadDB('manuales_'+cat.id,[]);
  });
}

// ================================================================
// ASISTENTE IA
// ================================================================
function showIAAsistente(){
  showModal('modal-ia');
}

async function enviarMensajeIA(){
  var input=document.getElementById('ia-input');
  var msg=input.value.trim();
  if(!msg)return;
  input.value='';
  var msgs=document.getElementById('ia-messages');

  var userDiv=document.createElement('div');
  userDiv.style.cssText='background:var(--mo);color:#fff;border-radius:12px;padding:10px 14px;font-size:13px;max-width:85%;align-self:flex-end;margin-left:auto';
  userDiv.textContent=msg;
  msgs.appendChild(userDiv);

  var loadDiv=document.createElement('div');
  loadDiv.style.cssText='background:#fff;border-radius:12px;padding:10px 14px;font-size:13px;max-width:85%;align-self:flex-start;box-shadow:0 1px 4px rgba(0,0,0,.08)';
  loadDiv.textContent='✦ Pensando...';
  msgs.appendChild(loadDiv);
  msgs.scrollTop=msgs.scrollHeight;

  try{
    var resp=await fetch('https://bwjvmtwkgvyewyjfazou.supabase.co/functions/v1/asistente-ia',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3anZtdHdrZ3Z5ZXd5amZhem91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxOTY1NTcsImV4cCI6MjA2MDc3MjU1N30.tGJasFCzMh3MWgLKNMsGBXuFd9tgMQ4GvttPM_5Ghgo'
      },
      body:JSON.stringify({mensaje:msg})
    });
    var data=await resp.json();
    loadDiv.textContent=data.respuesta||data.error||'No pude procesar tu pregunta.';
  }catch(err){
    loadDiv.textContent='Error al conectar. Verifica tu conexión.';
  }
  msgs.scrollTop=msgs.scrollHeight;
}

// ================================================================
// TRABAJO VARIOS DÍAS
// ================================================================
function mostrarFormVariosDias(){
  var cont=document.getElementById('pm-wizard-container');
  var html='<div class="wizard-title">📅 Trabajo de Varios Días</div>'
    +'<div class="wizard-sub">Registra la fecha y horas por día (deja en blanco los que no apliquen)</div>'
    +'<div style="margin-top:12px">';
  for(var i=1;i<=10;i++){
    html+='<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">'
      +'<div style="width:24px;height:24px;background:var(--mo);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">'+i+'</div>'
      +'<input type="date" class="form-control" id="vd-fecha-'+i+'" style="flex:1;padding:8px">'
      +'<input type="number" class="form-control" id="vd-horas-'+i+'" placeholder="Hrs" min="0" max="24" step="0.5" style="width:70px;padding:8px">'
      +'</div>';
  }
  html+='</div>';
  cont.innerHTML=html;
  var saveBtn=document.createElement('button');
  saveBtn.className='btn btn-success mt8';
  saveBtn.textContent='💾 Guardar con registro diario';
  saveBtn.onclick=guardarOTVariosDias;
  cont.appendChild(saveBtn);
  var skipBtn=document.createElement('button');
  skipBtn.className='btn btn-gray mt8';
  skipBtn.textContent='📋 Guardar como Abierta sin días';
  skipBtn.onclick=function(){pmState.resuelta=false;guardarOT();};
  cont.appendChild(skipBtn);
  document.getElementById('pm-btn-next').style.display='none';
}

function guardarOTVariosDias(){
  var dias=[];
  for(var i=1;i<=10;i++){
    var f=document.getElementById('vd-fecha-'+i);
    var h=document.getElementById('vd-horas-'+i);
    if(f&&h&&f.value&&parseFloat(h.value)>0){
      dias.push({fecha:f.value,horas:parseFloat(h.value)});
    }
  }
  if(!dias.length){showAlert('Registra al menos un día con horas','error');return;}
  pmState.trabajoDias=dias;
  pmState.horasCierre=dias.reduce(function(s,d){return s+d.horas;},0);
  pmState.esTrabajoVariosDias=true;
  pmState.resuelta=true;
  guardarOT();
}

// ================================================================
// FOTO DESDE GALERÍA
// ================================================================
function tomarFotoOGaleria(callback){
  var inp=document.createElement('input');
  inp.type='file';
  inp.accept='image/*';
  inp.style.display='none';
  inp.onchange=function(e){
    if(!e.target.files.length)return;
    var reader=new FileReader();
    reader.onload=function(ev){if(callback)callback(ev.target.result);};
    reader.readAsDataURL(e.target.files[0]);
  };
  document.body.appendChild(inp);
  inp.click();
  setTimeout(function(){document.body.removeChild(inp);},1000);
}

// ================================================================
// INIT additions
// ================================================================
setTimeout(function(){loadManualesLocal();},100);

// ================================================================
// TURNO ACTIVO — Técnicos registran inicio/fin de turno
// ================================================================
var TURNO_ACTIVO = null; // {tecnicoId, tecnicoNombre, horaInicio, ts}

function iniciarTurno(){
  if(TURNO_ACTIVO && TURNO_ACTIVO.tecnicoId === currentUser.id){
    showAlert('Ya tienes un turno activo desde '+fmtTime(TURNO_ACTIVO.ts),'warning');
    return;
  }
  var modal = document.createElement('div');
  modal.id = 'modal-inicio-turno';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  var inner = document.createElement('div');
  inner.style.cssText = 'background:#fff;border-radius:20px;padding:24px;max-width:340px;width:100%;text-align:center';
  inner.innerHTML = '<div style="font-size:36px;margin-bottom:12px">👷</div>'
    +'<div style="font-family:Nunito,sans-serif;font-size:18px;font-weight:800;margin-bottom:8px">Cuál es tu rol en este turno?</div>'
    +'<div style="font-size:14px;color:var(--txt2);margin-bottom:20px">Esto define quién recibe las alertas primero</div>';
  var btnR = document.createElement('button');
  btnR.style.cssText = 'width:100%;padding:14px;background:var(--mo);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:800;margin-bottom:10px;cursor:pointer;display:block';
  btnR.textContent = 'Soy el Técnico Responsable';
  btnR.onclick = function(){confirmarInicioTurno(true);};
  var btnA = document.createElement('button');
  btnA.style.cssText = 'width:100%;padding:14px;background:var(--az3);color:var(--az4);border:2px solid var(--az);border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;display:block';
  btnA.textContent = 'Estoy de Apoyo en este turno';
  btnA.onclick = function(){confirmarInicioTurno(false);};
  inner.appendChild(btnR);
  inner.appendChild(btnA);
  modal.appendChild(inner);
  document.body.appendChild(modal);
}

function confirmarInicioTurno(esResponsable){
  var ol=document.getElementById('modal-inicio-turno');if(ol)ol.remove();
  // Unlock AudioContext on Android — requires user gesture
  try{
    var ctx=new(window.AudioContext||window.webkitAudioContext)();
    var buf=ctx.createBuffer(1,1,22050);
    var src=ctx.createBufferSource();
    src.buffer=buf; src.connect(ctx.destination); src.start(0);
    window._audioCtxUnlocked=true;
  }catch(e){}
  // Unlock vibration on Android
  try{ navigator.vibrate(1); }catch(e){}
  TURNO_ACTIVO = {
    tecnicoId: currentUser.id,
    tecnicoNombre: currentUser.nombre,
    horaInicio: fmtTime(Date.now()),
    ts: Date.now(),
    esResponsable: esResponsable
  };
  saveDB('turno_activo', TURNO_ACTIVO);
  supaUpsert('config', {
    key: 'turno_activo_'+currentUser.id,
    value: JSON.stringify(TURNO_ACTIVO)
  }).catch(function(){});
  // Tell SW who I am so it can notify me from background
  if(navigator.serviceWorker && navigator.serviceWorker.controller){
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_TECNICO',
      tecnicoId: currentUser.id
    });
  }
  actualizarBotonesTurno();
  showAlert(esResponsable ? '🔑 Turno iniciado — Eres el técnico responsable' : '🤝 Registrado como técnico de apoyo');
  // Tell SW about this tecnico immediately on turno start
  if(navigator.serviceWorker && navigator.serviceWorker.controller){
    navigator.serviceWorker.controller.postMessage({type:'SET_TECNICO', tecnicoId:currentUser.id, ultimaAlerta:0});
  }
  // Register FCM token via Capacitor native plugin
  setTimeout(function(){
    registrarTokenFCM(currentUser.id);
  }, 2000);

}

function finalizarTurno(){
  if(!TURNO_ACTIVO || TURNO_ACTIVO.tecnicoId !== currentUser.id){
    showAlert('No tienes un turno activo','error');
    return;
  }
  supaUpsert('config', {
    key: 'turno_activo_'+currentUser.id,
    value: null
  }).catch(function(){});
  TURNO_ACTIVO = null;
  saveDB('turno_activo', null);
  actualizarBotonesTurno();
  showAlert('✅ Turno finalizado');
}

function actualizarBotonesTurno(){
  var status = document.getElementById('turno-status');
  var btnInicio = document.getElementById('btn-inicio-turno');
  var btnFin = document.getElementById('btn-fin-turno');
  if(!status) return;
  // Only tecnicos can start/end turno — hide buttons for other roles
  var esTecnico = currentUser && currentUser.rol === 'tecnico';
  if(btnInicio) btnInicio.style.display = esTecnico ? '' : 'none';
  if(btnFin) btnFin.style.display = esTecnico ? '' : 'none';
  if(!esTecnico){ status.style.display = 'none'; return; }
  if(TURNO_ACTIVO && TURNO_ACTIVO.tecnicoId === currentUser.id){
    status.textContent = '🟢 En turno desde '+TURNO_ACTIVO.horaInicio;
    status.style.color = 'var(--vd)';
    status.style.fontWeight = '700';
    if(btnInicio) btnInicio.style.opacity = '0.5';
    if(btnFin) btnFin.style.background = 'var(--rj)';
    if(btnFin) btnFin.style.color = '#fff';
  } else {
    status.textContent = '⚪ Sin turno activo — presiona Iniciar Turno';
    status.style.color = 'var(--txt3)';
    status.style.fontWeight = '400';
    if(btnInicio) btnInicio.style.opacity = '1';
    if(btnFin) btnFin.style.background = '';
    if(btnFin) btnFin.style.color = '';
  }
}

function cargarTurnoActivo(){
  TURNO_ACTIVO = loadDB('turno_activo', null);
  actualizarBotonesTurno();
}

// ================================================================
// AYUDA — Operador/Líder alerta al técnico de turno
// ================================================================
function pedirAyuda(){
  actualizarBotonTecnicosEnTurno(); // refresh count
  // Load who's on duty
  supaFetch('config','GET',null,'').then(function(rows){
    var tecActivo = null;
    var tecnosEnTurno = [];
    if(rows && rows.length){
      rows.forEach(function(r){
        if(!r.key || !r.key.startsWith('turno_activo_')) return;
        if(r.value && r.value !== 'null'){
          try{
            var t = JSON.parse(r.value);
            if(t && t.tecnicoId){
              tecnosEnTurno.push(t);
              if(t.esResponsable) tecActivo = t;
            }
          }catch(e){console.warn('Error parsing turno:',e,r.value);}
        }
      });
      // If no esResponsable set, use first available (legacy turnos)
      if(!tecActivo && tecnosEnTurno.length > 0){
        tecActivo = tecnosEnTurno[0];
        tecActivo.esResponsable = true; // treat as responsable
      }
    }
    console.log('Técnicos en turno encontrados:', tecnosEnTurno.length, tecnosEnTurno);
    var infoEl = document.getElementById('ayuda-tecnico-info');
    var nomEl = document.getElementById('ayuda-tecnico-nombre');
    if(tecActivo && infoEl && nomEl){
      infoEl.style.display = 'block';
      nomEl.textContent = tecActivo.tecnicoNombre + ' (desde '+tecActivo.horaInicio+')';
    } else if(infoEl){
      infoEl.style.display = 'block';
      infoEl.innerHTML = '<div style="color:var(--am2);font-weight:700">⚠️ Ningún técnico ha iniciado turno. La alerta se enviará a todos.</div>';
    }
  }).catch(function(){
    var infoEl = document.getElementById('ayuda-tecnico-info');
    if(infoEl) infoEl.style.display = 'none';
  });
  showModal('modal-ayuda');
}

function enviarAyuda(){
  var area = document.getElementById('ayuda-area').value.trim();
  var desc = document.getElementById('ayuda-desc').value.trim();
  if(!area){showAlert('Escribe el área donde necesitas ayuda','error');return;}

  var alerta = {
    id: genID('ALRT'),
    tipo: 'ayuda',
    area: area,
    descripcion: desc,
    solicitadoPor: currentUser.nombre,
    solicitadoId: currentUser.id,
    ts: Date.now(),
    estado: 'activa',
    soloResponsable: true  // Only send to responsable first
  };

  supaUpsert('config', {
    key: 'alerta_'+alerta.id,
    value: JSON.stringify(alerta)
  }).then(function(){
    cerrarModal('modal-ayuda');
    // Send push via Supabase Edge Function -> FCM -> device
    fetch('https://bwjvmtwkgvyewyjfazou.supabase.co/functions/v1/enviar-alerta-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3anZtdHdrZ3Z5ZXd5amZhem91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxOTY1NTcsImV4cCI6MjA2MDc3MjU1N30.tGJasFCzMh3MWgLKNMsGBXuFd9tgMQ4GvttPM_5Ghgo'
      },
      body: JSON.stringify({ alerta: alerta })
    }).then(function(r){ return r.json(); })
    .then(function(d){ console.log('[FCM] Push enviado:', d); })
    .catch(function(e){ console.warn('[FCM] Push error:', e); });
    // Start 1-minute escalation timer
    iniciarEscalacion(alerta);
    // Show tracking card
    var card=document.createElement('div');
    card.id='alerta-enviada-'+alerta.id;
    card.style.cssText='position:fixed;bottom:80px;left:16px;right:16px;background:var(--rj3);border:2px solid var(--rj);border-radius:14px;padding:16px;text-align:center;z-index:500;transition:all 0.5s';
    card.innerHTML='<div style="font-size:20px">🚨</div><div style="font-weight:800;color:var(--rj)">Alerta enviada</div><div style="font-size:13px;color:var(--txt2)">Esperando confirmación del técnico...</div><button onclick="this.parentElement.remove()" style="margin-top:8px;background:none;border:1px solid var(--rj);border-radius:8px;padding:4px 12px;font-size:12px;cursor:pointer">Cerrar</button>';
    document.body.appendChild(card);
    setTimeout(function(){if(card&&card.parentElement&&!card._keepAlive)card.remove();},600000);
    // Clear inputs
    document.getElementById('ayuda-area').value = '';
    document.getElementById('ayuda-desc').value = '';
  }).catch(function(){
    cerrarModal('modal-ayuda');
    showAlert('⚠️ Sin conexión — guarda la alerta cuando tengas internet','warning');
  });
}

// ================================================================
// NOTIFICACIONES — Polling para técnicos
// ================================================================
var alertaPollingInterval = null;
var ultimaAlertaVista = 0; // Reset on each load — only block duplicates within same session

var operadorPollingInterval = null;
function iniciarPollingOperador(){
  if(operadorPollingInterval) clearInterval(operadorPollingInterval);
  // Operator/líder/admin polls for confirmations from technician
  operadorPollingInterval = setInterval(function(){
    if(!currentUser||(currentUser.rol!=='operador'&&currentUser.rol!=='lider'&&currentUser.rol!=='admin')) return;
    supaFetch('config','GET',null,'key=like.confirmacion*').then(function(rows){
      if(!rows||!rows.length) return;
      rows.forEach(function(r){
        if(!r.key||!r.key.startsWith('confirmacion_')) return;
        if(!r.value||r.value==='null') return;
        try{
          var conf=JSON.parse(r.value);
          var key='confirmacion_vista_'+conf.alertaId;
          if(!loadDB(key,false)){
            saveDB(key,true);
            // Show green confirmation to operator
            var el=document.getElementById('alerta-enviada-'+conf.alertaId);
            if(el){
              el.style.background='var(--vd3)';
              el.style.borderColor='var(--vd)';
              el.innerHTML='<div style="font-size:32px">✅</div><div style="font-weight:800;color:var(--vd);font-size:16px">'+conf.tecnico+' está en camino</div><div style="font-size:13px;color:var(--txt2);margin-top:4px">'+conf.area+'</div><button onclick="this.parentElement.remove()" style="margin-top:10px;background:none;border:1px solid var(--vd);border-radius:8px;padding:4px 14px;font-size:12px;cursor:pointer">Cerrar</button>';
              // Clear auto-remove timer — let operator close manually
              el._keepAlive = true;
            } else {
              // Card already gone — show persistent banner
              var banner=document.createElement('div');
              banner.style.cssText='position:fixed;bottom:80px;left:16px;right:16px;background:var(--vd3);border:2px solid var(--vd);border-radius:14px;padding:16px;text-align:center;z-index:500';
              banner.innerHTML='<div style="font-size:28px">✅</div><div style="font-weight:800;color:var(--vd)">'+conf.tecnico+' confirmó</div><div style="font-size:13px;color:var(--txt2)">Va a atender: '+conf.area+'</div><button onclick="this.parentElement.remove()" style="margin-top:8px;background:none;border:1px solid var(--vd);border-radius:8px;padding:4px 14px;font-size:12px;cursor:pointer">Cerrar</button>';
              document.body.appendChild(banner);
            }
            // Clean up confirmation from Supabase
            supaUpsert('config',{key:r.key,value:null}).catch(function(){});
          }
        }catch(e){}
      });
    }).catch(function(){});
  }, 8000);
}

function mostrarDebugToast(msg){ console.log('[DBG]',msg); } // silent in production

function iniciarPollingAlertas(){
  if(alertaPollingInterval) clearInterval(alertaPollingInterval);
  alertaPollingInterval = setInterval(function(){
    if(!currentUser || currentUser.rol !== 'tecnico') return;
    supaFetch('config','GET',null,'').then(function(rows){
      if(!rows || !rows.length){ mostrarDebugToast('Poll OK — 0 rows'); return; }

      // Am I in turno at all?
      var estoyEnTurno = (TURNO_ACTIVO && TURNO_ACTIVO.tecnicoId === currentUser.id) || false;
      rows.forEach(function(tr){
        if(!tr.key||!tr.key.startsWith('turno_activo_')) return;
        try{ var t=JSON.parse(tr.value); if(t&&t.tecnicoId===currentUser.id) estoyEnTurno=true; }catch(e){}
      });

      var alertRows = rows.filter(function(r){return r.key&&r.key.startsWith('alerta_');});
      mostrarDebugToast('Poll: '+rows.length+' rows, '+alertRows.length+' alertas, enTurno:'+estoyEnTurno+', ultimaVista:'+ultimaAlertaVista);

      rows.forEach(function(r){
        if(!r.key || !r.key.startsWith('alerta_')) return;
        if(!r.value || r.value === 'null') return;
        var alerta;
        try{ alerta = JSON.parse(r.value); }catch(e){ mostrarDebugToast('JSON error: '+r.key); return; }
        if(!alerta || !alerta.ts) return;

        var ahoraMs = Date.now();
        var alertaAge = ahoraMs - alerta.ts;

        mostrarDebugToast('Alerta '+alerta.id+' estado:'+alerta.estado+' age:'+(Math.round(alertaAge/1000))+'s ts:'+alerta.ts+' ultVista:'+ultimaAlertaVista);

        if(alerta.estado !== 'activa') return;
        if(alerta.ts <= ultimaAlertaVista) return;
        if(alertaAge > 300000) return; // older than 5 min

        // Who should receive this alert?
        var esMiAlerta = false;
        if(alerta.tecnicoDestinoId){
          // Directed to specific tecnico
          esMiAlerta = (alerta.tecnicoDestinoId === currentUser.id);
        } else {
          // soloResponsable OR broadcast — any tecnico in turno receives it
          esMiAlerta = estoyEnTurno;
        }

        mostrarDebugToast('esMiAlerta:'+esMiAlerta+' destino:'+(alerta.tecnicoDestinoId||'todos')+' soloResp:'+alerta.soloResponsable);

        if(esMiAlerta){
          ultimaAlertaVista = alerta.ts;
          saveDB('ultima_alerta_vista', ultimaAlertaVista);
          mostrarAlertaEmergencia(alerta);
          supaUpsert('config',{key:r.key,value:JSON.stringify(Object.assign({},alerta,{estado:'vista'}))}).catch(function(){});
          if(navigator.serviceWorker && navigator.serviceWorker.controller){
            navigator.serviceWorker.controller.postMessage({type:'ALERTA_VISTA', ts: alerta.ts});
          }
        }
      });
    }).catch(function(e){ mostrarDebugToast('Fetch ERROR: '+e); });
  }, 8000);
}

function mostrarAlertaEmergencia(alerta){
  // Prevent duplicate overlays
  if(document.getElementById('llamada-overlay-'+alerta.id)) return;

  // ── AUDIO ENGINE ──────────────────────────────────────────────
  var audioCtx = null;
  var sonandog = false;
  function iniciarAudio(){
    if(sonandog) return;
    sonandog = true;
    try{
      audioCtx = new(window.AudioContext||window.webkitAudioContext)();
      tocarRing();
    }catch(e){}
  }
  function tocarRing(){
    if(!sonandog || !audioCtx) return;
    // Ringtone: two-tone phone ring pattern
    var t = audioCtx.currentTime;
    function tono(freq, start, dur){
      var o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type='sine'; o.frequency.value=freq;
      g.gain.setValueAtTime(0,t+start);
      g.gain.linearRampToValueAtTime(0.35,t+start+0.02);
      g.gain.setValueAtTime(0.35,t+start+dur-0.02);
      g.gain.linearRampToValueAtTime(0,t+start+dur);
      o.start(t+start); o.stop(t+start+dur);
    }
    // Ring: 480Hz + 440Hz double-ring, then silence
    tono(480,0.0,0.4); tono(440,0.0,0.4);
    tono(480,0.5,0.4); tono(440,0.5,0.4);
    // Repeat after 2.5s total
    setTimeout(tocarRing, 2500);
  }
  function detenerAudio(){
    sonandog = false;
    try{ if(audioCtx) audioCtx.close(); }catch(e){}
  }

  // ── VIBRACIÓN patrón llamada ───────────────────────────────────
  var vibrandog = false;
  function iniciarVibracion(){
    if(vibrandog) return;
    vibrandog = true;
    function vloop(){
      if(!vibrandog) return;
      try{ navigator.vibrate([800,400,800,400,800]); }catch(e){}
      setTimeout(vloop, 3200);
    }
    vloop();
  }
  function detenerVibracion(){
    vibrandog = false;
    try{ navigator.vibrate(0); }catch(e){}
  }

  // ── OS NOTIFICATION (suena aunque app esté minimizada) ────────
  try{
    if(navigator.serviceWorker && navigator.serviceWorker.controller){
      navigator.serviceWorker.controller.postMessage({
        type:'SHOW_NOTIFICATION',
        title:'📞 Llamada — '+alerta.area,
        body:(alerta.descripcion||'Requieren tu atención')+' · '+alerta.solicitadoPor
      });
    }
  }catch(e){}

  // ── PANTALLA COMPLETA ─────────────────────────────────────────
  try{
    var el=document.documentElement;
    if(el.requestFullscreen) el.requestFullscreen();
    else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }catch(e){}

  // ── BUILD OVERLAY estilo llamada entrante ─────────────────────
  var overlay=document.createElement('div');
  overlay.id='llamada-overlay-'+alerta.id;
  overlay.style.cssText=[
    'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999',
    'background:linear-gradient(160deg,#0d1b2a 0%,#1b2838 60%,#0d1b2a 100%)',
    'display:flex;flex-direction:column;align-items:center;justify-content:space-between',
    'padding:48px 24px 52px;box-sizing:border-box;font-family:Nunito,sans-serif'
  ].join(';');

  // Avatar pulsante
  var avatarColor = '#e53935';
  var initials = (alerta.area||'?').substring(0,2).toUpperCase();
  overlay.innerHTML =
    // Top info
    '<div style="text-align:center;width:100%">'
      +'<div style="font-size:13px;color:rgba(255,255,255,.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Llamada entrante</div>'
      +'<div style="font-size:28px;font-weight:900;color:#fff;margin-bottom:4px">'+alerta.area+'</div>'
      +(alerta.descripcion?'<div style="font-size:15px;color:rgba(255,255,255,.65);max-width:280px;margin:0 auto">'+alerta.descripcion+'</div>':'')
      +'<div style="font-size:13px;color:rgba(255,255,255,.4);margin-top:6px">'+alerta.solicitadoPor+'</div>'
    +'</div>'
    // Avatar pulsante
    +'<div id="llamada-avatar-'+alerta.id+'" style="'
      +'width:120px;height:120px;border-radius:50%;background:'+avatarColor+';'
      +'display:flex;align-items:center;justify-content:center;'
      +'font-size:42px;font-weight:900;color:#fff;'
      +'box-shadow:0 0 0 0 rgba(229,57,53,.7);'
      +'animation:llamada-pulse 1.4s ease-out infinite'
    +'">'+initials+'</div>'
    // Botones
    +'<div style="display:flex;gap:48px;align-items:center;width:100%;justify-content:center">'
      // Rechazar
      +'<div style="display:flex;flex-direction:column;align-items:center;gap:10px">'
        +'<button id="btn-rechazar-'+alerta.id+'" style="'
          +'width:72px;height:72px;border-radius:50%;background:#e53935;border:none;'
          +'display:flex;align-items:center;justify-content:center;cursor:pointer;'
          +'box-shadow:0 4px 20px rgba(229,57,53,.5)'
        +'">'
          +'<svg width="32" height="32" viewBox="0 0 24 24" fill="white">'
            +'<path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>'
            +'<line x1="2" y1="2" x2="22" y2="22" stroke="white" stroke-width="2.5"/>'
          +'</svg>'
        +'</button>'
        +'<span style="color:rgba(255,255,255,.6);font-size:13px">Rechazar</span>'
      +'</div>'
      // Contestar
      +'<div style="display:flex;flex-direction:column;align-items:center;gap:10px">'
        +'<button id="btn-contestar-'+alerta.id+'" style="'
          +'width:72px;height:72px;border-radius:50%;background:#43a047;border:none;'
          +'display:flex;align-items:center;justify-content:center;cursor:pointer;'
          +'box-shadow:0 4px 20px rgba(67,160,71,.5)'
        +'">'
          +'<svg width="32" height="32" viewBox="0 0 24 24" fill="white">'
            +'<path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>'
          +'</svg>'
        +'</button>'
        +'<span style="color:rgba(255,255,255,.6);font-size:13px">Contestar</span>'
      +'</div>'
    +'</div>';

  // CSS animation para el avatar pulsante
  if(!document.getElementById('llamada-style')){
    var st=document.createElement('style');
    st.id='llamada-style';
    st.textContent='@keyframes llamada-pulse{'
      +'0%{box-shadow:0 0 0 0 rgba(229,57,53,.7)}'
      +'70%{box-shadow:0 0 0 28px rgba(229,57,53,0)}'
      +'100%{box-shadow:0 0 0 0 rgba(229,57,53,0)}'
    +'}';
    document.head.appendChild(st);
  }

  document.body.appendChild(overlay);

  // Arrancar audio+vibración en primer touchstart (desbloquea AudioContext en Android)
  var activado = false;
  function activar(){
    if(activado) return; activado=true;
    iniciarAudio(); iniciarVibracion();
  }
  overlay.addEventListener('touchstart', activar, {passive:true});
  // Fallback para desktop/emulador
  overlay.addEventListener('mousedown', activar);
  // Intento inmediato (funciona si ya hubo gesto previo en la sesión, ej. inicio de turno)
  setTimeout(activar, 100);

  function cerrarLlamada(){
    detenerAudio(); detenerVibracion();
    try{if(document.exitFullscreen)document.exitFullscreen();}catch(e){}
    overlay.remove();
  }

  // Rechazar — cierra sin confirmar
  document.getElementById('btn-rechazar-'+alerta.id).onclick=function(){
    cerrarLlamada();
  };

  // Contestar — confirma con operador y cierra
  document.getElementById('btn-contestar-'+alerta.id).onclick=function(){
    var btn=this;
    btn.style.background='#1565c0';
    btn.disabled=true;
    confirmarAtencion(alerta, function(ok){
      if(ok){
        cerrarLlamada();
      } else {
        btn.style.background='#43a047';
        btn.disabled=false;
        showAlert('Error de conexión, intenta de nuevo','error');
      }
    });
  };
}

function confirmarAtencion(alerta, cb){
  supaUpsert('config',{
    key:'confirmacion_'+alerta.id,
    value:JSON.stringify({
      alertaId:alerta.id,
      tecnico:currentUser.nombre,
      ts:Date.now(),
      area:alerta.area
    })
  }).then(function(){ if(cb) cb(true); })
  .catch(function(e){ console.error('confirmarAtencion error:',e); if(cb) cb(false); });
}


function registrarTokenFCM(tecnicoId){
  function guardarToken(token){
    if(!token || !tecnicoId) return;
    supaUpsert('config',{
      key:'fcm_'+tecnicoId,
      value:JSON.stringify({token:token, ts:Date.now(), plat:'android'})
    }).then(function(){ console.log('[FCM] Token guardado:', token.substring(0,20)+'...'); })
    .catch(function(e){ console.error('[FCM] Supabase error:', e); });
  }

  // Native Capacitor app — use Capacitor.Plugins.FirebaseMessaging
  var isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  if(isNative){
    var FM = window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseMessaging;
    if(FM){
      FM.requestPermissions().then(function(){
        FM.getToken().then(function(result){
          guardarToken(result && result.token);
        }).catch(function(e){ console.error('[FCM] getToken error:', e); });
      }).catch(function(e){ console.error('[FCM] permission error:', e); });
    } else {
      console.warn('[FCM] FirebaseMessaging plugin not found in Capacitor.Plugins');
    }
  } else {
    // Web fallback
    if(window._initFCM) window._initFCM(tecnicoId);
  }
}

function solicitarPermisoNotificaciones(){
  if(!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js', {scope:'/'}).then(function(reg){
    console.log('[SW] Registrado OK:', reg.scope);
    // Send tecnico ID to SW
    function sendId(){
      var sw = navigator.serviceWorker.controller;
      if(sw && currentUser){ sw.postMessage({type:'SET_TECNICO', tecnicoId:currentUser.id, ultimaAlerta:0}); }
    }
    navigator.serviceWorker.ready.then(sendId);
    navigator.serviceWorker.addEventListener('controllerchange', sendId);
  }).catch(function(e){ console.error('[SW] Error:', e); });
  navigator.serviceWorker.addEventListener('message', function(e){
    if(e.data && e.data.type === 'NUEVA_ALERTA') mostrarAlertaEmergencia(e.data.alerta);
  });
}

// Pulse animation CSS
(function(){
  var style = document.createElement('style');
  style.textContent = '@keyframes pulse-red{0%,100%{background:rgba(198,40,40,.95);}50%{background:rgba(198,40,40,.7);}}';
  document.head.appendChild(style);
})();

// ================================================================
// INIT — Load turno and start polling on login
// ================================================================
setTimeout(function(){
  cargarTurnoActivo();
  if(currentUser && currentUser.rol === 'tecnico'){
    iniciarPollingAlertas();
    solicitarPermisoNotificaciones();
    // Send SET_TECNICO to SW — including when a new SW activates
    if(navigator.serviceWorker){
      function enviarSetTecnico(){
        var sw = navigator.serviceWorker.controller;
        if(sw){ sw.postMessage({type:'SET_TECNICO', tecnicoId:currentUser.id, ultimaAlerta:0}); console.log('[SW] SET_TECNICO sent'); }
      }
      navigator.serviceWorker.ready.then(function(){ enviarSetTecnico(); });
      navigator.serviceWorker.addEventListener('controllerchange', enviarSetTecnico);
      navigator.serviceWorker.addEventListener('message', function(e){
        if(!e.data) return;
        if(e.data.type === 'NUEVA_ALERTA') mostrarAlertaEmergencia(e.data.alerta);
        // SW lost its state and is asking for the tecnico ID
        if(e.data.type === 'REQUEST_TECNICO_ID' && currentUser && navigator.serviceWorker.controller){
          navigator.serviceWorker.controller.postMessage({type:'SET_TECNICO', tecnicoId:currentUser.id, ultimaAlerta:0});
        }
      });
    }
  }
  if(currentUser && (currentUser.rol === 'operador' || currentUser.rol === 'lider' || currentUser.rol === 'admin')){
    iniciarPollingOperador();
  }
}, 200);

function abrirCamara(){
  var inp=document.getElementById('foto-input-camara');
  if(inp){inp.click();return;}
  // Fallback: create temporary camera input
  var tmp=document.createElement('input');
  tmp.type='file';tmp.accept='image/*';tmp.capture='environment';
  tmp.style.display='none';
  tmp.onchange=function(e){procesarFoto(e.target);document.body.removeChild(tmp);};
  document.body.appendChild(tmp);
  tmp.click();
}
function abrirGaleria(){
  var inp=document.getElementById('foto-input-galeria');
  if(inp){inp.click();return;}
  var tmp=document.createElement('input');
  tmp.type='file';tmp.accept='image/*';
  tmp.style.display='none';
  tmp.onchange=function(e){procesarFoto(e.target);document.body.removeChild(tmp);};
  document.body.appendChild(tmp);
  tmp.click();
}

// ================================================================
// ESCALACION — si no responde en 1 min, preguntar al operador
// ================================================================
var escalacionTimers = {};

function iniciarEscalacion(alerta){
  var cardId = 'alerta-enviada-'+alerta.id;
  // After 60 seconds, ask operator if they want to call another tecnico
  escalacionTimers[alerta.id] = setTimeout(function(){
    var card = document.getElementById(cardId);
    if(!card) return;
    // Check if already confirmed
    if(card.style.background && card.style.background.includes('green')) return;
    // Show escalation prompt inside the card
    card.innerHTML = '<div style="font-size:18px;font-weight:800;color:var(--am2)">⚠️ Sin respuesta (1 min)</div>'
      +'<div style="font-size:13px;color:var(--txt2);margin:8px 0">El técnico responsable no ha confirmado.</div>'
      +'<div style="font-size:14px;font-weight:700;margin-bottom:12px">¿Llamar a otro técnico en turno?</div>'
      +'<div style="display:flex;gap:8px">'
      +'<button onclick="mostrarTecnicosEnTurno(\''+alerta.id+'\',\''+alerta.area+'\',\''+alerta.descripcion+'\')" style="flex:1;background:var(--mo);color:#fff;border:none;border-radius:10px;padding:10px;font-weight:700;cursor:pointer">Sí, ver técnicos</button>'
      +'<button onclick="this.closest(\'[id^=alerta-enviada]\').remove()" style="flex:1;background:var(--gr3);border:none;border-radius:10px;padding:10px;cursor:pointer">No, gracias</button>'
      +'</div>';
    card.style.background = 'var(--am3)';
    card.style.borderColor = 'var(--am2)';
  }, 60000); // 60 seconds
}

function mostrarTecnicosEnTurno(alertaId, area, desc){
  // Fetch all active tecnicos from Supabase config
  supaFetch('config','GET',null,'').then(function(rows){
    var tecnicos = [];
    if(rows && rows.length){
      rows.forEach(function(r){
        if(!r.key||!r.key.startsWith('turno_activo_')) return;
        if(r.value && r.value!=='null'){
          try{
            var t = JSON.parse(r.value);
            if(t && t.tecnicoId) tecnicos.push(t); // show all tecnicos in turno
          }catch(e){}
        }
      });
    }
    
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-end;padding:0';
    
    var content = '<div style="background:#fff;border-radius:20px 20px 0 0;padding:24px;width:100%;max-height:70vh;overflow-y:auto">'
      +'<div style="font-family:Nunito,sans-serif;font-size:18px;font-weight:800;margin-bottom:4px">👷 Técnicos en Turno</div>'
      +'<div style="font-size:13px;color:var(--txt2);margin-bottom:16px">Selecciona quién debe atender: <b>'+area+'</b></div>';
    
    if(!tecnicos.length){
      content += '<div style="text-align:center;padding:20px;color:var(--txt3)">No hay técnicos de apoyo en turno en este momento.</div>';
    } else {
      tecnicos.forEach(function(t){
        content += '<div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--gr4);border-radius:12px;margin-bottom:8px;cursor:pointer" onclick="llamarTecnicoEspecifico(\''+t.tecnicoId+'\',\''+t.tecnicoNombre+'\',\''+alertaId+'\',\''+area+'\',\''+desc+'\',this.closest(\'div[style*=fixed]\')">'
          +'<div style="width:44px;height:44px;border-radius:50%;background:var(--az3);display:flex;align-items:center;justify-content:center;font-size:20px">👷</div>'
          +'<div><div style="font-weight:800">'+t.tecnicoNombre+'</div>'
          +'<div style="font-size:12px;color:var(--vd)">🟢 En turno desde '+t.horaInicio+'</div></div>'
          +'</div>';
      });
    }
    
    content += '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:12px;background:var(--gr3);border:none;border-radius:12px;font-size:15px;margin-top:8px;cursor:pointer">Cancelar</button></div>';
    
    modal.innerHTML = content;
    document.body.appendChild(modal);
  }).catch(function(){
    showAlert('Error al cargar técnicos','error');
  });
}

function llamarTecnicoEspecifico(tecnicoId, tecnicoNombre, alertaId, area, desc, overlay){
  if(overlay) overlay.remove();
  
  var alerta = {
    id: genID('ALRT'),
    tipo: 'ayuda',
    area: area,
    descripcion: desc,
    solicitadoPor: currentUser.nombre,
    solicitadoId: currentUser.id,
    ts: Date.now(),
    estado: 'activa',
    soloResponsable: false,
    tecnicoDestinoId: tecnicoId,
    tecnicoDestinoNombre: tecnicoNombre
  };
  
  supaUpsert('config',{
    key: 'alerta_'+alerta.id,
    value: JSON.stringify(alerta)
  }).then(function(){
    showAlert('🚨 Alerta enviada a '+tecnicoNombre);
    // Show new tracking card
    var card = document.createElement('div');
    card.id = 'alerta-enviada-'+alerta.id;
    card.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;background:var(--rj3);border:2px solid var(--rj);border-radius:14px;padding:16px;text-align:center;z-index:500;transition:all 0.5s';
    card.innerHTML = '<div style="font-size:18px;font-weight:800;color:var(--rj)">🚨 Alerta enviada a '+tecnicoNombre+'</div>'
      +'<div style="font-size:13px;color:var(--txt2)">Esperando confirmación...</div>'
      +'<button onclick="this.parentElement.remove()" style="margin-top:8px;background:none;border:1px solid var(--rj);border-radius:8px;padding:4px 12px;font-size:12px;cursor:pointer">Cerrar</button>';
    document.body.appendChild(card);
    // No further escalation — this is already a 2nd-level call, stop here
    setTimeout(function(){if(card&&card.parentElement&&!card._keepAlive)card.remove();},600000);
  }).catch(function(){
    showAlert('Error al enviar alerta','error');
  });
}

// ================================================================
// ADD "Técnicos en Turno" button to lider/operador/admin menus
// ================================================================
function actualizarBotonTecnicosEnTurno(){
  var btns = document.querySelectorAll('.btn-tecnicos-turno');
  if(!btns.length) return;
  supaFetch('config','GET',null,'').then(function(rows){
    var count = 0;
    if(rows) rows.forEach(function(r){
      if(!r.key||!r.key.startsWith('turno_activo_')) return;
      if(r.value && r.value!=='null'){try{var t=JSON.parse(r.value);if(t&&t.tecnicoId)count++;}catch(e){}}
    });
    btns.forEach(function(b){
      b.textContent = '👷 Técnicos en Turno ('+(count||0)+')';
      b.style.opacity = count>0?'1':'0.5';
    });
  }).catch(function(){});
}

// ================================================================
// OFFLINE SYNC QUEUE — retry failed Supabase saves
// ================================================================
var syncQueue = loadDB('sync_queue', []);

function queueSync(table, data){
  syncQueue.push({table:table, data:data, ts:Date.now()});
  saveDB('sync_queue', syncQueue);
}

function processSyncQueue(){
  if(!syncQueue.length) return;
  var remaining = [];
  var promises = syncQueue.map(function(item){
    return supaUpsert(item.table, item.data).then(function(){
      // success
    }).catch(function(){
      remaining.push(item);
    });
  });
  Promise.all(promises).then(function(){
    syncQueue = remaining;
    saveDB('sync_queue', syncQueue);
    if(remaining.length > 0){
      console.log('Sync queue: '+remaining.length+' items pending');
    }
  });
}

// Process queue on every sync - patched into existing syncSupabase

// Also run every 2 minutes
setInterval(processSyncQueue, 120000);

// Restart polling when app becomes visible again (mobile)
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'visible' && currentUser){
    if(currentUser.rol === 'tecnico'){
      iniciarPollingAlertas();
    }
    if(currentUser.rol === 'operador' || currentUser.rol === 'lider' || currentUser.rol === 'admin'){
      iniciarPollingOperador();
    }
    // Also sync
    syncSupabase();
  }
});

// ================================================================
// SERVICE WORKER — Background notifications
// ================================================================
function registrarServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  // OneSignal registers the SW — we just wait for it to be ready then send tecnico info
  navigator.serviceWorker.ready.then(function(reg){
    console.log('[SW] Ready:', reg.scope);
    if(currentUser && currentUser.rol === 'tecnico' && reg.active){
      reg.active.postMessage({
        type: 'SET_TECNICO',
        tecnicoId: currentUser.id,
        ultimaAlerta: 0
      });
    }
  });
  // Listen for NUEVA_ALERTA messages from SW background polling
  navigator.serviceWorker.addEventListener('message', function(e){
    if(e.data && e.data.type === 'NUEVA_ALERTA'){
      mostrarAlertaEmergencia(e.data.alerta);
    }
  });
}

function pedirPermisoNotificacion(){
  if(!('Notification' in window)) return;
  if(Notification.permission === 'default'){
    Notification.requestPermission().then(function(p){
      if(p === 'granted'){
        showAlert('✅ Notificaciones activadas — recibirás alertas aunque la app esté cerrada');
        registrarServiceWorker();
      }
    });
  } else if(Notification.permission === 'granted'){
    registrarServiceWorker();
  }
}

// ================================================================
// MÓDULO MEJORAS — Lección de Un Punto
// ================================================================

var LOGO_MEJORA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCACTAJQDASIAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAYHBAUIAwIB/8QAQRAAAQMDAQUGAggDBgcBAAAAAQIDBAAFEQYSITFBUQcTImFxgRSRIzJCYqGxwdEVUpIzNFNygqIIFhckJdLh8P/EABsBAAEFAQEAAAAAAAAAAAAAAAUAAgMEBgcB/8QAOBEAAQMCAwYDBwMCBwAAAAAAAQACAwQRBSExBhJBUWFxscHwEyIykaHR4RSB8RUjJDNCUmJyov/aAAwDAQACEQMRAD8A6+SAkYFKUpJJSlKSSUrBvd3t1lgqmXKUiOyNwzxUegHEn0qpNWdqVynFcaxt/AR87nlYLyh+SfxPnVOqr4aUe+c+XFQyzsi+JW7dbtbbU13lxnR4qSMjvFgE+g4modcu1XTcZRTEblzccFIb2En+rB/CqSlSH5UhciS8488s5U44oqUr1JrzoBNjszj/AGwAPmqD655+EWUv13rZ7Uc6BKixXLcuDt92tL+Vkq2d+QBjGz+Nbi1dq16Sy2xLYhOuJGC6pBBX5nBAB9sVXFfqUqWoJSCSeAFVKbEqiOo9qPeJ1HPhoPJUpZZHAkPIJ4q4Y/adJB/7i0MrHVt4p/MGtxB7R7K8oJksyoueKinbSPlv/CqghNONMhLi9o8h08q966dDSxzRNe5haTwvos3/AF+uheWiQOA6D8FdA226W65N7cCYzIGMkIVvHqOIrLrnZh11h5LzDi2nEHKVoUQoehFTTTXaFOiFEe7p+MYz/ajc6kfkr8/OoJcPc3NhujlFtRFIQ2obunmMx9x9VatKxLTcoV1iJlQJCHmzxwd6T0I4g1l0PIINitQx7XtDmm4KUpSvE5KUpSSSlKUkkqO641ZA0vADjw7+W4PoI4Vgq8yeSfOsnWWoYmm7K5PkeNw+FhrOC4vG4enU8hXO16ucy8XJ64T3S4+6rJPIDkAOQFCMTxL9MNxnxH6KpU1Pshut1XrqG93K/XBU25SC64dyUjclA6JHIVrq/UgqUEpBJJwAOdWjoLsyL7bdx1GlaEHCm4YOFEffPEf5ePXpWYgp5qySzczxP3Qxkb5nZKAWKw3i+Olu1wHZGycKWNyE+qjuFWFZuyFZKV3i6hI+03FTv/qV/wCtWpEjR4kdEeKw2wygYShtISkewrSXvWNhtKy09MDz3+GwNsj1I3D3NH24XSUjN+pd8zYIrT4bvGwBcVXus+zhTV0tkLTcWQtDyV9+86vKEYIwVHluJ3DjjcKmGnuznT9utyWZjHx0k73HlKUnJ6JAO4VqJ/aj4ymDaMp5Ledwf6QP1rA/6nXfP9wg46YV+9VI8UwqmnMsbs+FgcuyIN2fkdcuYLHgbeCmEjQOmnQdmK8yTzQ8rd881oLp2ZqBUu2XIEcm5Cd/9Sf2r4g9qKtsJnWgbPNbLu/+kj9alNk1lYLqsNNS+4ePBt8bBPoeB9AaP0m0cExtHLnyOXih9XsvCW+/DbqMvDzVSXiyXS0L2bhDcZBOAvig+ihurX10TIZZkMqZfaQ60sYUlYyD7VXWsdAhCHJ1iSogZUuLnJ/0ft8ulaSCva82fkVi8R2akgBkpzvDlx/KhFlus6zzBLgPltY3KHFKh0I5iri0hqaHqCMdjDMtA+lYJyR94dRVIKBSopUCCDgg8RWRbpsm3zWpkN0tPNnKVD8j1FT1NM2YX4ofhWLy0D7HNh1HmOviuhKVp9JX5i/2pMpvCHkeF5rO9Cv2PKtxQFzSwlp1XSYZmTMEjDcFKUpTVIlfLq0NNqccUEIQCpSicAAcTX1UD7ar6q2acTbmHNmRcCUHHEND63zyB7moaicQROkdwTJHhjS4qsO0PUjmpNQOSEqPwbJLcVOMeD+b1PH5DlUcpU27I9NJvl++MlICoUEha0qTkOL+yn05n0xzrDNbJWT21c4+vkgYDpn9Spb2TaHRDZav13ZCpSwFRmVjPdDks/ePLp68LAu9yh2mCubOeDTKOfEk8gBzNes2SxCiOypCw2y0gqWo8gKo3WGoZOobmX3CURmyQw1/KnqfM86P11bFg1OGRi7jp9z66LU4bh3tTujJo1Kz9W62uV6UuPHUqHBI2e7SfEsfeP6Dd61FaUrAVFTLUv8AaSuuVrooWRN3WCwSlKVApUpSlJJSnSWtblZFIYeUqZBAx3Sz4kD7p5enD0q3rNc4V3gImwHg60rd0KTzBHI1zxW60jqCVp+5pkNErYWQH2uS0/uORrRYPj0lK4RzG7PqPx0+SFV2GtmBfGLO8VP+0bSSJjTl3trWJSBtPNpH9qOo+8Px9aqyuh4EtidCZmRlhbLyQpCh0qqO0+wptd2E6MjZiyyTgDchzmPfj8+ldYw+r3wGE35Lke0mEiO9TGLf7h5/f+VqNH3tyxXpqUFK+HUdiQgDO0j06jiP/tXk04h1pDragpC0hSVDgQeBrnWra7J7sZtkXb3XNp6GrCc8S2eHyOR8qfiENx7QJmy9eWvNK45HMd+IUypSlCFt0qgO165i5a2koQrLUNIjp9RvV/uJHtV/kgAknAHGuWblJMy4yZZ4vuqc+ZJ/WgOPylsTWDifD+VQr3WaG81j10d2e2b+B6Thw1JAfWnvn8fzq3ke24e1URou3i66rtsFQyhyQkuDqhPiUPkDXS9QYBBm6U9vv5JlAzV6rXtjvR2mbEwogYDsjB4/yp/X5VW1Z+oZy7lfJk5atrvXlFJ+7wSPYACsCsbidWauqfKdOHYaLo1JAIIWs+fdKVkxYMyVHfkR4zjrUdO08tKchA3nJ6cD8q+49ruMiKmUzDecYU4G0uBO4qJwB65NUxE92gKnL2jUrDpWbcrTcrahC58J6MlZISXE4yafwq5GSxGEF8vSEBxpAQSVpP2h5bq9MMgO6Wm/bmvBI0i91hUrPcst2buCLeu3yEynElSGig7SgATkdeBrzuFsuFvcQ3Ohvx1OfUDiCNr068RSMMjQSWmw6JCRhNgViUrKuNvm251LU6K7HWpO0lLicEjrWLTHNc02cLFOBBFwrG7Hb0pL7tieVlCwXY+TwP2k+/H2NTbWNrF307KiAAuhHeNf507x8+HvVH2Sau3XeJOQopLDqVkjpnePcZFdDggjI3g10HZWtdJTmMnNhy7HTzWVx2jY5xBGTwb+a5zqS9mlwEHVkdKzhuSCwr1O9P8AuAHvWv1hCTb9TT4qBhCXipA6JV4gPbOPatdFfVGlNSU/WaWlY9jmukuAljtzC4pE51HVAnVjvA5roilfiVBSQocCMilZpdZWDqR4x9PXJ9JwW4jqwfRBNcrS3yjDbZwRxNdAdsWqY9h0y9AThydcWlstt5+qgjClnyAOB54865zPHJoRXwtlma53+kLXbM7OtqpBW1Iuxvwg8Tz7Dx7KxOxHZk65jLxvaacUR0Ozj9avHUchUTT9xkoOFtRXVp9QkkVy9pW+TdO3ti6wVeNs4Wg/VcQeKT6/hxro5+5xNS6AmTrarbbkwnQlJ4pVsHKT5g7qVNGIaeRseuZHyVTGNnxhc4dH/lOOXTp9unZUcNwxSlbnSlmReJUj4mQqNEiMKfkOpTkhI5AdePyrmkMTpnhjBmUXe8MaXO0Ug7MLlCt0C7LmuNBDimEFC1DxJJUFbueAc1v3pNmg2Zi0QZkctQrhGG13oyvK0rUrjw8Xtiogxp60XS7wYljuzrqH9rvUvtYcZCRnJxgHP7V7jTNmnxvirLcpTzbEltmUl5ASoJWoJ2k7vPnWkpZqmOARMY02BANxc394252uCeyFTRxPk33OIvY6fsL/AFWx1fAiXi+toNzgQmnFOlDvxhfDitxG0kkBvgeHWs92529FxXa2rpHZmGzNxGpiV/RodG0SnbHDORv8utaqdoRmJcJyVypC4bUFySw6nZyVIwFIVuxz8qw5lh023Z4U9mXdlfHLLbCVpb3KCsHa6D0p7jUxPe/2YaSbm54DLLTnkRzGqaBE9rW7xI4ZcdfLRSK0zo0Kfp+3XC7x5syO6+46+HtpLaFNrASVnru3eXpXlLet9yk2BhMxkWppa5by35G26lxJJ2FEnOCdw6j0FYUnQEdTN1TCmPrkxHg2whezh36JC8HcN/iI9hWJK0fDZtsyT8TKDke2tSwlWz9dW1lJ3cBs+tSOdWsaY3RC3fg22V+PwZ879k1ogcd4Pz7c75/+slk69m22/WJu4xLi3IfiSVpUlTfdKLazkAJO87PhGee+oFUpb0s09M09HZfe/wDKRw+8Tj6MYBVs7umeNYOsbKzZbgyiI8uRDkMJeYeVjxA8eH/7eKC4hHUTk1MjQNAbHjYZ89CFfpXRR2iab6kfP73Wkq8IsL+P6Bgx3nltuOw2lBxJwQsJG/58qo+r+0c2W9KWpCgQfhGiQeWUg0Y2Rc5tQ8jl5ofj0bZIQxwuDcfRUjdIkqBcHokxKkvtKwvJznzzzBrGqw+06AJt1Utr+3bbSB5jp+NRCw2/4h7v3knumzwP2ldK6GNoqQU0szzYxmxHG/C3fh+/JcgqdmKplaymjFw/MHhbjftx/bmplpbSE6dZWZcy8TopcGW223DgIxuzv3ftilTuzAptEQH/AAUfkKVEyulkaH6XzstW3BKSIbhbe3G5z+q+bhaLVcFlc62w5KynY2nWUqVs9MkZ5muTZsdcSY/Ec+uy4ptXqDj9K6/rmrthtP8ACdezwkYalkSm/wDX9b/cFUOq25ArpexdURNJA46gEft/K1Oh1QU6vtQuUduREXJS2624kKSQrw5I6AkH2rqG2Wy3WyIYlugx4kcqKi2y2EpJPE4FcjJJSoKScEbwa6q0TeUX/S0C6JwFutAOp/lcG5Q+YNeUhGYVjbWGS0coJ3dDyvqPNUddYqoNzkwlAgsOqb3+RxWVpy8yLJOXIZabeQ62WnmXB4XEHiDUq7YbOti6N3lpP0UkBDpHJYG7PqB+FQKua1cMlBVua3ItOXbh9FUge2pgBOd9VI39WPInQpFrt0O3NwyS20hO1tEjB2juJGCele0rWBLbbMC0RbfH+IRIkIaUcvqSoKAJxuGRwwai1KZ/UanMb2vQdssssssrXC9/SxZZaKWI1xMSLw2qIhTFyCiGy4foVKTskg438t27hWrdvi3LTa7eYyQLe6pwL2/r5VnGMbq09K8fX1LxZz7/AC4m/jn+F62miboPVreClly1tLlNyu4iJjOvy25SXEu7WwUJQkDGN/1Pxr0ka7kyLouW9bWHGHoojSIylkpdAJOc43fWPWofSpDitWTff8OvTqe6Z+jgAtu+vQUrRrWQ3cFzGbbHaLcT4WGhKvDGT1xjxHcOnCsC/wCpJF6tkWLMjNB2MtRS8jCcpP2dkDA4D5Vo6Ux+IVL2ljn5HUZeuH7aDJObSxNIcG5he9ujKmz48NGdp91LYx5nFdFtoS22ltACUpAAA5AVVHZBZ1Sbu5d3UDuYoKWyebhHL0BPzFWddpSYVvekHilPhHVXL8a1+zUApqR9TJkD4D0UDxaT2szYm8PEqD6gfEi8yXBwC9ke279KwEI2lBCAMqOAPM0JJOTxNbDTsYyrxHR9lKttXoN9Y4b1ZU9Xu8SiOUUfYKfsoDTKG08EJCR7Ur6pXWwABYLK6pVYf8QVh+NsMe+MNkvQVbDpA4tK5n0Vj5mrPrxnRWJsJ+HJRtsvtqbcT1SRg02Rm+0hXcOrHUVSydvA/Tj9FyDVn9guqBb7q5p6Y6RHmq2oxPBL2OHltAfMDrUI1lYZGm9RSbU+FlLassuKGO8bP1VfvjmCK1CFKQtK0KUlSTlKknBBHAg0Ma4xuuuvVdPDidGWXu1wuD4Fdb3u2xrva37fKTlt1OM43pPJQ8waoi/2mXZbm5BmIIUk5QrG5xPJQ8qsjsm1w1qW3JgTnEou8dGFg7u/SPtjz6jrv4GpJqnT8HUED4eUnYcTvaeSPE2f1HUVWxjCm4jGJI/jGnXofJcvjfLhdQ6CcZesx0VB0rb6k09crDJ7uazlonwPo3oX78j5GtRXO5YnwvLJBYhH2Pa9u803CUpSmJ6UpSkklZ1itUu83JuDDQVLXvUrG5Ceaj5CvfTtguV9ldzBZOwD43lbkI9T18uNXNpXT0HT0HuIw23l73nlDxLP6DoKN4Rg0lc8OcLMGp59Ah9dXsp22GbvWqyrFbI1ntTNvipwhpO9WN61c1HzJqPa0uAdfTBaVlDRy5jmrp7frW41Hd0W9gtNEKkrHhH8o6moMpRUoqUSVE5JJ3mjW0OIshiFFB+9uA4D1w7oTQQOe72z/XVflS3RELYYcnLG9zwI9Bx/H8qjdrhuT5rcZvI2j4lY+qOZqxY7SGGEMtjCEJCQPIVU2YoDJMalwybp3/AUuJT7rPZjUr7pSlbxA0pSlJJQ7tU0cjVVlzHCEXOLlUZZONoc2z5H8DjzrnCQy9HkOR5DS2nW1FC0LGClQ3EEV2BUA7Uuz1nUrarnbNhi7ITvzuTIAG5KuiuivY8sVaiDe95uq2Gze0ApP8NUH3DoeX48FQEGVJgzGpkN9bEhlW024g4KT5VevZ12oQruhq3X5bUK4bkpdJ2Wnz68EqPTh06VRdwhy7fMchzo7keQ0cLbcThSTXhVSOR0ZyW2xLCabFIgH68HDX8hdgSWGJUdbEhpt5lYwpC0hSVDzBqGXvs3tMtwu295yAs/YA22/kd4+eKqLSHaLqLTqG46XxOhIP8Ad5G/A6JVxT+IHSrPsPa/pmcQ3cG5NscPNxHeN56bSd/zAp88NJWttM0Hv91gajAMTw9xMPvN5t8x/PdaKb2c6hYWe4+FlI5FDmyfcKA/M1h/8i6n2sfw3371H71asPVmmZmPh7/bVk8EmQkE+xOazZN1gMRTIMltaOXdqCio9BihMuzeHtBeXEAdRb6hUjiFaw7rmZ9QVVEPs61E+od8IsZPMuO5PySDUqsvZta4riXbjIdnKH2MbDfuBvPzrb2nUKZM19UpxuOwEju0k7+PXma9pmp7ez4WAuQr7owPmagpKbBIme2Lr/8AY8v+P4TZqiuedzTt91uIsdiJHRHjMtssoGEoQkBIHpWmvmoWYoUzDKXn+BUN6Ufuaj1zvk6cCgr7po/YRuz6nnWsqviO012+zpBYc/sPXZKDDs96U36L7fdcfdU66srWo5Uo8TXyhKlrShCSpSjgADeTX602t1xLbSFLWo4CQMk1NNOWNMFIkSQlUkjcOIb8vXzoHh2GzYjLYacT64q7UVDIG568AvfTlrFtiZcAMhzesjl5VtKUrptPTx08QijFgFnJJHSOLnalKUpUyYlKUpJJSlKSSj+stH2bVMXu7gxsSEjDUlvc4jyzzHkao3WXZzqDTpW+lk3CCDukMJyQPvI4p/EeddJUqGSBr+6OYXj9Vh3utO8zkfLl4dFx3SunNS6A0vfluPSreGJLm9UiMe7WT1PIn1BqAXXsUkAqVar20sfZRJaKfmpOfyqm6meNM1uKTaygnH9wlh66fMedlW2mrOu9XD4ZLzbSEjaWVEbWPIcz+VWjZrVCtMUMQ2QgfbWfrLPUmoq92W64gvpcjRWHloOUuR5SRg9RtbJqY2C16vEVSL3ZltqbTnvkOIVt+qUknPpWbxuirJG7zLlo4efVV8YrYp2h0U7S3lcX8c170rMtdtk3FxaI4R4ACoqOAM1u4+klnBkS0jqG05/E1n6XCquqbvRMuOeg+qzUlTFEbOOajFbK12WdPIUlvumubixgew51LYNjt0QhSGA4sfac8R/atlWjotlbHeqXfsPv67ofNifCMfNYFptMS2o+iTtun6ziuJ/YVn0pWuhgjgYGRiwCFPe553nG5SlKVKmpSlKSS8oxJSQTwr1pSnyfEU1uiUpSmJyUpSkklKUpJJSlKSSxmI7DM951ppKFOISVkc95rJpSo4mtaCGi2ZTnEk5pSlKkTUpSlJJKUpSSQ0pSvV4v/9k=';

// ── FOLIO ────────────────────────────────────────────────────────
async function generarFolioMejora(){
  try{
    var rows = await supaFetch('mejoras','GET',null,'select=folio&order=created_at.desc&limit=1');
    if(!rows || !rows.length) return 'ME-MTTO-00001';
    var last = rows[0].folio;
    var num = parseInt((last||'ME-MTTO-00000').split('-')[2],10)||0;
    return 'ME-MTTO-'+String(num+1).padStart(5,'0');
  }catch(e){ return 'ME-MTTO-00001'; }
}

// ── MENÚ PRINCIPAL ───────────────────────────────────────────────
function showMejoras(){
  showScreen('screen-mejoras');
  var root = document.getElementById('mejoras-root');
  root.innerHTML =
    '<div style="display:flex;flex-direction:column;align-items:center;padding:28px 20px 40px">'
    +'<img src="'+LOGO_MEJORA+'" style="width:84px;height:84px;border-radius:50%;object-fit:contain;margin-bottom:10px" />'
    +'<div style="font-size:1.5rem;font-weight:800;color:#1a3c5e;margin-bottom:2px">Mejoras</div>'
    +'<div style="font-size:.82rem;color:#6b7280;margin-bottom:28px">Lección de Un Punto</div>'
    +'<button class="mej-menu-btn consultar" onclick="showMejorasConsultar()"><span style="font-size:1.4rem">🔍</span> Consultar Mejoras</button>'
    +'<button class="mej-menu-btn registrar" onclick="showMejorasForm()"><span style="font-size:1.4rem">＋</span> Registrar Mejora</button>'
    +'<button class="mej-menu-btn" style="background:linear-gradient(135deg,#1a3c5e,#3b82f6);color:#fff" onclick="showMejorasKPI()"><span style="font-size:1.4rem">📊</span> KPI Mejoras</button>'
    +'</div>';
}

// ── REGISTRAR ────────────────────────────────────────────────────
function showMejorasForm(){
  showScreen('screen-mejoras-form');
  var hoy = new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'2-digit',year:'numeric'});
  var tecnicos = USERS.filter(function(u){return u.rol==='tecnico';});
  var todasLineas = (LISTAS.lineas_proceso||[]).concat(LISTAS.lineas_envasado||[]).concat(LISTAS.lineas_servicios||[]);

  var tecOpts = tecnicos.map(function(t){return '<option value="'+t.nombre+'">'+t.nombre+'</option>';}).join('');
  var linOpts = todasLineas.map(function(l){return '<option value="'+l+'">'+l+'</option>';}).join('');

  document.getElementById('mejoras-form-content').innerHTML =
    '<div style="padding:14px;display:flex;flex-direction:column;gap:0">'

    // Fecha
    +'<div class="mej-field"><label>Fecha</label>'
    +'<input class="mej-input ro" type="text" value="'+hoy+'" readonly /></div>'

    // Tema
    +'<div class="mej-field"><label>Tema</label>'
    +'<input class="mej-input ro" type="text" value="Registro de Mejora" readonly /></div>'

    // Área
    +'<div class="mej-field"><label>Área <span class="req">*</span></label>'
    +'<select id="mej-area" class="mej-input"><option value="">-- Seleccionar --</option>'
    +'<option value="Envasado">Envasado</option>'
    +'<option value="Proceso">Proceso</option>'
    +'<option value="Servicios e instalaciones">Servicios e instalaciones</option>'
    +'</select></div>'

    // Línea
    +'<div class="mej-field"><label>Línea <span class="req">*</span></label>'
    +'<select id="mej-linea" class="mej-input" onchange="mejLineaChange(this)">'
    +'<option value="">-- Seleccionar --</option>'
    +'<option value="Otro">Otro (especificar)</option>'
    +linOpts
    +'</select></div>'
    +'<div id="mej-linea-otro-wrap" style="display:none" class="mej-field"><label>Especificar línea <span class="req">*</span></label>'
    +'<input id="mej-linea-otro" class="mej-input" type="text" placeholder="Escribir línea..." /></div>'

    // Equipo
    +'<div class="mej-field"><label>Equipo / Máquina <span class="req">*</span></label>'
    +'<input id="mej-equipo" class="mej-input" type="text" placeholder="Nombre del equipo..." /></div>'

    // Técnico
    +'<div class="mej-field"><label>Mejora realizada por <span class="req">*</span></label>'
    +'<select id="mej-tecnico" class="mej-input"><option value="">-- Seleccionar técnico --</option>'+tecOpts+'</select></div>'

    // Foto ANTES
    +'<div class="mej-field"><label>Foto ANTES <span class="req">*</span></label>'
    +'<div class="mej-foto-area" id="mej-foto-antes-area">'
    +'<img id="mej-foto-antes-prev" src="" style="display:none" class="mej-foto-prev" />'
    +'<div id="mej-foto-antes-btns" class="mej-foto-btns">'
    +'<button type="button" class="mej-foto-btn" onclick="mejFoto(\'antes\',\'camara\')">📷 Cámara</button>'
    +'<button type="button" class="mej-foto-btn" onclick="mejFoto(\'antes\',\'galeria\')">🖼 Galería</button>'
    +'</div>'
    +'<input type="file" id="mej-file-antes-cam" accept="image/*" capture="environment" style="display:none" onchange="mejFotoSelected(\'antes\',this)" />'
    +'<input type="file" id="mej-file-antes-gal" accept="image/*" style="display:none" onchange="mejFotoSelected(\'antes\',this)" />'
    +'<button type="button" id="mej-del-antes" class="mej-foto-del" style="display:none" onclick="mejFotoBorrar(\'antes\')">🗑 Borrar foto</button>'
    +'</div></div>'

    // Foto DESPUÉS
    +'<div class="mej-field"><label>Foto DESPUÉS <span class="req">*</span></label>'
    +'<div class="mej-foto-area" id="mej-foto-despues-area">'
    +'<img id="mej-foto-despues-prev" src="" style="display:none" class="mej-foto-prev" />'
    +'<div id="mej-foto-despues-btns" class="mej-foto-btns">'
    +'<button type="button" class="mej-foto-btn" onclick="mejFoto(\'despues\',\'camara\')">📷 Cámara</button>'
    +'<button type="button" class="mej-foto-btn" onclick="mejFoto(\'despues\',\'galeria\')">🖼 Galería</button>'
    +'</div>'
    +'<input type="file" id="mej-file-despues-cam" accept="image/*" capture="environment" style="display:none" onchange="mejFotoSelected(\'despues\',this)" />'
    +'<input type="file" id="mej-file-despues-gal" accept="image/*" style="display:none" onchange="mejFotoSelected(\'despues\',this)" />'
    +'<button type="button" id="mej-del-despues" class="mej-foto-del" style="display:none" onclick="mejFotoBorrar(\'despues\')">🗑 Borrar foto</button>'
    +'</div></div>'

    // Botón Guardar — aparece sólo cuando ambas fotos cargadas
    +'<div id="mej-guardar-wrap" style="display:none">'
    +'<button class="mej-guardar-btn" onclick="mejGuardar()">💾 Guardar Mejora</button>'
    +'</div>'

    +'</div>'; // end padding div

  window._mejFotos = {antes:null, despues:null};
}

function mejLineaChange(sel){
  document.getElementById('mej-linea-otro-wrap').style.display = sel.value==='Otro'?'block':'none';
}

function mejFoto(tipo, origen){
  var id = origen==='camara' ? 'mej-file-'+tipo+'-cam' : 'mej-file-'+tipo+'-gal';
  document.getElementById(id).click();
}

function mejFotoSelected(tipo, input){
  if(!input.files||!input.files[0]) return;
  comprimirImagen(input.files[0], function(b64){
    window._mejFotos[tipo] = b64;
    var prev = document.getElementById('mej-foto-'+tipo+'-prev');
    var btns = document.getElementById('mej-foto-'+tipo+'-btns');
    var del  = document.getElementById('mej-del-'+tipo);
    prev.src = b64; prev.style.display='block';
    btns.style.display='none'; del.style.display='inline-flex';
    mejCheckGuardar();
  });
}

function mejFotoBorrar(tipo){
  window._mejFotos[tipo]=null;
  document.getElementById('mej-foto-'+tipo+'-prev').style.display='none';
  document.getElementById('mej-foto-'+tipo+'-btns').style.display='flex';
  document.getElementById('mej-del-'+tipo).style.display='none';
  document.getElementById('mej-file-'+tipo+'-cam').value='';
  document.getElementById('mej-file-'+tipo+'-gal').value='';
  document.getElementById('mej-guardar-wrap').style.display='none';
}

function mejCheckGuardar(){
  if(window._mejFotos && window._mejFotos.antes && window._mejFotos.despues){
    document.getElementById('mej-guardar-wrap').style.display='block';
  }
}

async function mejGuardar(){
  var area    = document.getElementById('mej-area').value;
  var linea   = document.getElementById('mej-linea').value;
  var lineaOtro = (document.getElementById('mej-linea-otro')||{}).value||'';
  var equipo  = document.getElementById('mej-equipo').value.trim();
  var tecnico = document.getElementById('mej-tecnico').value;

  if(!area||!linea||!equipo||!tecnico){showAlert('Completa todos los campos obligatorios','error');return;}
  if(linea==='Otro'&&!lineaOtro.trim()){showAlert('Especifica el nombre de la línea','error');return;}
  if(!window._mejFotos||!window._mejFotos.antes||!window._mejFotos.despues){showAlert('Carga ambas fotos','error');return;}

  var btn = document.querySelector('.mej-guardar-btn');
  btn.disabled=true; btn.textContent='⏳ Guardando...';

  try{
    var folio = await generarFolioMejora();
    var hoy = new Date().toISOString().split('T')[0];
    var reg = {
      folio: folio,
      tema: 'Registro de Mejora',
      fecha: hoy,
      area: area,
      linea: linea,
      linea_otro: linea==='Otro'?lineaOtro.trim():null,
      equipo: equipo,
      realizado_por: tecnico,
      foto_antes: window._mejFotos.antes,
      foto_despues: window._mejFotos.despues,
      created_by: currentUser.nombre
    };
    var r = await supaUpsert('mejoras', reg);
    if(!r){ throw new Error('Sin respuesta de Supabase'); }
    showAlert('✅ Mejora guardada — Folio: '+folio);
    showMejoras();
  }catch(e){
    showAlert('Error al guardar: '+(e.message||e),'error');
    btn.disabled=false; btn.textContent='💾 Guardar Mejora';
  }
}

// ── CONSULTAR ────────────────────────────────────────────────────
async function showMejorasConsultar(){
  showScreen('screen-mejoras-consultar');
  var semAct = currentWeek();
  var añoAct = currentYear();
  var tecnicos = USERS.filter(function(u){return u.rol==='tecnico';});
  var todasLineas = (LISTAS.lineas_proceso||[]).concat(LISTAS.lineas_envasado||[]).concat(LISTAS.lineas_servicios||[]);

  var semOpts = Array.from({length:53},function(_,i){return i+1;}).map(function(s){
    return '<option value="'+s+'"'+(s===semAct?' selected':'')+'>'+s+'</option>';
  }).join('');
  var añoOpts = [añoAct-1,añoAct,añoAct+1].map(function(a){
    return '<option value="'+a+'"'+(a===añoAct?' selected':'')+'>'+a+'</option>';
  }).join('');
  var linOpts = todasLineas.map(function(l){return '<option value="'+l+'">'+l+'</option>';}).join('');
  var tecOpts = tecnicos.map(function(t){return '<option value="'+t.nombre+'">'+t.nombre+'</option>';}).join('');

  document.getElementById('mejoras-consultar-content').innerHTML =
    '<div style="padding:12px">'
    // Filtros
    +'<div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,.07)">'
    +'<div style="display:flex;gap:8px;margin-bottom:8px">'
    +'<div style="flex:1"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Semana</label>'
    +'<select id="mej-fil-sem" class="mej-input" style="padding:8px">'+semOpts+'</select></div>'
    +'<div style="flex:1"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Año</label>'
    +'<select id="mej-fil-año" class="mej-input" style="padding:8px">'+añoOpts+'</select></div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:8px">'
    +'<div style="flex:1"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Área</label>'
    +'<select id="mej-fil-area" class="mej-input" style="padding:8px"><option value="">Todas</option>'
    +'<option value="Envasado">Envasado</option><option value="Proceso">Proceso</option><option value="Servicios e instalaciones">Servicios e instalaciones</option>'
    +'</select></div>'
    +'<div style="flex:1"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Línea</label>'
    +'<select id="mej-fil-linea" class="mej-input" style="padding:8px"><option value="">Todas</option>'+linOpts+'</select></div>'
    +'</div>'
    +'<div style="margin-bottom:10px"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Técnico</label>'
    +'<select id="mej-fil-tec" class="mej-input" style="padding:8px"><option value="">Todos</option>'+tecOpts+'</select></div>'
    +'<button style="width:100%;padding:11px;background:#1a3c5e;color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer" onclick="mejBuscar()">🔎 Buscar</button>'
    +'</div>'
    +'<div id="mej-lista"></div>'
    +'</div>';
}

function getWeekRange(week, year){
  var simple = new Date(year, 0, 1+(week-1)*7);
  var dow = simple.getDay();
  var start = new Date(simple);
  if(dow<=4) start.setDate(simple.getDate()-simple.getDay()+1);
  else start.setDate(simple.getDate()+8-simple.getDay());
  var end = new Date(start); end.setDate(start.getDate()+6);
  return{
    inicio: start.toISOString().split('T')[0],
    fin:    end.toISOString().split('T')[0]
  };
}

async function mejBuscar(){
  var sem   = parseInt(document.getElementById('mej-fil-sem').value);
  var año   = parseInt(document.getElementById('mej-fil-año').value);
  var area  = document.getElementById('mej-fil-area').value;
  var linea = document.getElementById('mej-fil-linea').value;
  var tec   = document.getElementById('mej-fil-tec').value;
  var lista = document.getElementById('mej-lista');
  lista.innerHTML='<p style="color:#9ca3af;text-align:center;padding:20px">Cargando...</p>';

  var rng = getWeekRange(sem, año);
  var params = 'order=created_at.desc&fecha=gte.'+rng.inicio+'&fecha=lte.'+rng.fin;
  if(area)  params += '&area=eq.'+encodeURIComponent(area);
  if(linea) params += '&linea=eq.'+encodeURIComponent(linea);
  if(tec)   params += '&realizado_por=eq.'+encodeURIComponent(tec);

  try{
    var rows = await supaFetch('mejoras','GET',null,params);
    if(!rows||!rows.length){
      lista.innerHTML='<p style="color:#9ca3af;text-align:center;padding:20px">Sin mejoras con esos filtros.</p>';
      return;
    }
    lista.innerHTML = rows.map(function(m){
      var lineaD = m.linea==='Otro'?(m.linea_otro||'—'):m.linea;
      return '<div class="mej-card" onclick="mejAbrirDetalle('+JSON.stringify(m).replace(/"/g,"'")+')">'
        +'<div class="mej-card-folio">'+m.folio+'</div>'
        +'<div class="mej-card-info">'
        +'<span class="mej-badge-area">'+m.area+'</span>'
        +'<span class="mej-badge-linea">'+lineaD+'</span>'
        +'</div>'
        +'<div class="mej-card-equipo">'+m.equipo+'</div>'
        +'<div class="mej-card-meta">👷 '+m.realizado_por+' &nbsp;·&nbsp; 📅 '+m.fecha+'</div>'
        +'<div style="text-align:right;margin-top:6px"><span style="background:#1a3c5e;color:#fff;border-radius:7px;padding:4px 12px;font-size:.8rem;font-weight:600">Abrir →</span></div>'
        +'</div>';
    }).join('');
  }catch(e){
    lista.innerHTML='<p style="color:#ef4444;text-align:center;padding:20px">Error: '+e.message+'</p>';
  }
}

// ── DETALLE LUP ──────────────────────────────────────────────────
function mejAbrirDetalle(m){
  // m puede llegar como string por el onclick
  if(typeof m === 'string'){
    try{ m = JSON.parse(m.replace(/'/g,'"')); }catch(e){ return; }
  }
  var lineaD = m.linea==='Otro'?(m.linea_otro||'—'):m.linea;
  document.getElementById('lup-detalle-content').innerHTML =
    '<div class="lup-doc" id="lup-print-doc">'
    // ENCABEZADO
    +'<div class="lup-header">'
    +'<div class="lup-logo-cell"><img class="lup-logo-img" src="'+LOGO_MEJORA+'" /></div>'
    +'<div class="lup-title-cell"><div class="lup-main-title">Lección de Un Punto</div><div class="lup-sub-title">Tema: <strong>Mejora Implementada</strong></div></div>'
    +'<div class="lup-folio-cell"><div class="lup-folio-label">Folio</div><div class="lup-folio-value">'+m.folio+'</div><div class="lup-fecha-label">Fecha: <strong>'+m.fecha+'</strong></div></div>'
    +'</div>'
    // DATOS
    +'<div class="lup-datos">'
    +'<div class="lup-dato-row">'
    +'<div class="lup-dato"><span class="lup-lbl">Área:</span> '+m.area+'</div>'
    +'<div class="lup-dato"><span class="lup-lbl">Equipo / Máquina:</span> '+m.equipo+'</div>'
    +'</div>'
    +'<div class="lup-dato-row">'
    +'<div class="lup-dato"><span class="lup-lbl">Línea:</span> '+lineaD+'</div>'
    +'<div class="lup-dato"><span class="lup-lbl">Mejora realizada por:</span> '+m.realizado_por+'</div>'
    +'</div>'
    +'</div>'
    // ANTES / DESPUÉS
    +'<div class="lup-body">'
    +'<div class="lup-col">'
    +'<div class="lup-col-hdr antes">ANTES</div>'
    +'<div class="lup-foto-wrap">'
    +(m.foto_antes?'<img class="lup-foto" src="'+m.foto_antes+'" />':'<div class="lup-foto-ph">Sin foto</div>')
    +'</div></div>'
    +'<div class="lup-col">'
    +'<div class="lup-col-hdr despues">DESPUÉS</div>'
    +'<div class="lup-foto-wrap">'
    +(m.foto_despues?'<img class="lup-foto" src="'+m.foto_despues+'" />':'<div class="lup-foto-ph">Sin foto</div>')
    +'</div></div>'
    +'</div>'
    // PIE
    +'<div class="lup-footer">Saporis MTTO — Sistema de Gestión de Mantenimiento</div>'
    +'</div>';

  showScreen('screen-lup-detalle');
}
// ── FIN MÓDULO MEJORAS ───────────────────────────────────────────

// ================================================================
// KPI MEJORAS
// ================================================================
function showMejorasKPI(){
  showScreen('screen-mejoras-kpi');
  var semAct = currentWeek();
  var añoAct = currentYear();
  var tecnicos = USERS.filter(function(u){return u.rol==='tecnico';});
  var semOpts = '<option value="">Todas las semanas</option>'
    + Array.from({length:53},function(_,i){return i+1;}).map(function(s){
    return '<option value="'+s+'"'+(s===semAct?' selected':'')+'>Sem '+s+'</option>';
  }).join('');
  var añoOpts = [añoAct-1,añoAct,añoAct+1].map(function(a){
    return '<option value="'+a+'"'+(a===añoAct?' selected':'')+'>'+a+'</option>';
  }).join('');
  var tecOpts = tecnicos.map(function(t){return '<option value="'+t.nombre+'">'+t.nombre+'</option>';}).join('');

  document.getElementById('mejoras-kpi-content').innerHTML =
    '<div style="padding:14px">'
    +'<div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.07)">'
    +'<div style="display:flex;gap:8px;margin-bottom:8px">'
    +'<div style="flex:1"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Semana</label>'
    +'<select id="mkpi-sem" class="mej-input" style="padding:8px">'+semOpts+'</select></div>'
    +'<div style="flex:1"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Año</label>'
    +'<select id="mkpi-año" class="mej-input" style="padding:8px">'+añoOpts+'</select></div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:10px">'
    +'<div style="flex:1"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Técnico</label>'
    +'<select id="mkpi-tec" class="mej-input" style="padding:8px"><option value="">Todos</option>'+tecOpts+'</select></div>'
    +'<div style="flex:1"><label style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;display:block;margin-bottom:3px">Área</label>'
    +'<select id="mkpi-area" class="mej-input" style="padding:8px"><option value="">Todas</option>'
    +'<option value="Envasado">Envasado</option><option value="Proceso">Proceso</option><option value="Servicios e instalaciones">Servicios e instalaciones</option>'
    +'</select></div>'
    +'</div>'
    +'<button style="width:100%;padding:11px;background:#16a34a;color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer" onclick="mejKPIBuscar()">📊 Ver KPIs</button>'
    +'</div>'
    +'<div id="mkpi-results"></div>'
    +'</div>';
}

async function mejKPIBuscar(){
  var sem  = parseInt(document.getElementById('mkpi-sem').value);
  var año  = parseInt(document.getElementById('mkpi-año').value);
  var tec  = document.getElementById('mkpi-tec').value;
  var area = document.getElementById('mkpi-area').value;
  var res  = document.getElementById('mkpi-results');
  res.innerHTML='<p style="color:#9ca3af;text-align:center;padding:20px">Cargando...</p>';

  var semVal = document.getElementById('mkpi-sem').value;
  var params = 'order=created_at.desc';
  if(semVal){
    var rng = getWeekRange(parseInt(semVal), año);
    params += '&fecha=gte.'+rng.inicio+'&fecha=lte.'+rng.fin;
  }
  if(tec)  params += '&realizado_por=eq.'+encodeURIComponent(tec);
  if(area) params += '&area=eq.'+encodeURIComponent(area);

  try{
    var rows = await supaFetch('mejoras','GET',null,params);
    if(!rows||!rows.length){
      res.innerHTML='<div style="background:#fff;border-radius:10px;padding:32px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.07)"><div style="font-size:40px">📭</div><div style="font-weight:700;margin-top:8px;color:#374151">Sin mejoras en este período</div></div>';
      return;
    }

    // Totales
    var total = rows.length;

    // Por técnico
    var porTec = {};
    rows.forEach(function(r){
      var n = r.realizado_por||'Sin asignar';
      porTec[n] = (porTec[n]||0)+1;
    });

    // Por área
    var porArea = {};
    rows.forEach(function(r){
      var a = r.area||'Sin área';
      porArea[a] = (porArea[a]||0)+1;
    });

    var maxTec  = Math.max.apply(null, Object.values(porTec));
    var maxArea = Math.max.apply(null, Object.values(porArea));

    var colores = ['#16a34a','#2563eb','#dc2626','#d97706','#7c3aed','#0891b2','#db2777','#65a30d'];

    var html = '<div style="background:#fff;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,.07)">'
      +'<div style="text-align:center;margin-bottom:12px">'
      +'<div style="font-size:2.4rem;font-weight:900;color:#16a34a">'+total+'</div>'
      +'<div style="font-size:.85rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Mejoras registradas — Sem '+sem+'/'+año+'</div>'
      +'</div></div>';

    // Gráfico por técnico
    html += '<div style="background:#fff;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,.07)">'
      +'<div style="font-size:.9rem;font-weight:800;color:#1a3c5e;margin-bottom:12px">👷 Mejoras por Técnico</div>';

    Object.entries(porTec).sort(function(a,b){return b[1]-a[1];}).forEach(function(entry, idx){
      var nombre = entry[0], cant = entry[1];
      var pct = Math.round((cant/maxTec)*100);
      var col = colores[idx % colores.length];
      html += '<div style="margin-bottom:10px">'
        +'<div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px">'
        +'<span style="font-weight:600;color:#111827">'+nombre+'</span>'
        +'<span style="font-weight:800;color:'+col+'">'+cant+' mejora'+(cant>1?'s':'')+'</span>'
        +'</div>'
        +'<div style="background:#f3f4f6;border-radius:6px;height:14px;overflow:hidden">'
        +'<div style="width:'+pct+'%;height:100%;background:'+col+';border-radius:6px;transition:width .4s"></div>'
        +'</div></div>';
    });
    html += '</div>';

    // Gráfico por área
    html += '<div style="background:#fff;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 6px rgba(0,0,0,.07)">'
      +'<div style="font-size:.9rem;font-weight:800;color:#1a3c5e;margin-bottom:12px">🏭 Mejoras por Área</div>';

    Object.entries(porArea).sort(function(a,b){return b[1]-a[1];}).forEach(function(entry, idx){
      var nombre = entry[0], cant = entry[1];
      var pct = Math.round((cant/maxArea)*100);
      var col = colores[(idx+3) % colores.length];
      html += '<div style="margin-bottom:10px">'
        +'<div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px">'
        +'<span style="font-weight:600;color:#111827">'+nombre+'</span>'
        +'<span style="font-weight:800;color:'+col+'">'+cant+' mejora'+(cant>1?'s':'')+'</span>'
        +'</div>'
        +'<div style="background:#f3f4f6;border-radius:6px;height:14px;overflow:hidden">'
        +'<div style="width:'+pct+'%;height:100%;background:'+col+';border-radius:6px;transition:width .4s"></div>'
        +'</div></div>';
    });
    html += '</div>';

    // Tabla detalle
    // Guardar rows en variable global para descarga
    window._mejKpiRows = rows;
    html += '<div style="background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 6px rgba(0,0,0,.07)">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
      +'<div style="font-size:.9rem;font-weight:800;color:#1a3c5e">📋 Detalle ('+total+')</div>'
      +'<button onclick="mejKPIDescargar()" style="background:#1a3c5e;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:.8rem;font-weight:700;cursor:pointer">⬇️ Descargar</button>'
      +'</div>'
      +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.78rem">'
      +'<thead><tr style="background:#f0f4ff">'
      +'<th style="padding:6px 8px;text-align:left;font-weight:700;color:#1a3c5e">Folio</th>'
      +'<th style="padding:6px 8px;text-align:left;font-weight:700;color:#1a3c5e">Área</th>'
      +'<th style="padding:6px 8px;text-align:left;font-weight:700;color:#1a3c5e">Técnico</th>'
      +'<th style="padding:6px 8px;text-align:left;font-weight:700;color:#1a3c5e">Fecha</th>'
      +'</tr></thead><tbody>';

    rows.forEach(function(r){
      html += '<tr style="border-bottom:1px solid #f3f4f6">'
        +'<td style="padding:6px 8px;font-weight:700;color:#16a34a">'+r.folio+'</td>'
        +'<td style="padding:6px 8px;color:#374151">'+r.area+'</td>'
        +'<td style="padding:6px 8px;color:#374151">'+r.realizado_por+'</td>'
        +'<td style="padding:6px 8px;color:#6b7280">'+r.fecha+'</td>'
        +'</tr>';
    });

    html += '</tbody></table></div></div>';
    res.innerHTML = html;

  }catch(e){
    res.innerHTML='<p style="color:#ef4444;text-align:center;padding:20px">Error: '+(e.message||e)+'</p>';
  }
}
// ── FIN KPI MEJORAS ──────────────────────────────────────────────

// ================================================================
// ADMIN — Editar Estado y Tipo de OT
// ================================================================
function abrirEditarOTAdmin(id){
  var o = ORDENES.find(function(x){return x.id===id;});
  if(!o) return;
  var modal = document.createElement('div');
  modal.id = 'modal-edit-ot-admin';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-end';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:20px 20px 0 0;padding:24px;width:100%;box-sizing:border-box;max-height:85vh;overflow-y:auto">'
    +'<div style="font-family:Nunito,sans-serif;font-size:17px;font-weight:800;color:#1a3c5e;margin-bottom:4px">✏️ Editar Orden</div>'
    +'<div style="font-size:12px;color:#6b7280;margin-bottom:18px">'+id+'</div>'
    // Estado
    +'<div style="margin-bottom:16px"><label style="font-size:.75rem;font-weight:700;color:#374151;text-transform:uppercase;display:block;margin-bottom:6px">Estado</label>'
    +'<div style="display:flex;gap:8px">'
    +'<button id="eot-btn-abierta" onclick="eotSetEstado(\'abierta\')" style="flex:1;padding:12px;border-radius:10px;border:2px solid '+(o.estado==='abierta'?'#f59e0b':'#d1d5db')+';background:'+(o.estado==='abierta'?'#fef3c7':'#fff')+';font-weight:700;font-size:.9rem;cursor:pointer">📂 Abierta</button>'
    +'<button id="eot-btn-cerrada" onclick="eotSetEstado(\'cerrada\')" style="flex:1;padding:12px;border-radius:10px;border:2px solid '+(o.estado==='cerrada'?'#16a34a':'#d1d5db')+';background:'+(o.estado==='cerrada'?'#dcfce7':'#fff')+';font-weight:700;font-size:.9rem;cursor:pointer">✅ Cerrada</button>'
    +'</div></div>'
    // Tipo
    +'<div style="margin-bottom:20px"><label style="font-size:.75rem;font-weight:700;color:#374151;text-transform:uppercase;display:block;margin-bottom:6px">Tipo de PM</label>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +['PM01','PM02','PM03','PM04'].map(function(t){
      var sel = o.tipo===t;
      return '<button id="eot-btn-'+t+'" onclick="eotSetTipo(\''+t+'\')" style="padding:12px;border-radius:10px;border:2px solid '+(sel?'#2563eb':'#d1d5db')+';background:'+(sel?'#dbeafe':'#fff')+';font-weight:700;font-size:.9rem;cursor:pointer">'+t+'</button>';
    }).join('')
    +'</div></div>'
    +'<div style="display:flex;gap:10px">'
    +'<button onclick="document.getElementById(\'modal-edit-ot-admin\').remove()" style="flex:1;padding:13px;background:#f3f4f6;border:none;border-radius:11px;font-size:.95rem;font-weight:600;cursor:pointer">Cancelar</button>'
    +'<button onclick="guardarEdicionOTAdmin(\''+id+'\')" style="flex:1;padding:13px;background:#7c3aed;color:#fff;border:none;border-radius:11px;font-size:.95rem;font-weight:700;cursor:pointer">💾 Guardar</button>'
    +'</div></div>';
  document.body.appendChild(modal);
  window._eotEstado = o.estado;
  window._eotTipo   = o.tipo;
}

function eotSetEstado(val){
  window._eotEstado = val;
  var btnA = document.getElementById('eot-btn-abierta');
  var btnC = document.getElementById('eot-btn-cerrada');
  if(btnA){ btnA.style.borderColor=val==='abierta'?'#f59e0b':'#d1d5db'; btnA.style.background=val==='abierta'?'#fef3c7':'#fff'; }
  if(btnC){ btnC.style.borderColor=val==='cerrada'?'#16a34a':'#d1d5db'; btnC.style.background=val==='cerrada'?'#dcfce7':'#fff'; }
}

function eotSetTipo(val){
  window._eotTipo = val;
  ['PM01','PM02','PM03','PM04'].forEach(function(t){
    var b = document.getElementById('eot-btn-'+t);
    if(!b) return;
    b.style.borderColor = t===val?'#2563eb':'#d1d5db';
    b.style.background  = t===val?'#dbeafe':'#fff';
  });
}

function guardarEdicionOTAdmin(id){
  var o = ORDENES.find(function(x){return x.id===id;});
  if(!o) return;
  var nuevoEstado = window._eotEstado || o.estado;
  var nuevoTipo   = window._eotTipo   || o.tipo;
  var cambios = [];
  if(nuevoEstado !== o.estado){ cambios.push('Estado: '+o.estado+' → '+nuevoEstado); o.estado=nuevoEstado; if(nuevoEstado==='cerrada'&&!o.cerradaTs){o.cerradaTs=Date.now();o.cerradaPor=currentUser.nombre;} if(nuevoEstado==='abierta'){o.cerradaTs=null;o.cerradaPor='';} }
  if(nuevoTipo !== o.tipo){ cambios.push('Tipo: '+o.tipo+' → '+nuevoTipo); o.tipo=nuevoTipo; }
  if(!cambios.length){ document.getElementById('modal-edit-ot-admin').remove(); return; }
  if(!o.historialModificacion) o.historialModificacion=[];
  o.historialModificacion.push({ts:Date.now(),por:currentUser.nombre,campo:'Admin Edit',de:'—',a:cambios.join(' | ')});
  saveDB('ordenes',ORDENES);
  saveOrdenSupa(o);
  document.getElementById('modal-edit-ot-admin').remove();
  showAlert('✅ Orden actualizada: '+cambios.join(', '));
  showDetalle(id);
}

// ================================================================
// PM — Borrar foto en wizard
// ================================================================
function pmBorrarFoto(){
  pmState.foto = null;
  // Re-render solo la preview sin perder el texto
  var preview = document.querySelector('.foto-preview');
  if(preview && preview.parentElement){
    preview.parentElement.outerHTML = '';
  }
  // Reset file inputs
  var cam = document.getElementById('foto-input-camara');
  var gal = document.getElementById('foto-input-galeria');
  if(cam) cam.value='';
  if(gal) gal.value='';
  showAlert('Foto eliminada','warning');
}

// ================================================================
// KPI MEJORAS — Descargar (PDF masivo o Excel)
// ================================================================
function mejKPIDescargar(){
  var rows = window._mejKpiRows;
  if(!rows||!rows.length){ showAlert('Sin datos para descargar','error'); return; }

  var modal = document.createElement('div');
  modal.id = 'modal-mej-descarga';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-end';
  modal.innerHTML =
    '<div style="background:#fff;border-radius:20px 20px 0 0;padding:24px;width:100%;box-sizing:border-box">'
    +'<div style="font-family:Nunito,sans-serif;font-size:17px;font-weight:800;color:#1a3c5e;margin-bottom:6px">⬇️ Descargar Mejoras</div>'
    +'<div style="font-size:13px;color:#6b7280;margin-bottom:20px">'+rows.length+' registro(s) — ¿En qué formato?</div>'
    +'<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">'
    +'<button onclick="mejKPIDescargaExcel();document.getElementById(\'modal-mej-descarga\').remove()" style="padding:16px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer">📊 Excel (.xls)</button>'
    +'<button onclick="mejKPIDescargaPDF();document.getElementById(\'modal-mej-descarga\').remove()" style="padding:16px;background:linear-gradient(135deg,#1a3c5e,#2563eb);color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer">📄 PDF Masivo</button>'
    +'</div>'
    +'<button onclick="document.getElementById(\'modal-mej-descarga\').remove()" style="width:100%;padding:12px;background:#f3f4f6;border:none;border-radius:11px;font-size:.95rem;cursor:pointer">Cancelar</button>'
    +'</div>';
  document.body.appendChild(modal);
}

function mejKPIDescargaExcel(){
  var rows = window._mejKpiRows || [];
  if(!rows.length){ showAlert('Sin datos','error'); return; }
  var hdrs = ['Folio','Tema','Fecha','Área','Línea','Línea Otro','Equipo','Realizado Por','Registrado Por'];
  var dataRows = rows.map(function(r){
    return [r.folio, r.tema||'Registro de Mejora', r.fecha, r.area, r.linea, r.linea_otro||'', r.equipo, r.realizado_por, r.created_by||''];
  });
  generarExcelXML(hdrs, dataRows, 'Saporis_Mejoras_'+new Date().toISOString().slice(0,10)+'.xls', 'Mejoras');
  showAlert('✅ Excel descargado — '+rows.length+' mejoras');
}

function mejKPIDescargaPDF(){
  var rows = window._mejKpiRows || [];
  if(!rows.length){ showAlert('Sin datos','error'); return; }

  var logoB64 = LOGO_MEJORA;
  var win = window.open('','_blank');
  if(!win){ showAlert('Permite ventanas emergentes para descargar PDF','error'); return; }

  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mejoras LUP</title>'
    +'<style>'
    +'body{font-family:Arial,sans-serif;margin:0;padding:0}'
    +'.page{page-break-after:always;border:2px solid #1a3c5e;margin:16px;border-radius:8px;overflow:hidden}'
    +'.page:last-child{page-break-after:auto}'
    +'.hdr{display:flex;border-bottom:2px solid #1a3c5e}'
    +'.hdr-logo{padding:8px;border-right:1.5px solid #1a3c5e;display:flex;align-items:center;justify-content:center;min-width:70px}'
    +'.hdr-logo img{width:52px;height:52px;border-radius:50%;object-fit:contain}'
    +'.hdr-title{flex:1;padding:8px 12px;border-right:1.5px solid #1a3c5e}'
    +'.hdr-main{font-size:15px;font-weight:700;color:#1a3c5e}'
    +'.hdr-sub{font-size:11px;color:#374151;margin-top:2px}'
    +'.hdr-folio{padding:8px 10px;min-width:110px}'
    +'.folio-lbl{font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase}'
    +'.folio-val{font-size:13px;font-weight:700;color:#1a3c5e;margin-bottom:2px}'
    +'.folio-fecha{font-size:11px;color:#374151}'
    +'.datos{border-bottom:1.5px solid #1a3c5e;padding:7px 12px;background:#f0f4ff}'
    +'.dato-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:3px}'
    +'.dato{font-size:12px;color:#111827;flex:1;min-width:140px}'
    +'.lbl{font-weight:700;color:#1a3c5e}'
    +'.body{display:flex;min-height:220px;border-bottom:1.5px solid #1a3c5e}'
    +'.col{flex:1;display:flex;flex-direction:column}'
    +'.col:first-child{border-right:1.5px solid #1a3c5e}'
    +'.col-hdr{padding:7px;font-weight:700;font-size:13px;text-align:center;color:#fff;letter-spacing:.05em}'
    +'.antes{background:#dc2626}.despues{background:#16a34a}'
    +'.foto-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:8px}'
    +'.foto-wrap img{width:100%;max-height:190px;object-fit:cover;border-radius:5px}'
    +'.foto-ph{color:#9ca3af;font-size:12px}'
    +'.footer{padding:5px 12px;font-size:10px;color:#9ca3af;text-align:center}'
    +'@media print{.page{margin:0;border-radius:0;border:2px solid #1a3c5e}}'
    +'</style></head><body>';

  rows.forEach(function(m){
    var lineaD = m.linea==='Otro'?(m.linea_otro||'—'):m.linea;
    html += '<div class="page">'
      +'<div class="hdr">'
      +'<div class="hdr-logo"><img src="'+logoB64+'" /></div>'
      +'<div class="hdr-title"><div class="hdr-main">Lección de Un Punto</div><div class="hdr-sub">Tema: <strong>Mejora Implementada</strong></div></div>'
      +'<div class="hdr-folio"><div class="folio-lbl">Folio</div><div class="folio-val">'+m.folio+'</div><div class="folio-fecha">Fecha: <strong>'+m.fecha+'</strong></div></div>'
      +'</div>'
      +'<div class="datos">'
      +'<div class="dato-row"><div class="dato"><span class="lbl">Área:</span> '+m.area+'</div><div class="dato"><span class="lbl">Equipo / Máquina:</span> '+m.equipo+'</div></div>'
      +'<div class="dato-row"><div class="dato"><span class="lbl">Línea:</span> '+lineaD+'</div><div class="dato"><span class="lbl">Mejora realizada por:</span> '+m.realizado_por+'</div></div>'
      +'</div>'
      +'<div class="body">'
      +'<div class="col"><div class="col-hdr antes">ANTES</div><div class="foto-wrap">'
      +(m.foto_antes?'<img src="'+m.foto_antes+'" />':'<div class="foto-ph">Sin foto</div>')
      +'</div></div>'
      +'<div class="col"><div class="col-hdr despues">DESPUÉS</div><div class="foto-wrap">'
      +(m.foto_despues?'<img src="'+m.foto_despues+'" />':'<div class="foto-ph">Sin foto</div>')
      +'</div></div>'
      +'</div>'
      +'<div class="footer">Saporis MTTO — '+m.folio+' — '+m.fecha+'</div>'
      +'</div>';
  });

  html += '<script>window.onload=function(){window.print();}<\/script></body></html>';
  win.document.write(html);
  win.document.close();
}
// ── FIN FUNCIONES ADICIONALES ────────────────────────────────────

// ================================================================
// GENERADOR EXCEL XML — garantiza una celda por campo
// ================================================================
function generarExcelXML(hdrs, dataRows, filename, sheetName){
  // Usar SheetJS para generar .xlsx real — cada dato en su propia celda
  try{
    if(typeof XLSX === 'undefined'){ throw new Error('SheetJS no cargado'); }
    var wsData = [hdrs].concat(dataRows.map(function(row){
      return row.map(function(v){ return v===null||v===undefined?'':v; });
    }));
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    // Ancho de columnas automático basado en contenido
    var colWidths = hdrs.map(function(h, ci){
      var max = h.length;
      dataRows.forEach(function(row){
        var v = String(row[ci]===null||row[ci]===undefined?'':row[ci]);
        if(v.length > max) max = v.length;
      });
      return { wch: Math.min(max + 2, 40) };
    });
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (sheetName||'Datos').substring(0,31));
    var fname = filename.replace(/\.xls$/, '.xlsx').replace(/\.csv$/, '.xlsx');
    XLSX.writeFile(wb, fname);
  } catch(e){
    console.error('SheetJS error:', e);
    // Fallback: CSV con punto y coma si SheetJS falla
    function ec(v){
      var s = String(v===null||v===undefined?'':v).replace(/[\r\n]+/g,' ');
      if(s.indexOf(';')>=0||s.indexOf('"')>=0) s='"'+s.replace(/"/g,'""')+'"';
      return s;
    }
    var crlf = '\r\n';
    var lineas = [hdrs.map(ec).join(';')];
    dataRows.forEach(function(row){ lineas.push(row.map(ec).join(';')); });
    var bom = String.fromCharCode(65279);
    var blob = new Blob([bom+lineas.join(crlf)],{type:'text/csv;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href=url; a.download=filename.replace(/\.xls$/,'.csv');
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
// ── FIN EXCEL XML ─────────────────────────────────────────────────

// ================================================================
// DETALLE INSPECCIONES — desde KPI
// ================================================================
function showDetalleInspecciones(){
  showScreen('screen-insp-detalle');
  var cont = document.getElementById('insp-detalle-content');
  cont.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:20px">Cargando...</p>';

  // Filtros de semana/año activos en KPI
  var semSel = document.getElementById('kpi-sem-sel');
  var añoSel = document.getElementById('kpi-año-sel');
  var semRaw = semSel ? semSel.value : '';
  var sem    = semRaw===''?currentWeek():parseInt(semRaw)||0;
  var año    = añoSel ? (parseInt(añoSel.value)||currentYear()) : currentYear();
  var todoElAnio = (semRaw===''||semRaw==='0'||!semRaw);

  var inspF = INSPECCIONES.filter(function(i){
    var iAno = i.año||i.anio||new Date(i.ts||i.tsCierre||0).getFullYear();
    var iSem = i.semana||0;
    if(!iSem&&i.tsCierre){ var d=new Date(i.tsCierre); iSem=getWeekNumber(d); }
    if(todoElAnio) return iAno===año;
    return iSem===sem && iAno===año;
  }).sort(function(a,b){ return (b.tsCierre||b.ts||0)-(a.tsCierre||a.ts||0); });

  if(!inspF.length){
    cont.innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af"><div style="font-size:40px">📋</div><div style="font-weight:700;margin-top:8px">Sin inspecciones en este período</div></div>';
    return;
  }

  var html = '<div style="padding:14px">';
  html += '<div style="font-size:13px;font-weight:700;color:#6b7280;margin-bottom:12px">'+inspF.length+' inspección(es) — '+(todoElAnio?'Año '+año:'Semana '+sem+'/'+año)+'</div>';

  inspF.forEach(function(insp){
    var tecNom = insp.tecnico||insp.tecnicoNombre||insp.levantadoPor||'—';
    var fecha  = insp.fecha||fmtDate(insp.tsCierre||insp.ts||0);
    var turno  = insp.turno||'—';
    var momento= insp.momentoInspeccion||insp.momento||'—';
    var puntos = insp.puntos||[];
    var verde  = puntos.filter(function(p){return p.estado==='verde';}).length;
    var rojo   = puntos.filter(function(p){return p.estado==='rojo';}).length;
    var napl   = puntos.filter(function(p){return p.estado==='no_aplica';}).length;
    var total  = puntos.length;
    var aplicables = total - napl;
    var pct    = aplicables>0?Math.round((verde/aplicables)*100):100;
    var col    = pct>=80?'#16a34a':pct>=50?'#d97706':'#dc2626';

    html += '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-left:4px solid '+col+'">';
    // Encabezado
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'
      +'<div>'
      +'<div style="font-size:.9rem;font-weight:800;color:#111827">'+tecNom+'</div>'
      +'<div style="font-size:.75rem;color:#6b7280">'+fecha+' · Turno '+turno+' · '+(momento==='inicio'?'🌅 Inicio':'⏰ Medio turno')+'</div>'
      +'</div>'
      +'<div style="text-align:right">'
      +'<div style="font-size:1.3rem;font-weight:900;color:'+col+'">'+pct+'%</div>'
      +'<div style="font-size:.7rem;color:#6b7280">cumplimiento</div>'
      +'</div></div>';

    // Resumen contadores
    html += '<div style="display:flex;gap:6px;margin-bottom:10px">'
      +'<div style="flex:1;background:#dcfce7;border-radius:7px;padding:6px;text-align:center"><div style="font-size:1.1rem;font-weight:800;color:#16a34a">'+verde+'</div><div style="font-size:.65rem;color:#16a34a;font-weight:700">✅ Verde</div></div>'
      +'<div style="flex:1;background:#fee2e2;border-radius:7px;padding:6px;text-align:center"><div style="font-size:1.1rem;font-weight:800;color:#dc2626">'+rojo+'</div><div style="font-size:.65rem;color:#dc2626;font-weight:700">🔴 Rojo</div></div>'
      +'<div style="flex:1;background:#f3f4f6;border-radius:7px;padding:6px;text-align:center"><div style="font-size:1.1rem;font-weight:800;color:#6b7280">'+napl+'</div><div style="font-size:.65rem;color:#6b7280;font-weight:700">⬛ N/A</div></div>'
      +'<div style="flex:1;background:#f0f4ff;border-radius:7px;padding:6px;text-align:center"><div style="font-size:1.1rem;font-weight:800;color:#1a3c5e">'+total+'</div><div style="font-size:.65rem;color:#1a3c5e;font-weight:700">Total</div></div>'
      +'</div>';

    // Puntos en rojo — siempre visibles para tomar acción
    var rojosLista = puntos.filter(function(p){return p.estado==='rojo';});
    if(rojosLista.length){
      html += '<div style="background:#fff5f5;border:1px solid #fecaca;border-radius:8px;padding:8px;margin-bottom:8px">'
        +'<div style="font-size:.75rem;font-weight:700;color:#dc2626;margin-bottom:6px">🔴 Puntos en Rojo — Requieren atención</div>';
      rojosLista.forEach(function(p){
        html += '<div style="font-size:.78rem;color:#374151;padding:4px 0;border-bottom:1px solid #fee2e2">'
          +'<div style="font-weight:600">'+p.nombre+'</div>'
          +(p.comentario?'<div style="color:#dc2626;font-size:.72rem;margin-top:1px">⚠️ '+p.comentario+'</div>':'')
          +(p.hora?'<div style="color:#9ca3af;font-size:.68rem">'+p.hora+'</div>':'')
          +'</div>';
      });
      html += '</div>';
    }

    // Toggle para ver todos los puntos
    var inspId = insp.id||('insp_'+Math.random());
    html += '<button onclick="togglePuntosInsp(\'puntos-'+inspId+'\')" style="width:100%;padding:7px;background:#f0f4ff;border:none;border-radius:7px;font-size:.8rem;font-weight:600;color:#1a3c5e;cursor:pointer">Ver todos los puntos ('+total+')</button>';
    html += '<div id="puntos-'+inspId+'" style="display:none;margin-top:8px">';
    puntos.forEach(function(p){
      var bg = p.estado==='verde'?'#f0fdf4':p.estado==='rojo'?'#fff5f5':p.estado==='no_aplica'?'#f9fafb':'#fff';
      var ic = p.estado==='verde'?'✅':p.estado==='rojo'?'🔴':p.estado==='no_aplica'?'⬛':'○';
      html += '<div style="background:'+bg+';border-radius:6px;padding:6px 8px;margin-bottom:4px;font-size:.75rem">'
        +'<div style="display:flex;gap:6px;align-items:flex-start">'
        +'<span>'+ic+'</span>'
        +'<div><div style="font-weight:600;color:#111827">'+p.nombre+'</div>'
        +(p.comentario?'<div style="color:#dc2626;margin-top:1px">'+p.comentario+'</div>':'')
        +(p.hora?'<div style="color:#9ca3af;font-size:.68rem">'+p.hora+'</div>':'')
        +'</div></div></div>';
    });
    html += '</div>';
    html += '</div>'; // card
  });

  html += '</div>';
  cont.innerHTML = html;
}

function togglePuntosInsp(id){
  var el = document.getElementById(id);
  if(!el) return;
  el.style.display = el.style.display==='none'?'block':'none';
}
// ── FIN DETALLE INSPECCIONES ─────────────────────────────────────

// ================================================================
// CHECKLISTS DINÁMICOS
// ================================================================

// Tipos de checklist — puntos guardados en localStorage por admins
var CHECKLIST_TIPOS = [
  { id: 'inspeccion_turno',   label: 'Inspección de Turno',            icon: '✅', color: '#16a34a' },
  { id: 'paro_planta',        label: 'Paro de Planta Servicios',        icon: '🔴', color: '#dc2626' },
  { id: 'arranque_planta',    label: 'Arranque de Planta Servicios',    icon: '🟢', color: '#2563eb' },
];

function getChecklistPuntos(tipoId) {
  // inspeccion_turno usa los puntos globales ya definidos
  if (tipoId === 'inspeccion_turno') return loadDB('chk_puntos_inspeccion_turno', CHECKLIST_PUNTOS.map(function(p){ return {id: p, texto: p}; }));
  return loadDB('chk_puntos_' + tipoId, []);
}

function saveChecklistPuntos(tipoId, puntos) {
  saveDB('chk_puntos_' + tipoId, puntos);
}

// ── MENÚ CHECKLISTS ──────────────────────────────────────────────
function showChecklistMenu() {
  showScreen('screen-checklist-menu');
  var isAdmin = currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'super');
  var cont = document.getElementById('checklist-menu-content');
  var html = '<div style="padding:16px;display:flex;flex-direction:column;gap:12px">';

  CHECKLIST_TIPOS.forEach(function(tipo) {
    var puntos = getChecklistPuntos(tipo.id);
    html += '<div style="background:#fff;border-radius:13px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.08);border-left:5px solid ' + tipo.color + '">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">'
      + '<span style="font-size:2rem">' + tipo.icon + '</span>'
      + '<div style="flex:1"><div style="font-weight:800;font-size:1rem;color:#111827">' + tipo.label + '</div>'
      + '<div style="font-size:.75rem;color:#6b7280">' + puntos.length + ' punto(s) configurado(s)</div></div>'
      + '</div>'
      + '<div style="display:flex;gap:8px">'
      + '<button onclick="iniciarChecklist(\'' + tipo.id + '\')" style="flex:2;padding:11px;background:' + tipo.color + ';color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer">▶ Iniciar</button>'
      + (isAdmin ? '<button onclick="editarPuntosChecklist(\'' + tipo.id + '\')" style="flex:1;padding:11px;background:#f0f4ff;border:none;border-radius:10px;font-size:.85rem;font-weight:600;color:#1a3c5e;cursor:pointer">⚙️ Puntos</button>' : '')
      + '</div></div>';
  });

  html += '</div>';
  cont.innerHTML = html;
}

// ── INICIAR CHECKLIST ────────────────────────────────────────────
var _chkActual = null;

function iniciarChecklist(tipoId) {
  // Si es inspeccion_turno, usar el flujo existente
  if (tipoId === 'inspeccion_turno') { showInspeccion(); return; }

  var tipo = CHECKLIST_TIPOS.find(function(t){ return t.id === tipoId; });
  if (!tipo) return;
  var puntos = getChecklistPuntos(tipoId);
  if (!puntos.length) {
    showAlert('No hay puntos configurados. Pide al administrador que los agregue.', 'error');
    return;
  }

  _chkActual = {
    tipoId: tipoId,
    tipoLabel: tipo.label,
    tipoColor: tipo.color,
    tecnicoId: currentUser.id,
    tecnicoNombre: currentUser.nombre,
    fecha: todayStr(),
    turno: getTurno(),
    estado: 'en_progreso',
    puntos: puntos.map(function(p) {
      return { id: p.id, nombre: p.texto || p, estado: null, hora: null, comentario: '' };
    }),
    tsInicio: Date.now()
  };

  document.getElementById('chk-topbar-title').textContent = tipo.icon + ' ' + tipo.label;
  renderChecklist();
  showScreen('screen-checklist');
}

function renderChecklist() {
  if (!_chkActual) return;
  var cont = document.getElementById('checklist-content');
  var puntos = _chkActual.puntos;
  var verde  = puntos.filter(function(p){ return p.estado === 'verde'; }).length;
  var rojo   = puntos.filter(function(p){ return p.estado === 'rojo'; }).length;
  var napl   = puntos.filter(function(p){ return p.estado === 'no_aplica'; }).length;
  var total  = puntos.length;
  var aplicables = total - napl;
  var pct = aplicables > 0 ? Math.round(((verde + rojo) / aplicables) * 100) : 0;
  var col = pct === 100 ? 'var(--vd)' : 'var(--mo)';

  var html = '<div style="background:#fff;border-radius:12px;padding:14px;margin:12px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    + '<div style="font-size:.85rem;font-weight:700;color:#374151">Turno ' + _chkActual.turno + ' — ' + _chkActual.fecha + '</div>'
    + '<span style="background:' + (pct===100?'var(--vd3)':'var(--am3)') + ';color:' + (pct===100?'var(--vd)':'var(--am)') + ';border-radius:20px;padding:3px 10px;font-size:.8rem;font-weight:700">' + (verde+rojo) + '/' + total + '</span>'
    + '</div>'
    + '<div style="background:var(--gr3);border-radius:6px;height:8px;overflow:hidden">'
    + '<div style="width:' + pct + '%;height:100%;background:' + col + ';border-radius:6px;transition:width .3s"></div></div>'
    + '<div style="font-size:.7rem;color:var(--txt3);margin-top:4px">' + pct + '% · ' + verde + ' ✅ · ' + rojo + ' 🔴 · ' + napl + ' ⬛</div>'
    + '</div>';

  // Un click = verde, doble click = rojo (con comentario), triple = no aplica
  // Implementamos con tap: null→verde→rojo(modal)→no_aplica→null
  html += '<div style="padding:0 12px 100px">';
  puntos.forEach(function(p, idx) {
    var bg   = p.estado==='verde'?'#f0fdf4':p.estado==='rojo'?'#fff5f5':p.estado==='no_aplica'?'#f9fafb':'#fff';
    var bdr  = p.estado==='verde'?'#16a34a':p.estado==='rojo'?'#dc2626':p.estado==='no_aplica'?'#9ca3af':'#e5e7eb';
    var ic   = p.estado==='verde'?'✓':p.estado==='rojo'?'✗':p.estado==='no_aplica'?'⬛':'○';
    var icCol= p.estado==='verde'?'#16a34a':p.estado==='rojo'?'#dc2626':p.estado==='no_aplica'?'#9ca3af':'#9ca3af';
    html += '<button onclick="chkToggle(' + idx + ')" style="width:100%;display:flex;align-items:center;gap:12px;background:' + bg + ';border:2px solid ' + bdr + ';border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;text-align:left">'
      + '<div style="width:28px;height:28px;border-radius:50%;background:' + bdr + ';display:flex;align-items:center;justify-content:center;color:#fff;font-size:.9rem;font-weight:800;flex-shrink:0">' + ic + '</div>'
      + '<div style="flex:1"><div style="font-size:.88rem;font-weight:600;color:#111827">' + p.nombre + '</div>'
      + (p.hora ? '<div style="font-size:.7rem;color:#6b7280;margin-top:2px">⏱ ' + p.hora + (p.comentario?' — '+p.comentario.substring(0,30):'') + '</div>' : '')
      + '</div></button>';
  });
  html += '</div>';
  cont.innerHTML = html;
}

function chkToggle(idx) {
  if (!_chkActual) return;
  var p = _chkActual.puntos[idx];
  var estado = p.estado;
  if (!estado || estado === 'no_aplica') {
    p.estado = 'verde'; p.hora = fmtTime(Date.now()); p.comentario = '';
    renderChecklist();
  } else if (estado === 'verde') {
    // Abrir modal para comentario de rojo
    puntoRojoIdx = idx;
    document.getElementById('modal-punto-nombre').textContent = p.nombre;
    document.getElementById('modal-comentario-input').value = '';
    showModal('modal-comentario-rojo');
  } else if (estado === 'rojo') {
    p.estado = 'no_aplica'; p.hora = fmtTime(Date.now()); p.comentario = '';
    renderChecklist();
  }
}

// Override confirmarComentarioRojo para manejar ambos flujos (inspeccion y checklists)
var _origConfirmarRojo = confirmarComentarioRojo;
confirmarComentarioRojo = function() {
  if (_chkActual && puntoRojoIdx >= 0 && document.getElementById('screen-checklist').classList.contains('active')) {
    var obs = document.getElementById('modal-comentario-input').value.trim();
    if (!obs) { showAlert('Describe el problema', 'error'); return; }
    _chkActual.puntos[puntoRojoIdx].estado = 'rojo';
    _chkActual.puntos[puntoRojoIdx].hora = fmtTime(Date.now());
    _chkActual.puntos[puntoRojoIdx].comentario = obs;
    cerrarModal('modal-comentario-rojo');
    puntoRojoIdx = -1;
    renderChecklist();
  } else {
    _origConfirmarRojo();
  }
};

var _origMarcarNoAplica = marcarNoAplica;
marcarNoAplica = function() {
  if (_chkActual && puntoRojoIdx >= 0 && document.getElementById('screen-checklist').classList.contains('active')) {
    _chkActual.puntos[puntoRojoIdx].estado = 'no_aplica';
    _chkActual.puntos[puntoRojoIdx].hora = fmtTime(Date.now());
    _chkActual.puntos[puntoRojoIdx].comentario = '';
    cerrarModal('modal-comentario-rojo');
    puntoRojoIdx = -1;
    renderChecklist();
  } else {
    _origMarcarNoAplica();
  }
};

// ── GUARDAR CHECKLIST ────────────────────────────────────────────
async function guardarChecklist() {
  if (!_chkActual) return;
  var incompletos = _chkActual.puntos.filter(function(p){ return !p.estado; }).length;
  if (incompletos > 0) {
    if (!confirm('Hay ' + incompletos + ' punto(s) sin revisar. ¿Guardar de todas formas?')) return;
  }
  _chkActual.estado = 'cerrada';
  _chkActual.tsCierre = Date.now();
  _chkActual.semana = currentWeek();
  _chkActual.año = currentYear();
  var verde = _chkActual.puntos.filter(function(p){ return p.estado==='verde'; }).length;
  var rojo  = _chkActual.puntos.filter(function(p){ return p.estado==='rojo'; }).length;
  var napl  = _chkActual.puntos.filter(function(p){ return p.estado==='no_aplica'; }).length;

  // Guardar en INSPECCIONES con tipo diferenciador
  var insp = Object.assign({}, _chkActual, {
    id: genID('CHK'),
    tipo: _chkActual.tipoId,
    area: 'servicios',
    momento: _chkActual.tipoId,
    levantadoPor: currentUser.nombre,
    tsFin: fmtTime(Date.now())
  });

  var idx = INSPECCIONES.findIndex(function(i){ return i.id === insp.id; });
  if (idx >= 0) INSPECCIONES[idx] = insp; else INSPECCIONES.push(insp);
  saveDB('inspecciones', INSPECCIONES);

  // Sync a Supabase
  supaUpsert('inspecciones', {
    id: insp.id,
    tipo: insp.tipoId,
    area: 'servicios',
    turno: insp.turno,
    momento: insp.tipoId,
    estado: 'cerrada',
    semana: insp.semana,
    anio: insp.año,
    tecnico: insp.tecnicoNombre,
    tecnico_id: insp.tecnicoId,
    levantado_por: insp.tecnicoNombre,
    ts: insp.tsCierre,
    puntos_total: insp.puntos.length,
    puntos_verde: verde,
    puntos_rojo: rojo
  }).catch(function(){});

  showAlert('✅ Check list guardado — ' + verde + ' ✅ / ' + rojo + ' 🔴 / ' + napl + ' ⬛');
  _chkActual = null;
  showChecklistMenu();
}

// ── ADMIN: EDITAR PUNTOS ─────────────────────────────────────────
function editarPuntosChecklist(tipoId) {
  var tipo = CHECKLIST_TIPOS.find(function(t){ return t.id === tipoId; });
  var puntos = getChecklistPuntos(tipoId);

  var modal = document.createElement('div');
  modal.id = 'modal-chk-puntos';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:flex-end';

  function render() {
    var ps = getChecklistPuntos(tipoId);
    modal.innerHTML = '<div style="background:#fff;border-radius:20px 20px 0 0;padding:20px;width:100%;box-sizing:border-box;max-height:85vh;display:flex;flex-direction:column">'
      + '<div style="font-family:Nunito,sans-serif;font-size:16px;font-weight:800;color:#1a3c5e;margin-bottom:4px">' + (tipo?tipo.icon+' ':' ') + (tipo?tipo.label:'') + '</div>'
      + '<div style="font-size:12px;color:#6b7280;margin-bottom:14px">Administrar puntos del check list</div>'
      + '<div style="overflow-y:auto;flex:1;margin-bottom:12px">'
      + (ps.length === 0 ? '<div style="color:#9ca3af;text-align:center;padding:20px;font-size:.85rem">Sin puntos aún</div>' : '')
      + ps.map(function(p, i) {
        return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f3f4f6">'
          + '<span style="flex:1;font-size:.85rem;color:#111827">' + (p.texto||p) + '</span>'
          + '<button onclick="chkEliminarPunto(\'' + tipoId + '\',' + i + ')" style="background:#fee2e2;color:#dc2626;border:none;border-radius:7px;padding:4px 10px;font-size:.78rem;cursor:pointer">🗑</button>'
          + '</div>';
      }).join('')
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-bottom:12px">'
      + '<input id="chk-nuevo-punto" type="text" placeholder="Nuevo punto..." style="flex:1;padding:10px;border:1.5px solid #d1d5db;border-radius:9px;font-size:.88rem">'
      + '<button onclick="chkAgregarPunto(\'' + tipoId + '\')" style="padding:10px 16px;background:#1a3c5e;color:#fff;border:none;border-radius:9px;font-size:.88rem;font-weight:700;cursor:pointer">+ Agregar</button>'
      + '</div>'
      + '<button onclick="document.getElementById(\'modal-chk-puntos\').remove()" style="width:100%;padding:12px;background:#f3f4f6;border:none;border-radius:11px;font-size:.95rem;cursor:pointer">Cerrar</button>'
      + '</div>';
  }

  window._chkModalRender = render;
  render();
  document.body.appendChild(modal);
}

function chkAgregarPunto(tipoId) {
  var inp = document.getElementById('chk-nuevo-punto');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) { showAlert('Escribe el punto', 'error'); return; }
  var ps = getChecklistPuntos(tipoId);
  ps.push({ id: 'pt_' + Date.now(), texto: txt });
  saveChecklistPuntos(tipoId, ps);
  showAlert('✅ Punto agregado');
  if (window._chkModalRender) window._chkModalRender();
  showChecklistMenu();
}

function chkEliminarPunto(tipoId, idx) {
  if (!confirm('¿Eliminar este punto?')) return;
  var ps = getChecklistPuntos(tipoId);
  ps.splice(idx, 1);
  saveChecklistPuntos(tipoId, ps);
  if (window._chkModalRender) window._chkModalRender();
  showChecklistMenu();
}
// ── FIN CHECKLISTS ───────────────────────────────────────────────
