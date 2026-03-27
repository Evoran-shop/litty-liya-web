/* =====================================================
   LITTY LIYA 3D — script.js
   
   NEW vs original:
   ┌─────────────────────────────────────────────────┐
   │  THREE.JS 3D HERO    → initThreeHero()          │
   │  Custom Cursor        → initCursor()             │
   │  CSS Particles        → initParticles()          │
   │  3D Card Tilt         → initCardTilt()           │
   │  Counter Animation    → animateCounters()        │
   │  Hero AOS (fade-up)   → triggerHeroAOS()         │
   └─────────────────────────────────────────────────┘
   
   UNCHANGED from original:
   - Product data + localStorage
   - Cart logic (add/remove/qty)
   - WhatsApp checkout
   - Product modal
   - Contact form
   - Navbar scroll + active link
   - Scroll reveal
   - Back to top
===================================================== */

/* =============================================
   PRODUCT DATA — FIRESTORE
   
   Products এখন Firestore থেকে আসে।
   Collection: "products"
   
   allProducts array টা always up-to-date থাকে
   কারণ onSnapshot() realtime listener use করা হইছে।
   Admin থেকে add/delete করলে main site এ
   automatically update হয়ে যাবে — reload ছাড়াই।
============================================= */
/* =============================================
   PRODUCT DATA + LOCALSTORAGE
============================================= */
const DEFAULT_PRODUCTS = [
  { id:1, name:'Velvet Matte Lipstick',   category:'Lips',     price:650,  image:'https://images.unsplash.com/photo-1586495777744-4e6232bf4f27?w=500&q=80', desc:'Long-lasting matte formula with rich pigment. Stays for 12+ hours without drying.' },
  { id:2, name:'Rose Gloss Shine',         category:'Lips',     price:480,  image:'https://images.unsplash.com/photo-1631214500004-bf5d53da7ebe?w=500&q=80', desc:'High-shine lip gloss with plumping effect. Non-sticky, hydrating formula.' },
  { id:3, name:'Smoky Eyeshadow Palette',  category:'Eyes',     price:1200, image:'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&q=80', desc:'12 richly pigmented shades for every look — from soft day glam to dramatic night.' },
  { id:4, name:'Precision Liner Pen',      category:'Eyes',     price:420,  image:'https://images.unsplash.com/photo-1596704017234-6a7f44bdb2c3?w=500&q=80', desc:'Ultra-fine tip for perfect wings. Waterproof and smudge-proof all day.' },
  { id:5, name:'Glow Foundation SPF30',    category:'Face',     price:1450, image:'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80', desc:'Buildable coverage with a natural glow finish. Suitable for all skin tones.' },
  { id:6, name:'Radiance Highlighter',     category:'Face',     price:780,  image:'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500&q=80', desc:'Champagne-gold shimmer for cheekbones, brow bone, and cupid\'s bow.' },
  { id:7, name:'Rose Petal Face Mist',     category:'Skincare', price:560,  image:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80', desc:'Hydrating facial mist with real rose extract. Sets makeup and refreshes skin.' },
  { id:8, name:'Gold Serum Moisturizer',   category:'Skincare', price:1850, image:'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=500&q=80', desc:'24K gold-infused serum that plumps, brightens, and reduces fine lines overnight.' },
];

const WA_NUMBER = "8801678064162";

function getProducts() {
  const stored = localStorage.getItem('ll_products');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('ll_products', JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}

/* =============================================
   CART STATE
============================================= */
let cart = JSON.parse(localStorage.getItem('ll_cart') || '[]');
function saveCart() { localStorage.setItem('ll_cart', JSON.stringify(cart)); }

/* =============================================
   THREE.JS 3D HERO — FLOATING MAKEUP PARTICLES
   
   What it renders:
   - Lipstick tubes  → CylinderGeometry (tall, thin)
   - Compact mirrors → CylinderGeometry (flat disc)
   - Sparkle stars   → OctahedronGeometry (diamond shape)
   - Glitter dust    → PointsMaterial cloud (1200 points)
   - Rose petals     → PlaneGeometry (flat quad, pink tint)
   
   Each object has:
   - Random start position spread across the scene
   - Individual float speed, rotation speed, drift path
   - Metallic rose-gold / blush / mauve material
   
   Mouse effect:
   - Entire group gently tilts toward cursor (parallax)
   
   Mobile: disabled on < 768px for performance.
============================================= */
function initThreeHero() {
  if (window.innerWidth < 768) return;

  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── Renderer ── */
  const W = canvas.offsetWidth  || window.innerWidth;
  const H = canvas.offsetHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* ── Scene + Camera ── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 100);
  camera.position.set(0, 0, 14);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x1a0a10, 2));

  const light1 = new THREE.PointLight(0xc9956a, 5, 30); // warm amber
  light1.position.set(6, 8, 8);
  scene.add(light1);

  const light2 = new THREE.PointLight(0x8b4a6b, 3, 20); // deep mauve
  light2.position.set(-6, -4, 5);
  scene.add(light2);

  const light3 = new THREE.PointLight(0xe8b4a0, 2, 18); // blush pink
  light3.position.set(0, -6, 6);
  scene.add(light3);

  /* ── Shared materials ── */
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xc9956a, metalness: 0.9, roughness: 0.12,
    emissive: 0x3a1a0a, emissiveIntensity: 0.2,
  });
  const matBlush = new THREE.MeshStandardMaterial({
    color: 0xe8b4a0, metalness: 0.85, roughness: 0.15,
    emissive: 0x2a0a18, emissiveIntensity: 0.2,
  });
  const matMauve = new THREE.MeshStandardMaterial({
    color: 0x8b4a6b, metalness: 0.8, roughness: 0.2,
    emissive: 0x1a0510, emissiveIntensity: 0.3,
  });
  const matWhite = new THREE.MeshStandardMaterial({
    color: 0xfdf8f5, metalness: 0.7, roughness: 0.1,
    emissive: 0xc9956a, emissiveIntensity: 0.15,
  });

  const materials = [matGold, matBlush, matMauve, matWhite];

  /* ── Helper: random range ── */
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ── Container group — mouse parallax applied here ── */
  const group = new THREE.Group();
  scene.add(group);

  /* Store per-object animation data */
  const objects = [];

  /* ──────────────────────────────────────────
     1. LIPSTICK TUBES
     Tall thin cylinders with a tapered top cap.
     Scattered across scene.
  ────────────────────────────────────────── */
  for (let i = 0; i < 10; i++) {
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 16);
    const capGeo  = new THREE.CylinderGeometry(0.0, 0.12, 0.22, 16); // bullet tip
    const mat     = materials[Math.floor(Math.random() * materials.length)];

    const body = new THREE.Mesh(bodyGeo, mat);
    const cap  = new THREE.Mesh(capGeo,  mat);
    cap.position.y = 0.56;

    const tube = new THREE.Group();
    tube.add(body, cap);

    /* Random position spread wide */
    tube.position.set(rnd(-9, 9), rnd(-6, 6), rnd(-4, 2));
    tube.rotation.set(rnd(0, Math.PI * 2), rnd(0, Math.PI * 2), rnd(0, Math.PI * 2));

    group.add(tube);
    objects.push({
      mesh:   tube,
      floatSpeed:  rnd(0.3, 0.7),
      floatAmp:    rnd(0.3, 0.8),
      rotSpeedX:   rnd(-0.008, 0.008),
      rotSpeedY:   rnd(0.005, 0.015),
      rotSpeedZ:   rnd(-0.005, 0.005),
      originY:     tube.position.y,
      phase:       rnd(0, Math.PI * 2),
    });
  }

  /* ──────────────────────────────────────────
     2. COMPACT MIRRORS / POWDER CASES
     Flat thick discs — like a makeup compact.
  ────────────────────────────────────────── */
  for (let i = 0; i < 8; i++) {
    const discGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32);
    const mat     = materials[Math.floor(Math.random() * materials.length)];
    const disc    = new THREE.Mesh(discGeo, mat);

    disc.position.set(rnd(-10, 10), rnd(-7, 7), rnd(-5, 1));
    disc.rotation.set(rnd(0, Math.PI * 2), rnd(0, Math.PI * 2), rnd(0, Math.PI * 2));

    group.add(disc);
    objects.push({
      mesh:       disc,
      floatSpeed: rnd(0.2, 0.5),
      floatAmp:   rnd(0.2, 0.6),
      rotSpeedX:  rnd(0.003, 0.01),
      rotSpeedY:  rnd(0.005, 0.012),
      rotSpeedZ:  rnd(-0.004, 0.004),
      originY:    disc.position.y,
      phase:      rnd(0, Math.PI * 2),
    });
  }

  /* ──────────────────────────────────────────
     3. SPARKLE STARS (OctahedronGeometry)
     Diamond-shaped gems — catch light beautifully.
  ────────────────────────────────────────── */
  for (let i = 0; i < 14; i++) {
    const size    = rnd(0.08, 0.28);
    const starGeo = new THREE.OctahedronGeometry(size, 0);
    const mat     = materials[Math.floor(Math.random() * materials.length)];
    const star    = new THREE.Mesh(starGeo, mat);

    star.position.set(rnd(-11, 11), rnd(-7, 7), rnd(-6, 3));
    star.rotation.set(rnd(0, Math.PI * 2), rnd(0, Math.PI * 2), rnd(0, Math.PI * 2));

    group.add(star);
    objects.push({
      mesh:       star,
      floatSpeed: rnd(0.4, 1.0),
      floatAmp:   rnd(0.15, 0.5),
      rotSpeedX:  rnd(0.01, 0.03),
      rotSpeedY:  rnd(0.01, 0.025),
      rotSpeedZ:  rnd(0.008, 0.02),
      originY:    star.position.y,
      phase:      rnd(0, Math.PI * 2),
    });
  }

  /* ──────────────────────────────────────────
     4. EYESHADOW PALETTE SLABS
     Thin flat boxes.
  ────────────────────────────────────────── */
  for (let i = 0; i < 5; i++) {
    const palGeo = new THREE.BoxGeometry(0.9, 0.06, 0.6);
    const mat    = materials[Math.floor(Math.random() * materials.length)];
    const pal    = new THREE.Mesh(palGeo, mat);

    pal.position.set(rnd(-9, 9), rnd(-6, 6), rnd(-4, 0));
    pal.rotation.set(rnd(0, Math.PI * 2), rnd(0, Math.PI * 2), rnd(0, Math.PI * 2));

    group.add(pal);
    objects.push({
      mesh:       pal,
      floatSpeed: rnd(0.25, 0.55),
      floatAmp:   rnd(0.3, 0.7),
      rotSpeedX:  rnd(0.003, 0.009),
      rotSpeedY:  rnd(0.006, 0.014),
      rotSpeedZ:  rnd(-0.004, 0.004),
      originY:    pal.position.y,
      phase:      rnd(0, Math.PI * 2),
    });
  }

  /* ──────────────────────────────────────────
     5. GLITTER DUST CLOUD
     1200 tiny points scattered everywhere.
     Two separate clouds — gold + blush pink.
  ────────────────────────────────────────── */
  function makeGlitter(count, color, spread) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = rnd(-spread, spread);
      pos[i*3+1] = rnd(-spread, spread);
      pos[i*3+2] = rnd(-spread * 0.5, spread * 0.3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color, size: rnd(0.018, 0.03),
      transparent: true, opacity: 0.55,
      sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  }

  const glitterGold  = makeGlitter(700, 0xc9956a, 11);
  const glitterBlush = makeGlitter(500, 0xe8b4a0, 9);
  group.add(glitterGold, glitterBlush);

  /* ──────────────────────────────────────────
     6. ROSE PETALS (flat quads, tilted planes)
  ────────────────────────────────────────── */
  for (let i = 0; i < 12; i++) {
    const petalGeo = new THREE.PlaneGeometry(rnd(0.2, 0.5), rnd(0.15, 0.35));
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xe8b4a0,
      metalness: 0.3, roughness: 0.6,
      transparent: true, opacity: rnd(0.4, 0.75),
      side: THREE.DoubleSide,
    });
    const petal = new THREE.Mesh(petalGeo, petalMat);

    petal.position.set(rnd(-10, 10), rnd(-7, 7), rnd(-5, 2));
    petal.rotation.set(rnd(0, Math.PI*2), rnd(0, Math.PI*2), rnd(0, Math.PI*2));

    group.add(petal);
    objects.push({
      mesh:       petal,
      floatSpeed: rnd(0.15, 0.4),
      floatAmp:   rnd(0.4, 1.0),
      rotSpeedX:  rnd(0.002, 0.007),
      rotSpeedY:  rnd(0.003, 0.008),
      rotSpeedZ:  rnd(0.004, 0.01),
      originY:    petal.position.y,
      phase:      rnd(0, Math.PI * 2),
    });
  }

  /* ── Mouse tracking for group parallax ── */
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 0.6;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
  });

  /* ── Clock ── */
  const clock = new THREE.Clock();
  let animId;

  /* ── Render loop ── */
  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    /* Smooth mouse lerp */
    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    /* Tilt entire group with mouse */
    group.rotation.y = mouseX;
    group.rotation.x = -mouseY;

    /* Animate every makeup object */
    objects.forEach(obj => {
      const { mesh, floatSpeed, floatAmp, rotSpeedX, rotSpeedY, rotSpeedZ, originY, phase } = obj;

      /* Floating up-down with sine wave */
      mesh.position.y = originY + Math.sin(t * floatSpeed + phase) * floatAmp;

      /* Continuous slow rotation */
      mesh.rotation.x += rotSpeedX;
      mesh.rotation.y += rotSpeedY;
      mesh.rotation.z += rotSpeedZ;
    });

    /* Glitter clouds counter-rotate slowly for depth */
    glitterGold.rotation.y  =  t * 0.03;
    glitterGold.rotation.x  =  t * 0.015;
    glitterBlush.rotation.y = -t * 0.025;
    glitterBlush.rotation.x =  t * 0.02;

    /* Gently breathe light colors */
    light1.intensity = 5 + Math.sin(t * 0.7) * 1.5;
    light3.intensity = 2 + Math.cos(t * 0.5) * 0.8;

    renderer.render(scene, camera);
  }

  animate();

  /* ── Resize handler ── */
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) { cancelAnimationFrame(animId); return; }
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
}

