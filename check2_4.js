
(function () {
  function bindProfileBridge() {
    var avatar = document.getElementById('avatarBtn');
    if (!avatar || avatar.dataset.profileBridge === '1' || avatar.dataset.profileBound === '1') return;
    avatar.dataset.profileBridge = '1';
    avatar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.__tapeheadOpenProfile === 'function') {
        window.__tapeheadOpenProfile();
      }
    }, true);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindProfileBridge, { once: true });
  } else {
    bindProfileBridge();
  }
})();
