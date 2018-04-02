// ==========================================================================
// webkit-lowerfill.js
// A polyfill for lower fill on `<input type='range'>` in webkit
// https://github.com/sampotts/webkit-lowerfill
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // WebKit only and Array.from needed (modern WebKit)
    if (!('WebkitAppearance' in document.documentElement.style) || !Array.from) {
        return;
    }

    // Events that trigger an update
    const events = [
        'input', // Live user input
        'change', // At end of input
        'update', // Custom event
    ];

    // Get the value as percentage
    function getPercentage() {
        const max = this.max || 100;
        const min = this.min || 0;
        return (this.value - min) / (max - min) * 100;
    }

    // Update the fill
    function update() {
        this.style.setProperty('--value', `${getPercentage.call(this)}%`);
    }

    // Build a single input
    function build(range) {
        if (typeof range.set === 'function') {
            return;
        }

        // Update on render
        update.call(range);

        // Listen for events
        events.forEach(type => {
            range.addEventListener(type, update, false);
        });

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
    }

    // Setup all inputs
    function setup(target = document.body) {
        let container = target;
        const selector = 'input[type="range"]';

        if (!(container instanceof HTMLElement)) {
            return;
        }

        if (container.matches(selector)) {
            container = container.parentNode;
        }

        Array.from(container.querySelectorAll(selector)).forEach(build);
    }

    // Initialise a new observer
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                setup(node);
            });
        });
    });

    // Watch for new inputs added
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Setup
    setup();
});