/* =============================================
   CUSTOM CURSOR
   Two elements: dot (instant) + ring (lagged).
   Cursor expands when hovering interactive elements.
============================================= */
function initCursor() {
  /* Skip on touch devices */
  if (!window.matchMedia('(hover: hover)').matches) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let dotX = 0, dotY = 0;
  let ringX = 0, ringY = 0;

  /* Dot follows mouse instantly */
  document.addEventListener('mousemove', (e) => {
    dotX = e.clientX;
    dotY = e.clientY;
  });

  /* Ring follows with lerp smoothing */
  function moveCursor() {
    ringX += (dotX - ringX) * 0.14;
    ringY += (dotY - ringY) * 0.14;

    dot.style.left  = dotX  + 'px';
    dot.style.top   = dotY  + 'px';
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';

    requestAnimationFrame(moveCursor);
  }
  moveCursor();

  /* Expand cursor on hoverable elements */
  const hoverEls = document.querySelectorAll('a, button, .product-card, .tab-btn, .social-btn');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* =============================================
   CSS PARTICLES
   Creates 30 floating dots in the hero section.
   Pure CSS animation — zero performance cost.
============================================= */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    /* Random position, size, speed */
    p.style.left     = Math.random() * 100 + 'vw';
    p.style.bottom   = '-10px';
    p.style.width    = (Math.random() * 3 + 1) + 'px';
    p.style.height   = p.style.width;
    p.style.animationDuration  = (Math.random() * 12 + 8) + 's';
    p.style.animationDelay     = (Math.random() * 8) + 's';
    p.style.opacity  = (Math.random() * 0.5 + 0.1).toString();

    /* Random color: accent-1 or accent-2 */
    p.style.background = Math.random() > 0.5 ? '#c9956a' : '#e8b4a0';

    container.appendChild(p);
  }
}

