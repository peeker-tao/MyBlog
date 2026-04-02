(function () {
  function highlight(codeRoot) {
    if (!window.hljs) {
      return;
    }
    const blocks = codeRoot.querySelectorAll('pre code');
    blocks.forEach((block) => {
      window.hljs.highlightElement(block);
    });
  }

  function renderMath(mathRoot) {
    if (!window.renderMathInElement) {
      return;
    }
    window.renderMathInElement(mathRoot, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false },
      ],
    });
  }

  window.enhanceContent = function (root) {
    const target = root || document.body;
    renderMath(target);
    highlight(target);
  };
})();
