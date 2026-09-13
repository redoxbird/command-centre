// Smooth scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

hljs.highlightAll();

// Toggle code visibility
function toggleCode(button) {
  const codeBlock = button.closest('.e-demo__input-card').querySelector('.e-demo__code-block');
  const isShowing = codeBlock.classList.contains('e-demo__code-block--show');

  // Close all other code blocks
  document.querySelectorAll('.e-demo__code-block--show').forEach(block => {
    block.classList.remove('e-demo__code-block--show');
    block.closest('.e-demo__input-card').querySelector('.e-demo__code-toggle').classList.remove('e-demo__code-toggle--active');
  });

  // Toggle current code block
  if (!isShowing) {
    codeBlock.classList.add('e-demo__code-block--show');
    button.classList.add('e-demo__code-toggle--active');
  } else {
    codeBlock.classList.remove('e-demo__code-block--show');
    button.classList.remove('e-demo__code-toggle--active');
  }
}

// Copy code to clipboard
function copyCode(button) {
  const codeBlock = button.closest('.e-demo__code-block');
  const code = codeBlock.querySelector('pre').textContent;

  navigator.clipboard.writeText(code).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.style.background = 'rgba(34, 197, 94, 0.2)';
    button.style.borderColor = 'rgba(34, 197, 94, 0.5)';

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.style.background = '';
      button.style.borderColor = '';
    }, 2000);
  });
}

// Advanced form validation
async function validateAdvancedForm() {
  const form = document.getElementById('advanced-demo-form');
  const inputs = form.querySelectorAll('e-input');
  const statusDiv = document.getElementById('form-status');

  let allValid = true;
  let firstInvalid = null;

  for (const input of inputs) {
    const result = await input.validate();
    if (!result.valid) {
      allValid = false;
      if (!firstInvalid) firstInvalid = input;
    }
  }

  if (allValid) {
    statusDiv.style.background = '#10b981';
    statusDiv.style.color = 'white';
    statusDiv.textContent = '✅ Form is valid! All fields pass validation.';
    statusDiv.style.display = 'block';

    // Get form data
    const formData = new FormData(form);
    console.log('Form Data:', Object.fromEntries(formData));
  } else {
    statusDiv.style.background = '#ef4444';
    statusDiv.style.color = 'white';
    statusDiv.textContent = '❌ Please fix the validation errors above.';
    statusDiv.style.display = 'block';

    // Focus first invalid field
    if (firstInvalid) {
      firstInvalid.focus();
    }
  }

  // Hide status after 5 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
}

function resetAdvancedForm() {
  const form = document.getElementById('advanced-demo-form');
  const inputs = form.querySelectorAll('e-input');
  const statusDiv = document.getElementById('form-status');

  inputs.forEach(input => input.reset());
  statusDiv.style.display = 'none';

  console.log('Form reset');
}

// Add some interactivity to inputs
document.addEventListener('DOMContentLoaded', () => {
  // Listen for validation events
  const inputs = document.querySelectorAll('e-input');

  inputs.forEach(input => {
    input.addEventListener('input:success', () => {
      console.log(`✅ ${input.name} is valid`);
    });

    input.addEventListener('input:error', (e) => {
      console.log(`❌ ${input.name}: ${e.detail.error}`);
    });
  });

  // Simulate async validation for username
  const usernameInput = document.querySelector('e-input[name="username_check"]');
  if (usernameInput) {
    usernameInput.addEventListener('input:validate', async (e) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const value = e.target.value;
      if (value && value.length >= 3) {
        // Simulate checking if username is taken
        const takenUsernames = ['admin', 'user', 'test', 'demo'];
        if (takenUsernames.includes(value.toLowerCase())) {
          e.target.error = 'Username is already taken';
          e.target.valid = false;
          e.target.dispatchEvent(new CustomEvent('input:error', {
            bubbles: true,
            composed: true,
            detail: { error: 'Username is already taken' }
          }));
        } else {
          e.target.dispatchEvent(new CustomEvent('input:success', {
            bubbles: true,
            composed: true,
            detail: { message: 'Username is available!' }
          }));
        }
      }
    });
  }
});

// Theme switching functionality
let currentTheme = localStorage.getItem('enhanced-inputs-theme') || 'default';