/* =============================================
   HERO AOS (Animate On Show)
   Triggers fade-up on hero text elements
   after loader finishes (2.5s delay).
============================================= */
function triggerHeroAOS() {
  setTimeout(() => {
    document.querySelectorAll('[data-aos]').forEach(el => {
      el.classList.add('aos-done');
    });
  }, 2500);
}

/* =============================================
   3D CARD TILT
   Adds mouse-driven rotateX/rotateY to product cards.
   Creates a realistic 3D depth effect on hover.
   Disabled on mobile via CSS (transform:none !important).
============================================= */
function initCardTilt() {
  if (window.innerWidth < 768) return;

  /* Delegate to product grid — handles dynamically added cards too */
  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;

    const rect     = card.getBoundingClientRect();
    const centerX  = rect.left + rect.width  / 2;
    const centerY  = rect.top  + rect.height / 2;

    /* Max tilt: 12 degrees */
    const rotateY  =  ((e.clientX - centerX) / (rect.width  / 2)) * 12;
    const rotateX  = -((e.clientY - centerY) / (rect.height / 2)) * 12;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
  });

  document.addEventListener('mouseleave', (e) => {
    const card = e.target.closest('.product-card');
    if (card) card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  }, true);

  /* Reset on card mouse-leave */
  document.addEventListener('mouseover', () => {}, true);
}

