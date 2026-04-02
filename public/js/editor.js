(function () {
  const textarea = document.getElementById('content');
  const preview = document.getElementById('preview');
  const imageInput = document.getElementById('image-upload');
  const markdownInput = document.getElementById('markdown-upload');

  if (!textarea || !preview || !window.marked) {
    return;
  }

  function render() {
    const raw = textarea.value || '';
    preview.innerHTML = window.marked.parse(raw, { breaks: true });
    if (window.enhanceContent) {
      window.enhanceContent(preview);
    }
  }

  textarea.addEventListener('input', render);
  render();

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/admin/uploads', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('upload failed');
    }
    return response.json();
  }

  function insertAtCursor(value) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    textarea.value = `${before}${value}${after}`;
    const nextPos = start + value.length;
    textarea.setSelectionRange(nextPos, nextPos);
    textarea.focus();
    render();
  }

  if (imageInput) {
    imageInput.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      try {
        const data = await uploadImage(file);
        const alt = file.name.replace(/\s+/g, '-');
        insertAtCursor(`![${alt}](${data.url})\n`);
      } catch (error) {
        alert('图片上传失败，请重试。');
      } finally {
        imageInput.value = '';
      }
    });
  }

  if (markdownInput) {
    markdownInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        textarea.value = reader.result || '';
        render();
      };
      reader.onerror = () => {
        alert('读取 Markdown 文件失败，请重试。');
      };
      reader.readAsText(file, 'utf-8');
      markdownInput.value = '';
    });
  }
})();
