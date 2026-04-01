(() => {
  const display = document.getElementById('display');
  const expression = document.getElementById('expression');

  let current = '0';
  let previous = '';
  let operator = null;
  let shouldReset = false;

  const OP_SYMBOLS = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' };

  function updateDisplay() {
    display.textContent = formatNumber(current);
    display.classList.toggle('shrink', current.length > 10);
  }

  function formatNumber(val) {
    if (val === 'Error') return val;
    if (val.endsWith('.') || val.endsWith('.0') || /\.\d*0$/.test(val)) return val;
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (Math.abs(num) >= 1e12) return num.toExponential(4);
    return val;
  }

  function updateExpression() {
    if (operator && previous !== '') {
      expression.textContent = `${formatNumber(previous)} ${OP_SYMBOLS[operator] || operator}`;
    } else {
      expression.textContent = '';
    }
  }

  function inputDigit(digit) {
    if (shouldReset) {
      current = digit;
      shouldReset = false;
    } else if (current === '0' && digit !== '0') {
      current = digit;
    } else if (current === '0' && digit === '0') {
      return;
    } else {
      if (current.replace(/[^0-9]/g, '').length >= 15) return;
      current = current + digit;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (shouldReset) {
      current = '0.';
      shouldReset = false;
    } else if (!current.includes('.')) {
      current += '.';
    }
    updateDisplay();
  }

  function handleOperator(op) {
    const val = parseFloat(current);
    if (isNaN(val)) return;

    if (operator && !shouldReset) {
      const result = calculate(parseFloat(previous), val, operator);
      if (result === null) {
        current = 'Error';
        previous = '';
        operator = null;
        updateDisplay();
        updateExpression();
        shouldReset = true;
        return;
      }
      current = stripTrailingZeros(result);
      previous = current;
    } else {
      previous = current;
    }

    operator = op;
    shouldReset = true;
    updateDisplay();
    updateExpression();
    highlightOperator(op);
  }

  function calculate(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? null : a / b;
      default: return b;
    }
  }

  function stripTrailingZeros(num) {
    const str = parseFloat(num.toPrecision(12)).toString();
    return str;
  }

  function handleEquals() {
    if (operator === null || previous === '') return;
    const a = parseFloat(previous);
    const b = parseFloat(current);
    if (isNaN(a) || isNaN(b)) return;

    const result = calculate(a, b, operator);
    const exprText = `${formatNumber(previous)} ${OP_SYMBOLS[operator]} ${formatNumber(current)} =`;

    if (result === null) {
      expression.textContent = exprText;
      current = 'Error';
      previous = '';
      operator = null;
      updateDisplay();
      shouldReset = true;
      clearOperatorHighlight();
      return;
    }

    expression.textContent = exprText;
    current = stripTrailingZeros(result);
    previous = '';
    operator = null;
    shouldReset = true;
    updateDisplay();
    clearOperatorHighlight();
  }

  function handleClear() {
    current = '0';
    previous = '';
    operator = null;
    shouldReset = false;
    updateDisplay();
    updateExpression();
    clearOperatorHighlight();
  }

  function handleBackspace() {
    if (shouldReset || current === 'Error') {
      current = '0';
      shouldReset = false;
    } else if (current.length === 1 || (current.length === 2 && current.startsWith('-'))) {
      current = '0';
    } else {
      current = current.slice(0, -1);
    }
    updateDisplay();
  }

  function handlePercent() {
    const val = parseFloat(current);
    if (isNaN(val)) return;
    current = stripTrailingZeros(val / 100);
    shouldReset = true;
    updateDisplay();
  }

  function highlightOperator(op) {
    document.querySelectorAll('.btn.op').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === op);
    });
  }

  function clearOperatorHighlight() {
    document.querySelectorAll('.btn.op').forEach(btn => btn.classList.remove('active'));
  }

  // Button clicks
  document.querySelector('.buttons').addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const action = btn.dataset.action;
    switch (action) {
      case 'digit': inputDigit(btn.dataset.value); break;
      case 'decimal': inputDecimal(); break;
      case 'operator': handleOperator(btn.dataset.value); break;
      case 'equals': handleEquals(); break;
      case 'clear': handleClear(); break;
      case 'backspace': handleBackspace(); break;
      case 'percent': handlePercent(); break;
    }
  });

  // Keyboard support
  document.addEventListener('keydown', e => {
    if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
    else if (e.key === '.') inputDecimal();
    else if (e.key === '+') handleOperator('+');
    else if (e.key === '-') handleOperator('-');
    else if (e.key === '*') handleOperator('*');
    else if (e.key === '/') { e.preventDefault(); handleOperator('/'); }
    else if (e.key === 'Enter' || e.key === '=') handleEquals();
    else if (e.key === 'Escape') handleClear();
    else if (e.key === 'Backspace') handleBackspace();
    else if (e.key === '%') handlePercent();
  });
})();
