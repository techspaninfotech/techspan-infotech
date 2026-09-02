/* TechSpan Infotech — lightweight interactive enhancements */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const header = document.querySelector('.site-header');
  const backToTop = document.querySelector('.back-to-top');
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = [...document.querySelectorAll('.nav-menu a[href^="#"]')];

  // Header, scroll progress and mobile navigation.
  const updateScrollUI = () => {
    const scrolled = window.scrollY > 30;
    header.classList.toggle('scrolled', scrolled);
    backToTop.classList.toggle('show', window.scrollY > 550);
  };
  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });

  const closeMenu = () => {
    menuToggle.classList.remove('active');
    navMenu.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  };
  menuToggle.addEventListener('click', () => {
    const open = !navMenu.classList.contains('open');
    navMenu.classList.toggle('open', open);
    menuToggle.classList.toggle('active', open);
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  navLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // Reveal-on-scroll and active navigation.
  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
      revealObserver.observe(item);
    });
  }

  const sections = document.querySelectorAll('main section[id]');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach(section => sectionObserver.observe(section));

  // Animated marketing counters.
  const counters = document.querySelectorAll('.counter');
  const animateCounter = counter => {
    const target = Number(counter.dataset.target);
    if (reduceMotion) { counter.textContent = target; return; }
    const start = performance.now();
    const duration = 1500;
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      counter.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCounter(entry.target); counterObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.65 });
  counters.forEach(counter => counterObserver.observe(counter));

  // Testimonial slider. Site remains readable if the CDN is unavailable.
  if (typeof Swiper !== 'undefined') {
    new Swiper('.testimonial-slider', {
      slidesPerView: 1,
      spaceBetween: 18,
      loop: true,
      speed: reduceMotion ? 0 : 650,
      autoplay: reduceMotion ? false : { delay: 5000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      breakpoints: { 700: { slidesPerView: 2 }, 1050: { slidesPerView: 3 } },
      keyboard: { enabled: true }
    });
  }

  // Desktop custom cursor, magnetic CTAs and selected 3D cards.
  if (finePointer && !reduceMotion) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mouseX = -50, mouseY = -50, ringX = -50, ringY = -50;
    window.addEventListener('mousemove', event => { mouseX = event.clientX; mouseY = event.clientY; dot.style.transform = `translate(${mouseX - 3}px,${mouseY - 3}px)`; });
    const follow = () => { ringX += (mouseX - ringX) * .14; ringY += (mouseY - ringY) * .14; ring.style.transform = `translate(${ringX - ring.offsetWidth / 2}px,${ringY - ring.offsetHeight / 2}px)`; requestAnimationFrame(follow); };
    follow();
    document.querySelectorAll('a,button,.service-card,.tilt-card').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', event => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(event.clientX-r.left-r.width/2)*.12}px,${(event.clientY-r.top-r.height/2)*.12}px)`; });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', event => { const r = card.getBoundingClientRect(); const x = (event.clientX-r.left)/r.width-.5; const y = (event.clientY-r.top)/r.height-.5; card.style.transform = `perspective(900px) rotateX(${-y*5}deg) rotateY(${x*6}deg) translateY(-3px)`; });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // Lightweight hero particle network.
  const canvas = document.getElementById('particle-canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.parentElement;
    let particles = [], animationId, pointer = { x: -1000, y: -1000 };
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = hero.clientWidth * ratio; canvas.height = hero.clientHeight * ratio;
      canvas.style.width = `${hero.clientWidth}px`; canvas.style.height = `${hero.clientHeight}px`;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      const count = Math.min(52, Math.floor(hero.clientWidth / 24));
      particles = Array.from({ length: count }, () => ({ x: Math.random()*hero.clientWidth, y: Math.random()*hero.clientHeight, vx:(Math.random()-.5)*.22, vy:(Math.random()-.5)*.22, r:Math.random()*1.3+.5 }));
    };
    hero.addEventListener('pointermove', event => { const r=hero.getBoundingClientRect(); pointer={x:event.clientX-r.left,y:event.clientY-r.top}; }, { passive:true });
    hero.addEventListener('pointerleave', () => { pointer={x:-1000,y:-1000}; });
    const draw = () => {
      ctx.clearRect(0,0,hero.clientWidth,hero.clientHeight);
      particles.forEach((p,i) => {
        const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy); if(d<100&&d>0){p.x+=dx/d*.18;p.y+=dy/d*.18}
        p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>hero.clientWidth)p.vx*=-1;if(p.y<0||p.y>hero.clientHeight)p.vy*=-1;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(0,212,255,.55)';ctx.fill();
        for(let j=i+1;j<particles.length;j++){const q=particles[j],dist=Math.hypot(p.x-q.x,p.y-q.y);if(dist<120){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`rgba(0,180,216,${.13*(1-dist/120)})`;ctx.stroke()}}
      });
      animationId=requestAnimationFrame(draw);
    };
    resize();draw();
    let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,150)},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(animationId);else draw()});
  }

  // Local-only validation demo. Connect to a real form provider before launch.
  const form = document.getElementById('contact-form');
  form.addEventListener('submit', event => {
    event.preventDefault();
    let valid = true;
    const fields = [...form.querySelectorAll('[required]')];
    fields.forEach(field => {
      const wrapper = field.closest('.field');
      const emailInvalid = field.type === 'email' && !/^\S+@\S+\.\S+$/.test(field.value.trim());
      const invalid = !field.value.trim() || emailInvalid;
      wrapper.classList.toggle('invalid', invalid);
      wrapper.querySelector('.error').textContent = invalid ? (emailInvalid ? 'Please enter a valid email address.' : 'This field is required.') : '';
      if (invalid) valid = false;
    });
    if (!valid) { form.querySelector('.invalid input, .invalid select, .invalid textarea')?.focus(); return; }
    const status = form.querySelector('.form-status');
    status.textContent = 'Thanks! This demo form is working locally. Connect a form service before launch to receive submissions.';
    status.classList.add('show');
    form.reset();
  });
  form.querySelectorAll('[required]').forEach(field => field.addEventListener('input', () => { field.closest('.field').classList.remove('invalid'); field.closest('.field').querySelector('.error').textContent=''; }));
  document.getElementById('current-year').textContent = new Date().getFullYear();
})();

