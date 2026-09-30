import fs from 'node:fs'; import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../www/index.html',import.meta.url),'utf8');const a=html.indexOf('const NOTE_NAMES_SHARP'),b=html.indexOf('/* ══ Extras');const src=html.slice(a,b);
const api=new Function(src+'; return {detectPitch,melodyToChords,buildChord};')();
const sr=44100;
const tone=(f,n=2048,amp=0.4,harm=true)=>{const b=new Float32Array(n);for(let i=0;i<n;i++){let v=Math.sin(2*Math.PI*f*i/sr);if(harm)v+=0.5*Math.sin(2*Math.PI*2*f*i/sr)+0.25*Math.sin(2*Math.PI*3*f*i/sr);b[i]=amp*v/1.75;}return b;};
for(const f of [110,196,220,261.63,329.63,440,523.25]){
  const p=api.detectPitch(tone(f),sr); assert.ok(Math.abs(1200*Math.log2(p/f))<25,`pitch ${f} got ${p}`);
}
assert.equal(api.detectPitch(new Float32Array(2048),sr),-1);
const noise=new Float32Array(2048).map(()=>(Math.random()*2-1)*0.3);
assert.equal(api.detectPitch(noise,sr),-1,'noise rejected');
const pc=f=>Math.round(12*Math.log2(f/440)+69)%12;
const mel=(names)=>names.map(n=>({pc:{C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n],w:1}));
// C major tune: C E G E | F A C A | G B D B | C E G C
let r=api.melodyToChords(mel(['C','E','G','E','F','A','C','A','G','B','D','B','C','E','G','C']));
console.log(r); assert.equal(r.key,'C'); assert.deepEqual(r.chords,['C','F','G','C']);
// A minor tune
r=api.melodyToChords(mel(['A','C','E','C','D','F','A','F','E','G','B','G','A','C','E','A']));
console.log(r); assert.equal(r.key,'Am'); assert.equal(r.chords[0],'Am');
assert.deepEqual(api.buildChord('F#m'),['F#','A','C#']); assert.deepEqual(api.buildChord('Bb'),['A#','D','F']); assert.equal(api.buildChord('X'),null);
console.log('HUM TESTS PASSED');
