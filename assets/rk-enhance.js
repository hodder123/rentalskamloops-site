/* Rentals Kamloops - static enhancements: client-side filtering + Leaflet map.
   No server required. Data comes from rk-data.js (window.RK_PROPS). */
(function () {
  var P = window.RK_PROPS || [];
  var byId = {};
  P.forEach(function (p) { if (p.pid) byId[String(p.pid)] = p; });
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function ready(fn){ if(document.readyState!=='loading'){fn();} else {document.addEventListener('DOMContentLoaded',fn);} }
  ready(function(){ injectStyles(); initFilters(); initMap(); });

  function injectStyles(){
    if(document.getElementById('rk-style')) return;
    var s=document.createElement('style'); s.id='rk-style';
    s.textContent=[
      '.rk-filterbar{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:0 0 22px;padding:16px 18px;background:#f6f7f9;border:1px solid #e3e6ea;border-radius:10px;font-family:inherit}',
      '.rk-filterbar .rk-field{display:flex;flex-direction:column;gap:4px}',
      '.rk-filterbar label{font-size:12px;font-weight:600;color:#556;letter-spacing:.02em;text-transform:uppercase}',
      '.rk-filterbar select{padding:9px 12px;border:1px solid #cfd4da;border-radius:7px;background:#fff;font-size:15px;min-width:150px}',
      '.rk-filterbar .rk-count{margin-left:auto;font-size:14px;color:#556;align-self:center}',
      '.rk-filterbar .rk-reset{padding:9px 14px;border:1px solid #cfd4da;border-radius:7px;background:#fff;cursor:pointer;font-size:14px}',
      '.rk-filterbar .rk-reset:hover{background:#eef0f3}',
      '.rk-map-wrap{height:520px;border-radius:10px;overflow:hidden;border:1px solid #e3e6ea}',
      '.rk-pop{min-width:170px;font-family:inherit}',
      '.rk-pop img{width:100%;height:96px;object-fit:cover;border-radius:5px;margin-bottom:6px}',
      '.rk-pop a{display:inline-block;margin-top:5px;font-weight:600}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- Filtering ---------- */
  function initFilters(){
    var cards = [].slice.call(document.querySelectorAll('.js-es-listing[data-post-id]'));
    if(!cards.length) return;
    var host = document.querySelector('.js-es-listings__wrap-inner');
    if(!host || !host.parentNode) return;

    var bar=document.createElement('div');
    bar.className='rk-filterbar';
    bar.innerHTML =
      '<div class="rk-field"><label>Bedrooms</label>'+
      '<select id="rk-beds"><option value="any">Any</option><option value="1">1</option>'+
      '<option value="2">2</option><option value="3">3</option><option value="4">4</option>'+
      '<option value="5">5+</option></select></div>'+
      '<div class="rk-field"><label>Type</label>'+
      '<select id="rk-type"><option value="any">Any</option><option>House</option>'+
      '<option>Suite</option><option>Commercial</option></select></div>'+
      '<button type="button" class="rk-reset" id="rk-reset">Reset</button>'+
      '<span class="rk-count" id="rk-count"></span>';
    host.parentNode.insertBefore(bar, host);

    var beds=bar.querySelector('#rk-beds'), type=bar.querySelector('#rk-type'),
        count=bar.querySelector('#rk-count'), reset=bar.querySelector('#rk-reset');
    function apply(){
      var b=beds.value, t=type.value, shown=0;
      cards.forEach(function(c){
        var p=byId[c.getAttribute('data-post-id')]||{}, ok=true;
        if(b!=='any'){ var n=parseFloat(p.beds); ok = (b==='5')? (n>=5) : (String(p.beds)===b); }
        if(ok && t!=='any'){ ok = (p.type===t); }
        c.style.display = ok? '' : 'none';
        if(ok) shown++;
      });
      count.textContent = shown+' of '+cards.length+' properties';
    }
    beds.addEventListener('change',apply);
    type.addEventListener('change',apply);
    reset.addEventListener('click',function(){ beds.value='any'; type.value='any'; apply(); });
    apply();
  }

  /* ---------- Map (Leaflet + OpenStreetMap, keyless) ---------- */
  function initMap(){
    var el=document.querySelector('.js-es-map');
    if(!el) return;
    var pts=P.filter(function(p){return p.lat&&p.lng;});
    if(!pts.length) return;
    loadLeaflet(function(){
      el.className=(el.className||'')+' rk-map-wrap';
      el.innerHTML=''; el.style.height='520px';
      var map=L.map(el,{scrollWheelZoom:false}).setView([50.6745,-120.3273],12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {maxZoom:19, attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
      var bounds=[];
      pts.forEach(function(p){
        var mk=L.circleMarker([p.lat,p.lng],
          {radius:9,weight:2,color:'#ffffff',fillColor:'#c8102e',fillOpacity:1});
        var html='<div class="rk-pop">'+
          (p.thumb?'<img src="'+esc(p.thumb)+'" alt="">':'')+
          '<strong>'+esc(p.title)+'</strong><br>'+
          (p.beds?esc(p.beds)+' bd ':'')+(p.baths?'&middot; '+esc(p.baths)+' ba ':'')+
          (p.type?'&middot; '+esc(p.type):'')+'<br>'+
          '<a href="'+esc(p.url)+'">View listing &rarr;</a></div>';
        mk.bindPopup(html); mk.addTo(map); bounds.push([p.lat,p.lng]);
      });
      if(bounds.length) map.fitBounds(bounds,{padding:[40,40],maxZoom:14});
    });
  }
  function loadLeaflet(cb){
    if(window.L) return cb();
    var css=document.createElement('link'); css.rel='stylesheet';
    css.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload=cb; s.onerror=function(){ console.warn('Leaflet failed to load'); };
    document.body.appendChild(s);
  }
})();