/* =============================================
   COUNTER ANIMATION
   Animates the stat numbers in the About section
   (e.g., 0 → 500, 0 → 50, 0 → 100).
   Triggered when About section enters viewport.
============================================= */
function animateCounters() {
  const counters = document.querySelectorAll('.stat-n[data-count]');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el     = entry.target;
      const target = parseInt(el.dataset.count);
      const dur    = 1800;  /* ms */
      const start  = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / dur, 1);
        /* Ease out cubic */
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      }

      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* =============================================
   LOADING SCREEN
============================================= */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  /* Force hide after 3s max — Firestore timeout safe */
  setTimeout(() => {
    if (loader) loader.classList.add('hidden');
  }, 3000);
});

/* =============================================
   NAVBAR
============================================= */
const navbar     = document.getElementById('navbar');
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const navLinks   = document.querySelectorAll('.nav-link');
const sections   = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  handleBackTop();
  revealCheck();
  highlightNav();
}, { passive: true });

function highlightNav() {
  const pos = window.scrollY + 100;
  sections.forEach(sec => {
    const top    = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    const id     = sec.getAttribute('id');
    if (pos >= top && pos < bottom) {
      navLinks.forEach(l => l.classList.remove('active'));
      const match = document.querySelector(`.nav-link[href="#${id}"]`);
      if (match) match.classList.add('active');
    }
  });
}

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  });
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight;
    window.scrollTo({ top, behavior:'smooth' });
  });
});