// Function to switch theme
function switchTheme(themeName) {
  // Update stylesheet
  const themeLink = document.getElementById('theme-stylesheet');
  themeLink.href = `./dist/themes/${themeName}.css`;

  // Update active state
  document.querySelectorAll('.e-demo__theme-btn').forEach(btn => {
    btn.classList.remove('e-demo__theme-btn--active');
  });
  document.querySelector(`[data-theme="${themeName}"]`).classList.add('e-demo__theme-btn--active');

  // Save to localStorage
  localStorage.setItem('enhanced-inputs-theme', themeName);
  currentTheme = themeName;

  // Add transition effect
  document.body.style.transition = 'opacity 0.3s ease';
  document.body.style.opacity = '0.95';
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 150);

  console.log(`Theme switched to: ${themeName}`);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  // Set initial theme
  if (currentTheme !== 'default') {
    switchTheme(currentTheme);
  }

  // Add keyboard navigation for theme switching
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key >= '1' && e.key <= '6') {
      const themes = ['default', 'carbon', 'fluent', 'material', 'newspaper', 'classic'];
      const themeIndex = parseInt(e.key) - 1;
      if (themeIndex < themes.length) {
        switchTheme(themes[themeIndex]);
      }
    }
  });

  // Add theme info tooltip
  const themeButtons = document.querySelectorAll('.e-demo__theme-btn');
  themeButtons.forEach(btn => {
    const theme = btn.dataset.theme;
    btn.title = `Switch to ${theme.charAt(0).toUpperCase() + theme.slice(1)} theme (Alt + ${Array.from(themeButtons).indexOf(btn) + 1})`;
  });
  // Input Demo Card Web Component
  class InputDemoCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
    }

    render() {
      const title = this.getAttribute('title') || '';
      const description = this.getAttribute('description') || '';
      const iconClass = this.getAttribute('icon-class') || '';

      this.shadowRoot.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .e-demo__input-card {
          background: var(--white);
          border-radius: 8px;
          padding: 30px;
          box-shadow: var(--card-shadow);
          transition: all 0.3s ease;
          position: relative;
          border: 1px solid #e4eaf1;
          max-width: 100vw;
        }

        @media (max-width: 768px) {
          .e-demo__input-card {
            width: 100%;
        
          }
        }

        .e-demo__input-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--hover-shadow);
        }

        .e-demo__card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .e-demo__card-head {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 16px;
        }

        .e-demo__card-title {
          display: flex;
          flex-direction: column;
          gap: 2px;       
        }

        .e-demo__card-title h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--dark);
          margin: 0;
        }

        .e-demo__card-title p {
          margin: 0;
          font-size: 0.875rem;
          color: #475569;
        }
       
        .e-demo__card-icon {
          background-color: var(--primary-100);
          color: var(--primary);
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .e-demo__code-toggle {
          background: #f1f5f9;
          border: none;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #334155;
          font-size: 0.8rem;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 0.25rem;
          font-weight: 500;
        }

        .e-demo__code-toggle:hover {
          background: #020617;
          color: var(--white);
        }

        .e-demo__code-toggle--active {
          background: #020617;
          color: var(--white);
        }

        .e-demo__card-content {
        }

        .e-demo__code-block {
          border-radius: 8px;
          margin-top: 20px;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          overflow-x: auto;
          display: none;
          position: relative;
        }

        .e-demo__code-block--show {
          display: block;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .e-demo__code-block pre {
          margin: 0;
          white-space: pre-wrap;
        }

        .e-demo__copy-code {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e2e8f0;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s ease;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }

        .e-demo__copy-code:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      </style>

      <div class="e-demo__input-card">
        <div class="e-demo__card-header">
          <div class="e-demo__card-head">
            <div class="e-demo__card-icon">
              <slot name="icon"></slot>
            </div>
            <div class="e-demo__card-title">
              <h3>${title}</h3>
              <p>${description}</p>
            </div>
          </div>
          <button class="e-demo__code-toggle" onclick="this.getRootNode().host.toggleCode()">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-icon lucide-code"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg> Code
          </button>
        </div>
        <div class="e-demo__card-content">
          <slot name="input"></slot>
        </div>
        <div class="e-demo__code-block">
          <button class="e-demo__copy-code" onclick="this.getRootNode().host.copyCode()">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-icon lucide-code"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg> Copy
          </button>
          <slot name="code"></slot>
        </div>
      </div>
    `;
    }

    toggleCode() {
      const codeBlock = this.shadowRoot.querySelector('.e-demo__code-block');
      const button = this.shadowRoot.querySelector('.e-demo__code-toggle');
      const isShowing = codeBlock.classList.contains('e-demo__code-block--show');

      // Close all other code blocks
      document.querySelectorAll('e-demo-card').forEach(card => {
        const otherCodeBlock = card.shadowRoot.querySelector('.e-demo__code-block');
        const otherButton = card.shadowRoot.querySelector('.e-demo__code-toggle');
        if (otherCodeBlock && otherCodeBlock !== codeBlock) {
          otherCodeBlock.classList.remove('e-demo__code-block--show');
          otherButton.classList.remove('e-demo__code-toggle--active');
        }
      });

      // Toggle current
      if (!isShowing) {
        codeBlock.classList.add('e-demo__code-block--show');
        button.classList.add('e-demo__code-toggle--active');
      } else {
        codeBlock.classList.remove('e-demo__code-block--show');
        button.classList.remove('e-demo__code-toggle--active');
      }
    }

    copyCode() {
      const codeSlot = this.shadowRoot.querySelector('slot[name="code"]');
      const codeElement = codeSlot.assignedNodes().find(node => node.tagName === 'PRE');
      if (codeElement) {
        const code = codeElement.textContent;
        navigator.clipboard.writeText(code).then(() => {
          const button = this.shadowRoot.querySelector('.e-demo__copy-code');
          const originalHTML = button.innerHTML;
          button.innerHTML = '<i class="fas fa-check"></i> Copied!';
          button.style.background = 'rgba(34, 197, 94, 0.2)';
          button.style.borderColor = 'rgba(34, 197, 94, 0.5)';

          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
            button.style.borderColor = '';
          }, 2000);
        });
      }
    }
  }

  // Register the component
  customElements.define('e-demo-card', InputDemoCard);

  // Highlight Code Web Component
  class HighlightCode extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
    }

    render() {
      const code = this.innerHTML.trim();
      const language = this.getAttribute('lang');

      const unescapeHtml = (str) => {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = str;
        return textarea.value;
      };
      const unescaped = unescapeHtml(code);

      this.shadowRoot.innerHTML = `
        <style>
          .e-highlight-code-container {
            position: relative;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            line-height: 1.5;
            overflow-x: auto;
            margin: 0;
          }

          .e-highlight-code-container pre {
            margin: 0;
            white-space: pre-wrap;
          }

          .copy-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #e2e8f0;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.3s ease;
            display: inline-flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
          }

          .copy-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}
          .hljs{color:#c9d1d9;background:#0d1117}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#79c0ff}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#a5d6ff}.hljs-built_in,.hljs-symbol{color:#ffa657}.hljs-code,.hljs-comment,.hljs-formula{color:#8b949e}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#7ee787}.hljs-subst{color:#c9d1d9}.hljs-section{color:#1f6feb;font-weight:700}.hljs-bullet{color:#f2cc60}.hljs-emphasis{color:#c9d1d9;font-style:italic}.hljs-strong{color:#c9d1d9;font-weight:700}.hljs-addition{color:#aff5b4;background-color:#033a16}.hljs-deletion{color:#ffdcd7;background-color:#67060c}
        </style>
        <div class="e-highlight-code-container">
          <button class="copy-btn" onclick="this.getRootNode().host.copyCode()">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-icon lucide-code"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg> Copy
          </button>
          <pre><code class="language-${language}">${code}</code></pre>
        </div>
      `;

      // Apply syntax highlighting
      const codeEl = this.shadowRoot.querySelector('code');
      hljs.highlightElement(codeEl);
    }

    copyCode() {
      const code = this.innerHTML.trim();
      const unescapeHtml = (str) => {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = str;
        return textarea.value;
      };
      const unescaped = unescapeHtml(code);
      navigator.clipboard.writeText(unescaped).then(() => {
        const button = this.shadowRoot.querySelector('.copy-btn');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.style.background = 'rgba(34, 197, 94, 0.2)';
        button.style.borderColor = 'rgba(34, 197, 94, 0.5)';

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.style.background = '';
          button.style.borderColor = '';
        }, 2000);
      });
    }
  }

  // Register the e-highlight-code component
  customElements.define('e-highlight-code', HighlightCode);

});
