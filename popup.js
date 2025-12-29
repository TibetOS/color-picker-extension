// Color Picker Pro - Main Logic

class ColorPickerApp {
    constructor() {
        this.currentColor = null;
        this.currentFormat = 'hex';
        this.history = [];
        this.maxHistory = 12;

        this.init();
    }

    async init() {
        await this.loadHistory();
        this.bindEvents();
        this.renderHistory();
    }

    bindEvents() {
        // Pick color button
        document.getElementById('pickColor').addEventListener('click', () => this.pickColor());

        // Format tabs
        document.querySelectorAll('.format-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFormat(e.target.dataset.format));
        });

        // Copy button
        document.getElementById('copyBtn').addEventListener('click', () => this.copyColor());

        // Clear history
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
    }

    async pickColor() {
        if (!window.EyeDropper) {
            this.showToast('EyeDropper not supported in this browser');
            return;
        }

        try {
            const eyeDropper = new EyeDropper();
            const result = await eyeDropper.open();
            const hex = result.sRGBHex.toUpperCase();

            this.currentColor = hex;
            this.updateColorDisplay();
            this.addToHistory(hex);
            this.copyColor(); // Auto-copy on pick
        } catch (err) {
            // User cancelled or error
            if (err.name !== 'AbortError') {
                console.error('EyeDropper error:', err);
            }
        }
    }

    updateColorDisplay() {
        if (!this.currentColor) return;

        // Update preview
        const preview = document.getElementById('colorPreview');
        preview.style.setProperty('--picked-color', this.currentColor);

        // Update value display
        this.updateColorValue();
    }

    updateColorValue() {
        const valueEl = document.getElementById('colorValue');
        const value = this.formatColor(this.currentColor, this.currentFormat);
        valueEl.textContent = value;
    }

    switchFormat(format) {
        this.currentFormat = format;

        // Update active tab
        document.querySelectorAll('.format-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.format === format);
        });

        // Update displayed value
        if (this.currentColor) {
            this.updateColorValue();
        }

        // Save preference
        chrome.storage.local.set({ lastFormat: format });
    }

    formatColor(hex, format) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;

        switch (format) {
            case 'hex':
                return hex;
            case 'rgb':
                return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            case 'hsl':
                const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
                return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            default:
                return hex;
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    async copyColor() {
        if (!this.currentColor) return;

        const value = this.formatColor(this.currentColor, this.currentFormat);

        try {
            await navigator.clipboard.writeText(value);
            this.showToast('Copied!');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Copy failed');
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 1500);
    }

    async loadHistory() {
        try {
            const data = await chrome.storage.local.get(['colorHistory', 'lastFormat']);
            this.history = data.colorHistory || [];

            if (data.lastFormat) {
                this.currentFormat = data.lastFormat;
                document.querySelectorAll('.format-tab').forEach(tab => {
                    tab.classList.toggle('active', tab.dataset.format === this.currentFormat);
                });
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    }

    async saveHistory() {
        try {
            await chrome.storage.local.set({ colorHistory: this.history });
        } catch (err) {
            console.error('Failed to save history:', err);
        }
    }

    addToHistory(hex) {
        // Remove if already exists
        this.history = this.history.filter(c => c !== hex);

        // Add to beginning
        this.history.unshift(hex);

        // Limit size
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }

        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const grid = document.getElementById('historyGrid');

        if (this.history.length === 0) {
            grid.innerHTML = '<div class="empty-history">No colors yet</div>';
            return;
        }

        grid.innerHTML = this.history.map(color => `
            <div class="history-color"
                 style="background-color: ${color}"
                 data-color="${color}"
                 title="${color}">
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.history-color').forEach(el => {
            el.addEventListener('click', () => {
                this.currentColor = el.dataset.color;
                this.updateColorDisplay();
                this.copyColor();
            });
        });
    }

    async clearHistory() {
        this.history = [];
        await this.saveHistory();
        this.renderHistory();
        this.showToast('History cleared');
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new ColorPickerApp();
});