/* =============================================
   CATEGORY TABS + PRODUCT RENDERING
============================================= */
let activeCategory = 'all';

function buildCategoryTabs() {
  const tabsEl   = document.getElementById('category-tabs');
  const products = getProducts();
  const cats     = ['all', ...new Set(products.map(p => p.category))];

  tabsEl.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (cat === activeCategory ? ' active' : '');
    btn.dataset.cat = cat;
    btn.textContent = cat === 'all' ? 'All' : cat;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    });
    tabsEl.appendChild(btn);
  });
}

function renderProducts() {
  const grid     = document.getElementById('product-grid');
  const products = getProducts();
  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:12px;"></i>No products in this category yet.</div>';
    return;
  }

  grid.innerHTML = filtered.map((p, i) => `
    <div class="product-card reveal" style="transition-delay:${i * 0.07}s" data-id="${p.id}">
      <div class="product-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy"/>
        <div class="product-cat-tag">${p.category}</div>
        <div class="product-view-btn"><span>Quick View</span></div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="product-price">৳ ${p.price.toLocaleString()}</span>
          <button class="add-cart-btn" data-id="${p.id}" onclick="event.stopPropagation(); addToCart(${p.id}, this)">
            <i class="fas fa-bag-shopping"></i> Add
          </button>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.add-cart-btn')) return;
      openModal(parseInt(card.dataset.id));
    });
  });

  revealCheck();

  /* Re-apply cursor hover listeners to new cards */
  grid.querySelectorAll('.product-card, .add-cart-btn').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

/* =============================================
   CART LOGIC (unchanged from original)
============================================= */
const cartBtn       = document.getElementById('cart-btn');
const cartBadge     = document.getElementById('cart-badge');
const cartSidebar   = document.getElementById('cart-sidebar');
const cartOverlay   = document.getElementById('cart-overlay');
const cartClose     = document.getElementById('cart-close');
const cartItemsEl   = document.getElementById('cart-items');
const cartTotalEl   = document.getElementById('cart-total');
const cartCountLabel= document.getElementById('cart-count-label');
const cartCheckout  = document.getElementById('cart-checkout');
const cartClear     = document.getElementById('cart-clear');

function addToCart(productId, btn) {
  /* Firestore ID is string — compare as string */
  const products = getProducts();
  const product  = products.find(p => p.id == productId);
  if (!product) return;

  const existing = cart.find(item => item.id == productId);
  if (existing) existing.qty++;
  else cart.push({ ...product, qty:1 });

  saveCart();
  updateCartUI();

  if (btn) {
    btn.innerHTML = '<i class="fas fa-check"></i> Added';
    btn.classList.add('added');
    setTimeout(() => { btn.innerHTML = '<i class="fas fa-bag-shopping"></i> Add'; btn.classList.remove('added'); }, 1500);
  }

  cartBadge.classList.remove('bump');
  void cartBadge.offsetWidth;
  cartBadge.classList.add('bump');
  setTimeout(() => cartBadge.classList.remove('bump'), 300);
}

function updateCartUI() {
  const totalQty   = cart.reduce((s,i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s,i) => s + i.price * i.qty, 0);
  cartBadge.textContent    = totalQty;
  cartCountLabel.textContent = totalQty > 0 ? `(${totalQty})` : '';
  cartTotalEl.textContent  = '৳ ' + totalPrice.toLocaleString();

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<div class="cart-empty"><i class="fas fa-bag-shopping"></i><p>Your cart is empty</p></div>`;
    return;
  }

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">৳ ${(item.price * item.qty).toLocaleString()}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  `).join('');
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id == id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id != id);
  saveCart(); updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id != id);
  saveCart(); updateCartUI();
}

