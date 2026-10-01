
(function(){
  var sb=document.getElementById('sidebar'),ov=document.getElementById('overlay');
  if(!sb)return;
  var x0=0,y0=0;
  function ts(e){var t=e.touches[0];x0=t.clientX;y0=t.clientY;}
  function te(e){var t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;
    if(dx<-50&&Math.abs(dx)>Math.abs(dy)*1.5&&document.body.classList.contains('menu-open')&&window.closeSidebar)window.closeSidebar();}
  [sb,ov].forEach(function(el){if(!el)return;el.addEventListener('touchstart',ts,{passive:true});el.addEventListener('touchend',te,{passive:true});});
})();
