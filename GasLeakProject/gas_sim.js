let gasLevel = 0;
let activeVentPower = 0;
let lastSelectedId = null;
const particles = [];

// --- YENİ DEĞİŞKENLER ---
let countdown = 10;
let isGameOver = false;

const systems = {
    'stove-unit': { name: 'Ocak (Sızıntı)', active: true, power: 0, isLeak: true },
    'aspirator-unit': { name: 'Aspiratör', active: false, power: 0.15 },
    'fan-unit': { name: 'Fan', active: false, power: 0.12 },
    'window-unit': { name: 'Pencere', active: false, power: 0.20 },
    'door-unit': { name: 'Dış Kapı', active: false, power: 0.12 }
};

window.openMenu = (event, id) => {
    lastSelectedId = id;
    const menuTitle = document.getElementById('menu-title');
    if (menuTitle) menuTitle.innerText = systems[id].name;
    const menu = document.getElementById('interact-menu');
    menu.style.display = 'block';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
};

window.handleMenuAction = (action) => {
    const state = (action === 'open');
    if (lastSelectedId) toggleSystem(lastSelectedId, state);
    window.closeMenu();
};

window.closeMenu = () => { 
    const menu = document.getElementById('interact-menu');
    if (menu) menu.style.display = 'none'; 
};

window.toggleSystem = (id, state) => {
    if (!systems[id]) return;
    systems[id].active = state;
    const el = document.getElementById(id);

    if (id === 'stove-unit') {
        el.setAttribute('color', state ? '#ff4500' : '#111111');
    } else if (id === 'aspirator-unit') {
        el.setAttribute('color', state ? '#2ecc71' : '#94a3b8');
    } else if (id === 'window-unit') {
        const glass = document.getElementById('window-glass');
        const glassGroup = document.getElementById('window-glass-group');
        if (glass) glass.setAttribute('visible', !state);
        if (glassGroup) glassGroup.object3D.rotation.y = state ? Math.PI / 2 : 0;
    } 
    else if (id === 'door-unit') {
        el.object3D.rotation.y = state ? Math.PI / 2 : 0;
    }

    activeVentPower = Object.values(systems)
        .filter(s => s.active && !s.isLeak)
        .reduce((acc, curr) => acc + curr.power, 0);

    const ventStatus = document.getElementById('vent-status');
    if (ventStatus) ventStatus.innerText = activeVentPower > 0 ? "🌀 Tahliye: Aktif" : "🌀 Tahliye: Kapalı";
};

function update() {
    // Eğer oyun bittiyse (bayılma), simülasyonu durdur
    if (isGameOver) return;

    if (systems['fan-unit'].active) {
        const blades = document.getElementById('fan-blades');
        if (blades) blades.object3D.rotation.z += 0.2;
    }

    if (systems['stove-unit'].active) gasLevel += 0.25;
    if (activeVentPower > 0) gasLevel -= activeVentPower;
    
    gasLevel = Math.max(0, Math.min(100, gasLevel));

    // UI Elementleri
    const levelDisplay = document.getElementById('gas-level');
    const barFill = document.getElementById('gas-bar-fill');
    const dangerOverlay = document.getElementById('danger-overlay');
    const feedback = document.getElementById('feedback-note'); // index.html'e eklediğin id

    if (levelDisplay) levelDisplay.innerText = Math.floor(gasLevel);
    if (barFill) barFill.style.width = gasLevel + '%';
    
    // --- FEEDBACK VE TIMER MANTIĞI ---
    if (feedback) {
        if (gasLevel >= 100) {
            countdown -= 0.016; // Saniyede yaklaşık 1 azalır (60fps)
            feedback.innerText = `⚠️ KRİTİK! Bayılmaya: ${Math.ceil(countdown)}s`;
            feedback.style.color = "#ff4757";
            if (dangerOverlay) dangerOverlay.style.display = 'block';

            if (countdown <= 0) {
                isGameOver = true;
                feedback.innerText = "😵 BAYILDINIZ! Sistem Durduruldu.";
            }
        } 
        else if (gasLevel <= 0 && activeVentPower > 0) {
            feedback.innerText = "🎉 TEBRİKLER! Ortam Güvenli.";
            feedback.style.color = "#2ecc71";
            countdown = 10; 
            if (dangerOverlay) dangerOverlay.style.display = 'none';
        }
        else if (gasLevel > 75) {
            feedback.innerText = "❗ Tehlikeli Seviye!";
            feedback.style.color = "#ffa502";
            if (dangerOverlay) dangerOverlay.style.display = 'block';
            countdown = 10;
        }
        else {
            feedback.innerText = gasLevel > 0 ? "Gaz Tahliye Ediliyor..." : "Hava Temiz";
            feedback.style.color = "#f1c40f";
            if (dangerOverlay) dangerOverlay.style.display = 'none';
            countdown = 10;
        }
    }

    // Partikül Üretimi
    if (systems['stove-unit'].active && particles.length < 150) {
        const p = document.createElement('a-sphere');
        p.setAttribute('radius', '0.04');
        p.setAttribute('color', '#2ecc71');
        p.setAttribute('opacity', '0.5');
        p.setAttribute('position', '-4.5 1.1 -7.2'); 
        const v = { 
            x: (Math.random() - 0.5) * 0.015, 
            y: Math.random() * 0.03, 
            z: (Math.random() - 0.5) * 0.015 
        };
        const container = document.getElementById('gas-container');
        if (container) {
            container.appendChild(p);
            particles.push({ el: p, v: v });
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        let pos = p.el.getAttribute('position');
        let driftX = activeVentPower > 0 ? 0.015 : 0;
        
        p.el.setAttribute('position', { 
            x: pos.x + p.v.x + driftX, 
            y: pos.y + p.v.y, 
            z: pos.z + p.v.z 
        });

        if (pos.y > 4.8 || Math.abs(pos.x) > 7.9 || Math.abs(pos.z) > 7.9) {
            if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
            particles.splice(i, 1);
        }
    }
    requestAnimationFrame(update);
}

window.toggleSystem('stove-unit', true);
update();