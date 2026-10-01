
(function(){
  // Friendlier message when the browser can't reach the server at all
  var orig=window.toast; if(typeof orig!=='function')return;
  window.toast=function(m){
    try{ if(typeof m==='string' && /failed to fetch|networkerror|load failed|network request failed/i.test(m)){
      m = navigator.onLine===false ? "You're offline. Reconnect and try again." : "Can't reach the Tapehead server. Check your connection and try again.";
    } }catch(e){}
    return orig.apply(this,[m].concat([].slice.call(arguments,1)));
  };
})();
