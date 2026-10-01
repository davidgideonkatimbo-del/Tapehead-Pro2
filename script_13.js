
(function(){
  /* ===== Built-in sound library: kits synthesized by the app (no third-party audio) ===== */
  // layer: ['o',wave,f0,f1,sweepSec,decaySec,gain]  or  ['n',filter,freq,q,decaySec,gain,delaySec]
  var KITS=[
   {id:'808',name:'808 Sub',tag:'Deep & long',
    kick:[['o','sine',120,38,.18,.9,1],['n','highpass',2500,0,.012,.18,0]],
    snare:[['n','bandpass',1800,.7,.22,.9,0],['o','triangle',190,140,.08,.12,.5]],
    hat:[['n','highpass',8000,0,.05,.8,0]],
    clap:[['n','bandpass',1500,1,.05,.8,0],['n','bandpass',1500,1,.05,.8,.012],['n','bandpass',1500,1,.05,.8,.025],['n','bandpass',1400,1,.13,.5,.03]]},
   {id:'boombap',name:'Boom Bap',tag:'Dusty & punchy',
    kick:[['o','triangle',140,55,.06,.32,1],['n','highpass',1800,0,.01,.25,0]],
    snare:[['n','bandpass',3000,.5,.2,.9,0],['o','triangle',190,150,.06,.14,.6]],
    hat:[['n','highpass',6500,0,.07,.7,0]],
    clap:[['n','bandpass',1300,1.2,.06,.8,0],['n','bandpass',1300,1.2,.06,.8,.015],['n','bandpass',1250,1.2,.14,.55,.03]]},
   {id:'trap',name:'Trap Hard',tag:'Tight & bright',
    kick:[['o','sine',180,45,.08,.55,1],['n','highpass',3000,0,.01,.3,0]],
    snare:[['n','highpass',2800,0,.14,.9,0],['o','triangle',260,190,.05,.1,.5]],
    hat:[['n','highpass',9500,0,.03,.7,0]],
    clap:[['n','bandpass',1900,1,.04,.9,0],['n','bandpass',1900,1,.04,.9,.01],['n','bandpass',1800,1,.1,.6,.022]]},
   {id:'lofi',name:'Lo-fi Tape',tag:'Soft & warm',
    kick:[['o','sine',100,50,.1,.28,.9]],
    snare:[['n','bandpass',1400,.6,.25,.8,0],['o','triangle',170,130,.09,.15,.5]],
    hat:[['n','bandpass',5200,.5,.09,.6,0]],
    clap:[['n','bandpass',1100,.9,.07,.7,0],['n','bandpass',1100,.9,.16,.5,.02]]},
   {id:'afro',name:'Afro Dance',tag:'Bouncy & crisp',
    kick:[['o','sine',150,60,.07,.38,1],['n','highpass',2200,0,.01,.2,0]],
    snare:[['n','bandpass',3500,2,.09,.9,0],['o','triangle',400,320,.04,.08,.6]],
    hat:[['n','bandpass',9000,.8,.06,.7,0]],
    clap:[['n','bandpass',1800,1,.05,.8,0],['n','bandpass',1800,1,.05,.8,.014],['n','bandpass',1700,1,.1,.5,.028]]}
  ];
  var LEN={kick:1.0,snare:.4,hat:.2,clap:.35};
  /* Pure-JS synthesis (no OfflineAudioContext), so it works on every browser and phone */
  var NZ=null;
  function noiseTable(){ if(NZ)return NZ; NZ=new Float32Array(48000); var x=0x9E3779B9>>>0; for(var i=0;i<NZ.length;i++){x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;NZ[i]=x/2147483648-1;} return NZ; }
  function biquad(type,f,q,sr,src){
    var w=2*Math.PI*Math.min(f,sr*0.45)/sr, cs=Math.cos(w), sn=Math.sin(w), Q=q||0.707, al=sn/(2*Q), b0,b1,b2;
    if(type==='highpass'){b0=(1+cs)/2;b1=-(1+cs);b2=(1+cs)/2;} else {b0=al;b1=0;b2=-al;}   // bandpass: constant 0 dB peak gain
    var a0=1+al, a1=-2*cs, a2=1-al, out=new Float32Array(src.length), x1=0,x2=0,y1=0,y2=0;
    for(var i=0;i<src.length;i++){var x=src[i], y=(b0*x+b1*x1+b2*x2-a1*y1-a2*y2)/a0; out[i]=y; x2=x1;x1=x;y2=y1;y1=y;}
    return out;
  }
  function env(t,peak,atk,dec){ if(t<0)return 0; if(t<atk)return peak*(t/atk); if(t>=dec)return 0; return peak*Math.pow(0.001/peak,(t-atk)/(dec-atk)); }
  async function renderPart(layers,kind,sr){
    var n=Math.ceil(sr*LEN[kind]), mix=new Float32Array(n), base=0.002;
    layers.forEach(function(l){
      var i,t,tab=noiseTable();
      if(l[0]==='o'){
        var ph=0, f0=l[2], f1=l[3], sw=l[4], dec=l[5], pk=l[6], tri=(l[1]==='triangle');
        for(i=0;i<n;i++){ t=i/sr-base; if(t<0)continue; if(t>dec)break;
          var f=f0*Math.pow(f1/f0,Math.min(t/sw,1)); ph+=2*Math.PI*f/sr;
          var v=tri?(2/Math.PI)*Math.asin(Math.sin(ph)):Math.sin(ph);
          mix[i]+=v*env(t,pk,0.003,dec); }
      }else{
        var d=Math.round((base+(l[6]||0))*sr), len=Math.min(n-d,Math.ceil((l[4]+0.03)*sr)); if(len<=0)return;
        var raw=new Float32Array(len); for(i=0;i<len;i++)raw[i]=tab[i%tab.length];
        var fl=biquad(l[1],l[2],l[3],sr,raw);
        for(i=0;i<len;i++){ mix[d+i]+=fl[i]*env(i/sr,l[5],0.002,l[4]); }
      }
    });
    var pk2=0,k; for(k=0;k<n;k++){var a=Math.abs(mix[k]); if(a>pk2)pk2=a;}
    if(!(pk2>0))throw new Error('empty '+kind);
    var g=0.9/pk2; for(k=0;k<n;k++)mix[k]*=g;                    // same loudness for every sound
    var fade=Math.floor(sr*0.004); for(k=0;k<fade;k++)mix[n-1-k]*=k/fade;   // click-free tail
    var buf=ensureAudio().createBuffer(1,n,sr); buf.getChannelData(0).set(mix); return buf;
  }
  async function loadKit(kit,btn){
    try{
      unlockAudio(); var sr=ensureAudio().sampleRate;
      var kinds=['kick','snare','hat','clap'], bufs=await Promise.all(kinds.map(function(k){return renderPart(kit[k],k,sr);}));
      state.samples=state.samples||{}; state.sampleNames=state.sampleNames||{};
      kinds.forEach(function(k,i){
        state.samples[k]=bufs[i]; state.sampleNames[k]=kit.name;
        var lab=document.getElementById('sampleLabel'+k.charAt(0).toUpperCase()+k.slice(1)); if(lab)lab.textContent=kit.name.slice(0,18);
        var sl=document.querySelector('.sample-slot[data-slot="'+k+'"]'); if(sl)sl.classList.add('has-sample');
      });
      document.querySelectorAll('.lib-kit').forEach(function(b){b.classList.toggle('on',b===btn);});
      var c=ensureAudio(), t=c.currentTime+.05;                       // quick audition
      [['kick',0],['snare',.32],['hat',.5],['hat',.62],['clap',.76]].forEach(function(x){try{playSampleBuffer(state.samples[x[0]],t+x[1],.8,LEN[x[0]],c.destination);}catch(e){}});
      toast(kit.name+' kit loaded'); try{saveCurrentSong();}catch(e){}
    }catch(e){console.warn('kit',e); toast('Could not load kit: '+((e&&e.message)||e));}
  }
  var host=document.getElementById('libKits');
  if(host){KITS.forEach(function(k){
    var b=document.createElement('button'); b.type='button'; b.className='lib-kit'; b.innerHTML='<b>'+k.name+'</b><small>'+k.tag+'</small>';
    b.addEventListener('click',function(){loadKit(k,b);}); host.appendChild(b);
  });}

  /* ===== MP3 export (lamejs loaded on demand) ===== */
  function loadLame(){
    if(window.lamejs)return Promise.resolve();
    return new Promise(function(res,rej){var sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js';sc.onload=res;sc.onerror=function(){rej(new Error('lamejs'));};document.head.appendChild(sc);});
  }
  async function toMp3(wavBlob){
    await loadLame(); if(!window.lamejs)throw new Error('lamejs');
    var ab=await wavBlob.arrayBuffer(), buf=await ensureAudio().decodeAudioData(ab);
    var chs=Math.min(2,buf.numberOfChannels), sr=buf.sampleRate, enc=new lamejs.Mp3Encoder(chs,sr,192), out=[], N=buf.length, B=1152, i, c;
    var data=[]; for(c=0;c<chs;c++){var f=buf.getChannelData(c), p=new Int16Array(N); for(i=0;i<N;i++){var v=Math.max(-1,Math.min(1,f[i])); p[i]=v<0?v*32768:v*32767;} data.push(p);}
    for(i=0;i<N;i+=B){var l=data[0].subarray(i,i+B), r=chs>1?data[1].subarray(i,i+B):undefined, m=chs>1?enc.encodeBuffer(l,r):enc.encodeBuffer(l); if(m.length)out.push(new Int8Array(m));}
    var e=enc.flush(); if(e.length)out.push(new Int8Array(e));
    return new Blob(out,{type:'audio/mpeg'});
  }
  var orig=window.bounceFullSong;
  if(typeof orig==='function'){
    window.bounceFullSong=async function(loops,opts){
      var blob=await orig.apply(this,arguments), fmt=document.getElementById('bounceFormat');
      if(!fmt||fmt.value!=='mp3'||(opts&&opts.stem&&opts.stem!=='full'))return blob;
      try{return await toMp3(blob);}catch(e){console.warn('mp3',e);toast('MP3 encoder unavailable (check connection) — saved as WAV');return blob;}
    };
  }
})();
