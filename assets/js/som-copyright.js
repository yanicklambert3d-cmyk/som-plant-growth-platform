(function () {
  function updateCopyright() {
    var year = new Date().getFullYear();
    document.querySelectorAll('[data-copyright-year]').forEach(function (element) {
      element.textContent = 'Copyright © SEED OF MEMORIES ' + year;
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCopyright);
  } else {
    updateCopyright();
  }
}());
