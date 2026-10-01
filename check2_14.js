
(function(){
  function syncChips(){
    var r=thRes(), n=state.stepCount||16;
    document.querySelectorAll('#gridResChips .chip').forEach(function(c){c.classList.toggle('on',parseInt(c.dataset.res,10)===r);});
    document.querySelectorAll('#stepLenChips .chip').forEach(function(c){c.classList.toggle('on',parseInt(c.dataset.steps,10)===n);});
  }
  function setGrid(newRes){
    var old=thRes(); if(newRes===old)return;
    if(state.playing){try{stopTransport();}catch(e){}}
    var f=newRes/old, n=state.stepCount||16, newN=Math.max(8,Math.min(32,Math.round(n*f))), cut=Math.round(n*f)>32;
    ['kick','snare','hat','clap'].forEach(function(k){
      var a=state.pattern[k]||[], out=[];
      for(var i=0;i<newN;i++){var src=i/f; out.push(Number.isInteger(src)&&a[src]?1:0);}
      state.pattern[k]=out;
    });
    if(newRes===8)delete state.pattern._res; else state.pattern._res=newRes;
    state.stepCount=newN; state.currentStep=0;
    try{ensurePatternLength(newN);buildTracks();saveCurrentSong();}catch(e){console.warn(e);}
    syncChips(); toast('Grid 1/'+newRes+(cut?' (limited to 32 steps)':''));
  }
  var g=document.getElementById('gridResChips');
  if(g)g.addEventListener('click',function(e){var c=e.target.closest('[data-res]');if(c)setGrid(parseInt(c.dataset.res,10));});
  document.getElementById('stepLenChips')?.addEventListener('click',function(){setTimeout(syncChips,0);});
  var bt=window.buildTracks; if(typeof bt==='function'){window.buildTracks=function(){var r=bt.apply(this,arguments);try{syncChips();}catch(e){}return r;};}
  syncChips();
})();
