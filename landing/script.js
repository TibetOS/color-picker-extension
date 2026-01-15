// Color Picker Landing Page Scripts

(function() {
    'use strict';

    // Chrome Web Store URL - Update this when published
    const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/color-picker/hbedfhfdgkkjdanlddbafilbcgpinkce';

    // Set Chrome Web Store links
    const storeButtons = document.querySelectorAll('#chromeStoreBtn, #chromeStoreBtn2, #chromeStoreBtn3');
    storeButtons.forEach(btn => {
        btn.href = CHROME_STORE_URL;
        btn.target = '_blank';
        btn.rel = 'noopener';
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar background on scroll
    const nav = document.querySelector('.nav');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            nav.style.background = 'rgba(15, 15, 26, 0.95)';
        } else {
            nav.style.background = 'rgba(15, 15, 26, 0.9)';
        }
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all feature cards and screenshot cards
    document.querySelectorAll('.feature-card, .screenshot-card, .shortcut-card, .install-step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });

    // Add visible class styles
    const style = document.createElement('style');
    style.textContent = `
        .feature-card.visible,
        .screenshot-card.visible,
        .shortcut-card.visible,
        .install-step.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Stagger animation for grid items
    document.querySelectorAll('.features-grid, .screenshots-grid, .shortcuts-grid, .install-steps').forEach(grid => {
        const items = grid.children;
        Array.from(items).forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
        });
    });

    // Console Easter egg
    console.log('%c Color Picker ', 'background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 20px; border-radius: 6px; font-size: 16px; font-weight: bold;');
    console.log('%c Pick any color from your screen! ', 'color: #8892b0; font-size: 12px;');
    console.log('%c https://github.com/TibetOS/color-picker-extension ', 'color: #667eea; font-size: 12px;');

})();
