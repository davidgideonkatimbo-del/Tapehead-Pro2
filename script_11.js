
(function(){
  function goStudio(then){
    try{closeSidebar();}catch(e){}
    try{setView('studio');}catch(e){}
    setTimeout(function(){try{then();}catch(e){}},250);
  }
  function scrollTo(el,msg){ if(el&&el.scrollIntoView){el.scrollIntoView({behavior:'smooth',block:'center'});} else if(msg){toast(msg);} }
  var b;
  (b=document.getElementById('menuSoundsBtn'))&&b.addEventListener('click',function(){goStudio(function(){scrollTo(document.getElementById('sampleKitRow'),'Open Studio → Beat to load drum sounds');});});
  (b=document.getElementById('menuExportBtn'))&&b.addEventListener('click',function(){goStudio(function(){var m=document.getElementById('mixdownBtn');scrollTo(m&&(m.closest('.card')||m),'Open Studio → Mix to export');});});
  (b=document.getElementById('menuLibraryBtn'))&&b.addEventListener('click',function(){var l=document.getElementById('songList');scrollTo(l,'No saved songs yet');});

  // Pro gate: master bounce + stem export
  ['doMixdown','doExportStems'].forEach(function(n){
    var f=window[n]; if(typeof f!=='function')return;
    window[n]=function(){ if(!requirePro(n==='doMixdown'?'Master export':'Stem export'))return; return f.apply(this,arguments); };
  });
  function lockLabels(){
    var pro=false; try{pro=isPro();}catch(e){}
    [['mixdownBtn','🎧 Bounce Full Mix'],['stemsBtn','🎚 Export Stems (ZIP)']].forEach(function(x){
      var el=document.getElementById(x[0]); if(!el||el.disabled)return;
      var want=(pro?'':'🔒 ')+x[1]; if(el.textContent!==want)el.textContent=want;
    });
    var m=document.querySelector('#menuExportBtn .sk'); if(m)m.textContent=pro?'Ready':'🔒 Pro';
  }
  lockLabels(); setInterval(lockLabels,2500);
})();