function openCart()  { cartSidebar.classList.add('open'); cartOverlay.classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow=''; }

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

cartClear.addEventListener('click', () => {
  if (cart.length === 0) return;
  if (confirm('Clear all items?')) { cart=[]; saveCart(); updateCartUI(); }
});

/* WhatsApp checkout */
cartCheckout.addEventListener('click', () => {
  if (cart.length === 0) { alert('Your cart is empty!'); return; }
  const lines = cart.map(i => `• ${i.name} x${i.qty} = ৳${(i.price*i.qty).toLocaleString()}`);
  const total = cart.reduce((s,i) => s + i.price*i.qty, 0);
  const msg   = encodeURIComponent(`🛍️ *Litty Liya Order*\n\n${lines.join('\n')}\n\n💰 *Total: ৳${total.toLocaleString()}*\n\nPlease confirm my order!`);
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
});

/* Single product WhatsApp buy */
function buySingleWA(product) {
  const msg = encodeURIComponent(`🛍️ *Litty Liya Order*\n\n• ${product.name}\n💰 Price: ৳${product.price.toLocaleString()}\n\nI'd like to buy this product!`);
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
}

/* =============================================
   PRODUCT MODAL
============================================= */
const modalOverlay = document.getElementById('modal-overlay');
const productModal = document.getElementById('product-modal');
const modalContent = document.getElementById('modal-content');
const modalClose   = document.getElementById('modal-close');

