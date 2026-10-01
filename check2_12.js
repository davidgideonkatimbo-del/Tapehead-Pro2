
(function(){
  // Swipe the piano left/right to change octave
  var pw=document.getElementById('piano'); pw=pw&&pw.parentElement;
  if(pw){var x0=0,y0=0,t0=0;
    pw.addEventListener('pointerdown',function(e){x0=e.clientX;y0=e.clientY;t0=Date.now();},{passive:true});
    pw.addEventListener('pointerup',function(e){var dx=e.clientX-x0,dy=e.clientY-y0;
      if(Date.now()-t0<500&&Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*2){var b=document.getElementById(dx<0?'octaveUp':'octaveDown');if(b)b.click();}},{passive:true});
  }
  // First visit: load demo beat + 3 tooltips
  if(localStorage.getItem('th-onboard-v1109'))return;
  var tries=0, timer=setInterval(function(){
    tries++; if(tries>150){clearInterval(timer);return;}
    var app=document.querySelector('.app'); if(!app||app.classList.contains('app-locked'))return;
    if(typeof state==='undefined'||!(state.user||state.guest))return;
    if(document.querySelector('.modal-overlay.show'))return;
    clearInterval(timer); localStorage.setItem('th-onboard-v1109','1');
    if(state.songs&&state.songs.length)return;           // returning user: leave their work alone
    try{
      state.stepCount=16; state.bpm=100;
      state.pattern={kick:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],hat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1],clap:[0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0]};
      var t=document.getElementById('songTitle'); if(t)t.value='summer-beat-03';
      var bb=document.getElementById('bpmBadge'); if(bb)bb.textContent='100 BPM';
      setView('beat'); buildTracks();
      if(window.thEnsureProject){window.thEnsureProject('summer-beat-03');try{saveCurrentSong();}catch(e){}}
    }catch(e){console.warn('demo',e);}
    setTimeout(runTips,600);
  },1200);
  function runTips(){
    var steps=[
      {sel:'#playBtn',t:'Hear it',m:'Tap ▶ to play the summer-beat-03 demo.'},
      {sel:'#tracks',t:'Edit the pattern',m:'Tap the steps to turn drums on or off. Use each lane\u2019s fader to set its volume.'},
      {sel:'.bottom-nav',t:'Share it',m:'Finished? Publish your beat to the Feed from here.'}
    ], i=0, box=null, ring=null;
    function done(){if(box)box.remove();if(ring)ring.classList.remove('th-ring');box=ring=null;}
    function show(){
      done(); if(i>=steps.length)return;
      var st=steps[i], el=document.querySelector(st.sel);
      if(!el||!el.offsetParent){i++;return show();}
      ring=el; el.classList.add('th-ring'); el.scrollIntoView({block:'center',behavior:'smooth'});
      box=document.createElement('div'); box.className='th-tip'; box.setAttribute('role','dialog');
      box.innerHTML='<b>'+(i+1)+'/'+steps.length+' \u00b7 '+st.t+'</b>'+st.m+'<div class="row"><button class="skip" type="button">Skip</button><button class="next" type="button">'+(i===steps.length-1?'Got it':'Next')+'</button></div>';
      document.body.appendChild(box);
      setTimeout(function(){
        if(!box)return; var r=el.getBoundingClientRect(), w=box.offsetWidth, h=box.offsetHeight;
        var top=r.bottom+10; if(top+h>innerHeight-8)top=Math.max(8,r.top-h-10);
        box.style.top=top+'px'; box.style.left=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8)+'px';
      },350);
      box.querySelector('.skip').onclick=done;
      box.querySelector('.next').onclick=function(){i++;show();};
    }
    show();
  }
})();
