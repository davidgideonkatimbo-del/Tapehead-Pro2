
(function(){
  // Block double-submits on sign in / sign up
  ['doSignIn','doSignUp'].forEach(function(n){
    var f=window[n]; if(typeof f!=='function')return; var busy=false;
    window[n]=async function(){ if(busy)return; busy=true;
      var btns=document.querySelectorAll('#authModal .btn.pri'); btns.forEach(function(b){b.disabled=true;b.style.opacity='.6';});
      try{return await f.apply(this,arguments);}finally{busy=false;btns.forEach(function(b){b.disabled=false;b.style.opacity='';});}
    };
  });
  // Lazy-load feed images
  var feed=document.getElementById('communityFeed');
  if(feed&&window.MutationObserver){new MutationObserver(function(){feed.querySelectorAll('img:not([loading])').forEach(function(i){i.loading='lazy';i.decoding='async';});}).observe(feed,{childList:true,subtree:true});}
  // Connection status
  window.addEventListener('offline',function(){try{toast("You're offline");}catch(e){}});
  window.addEventListener('online',function(){try{toast('Back online');}catch(e){}});
})();