function openModal(productId) {
  const products = getProducts();
  const product  = products.find(p => p.id == productId);
  if (!product) return;

  modalContent.innerHTML = `
    <div class="modal-grid">
      <div class="modal-img"><img src="${product.image}" alt="${product.name}"/></div>
      <div class="modal-info">
        <span class="modal-info-cat">${product.category}</span>
        <h2 class="modal-info-name">${product.name}</h2>
        <div class="modal-info-price">৳ ${product.price.toLocaleString()}</div>
        <p class="modal-info-desc">${product.desc}</p>
        <div class="modal-actions">
          <button class="modal-wa-btn" onclick="buySingleWA({name:'${product.name.replace(/'/g,"\\'")}', price:${product.price}})">
            <i class="fab fa-whatsapp"></i> Buy via WhatsApp
          </button>
          <button class="btn-primary modal-add-btn" onclick="addToCart(${product.id}, null); closeModal();">
            <i class="fas fa-bag-shopping"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;

  productModal.classList.add('open');
  modalOverlay.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeModal() {
  productModal.classList.remove('open');
  modalOverlay.classList.remove('open');
  document.body.style.overflow='';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCart(); } });

/* =============================================
   CONTACT FORM
============================================= */
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name  = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const msg   = document.getElementById('c-msg').value.trim();

  if (!name || !email || !msg) {
    contactForm.style.animation = 'formShake 0.4s ease';
    setTimeout(() => contactForm.style.animation = '', 500);
    return;
  }

  const mailtoLink = `mailto:simo9696969696@gmail.com?subject=Litty Liya Inquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${msg}`)}`;
  window.open(mailtoLink, '_blank');
  formSuccess.classList.add('show');
  contactForm.reset();
  setTimeout(() => formSuccess.classList.remove('show'), 5000);
});

/* Inject form shake keyframe */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes formShake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-8px)} 40%{transform:translateX(8px)}
    60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
  }
`;
document.head.appendChild(shakeStyle);

/* =============================================
   BACK TO TOP
============================================= */
const backTop = document.getElementById('back-top');
function handleBackTop() { backTop.classList.toggle('visible', window.scrollY > 400); }
backTop.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

/* =============================================
   SCROLL REVEAL
============================================= */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

function revealCheck() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}

/* =============================================
   INIT — runs on page load
============================================= */
function init() {
  /* 3D Hero — main Three.js scene */
  initThreeHero();

  /* Custom cursor */
  initCursor();

  /* CSS floating particles in hero */
  initParticles();

  /* Hero text fade-up after loader */
  triggerHeroAOS();

  /* Product cards 3D tilt on hover */
  initCardTilt();

  /* Stat number counters */
  animateCounters();

  /* Products — localStorage */
  buildCategoryTabs();
  renderProducts();

  /* Listen for admin product changes */
  window.addEventListener('storage', (e) => {
    if (e.key === 'll_products') { buildCategoryTabs(); renderProducts(); }
  });

  /* Cart */
  updateCartUI();

  /* Reveal */
  revealCheck();

  /* Footer year */
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
}

init();