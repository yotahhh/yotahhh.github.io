/* yvesspiri.net · minimal behaviour: the atmospheric error dialog.
   retry: brief flicker, dialog stays. ignore: dismissed for the session.
   It never blocks anything; it is decoration that happens to have buttons. */
(function () {
  var dialog = document.querySelector('.error');
  if (!dialog) return;
  try { if (sessionStorage.getItem('ys-error-ignored') === '1') dialog.hidden = true; } catch (e) {}
  dialog.addEventListener('click', function (e) {
    var action = e.target.getAttribute('data-error');
    if (action === 'ignore') {
      dialog.hidden = true;
      try { sessionStorage.setItem('ys-error-ignored', '1'); } catch (err) {}
    } else if (action === 'retry') {
      dialog.style.visibility = 'hidden';
      setTimeout(function () { dialog.style.visibility = ''; }, 180);
    }
  });
})();
