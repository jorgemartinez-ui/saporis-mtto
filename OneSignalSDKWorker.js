importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

var SUPA_URL = 'https://bwjvmtwkgvyewyjfazou.supabase.co';
var SUPA_KEY = 'sb_publishable_bMC14dd2RT3n0Ka3Mwb8Yg_JRXlz-OE';
var ultimaAlerta = 0;
var miTecnicoId = null;

self.addEventListener('message', function(e){
  if(!e.data) return;
  if(e.data.type === 'SET_TECNICO'){ miTecnicoId = e.data.tecnicoId; ultimaAlerta = 0; }
  if(e.data.type === 'ALERTA_VISTA'){ ultimaAlerta = e.data.ts; }
  if(e.data.type === 'SHOW_NOTIFICATION'){
    e.waitUntil(self.registration.showNotification(e.data.title || 'Alerta Saporis', {
      body: e.data.body || '',
      icon: '/icons/icon-192.png',
      vibrate: [300,100,300,100,300,100,500,100,500],
      requireInteraction: true,
      tag: 'alerta-saporis',
      renotify: true
    }));
  }
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cls){
    for(var i=0;i<cls.length;i++){ if('focus' in cls[i]){ cls[i].focus(); return; } }
    return clients.openWindow('/');
  }));
});

function checkAlertas(){
  if(!miTecnicoId) return;
  fetch(SUPA_URL+'/rest/v1/config?select=key,value',{
    headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}
  }).then(function(r){ return r.json(); }).then(function(rows){
    if(!rows||!rows.length) return;
    var estoyEnTurno = false;
    rows.forEach(function(r){
      if(!r.key||!r.key.startsWith('turno_activo_')) return;
      try{ var t=JSON.parse(r.value); if(t&&t.tecnicoId===miTecnicoId) estoyEnTurno=true; }catch(e){}
    });
    rows.forEach(function(r){
      if(!r.key||!r.key.startsWith('alerta_')) return;
      if(!r.value||r.value==='null') return;
      var alerta; try{ alerta=JSON.parse(r.value); }catch(e){ return; }
      if(!alerta||alerta.estado!=='activa') return;
      if(alerta.ts<=ultimaAlerta) return;
      if(Date.now()-alerta.ts>300000) return;
      var esMia = alerta.tecnicoDestinoId ? alerta.tecnicoDestinoId===miTecnicoId : estoyEnTurno;
      if(esMia){
        ultimaAlerta = alerta.ts;
        self.registration.showNotification('Llamada - '+alerta.area, {
          body: (alerta.descripcion ? alerta.descripcion+' - ' : '') + alerta.solicitadoPor,
          icon: '/icons/icon-192.png',
          vibrate: [300,100,300,100,300,100,500,100,500],
          requireInteraction: true,
          tag: 'alerta-saporis',
          renotify: true
        });
        self.clients.matchAll({type:'window'}).then(function(cls){
          cls.forEach(function(c){ c.postMessage({type:'NUEVA_ALERTA',alerta:alerta}); });
        });
      }
    });
  }).catch(function(){});
}
setInterval(checkAlertas, 10000);
