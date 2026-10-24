document.addEventListener('DOMContentLoaded', function () {
  // Public application settings. No secret/service-role key belongs here.
  var projectUrl = 'https://nndsridxgxepsvmaglhf.supabase.co';
  var publishableKey = 'sb_publishable_-9VG45l2okQVtpG7_kL8gw_aGsjBN7-';
  var bucket = 'som-diaries-test';
  var maxBytes = 20 * 1024 * 1024;
  var form = document.getElementById('formUpload');
  if (!form) return;
  var input = document.getElementById('ficheiro');
  var button = form.querySelector('[type="submit"]');
  var progress = document.getElementById('barraProgresso');
  var status = document.getElementById('estado');
  var busy = false;
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  input.disabled = false; button.disabled = false; input.accept = '.pdf,application/pdf';
  status.textContent = ''; 
  form.addEventListener('submit', async function (event) {
    event.preventDefault(); if (busy) return;
    var file = input.files[0];
    if (!file) { status.textContent = 'Choose your completed PDF diary.'; return; }
    if (!/\.pdf$/i.test(file.name)) { status.textContent = 'Please choose a PDF diary.'; return; }
    if (file.size > maxBytes || file.size === 0) { status.textContent = 'Choose a non-empty PDF no larger than 20 MB.'; return; }
    busy = true; button.disabled = true; input.disabled = true;
    function fail(message) { busy = false; button.disabled = false; input.disabled = false; status.textContent = message; }
    try {
      var firstBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      if (String.fromCharCode.apply(null, firstBytes) !== '%PDF-') { fail('This file does not appear to be a PDF.'); return; }
      var randomBytes = new Uint8Array(6); crypto.getRandomValues(randomBytes);
      var dateParts = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach(function (part) { dateParts[part.type] = part.value; });
      var date = dateParts.year + '-' + dateParts.month + '-' + dateParts.day;
      var code = Array.from(randomBytes, function (n) { return n.toString(16).padStart(2, '0'); }).join('');
      var name = 'test/SOM_' + date + '_' + code + '.pdf';
      var xhr = new XMLHttpRequest();
      xhr.open('POST', projectUrl + '/storage/v1/object/' + bucket + '/' + name, true);
      xhr.setRequestHeader('apikey', publishableKey);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.timeout = 180000; progress.style.display = 'block'; progress.value = 0;
      status.textContent = 'Uploading diary…';
      xhr.upload.addEventListener('progress', function (e) { if (e.lengthComputable) progress.value = Math.round(e.loaded / e.total * 100); });
      xhr.onload = function () {
        var response; try { response = JSON.parse(xhr.responseText); } catch (_) {}
        if (xhr.status >= 200 && xhr.status < 300 && response && (response.Key === bucket + '/' + name || typeof response.Id === 'string')) {
          busy = false; button.disabled = false; input.disabled = false; progress.value = 100; form.reset();
          status.textContent = 'Your diary was submitted successfully.';
          document.dispatchEvent(new CustomEvent('som:diary-uploaded'));
        } else if (xhr.status === 400 || xhr.status === 401 || xhr.status === 403 || xhr.status === 404) {
          fail('The diary could not be submitted. Please try again later.');
        } else { fail('The diary could not be submitted. Please try again.'); }
      };
      xhr.onerror = xhr.ontimeout = function () { fail('Connection failed. Please try again.'); };
      xhr.send(file);
    } catch (_) { fail('The diary could not be prepared. Please try again.'); }
  });
});
