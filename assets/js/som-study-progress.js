document.addEventListener('DOMContentLoaded', function () {
  var stage = 0;
  var tracker = document.querySelector('.som-step-tracker');
  if (!tracker) return;
  var status = document.getElementById('som-flow-status');
  var questionnaire = document.getElementById('downloadBtn-1');
  function render() {
    tracker.querySelectorAll('[data-som-step]').forEach(function (item) {
      var n = Number(item.dataset.somStep);
      var done = n <= stage;
      var current = n === stage + 1;
      item.classList.toggle('is-complete', done);
      item.classList.toggle('is-current', current);
      item.classList.toggle('is-pending', !done && !current);
      item.querySelector('.som-tracker-marker').textContent = done ? '✓' : String(n);
      item.querySelector('.som-tracker-state').textContent = done ? 'Completed' : current ? 'Current step' : 'Pending';
      if (current) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    });
    tracker.style.setProperty('--som-progress', stage === 0 ? '0%' : stage === 1 ? '50%' : '100%');
    status.textContent = stage === 0 ? 'Step 1: choose your diary language and download the PDF.' : stage === 1 ? 'Step 2: complete your diary, then submit it.' : 'Step 3: open and complete the questionnaire.';
    if (questionnaire) { questionnaire.setAttribute('aria-disabled', stage < 2 ? 'true' : 'false'); questionnaire.classList.toggle('som-awaiting-upload', stage < 2); }
  }
  function advance(next) {
    if (next > stage) { stage = next; render(); }
  }
  document.addEventListener('som:diary-download-started', function () { advance(1); });
  document.addEventListener('som:diary-uploaded', function () { advance(2); });
  if (questionnaire) questionnaire.addEventListener('click', function (event) {
    if (stage < 2) { event.preventDefault(); status.textContent = 'Submit your completed diary before starting the questionnaire.'; return; }
    status.textContent = 'Questionnaire opened in another tab. Complete it there; this page cannot verify its submission.';
  });
  render();
});
