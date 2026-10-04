from pathlib import Path
p=Path('/mnt/data/tapehead_profile_upgrade/www/index.html')
s=p.read_text()
needle='''async function openPublicProfile(username) {'''
helpers=r'''
function formatProfileCount(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n/1000000).toFixed(n >= 10000000 ? 0 : 1).replace('.0','') + 'M';
  if (n >= 1000) return (n/1000).toFixed(n >= 10000 ? 0 : 1).replace('.0','') + 'K';
  return String(n);
}
function renderArtistProfileTabs(active) {
  document.querySelectorAll('#publicProfileModal [data-pp-tab]').forEach(b => {
    const on = b.getAttribute('data-pp-tab') === active;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  [['music','ppPanelMusic'],['projects','ppPanelProjects'],['about','ppPanelAbout']].forEach(([key,id]) => {
    const el = document.getElementById(id); if (el) el.classList.toggle('on', key === active);
  });
}
function artistProfilePosts(name) {
  try {
    const feed = loadSocial().feed || [];
    return feed.filter(p => String(p.username || '').toLowerCase() === String(name || '').toLowerCase()).sort((a,b)=>(b.updated||0)-(a.updated||0));
  } catch(e) { return []; }
}
function renderArtistProfileMedia(posts, name) {
  const featured = posts[0];
  const title = document.getElementById('ppFeaturedTitle');
  const meta = document.getElementById('ppFeaturedMeta');
  const player = document.getElementById('ppFeaturedPlayer');
  const play = document.getElementById('ppFeaturedPlay');
  const wave = document.getElementById('ppFeaturedWave');
  const time = document.getElementById('ppFeaturedTime');
  const releaseBox = document.getElementById('ppReleases');
  const projectBox = document.getElementById('ppProjects');
  const highlightBox = document.getElementById('ppHighlights');
  const hasAudio = p => !!(p && (p.pattern || p.vocalData || p.hasVocal || p.mixdownUrl || p.fullSong || (p.chords || []).length));
  if (!featured) {
    if (title) title.textContent = 'No featured release yet';
    if (meta) meta.textContent = 'Publish a track to give your profile a sound.';
    if (player) player.hidden = true;
  } else {
    if (title) title.textContent = featured.title || 'Untitled release';
    if (meta) meta.textContent = [featured.kit, featured.bpm ? featured.bpm + ' BPM' : '', featured.key ? 'Key ' + featured.key : ''].filter(Boolean).join(' · ') || 'Tapehead release';
    if (player) player.hidden = !hasAudio(featured);
    if (play) play.onclick = () => { try { playFeedPost(featured.id); } catch(e) {} };
    if (wave) wave.innerHTML = Array.from({length:24},(_,i)=>`<i style="height:${22+((i*17+(featured.id||'').length*5)%70)}%"></i>`).join('');
    if (time) time.textContent = hasAudio(featured) ? 'Play preview' : 'Lyrics / project';
  }
  const renderRows = (arr, limit) => arr.slice(0,limit).map(p => {
    const date = p.updated ? new Date(p.updated).toLocaleDateString(undefined,{month:'short',day:'numeric'}) : '';
    const parts = [p.fullSong||p.mixdownUrl?'Full':null,p.hasVocal||p.vocalData?'Vocal':null,p.pattern?'Beat':null,(p.chords||[]).length?'Keys':null].filter(Boolean).join(' · ') || 'Project';
    return `<div class="artist-release"><div class="artist-release-art">♪</div><div class="artist-release-copy"><div class="artist-release-title">${esc(p.title||'Untitled')}</div><div class="artist-release-meta">${esc(parts)}${date?' · '+esc(date):''}</div></div><button type="button" class="btn artist-release-btn" data-pp-play="${esc(p.id)}">${hasAudio(p)?'▶ Play':'Open'}</button></div>`;
  }).join('');
  if (releaseBox) releaseBox.innerHTML = arrEmpty(posts) ? '<div class="artist-profile-empty">No releases yet. Published music will appear here.</div>' : renderRows(posts,4);
  if (projectBox) projectBox.innerHTML = arrEmpty(posts) ? '<div class="artist-profile-empty">No published projects yet.</div>' : renderRows(posts,10);
  if (highlightBox) {
    const likes = posts.reduce((n,p)=>n+(Number(p.likes)||0),0);
    const top = posts.slice().sort((a,b)=>(Number(b.likes)||0)-(Number(a.likes)||0))[0];
    highlightBox.innerHTML = `<div class="artist-highlight"><b>Latest release</b><span>${esc(featured ? featured.title || 'Untitled' : '—')}</span></div><div class="artist-highlight"><b>Top track</b><span>${esc(top ? top.title || 'Untitled' : '—')}</span></div><div class="artist-highlight"><b>Total likes</b><span>${formatProfileCount(likes)}</span></div><div class="artist-highlight"><b>Releases</b><span>${posts.length}</span></div>`;
  }
  document.querySelectorAll('#publicProfileModal [data-pp-play]').forEach(btn => btn.addEventListener('click',()=>{
    const id=btn.getAttribute('data-pp-play'); const p=posts.find(x=>String(x.id)===String(id));
    if (p && hasAudio(p)) { try{playFeedPost(id);}catch(e){} } else { try{openFeedProject(id);}catch(e){} }
  }));
}
function arrEmpty(a){ return !Array.isArray(a) || !a.length; }
'''
s=s.replace(needle,helpers+'\n'+needle,1)
# Insert media population after stats
needle2="""    setTxt('ppPublished', published);\n    setTxt('ppLikes', likes);\n    setTxt('ppFollowers', followers);\n    setTxt('ppFollowing', following);"""
rep2=needle2+"""
    const posts = artistProfilePosts(name);
    renderArtistProfileMedia(posts, name);
    renderArtistProfileTabs('music');
    setTxt('ppAboutCopy', (found && found.bio) || 'Tapehead artist');
    const ownProfile = !!(state.user && ((found && found.id && state.user.cloudId && found.id === state.user.cloudId) || String(name).toLowerCase() === String(state.user.username || '').toLowerCase()));
    const editBtn = document.getElementById('ppEditBtn');
    if (editBtn) editBtn.style.display = ownProfile ? 'block' : 'none';
    const collabBtn = document.getElementById('ppCollabBtn');
    if (collabBtn) collabBtn.style.display = (found && found.openToCollab && !ownProfile) ? 'block' : 'none';"""
s=s.replace(needle2,rep2,1)
# Add event listeners near existing saveProfile binding
needle3="document.getElementById('saveProfile')?.addEventListener('click',saveProfile);"
rep3=needle3+"""
document.getElementById('previewProfileBtn')?.addEventListener('click',()=>{ if(state.user?.username){ closeProfile(); openPublicProfile(state.user.username); } });
document.getElementById('ppEditBtn')?.addEventListener('click',()=>{ closePublicProfile(); openProfile(); });
document.getElementById('ppCollabBtn')?.addEventListener('click',()=>{ try{ closePublicProfile(); setView('collab'); }catch(e){ toast('Open Collab from the bottom bar'); } });
document.getElementById('publicProfileModal')?.addEventListener('click',e=>{ const tab=e.target.closest('[data-pp-tab]'); if(tab){ renderArtistProfileTabs(tab.getAttribute('data-pp-tab')); } });"""
s=s.replace(needle3,rep3,1)
p.write_text(s)
