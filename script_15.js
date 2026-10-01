
(function(){
  function esc2(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  /* Every project goes to the Library: auto-create one the first time work is saved */
  function ensureProject(title){
    if(state.currentSongId&&(state.songs||[]).some(function(x){return x.id===state.currentSongId;}))return state.currentSongId;
    if(!(state.user||state.guest))return null;
    if(state.user&&typeof isPro==='function'&&!isPro()&&(state.songs||[]).length>=FREE_PROJECT_LIMIT)return null;
    var t=title||(document.getElementById('songTitle')||{}).value||'';
    if(!t||t==='Untitled Session'){try{t=autoNameProject({kit:state.kit,bpm:state.bpm,updated:Date.now()});}catch(e){t='Untitled Session';}}
    var el=document.getElementById('songTitle'); if(el)el.value=t;
    var id='s_'+Date.now();
    state.songs=state.songs||[];
    state.songs.unshift({id:id,title:t,lyrics:'',bpm:state.bpm||120,kit:state.kit||'trap',stepCount:state.stepCount||16,pattern:JSON.parse(JSON.stringify(state.pattern||{})),updated:Date.now()});
    state.currentSongId=id; persistSongs(); renderSongList(); return id;
  }
  window.thEnsureProject=ensureProject;
  var scs=window.saveCurrentSong;
  if(typeof scs==='function')window.saveCurrentSong=function(){ if(!state.currentSongId||!(state.songs||[]).some(function(x){return x.id===state.currentSongId;})){ if(!ensureProject())return; } return scs.apply(this,arguments); };

  /* Library sheet */
  var box=document.createElement('div'); box.id='thLibrary'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Library');
  box.innerHTML='<div class="box"><div class="hd"><b>Library</b><button type="button" class="btn pri" id="thLibNew" style="padding:7px 12px;font-size:12px">＋ New</button><button type="button" class="btn ghost" id="thLibX" aria-label="Close library" style="padding:7px 11px">✕</button></div><input id="thLibQ" type="search" placeholder="Search projects" autocomplete="off"><div class="list" id="thLibList"></div></div>';
  document.body.appendChild(box);
  function fmt(t){try{return new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}catch(e){return '';}}
  function render(){
    var q=(document.getElementById('thLibQ').value||'').toLowerCase().trim(), list=document.getElementById('thLibList'), songs=(state.songs||[]).filter(function(x){return !q||String(x.title||'').toLowerCase().indexOf(q)>=0;});
    if(!songs.length){list.innerHTML='<div class="empty">'+(q?'No matches':'No projects yet. Tap ＋ New to start one.')+'</div>';return;}
    list.innerHTML=songs.map(function(x){return '<div class="card'+(x.id===state.currentSongId?' cur':'')+'" data-id="'+esc2(x.id)+'"><div class="t">'+esc2(x.title||'Untitled')+'</div><div class="m">'+(Number(x.bpm)||120)+' BPM · '+esc2(x.kit||'—')+' · '+fmt(x.updated)+'</div><div class="acts"><button type="button" class="go" data-a="open">Open</button><button type="button" data-a="dup">Duplicate</button><button type="button" class="del" data-a="del">Delete</button></div></div>';}).join('');
  }
  function open(){ try{closeSidebar();}catch(e){} document.getElementById('thLibQ').value=''; render(); box.classList.add('show'); }
  function close(){ box.classList.remove('show'); }
  window.openLibrary=open;
  box.addEventListener('click',function(e){
    if(e.target===box||e.target.id==='thLibX'){close();return;}
    if(e.target.id==='thLibNew'){ if(typeof canCreateProject==='function'&&state.user&&!canCreateProject())return; var n=(state.songs||[]).length; newSong(); if((state.songs||[]).length>n||state.currentSongId){close();} return; }
    var b=e.target.closest('[data-a]'); if(!b)return; var card=b.closest('.card'), id=card&&card.dataset.id, song=(state.songs||[]).find(function(x){return x.id===id;}); if(!song)return;
    var a=b.dataset.a;
    if(a==='open'){ loadSong(id); close(); toast('Opened '+(song.title||'project')); }
    else if(a==='dup'){ if(state.user&&typeof canCreateProject==='function'&&!canCreateProject())return; var c=JSON.parse(JSON.stringify(song)); c.id='s_'+Date.now(); c.title=(song.title||'Untitled')+' copy'; c.updated=Date.now(); state.songs.unshift(c); persistSongs(); renderSongList(); render(); toast('Duplicated'); }
    else if(a==='del'){ if(!confirm('Delete "'+(song.title||'this project')+'"? This cannot be undone.'))return; state.songs=state.songs.filter(function(x){return x.id!==id;}); if(state.currentSongId===id)state.currentSongId=null; persistSongs(); renderSongList(); render(); toast('Deleted'); }
  });
  document.getElementById('thLibQ').addEventListener('input',render);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('show'))close();});

  /* Menu: Library button opens the sheet, badge shows the count */
  var old=document.getElementById('menuLibraryBtn');
  if(old){ var nb=old.cloneNode(true); old.parentNode.replaceChild(nb,old); nb.addEventListener('click',open); }
  function badge(){ var k=document.querySelector('#menuLibraryBtn .sk'); if(k)k.textContent=String((state.songs||[]).length); }
  var rsl=window.renderSongList; if(typeof rsl==='function')window.renderSongList=function(){ var r=rsl.apply(this,arguments); try{badge();}catch(e){} return r; };
  badge();
})();
