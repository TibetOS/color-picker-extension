// Color Picker Pro v2.0 - Full Featured Color Picker

class ColorPickerApp {
    constructor() {
        this.currentColor = null;
        this.currentFormat = 'hex';
        this.history = [];
        this.palettes = [];
        this.activePalette = null;
        this.maxHistory = 12;
        this.adjustedColor = null;

        this.init();
    }

    async init() {
        await this.loadData();
        this.bindEvents();
        this.bindKeyboardShortcuts();
        this.renderHistory();
        this.renderPalettes();
    }

    // ==================== DATA MANAGEMENT ====================

    async loadData() {
        try {
            const data = await chrome.storage.local.get([
                'colorHistory', 'lastFormat', 'palettes', 'activePalette'
            ]);
            this.history = data.colorHistory || [];
            this.palettes = data.palettes || [];
            this.activePalette = data.activePalette || null;

            if (data.lastFormat) {
                this.currentFormat = data.lastFormat;
                this.updateFormatUI();
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    }

    async saveData() {
        try {
            await chrome.storage.local.set({
                colorHistory: this.history,
                palettes: this.palettes,
                activePalette: this.activePalette,
                lastFormat: this.currentFormat
            });
        } catch (err) {
            console.error('Failed to save data:', err);
        }
    }

    // ==================== EVENT BINDING ====================

    bindEvents() {
        // Pick color button
        document.getElementById('pickColor').addEventListener('click', () => this.pickColor());

        // Format tabs
        document.querySelectorAll('.format-tab:not(.more-btn)').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFormat(e.target.dataset.format));
        });

