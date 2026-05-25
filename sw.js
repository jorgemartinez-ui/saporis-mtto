// Saporis SW — includes Firebase messaging for background push
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBKKy3ZXGNPwbek-66MUqRc7XBxPgqnfNw",
  authDomain: "saporis-12c9f.firebaseapp.com",
  projectId: "saporis-12c9f",
  storageBucket: "saporis-12c9f.firebasestorage.app",
  messagingSenderId: "787748519692",
  appId: "1:787748519692:web:00b4812ef46dab61899329"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[SW FCM] Background message:', payload);
  const title = (payload.notification && payload.notification.title) || 'Llamada Saporis';
  const body = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(title, {
    body: body,
    icon: '/icons/icon-192.png',
    vibrate: [500,200,500,200,500,200,800],
    requireInteraction: true,
    tag: 'alerta-saporis',
    renotify: true
  });
});

// Saporis polling logic
var SUPA_URL = 'https://bwjvmtwkgvyewyjfazou.supabase.co';
var SUPA_KEY = 'sb_publishable_bMC14dd2RT3n0Ka3Mwb8Yg_JRXlz-OE';
var ultimaAlerta = 0;
var miTecnicoId = null;

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

function saveId(id){
  return new Promise(function(resolve){
    var req = indexedDB.open('saporis',1);
    req.onupgradeneeded = function(e){ e.target.result.createObjectStore('kv'); };
    req.onsuccess = function(e){
      var tx = e.target.result.transaction('kv','readwrite');
      tx.objectStore('kv').put(id,'tecnicoId');
      tx.oncomplete = resolve;
    };
    req.onerror = resolve;
  });
}

function loadId(){
  return new Promise(function(resolve){
    var req = indexedDB.open('saporis',1);
    req.onupgradeneeded = function(e){ e.target.result.createObjectStore('kv'); };
    req.onsuccess = function(e){
      var tx = e.target.result.transaction('kv','readonly');
      var r = tx.objectStore('kv').get('tecnicoId');
      r.onsuccess = function(){ resolve(r.result||null); };
      r.onerror = function(){ resolve(null); };
    };
    req.onerror = function(){ resolve(null); };
  });
}

self.addEventListener('message', function(e){
  if(!e.data) return;
  if(e.data.type==='SET_TECNICO'){ miTecnicoId=e.data.tecnicoId; ultimaAlerta=0; saveId(miTecnicoId); }
  if(e.data.type==='ALERTA_VISTA'){ ultimaAlerta=e.data.ts; }
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cls){
    for(var i=0;i<cls.length;i++){ if('focus' in cls[i]){ cls[i].focus(); return; } }
    return clients.openWindow('/');
  }));
});

function checkAlertas(){
  var idPromise = miTecnicoId ? Promise.resolve(miTecnicoId) : loadId().then(function(id){ miTecnicoId=id; return id; });
  idPromise.then(function(tecnicoId){
    if(!tecnicoId) return;
    fetch(SUPA_URL+'/rest/v1/config?select=key,value',{
      headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY}
    }).then(function(r){ return r.json(); }).then(function(rows){
      if(!rows||!rows.length) return;
      var estoyEnTurno = false;
      rows.forEach(function(r){
        if(!r.key||!r.key.startsWith('turno_activo_')) return;
        try{ var t=JSON.parse(r.value); if(t&&t.tecnicoId===tecnicoId) estoyEnTurno=true; }catch(e){}
      });
      if(!estoyEnTurno) return;
      rows.forEach(function(r){
        if(!r.key||!r.key.startsWith('alerta_')) return;
        if(!r.value||r.value==='null') return;
        var alerta; try{ alerta=JSON.parse(r.value); }catch(e){ return; }
        if(!alerta||alerta.estado!=='activa') return;
        if(alerta.ts<=ultimaAlerta) return;
        if(Date.now()-alerta.ts>300000) return;
        var esMia = alerta.tecnicoDestinoId ? alerta.tecnicoDestinoId===tecnicoId : true;
        if(esMia){
          ultimaAlerta = alerta.ts;
          self.registration.showNotification('Llamada - '+alerta.area,{
            body:(alerta.descripcion?alerta.descripcion+' - ':'')+alerta.solicitadoPor,
            icon:'/icons/icon-192.png',
            vibrate:[500,200,500,200,500,200,800],
            requireInteraction:true,
            tag:'alerta-'+alerta.id,
            renotify:true
          });
          self.clients.matchAll({type:'window'}).then(function(cls){
            cls.forEach(function(c){ c.postMessage({type:'NUEVA_ALERTA',alerta:alerta}); });
          });
          fetch(SUPA_URL+'/rest/v1/config',{
            method:'POST',
            headers:{'apikey':SUPA_KEY,'Authorization':'Bearer '+SUPA_KEY,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},
            body:JSON.stringify({key:r.key,value:JSON.stringify(Object.assign({},alerta,{estado:'vista'}))})
          }).catch(function(){});
        }
      });
    }).catch(function(){});
  });
}

setInterval(checkAlertas, 8000);
