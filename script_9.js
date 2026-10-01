
(function(){
  // Accessibility: labels, button types, live toast
  function fix(root){
    (root||document).querySelectorAll('button:not([type])').forEach(function(b){b.type='button';});
    (root||document).querySelectorAll('button[title]:not([aria-label]),a[title]:not([aria-label])').forEach(function(b){b.setAttribute('aria-label',b.getAttribute('title'));});
  }
  var t=document.getElementById('toast'); if(t){t.setAttribute('role','status');t.setAttribute('aria-live','polite');}
  fix();
  var q=0; if(window.MutationObserver){new MutationObserver(function(){if(q)return;q=setTimeout(function(){q=0;fix();},250);}).observe(document.body,{childList:true,subtree:true});}
})();
