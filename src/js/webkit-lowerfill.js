// ==========================================================================
// webkit-lowerfill.js
// A polyfill for lower fill on `<input type='range'>` in webkit
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // WebKit only
    if (!('WebkitAppearance' in document.documentElement.style)) {
        return;
    }

    // Get a random number
    function generateId() {
        return Math.random()
            .toString(36)
            .replace(/[^a-z]+/g, '')
            .substr(0, 10);
    }

    // Inject the stylesheet
    const styleSheet = document.createElement('style');
    document.head.appendChild(styleSheet);

    // Get the value as percentage
    function getPercentage() {
        const max = this.max || 100;
        const min = this.min || 0;
        return this.value / (max - min) * 100;
    }

    // Update the fill
    function update() {
        const range = this;
        const id = range.getAttribute('id');
        const { sheet } = styleSheet;
        const percentage = getPercentage.call(range);
        const selector = `#${id}::-webkit-slider-runnable-track`;
        const styles = `{ background-image: linear-gradient(to right, currentColor ${percentage}%, transparent ${percentage}%) }`;

        // Find old rule if it exists
        const ruleIndex = Array.from(sheet.rules).findIndex(rule => rule.selectorText === selector);

        // Remove old rule
        if (ruleIndex !== -1) {
            sheet.deleteRule(ruleIndex);
        }

        // Insert new rule
        sheet.insertRule([selector, styles].join(''));
    }

    // Setup all inputs
    Array.from(document.querySelectorAll('input[type="range"]')).forEach(range => {
        const { id } = range;

        // Generate an ID if needed
        if (typeof id !== 'string' || !id.length) {
            range.setAttribute('id', generateId());
        }

        // Update right away
        update.call(range);

        // Listen for user input changes
        range.addEventListener('input', update, false);

        // Helper for setting value programatically
        // Unfortunately watching .value = x is hard
        Object.defineProperty(range, 'set', {
            value(v) {
                if (v !== null && typeof v === 'number') {
                    this.value = v;
                }
                update.call(this);
            },
        });
    });
});