        // More formats dropdown
        document.getElementById('moreFormatsBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('moreFormats').classList.toggle('hidden');
        });

        document.querySelectorAll('.format-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                this.switchFormat(e.target.dataset.format);
                document.getElementById('moreFormats').classList.add('hidden');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.getElementById('moreFormats').classList.add('hidden');
        });

        // Copy button
        document.getElementById('copyBtn').addEventListener('click', () => this.copyColor());

        // Clear history
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Tool section toggles
        ['contrast', 'adjust', 'harmonies'].forEach(section => {
            document.getElementById(`${section}Toggle`).addEventListener('click', () => {
                this.toggleSection(section);
            });
        });

        // Adjustment sliders
        document.getElementById('lightnessSlider').addEventListener('input', (e) => this.updateAdjustment());
        document.getElementById('saturationSlider').addEventListener('input', (e) => this.updateAdjustment());
        document.getElementById('applyAdjust').addEventListener('click', () => this.applyAdjustment());

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => this.openExportModal());
        document.getElementById('closeExport').addEventListener('click', () => this.closeExportModal());
        document.querySelectorAll('.export-option').forEach(opt => {
            opt.addEventListener('click', (e) => this.selectExportFormat(e.target.dataset.format));
        });
        document.getElementById('copyExport').addEventListener('click', () => this.copyExport());

        // Palette management
        document.getElementById('newPaletteBtn').addEventListener('click', () => this.openPaletteModal());
        document.getElementById('closePalette').addEventListener('click', () => this.closePaletteModal());
        document.getElementById('createPalette').addEventListener('click', () => this.createPalette());
        document.getElementById('paletteSelect').addEventListener('change', (e) => this.selectPalette(e.target.value));
        document.getElementById('addToPalette').addEventListener('click', () => this.addColorToPalette());

        // Modal close on background click
        document.getElementById('exportModal').addEventListener('click', (e) => {
            if (e.target.id === 'exportModal') this.closeExportModal();
        });
        document.getElementById('paletteModal').addEventListener('click', (e) => {
            if (e.target.id === 'paletteModal') this.closePaletteModal();
        });
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'p': this.pickColor(); break;
                case 'c': this.copyColor(); break;
                case '1': this.switchFormat('hex'); break;
                case '2': this.switchFormat('rgb'); break;
                case '3': this.switchFormat('hsl'); break;
            }
        });
    }

    // ==================== COLOR PICKING ====================

    async pickColor() {
        if (!window.EyeDropper) {
            this.showToast('EyeDropper not supported');
            return;
        }

        try {
            const eyeDropper = new EyeDropper();
            const result = await eyeDropper.open();
            const hex = result.sRGBHex.toUpperCase();

            this.currentColor = hex;
            this.updateColorDisplay();
            this.addToHistory(hex);
            this.updateTools();
            this.copyColor();
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('EyeDropper error:', err);
            }
        }
    }

    // ==================== COLOR DISPLAY ====================

    updateColorDisplay() {
        if (!this.currentColor) return;

        const preview = document.getElementById('colorPreview');
        preview.style.setProperty('--picked-color', this.currentColor);

        // Update contrast swatches
        document.querySelectorAll('.contrast-swatch').forEach(el => {
            el.style.color = this.currentColor;
        });

        this.updateColorValue();
        this.updateTailwindMatch();
    }

    updateColorValue() {
        const valueEl = document.getElementById('colorValue');
        const value = this.formatColor(this.currentColor, this.currentFormat);
        valueEl.textContent = value;
    }

    updateTailwindMatch() {
        const matchEl = document.getElementById('tailwindMatch');
        const valueEl = document.getElementById('tailwindValue');

        if (window.TailwindColors && this.currentColor) {
            const match = window.TailwindColors.findClosest(this.currentColor);
            if (match) {
                valueEl.textContent = match.name;
                matchEl.classList.remove('hidden');
                return;
            }
        }
        matchEl.classList.add('hidden');
    }

    // ==================== FORMAT HANDLING ====================

    switchFormat(format) {
        this.currentFormat = format;
        this.updateFormatUI();

        if (this.currentColor) {
            this.updateColorValue();
        }

        this.saveData();
    }

    updateFormatUI() {
        // Update main tabs
        document.querySelectorAll('.format-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.format === this.currentFormat);
        });

        // Update dropdown options
        document.querySelectorAll('.format-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.format === this.currentFormat);
        });
    }

    formatColor(hex, format) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;

        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

        switch (format) {
            case 'hex': return hex;
            case 'rgb': return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            case 'hsl': return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            case 'rgba': return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
            case 'hsla': return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`;
            case 'hex8': return hex + 'FF';
            case 'tailwind':
                if (window.TailwindColors) {
                    const match = window.TailwindColors.findClosest(hex);
                    return match ? match.name : hex;
                }
                return hex;
            case 'cssvar': return `var(--color-${hex.slice(1).toLowerCase()})`;
            default: return hex;
        }
    }

    // ==================== COLOR CONVERSIONS ====================

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
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

    hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // ==================== CLIPBOARD ====================

    async copyColor() {
        if (!this.currentColor) return;

        const value = this.formatColor(this.currentColor, this.currentFormat);
        try {
            await navigator.clipboard.writeText(value);
            this.showToast('Copied!');
        } catch (err) {
            this.showToast('Copy failed');
        }
    }

    // ==================== TOOLS ====================

    toggleSection(section) {
        const header = document.getElementById(`${section}Toggle`);
        const panel = document.getElementById(`${section}Panel`);

        header.classList.toggle('open');
        panel.classList.toggle('hidden');
    }

    updateTools() {
        if (!this.currentColor) return;

        this.updateContrast();
        this.updateHarmonies();
        this.resetAdjustment();
    }

    // Contrast Checker
    updateContrast() {
        const rgb = this.hexToRgb(this.currentColor);
        if (!rgb) return;

        const luminance = this.getLuminance(rgb.r, rgb.g, rgb.b);
        const whiteLum = 1;
        const blackLum = 0;

        const contrastWhite = (whiteLum + 0.05) / (luminance + 0.05);
        const contrastBlack = (luminance + 0.05) / (blackLum + 0.05);

        document.getElementById('contrastWhite').textContent = contrastWhite.toFixed(1) + ':1';
        document.getElementById('contrastBlack').textContent = contrastBlack.toFixed(1) + ':1';

        // Best contrast (use for WCAG badges)
        const bestContrast = Math.max(contrastWhite, contrastBlack);

        const wcagAA = document.getElementById('wcagAA');
        const wcagAAA = document.getElementById('wcagAAA');

        wcagAA.classList.toggle('pass', bestContrast >= 4.5);
        wcagAA.classList.toggle('fail', bestContrast < 4.5);
        wcagAAA.classList.toggle('pass', bestContrast >= 7);
        wcagAAA.classList.toggle('fail', bestContrast < 7);
    }

    getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // Color Adjustments
    resetAdjustment() {
        document.getElementById('lightnessSlider').value = 0;
        document.getElementById('saturationSlider').value = 0;
        document.getElementById('lightnessValue').textContent = '0%';
        document.getElementById('saturationValue').textContent = '0%';
        this.updateAdjustment();
    }

    updateAdjustment() {
        if (!this.currentColor) return;

        const lightnessAdj = parseInt(document.getElementById('lightnessSlider').value);
        const saturationAdj = parseInt(document.getElementById('saturationSlider').value);

        document.getElementById('lightnessValue').textContent = `${lightnessAdj > 0 ? '+' : ''}${lightnessAdj}%`;
        document.getElementById('saturationValue').textContent = `${saturationAdj > 0 ? '+' : ''}${saturationAdj}%`;

        const rgb = this.hexToRgb(this.currentColor);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

        const newL = Math.max(0, Math.min(100, hsl.l + lightnessAdj));
        const newS = Math.max(0, Math.min(100, hsl.s + saturationAdj));

        const newRgb = this.hslToRgb(hsl.h, newS, newL);
        this.adjustedColor = this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);

        document.getElementById('adjustedPreview').style.backgroundColor = this.adjustedColor;
    }

    applyAdjustment() {
        if (!this.adjustedColor) return;

        this.currentColor = this.adjustedColor;
        this.updateColorDisplay();
        this.addToHistory(this.currentColor);
        this.updateTools();
        this.copyColor();
    }

    // Color Harmonies
    updateHarmonies() {
        const rgb = this.hexToRgb(this.currentColor);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

        // Complementary (opposite)
        const complementary = [this.currentColor, this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l)];
        this.renderHarmony('complementary', complementary);

        // Analogous (adjacent)
        const analogous = [
            this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
            this.currentColor,
            this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
        ];
        this.renderHarmony('analogous', analogous);

        // Triadic (120 degrees apart)
        const triadic = [
            this.currentColor,
            this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
            this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l)
        ];
        this.renderHarmony('triadic', triadic);
    }

    hslToHex(h, s, l) {
        const rgb = this.hslToRgb(h, s, l);
        return this.rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    renderHarmony(id, colors) {
        const container = document.getElementById(id);
        container.innerHTML = colors.map(color => `
            <div class="harmony-color" style="background-color: ${color}" data-color="${color}" title="${color}"></div>
        `).join('');

        container.querySelectorAll('.harmony-color').forEach(el => {
            el.addEventListener('click', () => {
                this.currentColor = el.dataset.color;
                this.updateColorDisplay();
                this.addToHistory(this.currentColor);
                this.updateTools();
                this.copyColor();
            });
        });
    }

    // ==================== HISTORY ====================

    addToHistory(hex) {
        this.history = this.history.filter(c => c !== hex);
        this.history.unshift(hex);
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }
        this.saveData();
        this.renderHistory();
    }

    renderHistory() {
        const grid = document.getElementById('historyGrid');

        if (this.history.length === 0) {
            grid.innerHTML = '<div class="empty-history">No colors yet</div>';
            return;
        }

        grid.innerHTML = this.history.map(color => `
            <div class="history-color" style="background-color: ${color}" data-color="${color}" title="${color}"></div>
        `).join('');

        grid.querySelectorAll('.history-color').forEach(el => {
            el.addEventListener('click', () => {
                this.currentColor = el.dataset.color;
                this.updateColorDisplay();
                this.updateTools();
                this.copyColor();
            });
        });
    }

    async clearHistory() {
        this.history = [];
        await this.saveData();
        this.renderHistory();
        this.showToast('History cleared');
    }

    // ==================== TABS ====================

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.getElementById('historyTab').classList.toggle('hidden', tab !== 'history');
        document.getElementById('palettesTab').classList.toggle('hidden', tab !== 'palettes');
    }

    // ==================== PALETTES ====================

    openPaletteModal() {
        document.getElementById('paletteModal').classList.remove('hidden');
        document.getElementById('paletteName').value = '';
        document.getElementById('paletteName').focus();
    }

    closePaletteModal() {
        document.getElementById('paletteModal').classList.add('hidden');
    }

    createPalette() {
        const name = document.getElementById('paletteName').value.trim();
        if (!name) {
            this.showToast('Enter a name');
            return;
        }

        const palette = {
            id: Date.now().toString(),
            name,
            colors: []
        };

        this.palettes.push(palette);
        this.activePalette = palette.id;
        this.saveData();
        this.renderPalettes();
        this.closePaletteModal();
        this.showToast('Palette created');
    }

    renderPalettes() {
        const select = document.getElementById('paletteSelect');
        select.innerHTML = '<option value="">Select palette...</option>' +
            this.palettes.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        if (this.activePalette) {
            select.value = this.activePalette;
            this.renderPaletteColors();
        }
    }

    selectPalette(id) {
        this.activePalette = id || null;
        this.saveData();
        this.renderPaletteColors();
    }

    renderPaletteColors() {
        const grid = document.getElementById('paletteGrid');
        const addBtn = document.getElementById('addToPalette');

        if (!this.activePalette) {
            grid.innerHTML = '<div class="empty-history">No palette selected</div>';
            addBtn.classList.add('hidden');
            return;
        }

        const palette = this.palettes.find(p => p.id === this.activePalette);
        if (!palette) return;

        addBtn.classList.remove('hidden');

        if (palette.colors.length === 0) {
            grid.innerHTML = '<div class="empty-history">Empty palette</div>';
            return;
        }

        grid.innerHTML = palette.colors.map(color => `
            <div class="history-color" style="background-color: ${color}" data-color="${color}" title="${color}"></div>
        `).join('');

        grid.querySelectorAll('.history-color').forEach(el => {
            el.addEventListener('click', () => {
                this.currentColor = el.dataset.color;
                this.updateColorDisplay();
                this.updateTools();
                this.copyColor();
            });
        });
    }

    addColorToPalette() {
        if (!this.currentColor || !this.activePalette) return;

        const palette = this.palettes.find(p => p.id === this.activePalette);
        if (!palette) return;

        if (!palette.colors.includes(this.currentColor)) {
            palette.colors.push(this.currentColor);
            this.saveData();
            this.renderPaletteColors();
            this.showToast('Added to palette');
        } else {
            this.showToast('Already in palette');
        }
    }

    // ==================== EXPORT ====================

    openExportModal() {
        document.getElementById('exportModal').classList.remove('hidden');
        this.selectExportFormat('json');
    }

    closeExportModal() {
        document.getElementById('exportModal').classList.add('hidden');
    }

    selectExportFormat(format) {
        document.querySelectorAll('.export-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.format === format);
        });

        const colors = this.getExportColors();
        let output = '';

        switch (format) {
            case 'json':
                output = JSON.stringify({ colors }, null, 2);
                break;
            case 'css':
                output = ':root {\n' + colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n') + '\n}';
                break;
            case 'scss':
                output = colors.map((c, i) => `$color-${i + 1}: ${c};`).join('\n');
                break;
            case 'tailwind':
                output = `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n` +
                    colors.map((c, i) => `        'custom-${i + 1}': '${c}',`).join('\n') +
                    `\n      }\n    }\n  }\n}`;
                break;
        }

        document.getElementById('exportOutput').value = output;
    }

    getExportColors() {
        // Export active palette if available, otherwise history
        if (this.activePalette) {
            const palette = this.palettes.find(p => p.id === this.activePalette);
            if (palette && palette.colors.length > 0) return palette.colors;
        }
        return this.history;
    }

    async copyExport() {
        const output = document.getElementById('exportOutput').value;
        try {
            await navigator.clipboard.writeText(output);
            this.showToast('Copied!');
        } catch (err) {
            this.showToast('Copy failed');
        }
    }

    // ==================== UTILITIES ====================

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1500);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ColorPickerApp();
});
