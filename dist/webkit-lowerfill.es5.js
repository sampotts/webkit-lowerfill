'use strict';

// ==========================================================================
// webkit-lowerfill.js
// A polyfill for lower fill on `<input type='range'>` in webkit
// https://github.com/sampotts/webkit-lowerfill
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
    // WebKit only
    if (!('WebkitAppearance' in document.documentElement.style)) {
        return;
    }

    // Get a random number
    function generateId() {
        return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
    }

    // Inject the stylesheet
    var styleSheet = document.createElement('style');
    document.head.appendChild(styleSheet);

    // Get the value as percentage
    function getPercentage() {
        var max = this.max || 100;
        var min = this.min || 0;

        return (this.value - min) / (max - min) * 100;
    }

    // Update the fill
    function update() {
        var range = this;
        var id = range.getAttribute('id');
        var sheet = styleSheet.sheet;

        var percentage = getPercentage.call(range);
        var selector = '#' + id + '::-webkit-slider-runnable-track';
        var styles = '{ background-image: linear-gradient(to right, currentColor ' + percentage + '%, transparent ' + percentage + '%) }';

        // Find old rule if it exists
        var ruleIndex = Array.from(sheet.rules).findIndex(function (rule) {
            return rule.selectorText === selector;
        });

        // Remove old rule
        if (ruleIndex !== -1) {
            sheet.deleteRule(ruleIndex);
        }

        // Insert new rule
        sheet.insertRule([selector, styles].join(''));
    }

    // Build a single input
    function build(range) {
        if (typeof range.set === 'function') {
            return;
        }

        var id = range.id;

        // Generate an ID if needed

        if (typeof id !== 'string' || !id.length) {
            range.setAttribute('id', generateId());
        }

        // Update on render
        update.call(range);

        // Listen for user input changes
        range.addEventListener('input', update, false);

        // List for custom event for programatic updates
        range.addEventListener('update', update, false);

        // Helper for setting value programatically
        // Unfortunately watching .value = x is hard
        Object.defineProperty(range, 'set', {
            value: function value(v) {
                if (v !== null && typeof v === 'number') {
                    this.value = v;
                }
                update.call(this);
            }
        });
    }

    // Setup all inputs
    function setup(target) {
        var container = target === null || typeof target === 'undefined' ? document.body : target;
        var selector = 'input[type="range"]';

        if (!(container instanceof HTMLElement)) {
            return;
        }

        if (container.matches(selector)) {
            container = container.parentNode;
        }

        Array.from(container.querySelectorAll(selector)).forEach(build);
    }

    // Initialise a new observer
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                setup(node);
            });
        });
    });

    // Watch for new inputs added
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Setup
    setup();
});