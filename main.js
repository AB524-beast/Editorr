let selectedFile = null;
let selectedAction = 'grayscale';

const dropArea = document.getElementById('dropArea');
const imageInput = document.getElementById('imageInput');
const chooseBtn = document.getElementById('chooseBtn');
const previewImg = document.getElementById('previewImg');
const previewWrap = document.getElementById('previewWrap');
const previewSpinner = document.getElementById('previewSpinner');
const fileNameEl = document.getElementById('fileName');
const statusEl = document.getElementById('status');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const actionButtons = document.querySelectorAll('[data-action]');
const progress = document.getElementById('progress');
const progressBar = progress ? progress.querySelector('.bar') : null;
const themeToggle = document.getElementById('themeToggle');
const previewBtn = document.getElementById('previewBtn');
const processedPreviewWrap = document.getElementById('processedPreviewWrap');
const processedPreviewImg = document.getElementById('processedPreviewImg');
const processedSpinner = document.getElementById('processedSpinner');
const processedFileName = document.getElementById('processedFileName');
let lastObjectUrl = null; 

function toggleTheme() { document.body.classList.toggle('dark'); document.body.classList.toggle('light');
  // small spin animation on the icon
  themeToggle?.classList.add('spin');
  setTimeout(()=> themeToggle?.classList.remove('spin'), 420);
}
themeToggle?.addEventListener('click', toggleTheme);

// entrance animation on page load
window.addEventListener('DOMContentLoaded', ()=>{
  const card = document.querySelector('.card');
  setTimeout(()=> card?.classList.add('entered'), 80);
});

chooseBtn?.addEventListener('click', () => imageInput.click());

imageInput?.addEventListener('change', e => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  const file = files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { setStatus('Please select an image file', true); return; }
  selectedFile = file;
  fileNameEl.textContent = file.name;
  const reader = new FileReader();
  reader.onloadstart = () => { previewSpinner?.classList.remove('hidden'); }
  reader.onload = () => {
    // show original preview
    previewImg.src = reader.result;
    previewWrap.classList.remove('hidden');
    // animate in
    previewWrap.classList.remove('entered');
    void previewWrap.offsetWidth;
    previewWrap.classList.add('entered');

    // hide spinner
    previewSpinner?.classList.add('hidden');

    // clear any previous processed preview
    if (processedPreviewWrap) {
      processedPreviewWrap.classList.add('hidden');
      processedPreviewWrap.classList.remove('entered');
      processedPreviewImg.src = '';
      processedFileName.textContent = '';
      if (lastObjectUrl) { URL.revokeObjectURL(lastObjectUrl); lastObjectUrl = null; }
    }
  }
  reader.onerror = () => { previewSpinner?.classList.add('hidden'); setStatus('Unable to read file', true); }
  reader.readAsDataURL(file);
  setStatus('');
}

// drag & drop
['dragenter','dragover'].forEach(evt => dropArea.addEventListener(evt, e=>{ e.preventDefault(); dropArea.classList.add('over'); }));
['dragleave','drop'].forEach(evt => dropArea.addEventListener(evt, e=>{ e.preventDefault(); dropArea.classList.remove('over'); }));
dropArea.addEventListener('drop', e => { handleFiles(e.dataTransfer.files); });

// action buttons
actionButtons.forEach(btn => btn.addEventListener('click', e => {
  actionButtons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedAction = btn.getAttribute('data-action');
}));

processBtn?.addEventListener('click', () => {
  if (!selectedFile) { setStatus('Select an image first', true); return; }
  processImage();
});

previewBtn?.addEventListener('click', () => {
  if (!selectedFile) { setStatus('Select an image first', true); return; }
  previewImage();
});

clearBtn?.addEventListener('click', () => {
  selectedFile = null;
  previewWrap.classList.add('hidden'); previewImg.src=''; fileNameEl.textContent='';
  previewSpinner?.classList.add('hidden');
  previewWrap.classList.remove('entered');
  downloadBtn.style.display='none';
  if (lastObjectUrl) { URL.revokeObjectURL(lastObjectUrl); lastObjectUrl = null; }
  processedPreviewWrap.classList.add('hidden'); processedPreviewImg.src=''; processedFileName.textContent='';
  processedSpinner?.classList.add('hidden');
  processedPreviewWrap.classList.remove('entered');
  setStatus('');
});

function previewImage() {
  setStatus('Preparing preview…');
  progress.classList.remove('hidden');
  progressBar.style.width = '0%';
  const formData = new FormData();
  formData.append('image', selectedFile);
  formData.append('action', selectedAction);

  // show processed spinner
  processedSpinner?.classList.remove('hidden');

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload', true);
  xhr.responseType = 'blob';
  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = pct + '%';
    }
  };
  xhr.onload = () => {
    progress.classList.add('hidden');
    processedSpinner?.classList.add('hidden');
    if (xhr.status === 200) {
      const blob = xhr.response;
      if (lastObjectUrl) { URL.revokeObjectURL(lastObjectUrl); }
      const url = window.URL.createObjectURL(blob);
      lastObjectUrl = url;
      processedPreviewImg.src = url;
      // trigger animation
      processedPreviewWrap.classList.remove('hidden');
      processedPreviewWrap.classList.remove('entered');
      // trigger reflow then add entered to animate
      void processedPreviewWrap.offsetWidth;
      processedPreviewWrap.classList.add('entered');

      const contentType = xhr.getResponseHeader('Content-Type') || 'image/png';
      const ext = contentType.split('/')[1] || 'png';
      processedFileName.textContent = `edited_image.${ext}`;

      // set download to processed preview as well
      downloadBtn.href = url;
      downloadBtn.download = `edited_image.${ext}`;
      downloadBtn.style.display = 'inline-block';

      setStatus('Preview ready — you can download or process further', false);
    } else {
      setStatus('Preview failed', true);
    }
  };
  xhr.onerror = () => { progress.classList.add('hidden'); processedSpinner?.classList.add('hidden'); setStatus('Upload error', true); };
  xhr.send(formData);
}

function processImage() {
  setStatus('Uploading…');
  progress.classList.remove('hidden');
  progressBar.style.width = '0%';
  const formData = new FormData();
  formData.append('image', selectedFile);
  formData.append('action', selectedAction);

  // show processed spinner
  processedSpinner?.classList.remove('hidden');

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload', true);
  xhr.responseType = 'blob';
  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      progressBar.style.width = pct + '%';
    }
  };
  xhr.onload = () => {
    progress.classList.add('hidden');
    processedSpinner?.classList.add('hidden');
    if (xhr.status === 200) {
      const blob = xhr.response;
      const contentType = xhr.getResponseHeader('Content-Type') || 'image/png';
      const ext = contentType.split('/')[1] || 'png';
      const url = window.URL.createObjectURL(blob);
      downloadBtn.href = url;
      downloadBtn.download = `edited_image.${ext}`;
      downloadBtn.style.display = 'inline-block';
      setStatus('Done — click Download', false);
    } else {
      setStatus('Processing failed', true);
    }
  };
  xhr.onerror = () => { progress.classList.add('hidden'); processedSpinner?.classList.add('hidden'); setStatus('Upload error', true); };
  xhr.send(formData);
}

function setStatus(msg, isError=false) { statusEl.textContent = msg; statusEl.style.color = isError ? '#e74c3c' : ''; }