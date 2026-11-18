'use strict';
const $id = id => document.getElementById(id);
const read = (key, fallback) => {
    try {
        return JSON.parse(localStorage.getItem('nova.' + key)) ?? fallback;
    }
    catch {
        return fallback;
    }
};
const write = (key, value) => localStorage.setItem('nova.' + key, JSON.stringify(value));
const topics = [
    { id: 'html', category: 'html', title: 'HTML', tag: 'STRUCTURE', description: 'The structure and meaning behind every webpage.', detail: 'Semantic HTML elements organize accessible content.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
    { id: 'css', category: 'css', title: 'CSS', tag: 'DESIGN', description: 'Colors, typography, spacing and modern web layouts.', detail: 'CSS selectors target elements, while the cascade determines which declarations apply.', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
    { id: 'javascript', category: 'javascript', title: 'JavaScript', tag: 'INTERACTIVITY', description: 'Events, logic and dynamic content in the browser.', detail: 'Event listeners respond to interaction and the DOM updates the page.', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
    { id: 'responsive', category: 'css', title: 'Responsive design', tag: 'LAYOUT', description: 'Build flexible layouts that adapt to every screen.', detail: 'CSS Grid, Flexbox and media queries adapt content to viewport widths.', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design' },
    { id: 'git', category: 'tools', title: 'Git & GitHub', tag: 'WORKFLOW', description: 'Track code changes and collaborate with developers.', detail: 'Git records history in commits. GitHub hosts repositories and supports collaboration.', url: 'https://docs.github.com/en/get-started' },
    { id: 'accessibility', category: 'html', title: 'Web accessibility', tag: 'INCLUSION', description: 'Make websites usable by as many people as possible.', detail: 'Semantic HTML, keyboard navigation, contrast and labels support inclusive interfaces.', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility' }
];
const currentUser = () => read('users', []).find(u => u.email === read('session', null));
const personalKey = key => key + '.' + (currentUser()?.email || 'guest');
const saved = () => read(personalKey('saved'), []), completed = () => read(personalKey('completed'), []);
let toastTimer;
function toast(message) { const n = $id('toast'); n.textContent = message; n.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => n.classList.remove('show'), 2400); }
function el(tag, cls, text) {
    const n = document.createElement(tag); if (cls)
        n.className = cls; if (text !== undefined)
        n.textContent = text; return n;
}
function externalLink(href, label) { const a = el('a', 'text-link', label); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
function initShared() {
    const toggle = $id('themeToggle'); function sync() { const dark = document.documentElement.dataset.theme === 'dark'; toggle.setAttribute('aria-checked', String(dark)); toggle.querySelector('.theme-knob').textContent = dark ? '☾' : '☀'; toggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode'; } sync(); toggle.addEventListener('click', () => { const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = theme; localStorage.setItem('nova.theme', theme); sync(); }); const menu = $id('menuToggle'); menu.addEventListener('click', () => { const open = $id('navigation').classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); }); document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            $id('navigation').classList.remove('open');
            menu.setAttribute('aria-expanded', 'false');
        }
    }); if (currentUser()) {
        $id('accountLink').href = 'profile.html';
        $id('accountLink').textContent = 'Profile';
    } const scroll = () => { const max = document.documentElement.scrollHeight - innerHeight; $id('scrollProgress').style.width = (max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0) + '%'; }; window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', scroll); scroll(); if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
        document.querySelectorAll('.counter').forEach(n => {
            const target = Number(n.dataset.target), start = performance.now(); const tick = now => {
                const f = Math.min(1, (now - start) / 650); n.textContent = Math.round(target * f); if (f < 1)
                    requestAnimationFrame(tick);
            }; requestAnimationFrame(tick);
        });
}
function highlight(n, text, query) {
    if (!query) {
        n.textContent = text;
        return;
    } const lower = text.toLowerCase(), needle = query.toLowerCase(); let cursor = 0, index; while ((index = lower.indexOf(needle, cursor)) !== -1) {
        n.append(document.createTextNode(text.slice(cursor, index)), el('mark', '', text.slice(index, index + needle.length)));
        cursor = index + needle.length;
    } n.append(document.createTextNode(text.slice(cursor)));
}
function topicCard(t, query = '', onSave = () => { }) { const card = el('article', 'topic-card'), img = el('img'); img.src = `images/${t.id}.svg`; img.alt = `${t.title} illustration`; img.loading = 'lazy'; img.width = 640; img.height = 360; const content = el('div', 'topic-content'), title = el('h3'), desc = el('p'); highlight(title, t.title, query); highlight(desc, t.description, query); const detail = el('p', 'article-detail', t.detail); detail.hidden = true; const actions = el('div', 'card-actions'), more = el('button', 'button outline', 'Read more +'); more.type = 'button'; more.setAttribute('aria-expanded', 'false'); more.addEventListener('click', () => { detail.hidden = !detail.hidden; more.textContent = detail.hidden ? 'Read more +' : 'Read less −'; more.setAttribute('aria-expanded', String(!detail.hidden)); }); const bookmark = el('button', 'button outline'); bookmark.type = 'button'; function sync() { const active = saved().includes(t.id); bookmark.textContent = active ? '★ Saved' : '☆ Save'; bookmark.classList.toggle('saved', active); bookmark.setAttribute('aria-pressed', String(active)); } sync(); bookmark.addEventListener('click', () => { const items = saved(), has = items.includes(t.id); write(personalKey('saved'), has ? items.filter(x => x !== t.id) : [...items, t.id]); sync(); toast(has ? 'Topic removed.' : 'Topic saved.'); onSave(); }); actions.append(more, bookmark, externalLink(t.url, 'Docs ↗')); content.append(el('span', 'tag', t.tag), title, desc, detail, actions); card.append(img, content); return card; }
function initLibrary() {
    const input = $id('wikiSearch'), filters = [...document.querySelectorAll('.filter[data-category]')];
    const initial = new URLSearchParams(location.search).get('category');
    let category = filters.some(f => f.dataset.category === initial) ? initial : 'all';
    const matching = q => topics.filter(t => [t.title, t.description, t.detail, t.tag].join(' ').toLowerCase().includes(q.toLowerCase()));
    function render(suggestions = false) {
        const q = input.value.trim(), list = matching(q).filter(t => category === 'all' || (category === 'saved' ? saved().includes(t.id) : t.category === category)); filters.forEach(f => { const active = f.dataset.category === category; f.classList.toggle('active', active); f.setAttribute('aria-pressed', String(active)); }); $id('articleCards').replaceChildren(...(list.length ? list.map(t => topicCard(t, q, () => {
            if (category === 'saved')
                render();
        })) : [el('p', 'empty', 'No matching topics. Try another search or filter.')])); $id('articleCount').textContent = `Showing ${list.length} of ${topics.length} topics`; write('lastSearch', q); const sug = $id('searchSuggestions'); sug.replaceChildren(); if (suggestions && q)
            matching(q).slice(0, 4).forEach(t => { const b = el('button', '', t.title); b.type = 'button'; b.addEventListener('click', () => { input.value = t.title; category = 'all'; render(); }); sug.append(b); }); sug.hidden = !sug.childElementCount;
    }
    // jQuery handlers preserve the Assignment 6 search behavior.
    if (window.jQuery) {
        jQuery(input).on('input', () => render(true));
        jQuery(document).on('click', '.filter[data-category]', function () { category = this.dataset.category; render(); });
    }
    else {
        input.addEventListener('input', () => render(true));
        filters.forEach(f => f.addEventListener('click', () => { category = f.dataset.category; render(); }));
    }
    input.addEventListener('keydown', e => {
        if (e.key === 'Escape')
            $id('searchSuggestions').hidden = true;
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.search-wrap'))
            $id('searchSuggestions').hidden = true;
    });
    $id('clearSearch').addEventListener('click', () => { input.value = ''; category = 'all'; render(); input.focus(); });
    $id('surpriseButton').addEventListener('click', () => { const t = topics[Math.floor(Math.random() * topics.length)]; input.value = t.title; category = 'all'; render(); input.scrollIntoView({ block: 'center' }); toast(`Try ${t.title}!`); });
    document.querySelector('.copy-code').addEventListener('click', async (e) => {
        try {
            await navigator.clipboard.writeText(document.querySelector('.snippet code').textContent);
            e.target.textContent = 'Copied ✓';
            toast('Code copied.');
            setTimeout(() => e.target.textContent = 'Copy', 1500);
        }
        catch {
            toast('Clipboard unavailable. Select and copy the snippet manually.');
        }
    });
    render();
}
function initRoadmap() { const order = ['html', 'css', 'responsive', 'javascript', 'git', 'accessibility']; function update() { const n = completed().length; $id('learningProgress').style.width = (n / topics.length * 100) + '%'; $id('progressLabel').textContent = `${n} of ${topics.length} topics completed · ${Math.round(n / topics.length * 100)}%`; } function render() { const done = completed(); $id('roadmapSteps').replaceChildren(); order.forEach((id, i) => { const t = topics.find(x => x.id === id), row = el('div', 'step'), box = el('input'); box.type = 'checkbox'; box.id = 'step-' + id; box.checked = done.includes(id); const label = el('label', '', `${String(i + 1).padStart(2, '0')} · ${t.title}`); label.htmlFor = box.id; label.append(el('small', '', t.tag)); const link = el('a', 'text-link', 'Read ↗'); link.href = `articles.html?category=${t.category}`; box.addEventListener('change', () => { const list = completed(); write(personalKey('completed'), box.checked ? [...new Set([...list, id])] : list.filter(x => x !== id)); update(); toast(box.checked ? 'Milestone completed.' : 'Milestone reopened.'); }); row.append(box, label, link); $id('roadmapSteps').append(row); }); update(); } $id('resetProgress').addEventListener('click', () => { write(personalKey('completed'), []); render(); toast('Learning progress reset.'); }); $id('recommend').addEventListener('click', () => { const category = $id('experience').value === 'beginner' ? 'html' : $id('interest').value, t = topics.find(x => x.category === category), link = el('a', 'text-link', `Explore ${t.title} ↗`); link.href = `articles.html?category=${category}`; $id('recommendation').replaceChildren(el('p', '', `Start with ${t.title}. ${t.description}`), link); }); render(); }
// JavaScript validation replaces native HTML validation.
const rules = { name: v => !v.trim() ? 'Enter your name.' : v.trim().length < 2 ? 'Use at least 2 characters.' : '', email: v => !v.trim() ? 'Enter your email.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? 'Enter a valid email, e.g. learner@example.com.' : '', phone: v => !v.trim() ? 'Enter your phone number.' : !/^\+?[0-9][0-9\s()-]*$/.test(v.trim()) || v.replace(/\D/g, '').length < 10 || v.replace(/\D/g, '').length > 15 ? 'Use 10–15 digits, with an optional +, spaces or dashes.' : '', password: v => !v ? 'Enter a password.' : v.length < 8 || !/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/[0-9]/.test(v) || !/[!@#$%^&*()_+\-=\[\]{};:,.?]/.test(v) ? 'Use 8+ characters, upper/lowercase, a number and a symbol.' : '', message: v => !v.trim() ? 'Enter a message.' : v.trim().length < 10 ? 'Write at least 10 characters.' : '' };
function status(form, text, good = false) { const n = form.querySelector('.form-status'); n.textContent = text; n.className = 'form-status ' + (good ? 'good' : 'bad'); }
function error(form, name, message) { form.elements[name].setAttribute('aria-invalid', String(!!message)); $id(name + 'Error').textContent = message; }
function validate(form) {
    const data = Object.fromEntries(new FormData(form)); let valid = true, first = null; Object.entries(data).forEach(([name, value]) => {
        const msg = name === 'confirm' ? (!value ? 'Repeat your password.' : value !== data.password ? 'Passwords do not match.' : '') : rules[name]?.(value) || ''; error(form, name, msg); if (msg) {
            valid = false;
            first ??= form.elements[name];
        }
    }); if (!valid) {
        status(form, 'Please correct the highlighted fields.');
        first?.focus();
    } return valid ? data : null;
}
// Salted SHA-256 digest stored locally, not a real authentication system.
async function passwordDigest(password, salt) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password)); return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join(''); }
function makeSalt() { return [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, '0')).join(''); }
function initForms() {
    const form = document.querySelector('form'); form.addEventListener('input', e => {
        if (e.target.name && $id(e.target.name + 'Error'))
            error(form, e.target.name, '');
    }); form.addEventListener('submit', async (e) => {
        e.preventDefault(); const d = validate(form); if (!d)
            return; const b = form.querySelector('button[type=submit]'), old = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="spinner" aria-hidden="true"></span> Please wait…'; const email = d.email.trim().toLowerCase(); try {
                if (form.id === 'signupForm') {
                    const users = read('users', []);
                    if (users.some(u => u.email === email)) {
                        error(form, 'email', 'An account already exists. Please log in.');
                        status(form, 'Choose another email or log in.');
                        return;
                    }
                    if (!crypto.subtle)
                        throw Error('secure context needed');
                    const salt = makeSalt(), passwordHash = await passwordDigest(d.password, salt);
                    write('users', [...users, { name: d.name.trim(), email, phone: d.phone.trim(), salt, passwordHash }]);
                    sessionStorage.setItem('nova.signupNotice', 'Account created. Log in with your test credentials.');
                    location.href = 'login.html';
                }
                else if (form.id === 'loginForm') {
                    const user = read('users', []).find(u => u.email === email);
                    if (!user || await passwordDigest(d.password, user.salt) !== user.passwordHash) {
                        error(form, 'password', 'Email or password is incorrect.');
                        status(form, 'Login failed. Check your demo credentials.');
                        return;
                    }
                    write('session', email);
                    location.href = 'profile.html';
                }
                else if (form.id === 'contactForm') {
                    await new Promise(resolve => setTimeout(resolve, 450));
                    write('messages', [...read('messages', []), { name: d.name.trim(), email, phone: d.phone.trim(), message: d.message.trim(), createdAt: new Date().toISOString() }]);
                    form.reset();
                    status(form, 'Your demo message was saved locally. Nothing was sent.', true);
                    toast('Demo message saved.');
                }
            }
        catch (err) {
            status(form, 'Could not complete this action. Open on localhost or HTTPS and allow browser storage.');
            console.warn(err);
        }
        finally {
            b.disabled = false;
            b.innerHTML = old;
        }
    }); if (form.id === 'loginForm') {
        const notice = sessionStorage.getItem('nova.signupNotice');
        if (notice) {
            status(form, notice, true);
            sessionStorage.removeItem('nova.signupNotice');
        }
    }
}
function initProfile() {
    const user = currentUser(); $id('profileGuest').hidden = !!user; $id('profileContent').hidden = !user; if (!user)
        return; $id('profileName').textContent = user.name; $id('avatar').textContent = user.name.charAt(0).toUpperCase(); $id('profileEmail').textContent = user.email; $id('profilePhone').textContent = user.phone; $id('completedCount').textContent = `${completed().length}/${topics.length}`; function render() { const list = topics.filter(t => saved().includes(t.id)); $id('savedCount').textContent = list.length; $id('savedTopics').replaceChildren(...(list.length ? list.map(t => topicCard(t, '', render)) : [el('p', 'empty', 'No saved topics yet. Open the library and select Save on an article.')])); } $id('logout').addEventListener('click', () => { localStorage.removeItem('nova.session'); location.href = 'login.html'; }); render();
}
// Public MediaWiki Action API; cancel outdated requests and label offline results honestly.
function initApi() {
    let active; const input = $id('apiQuery'), result = $id('apiResults'), state = $id('apiStatus'); function display(items) { result.replaceChildren(...items.map(i => { const card = el('article', 'api-result'); card.append(el('span', 'tag', i.source), el('h3', '', i.title), el('p', '', i.description), externalLink(i.url, 'Read article ↗')); return card; })); } function fallback(q) {
        const cache = read('apiCache', {})[q.toLowerCase()]; if (cache?.length) {
            display(cache.map(x => ({ ...x, source: 'CACHED WIKIPEDIA' })));
            state.textContent = 'API unavailable. Showing previously cached Wikipedia results.';
        }
        else {
            const m = topics.filter(t => (t.title + ' ' + t.description).toLowerCase().includes(q.toLowerCase()));
            display((m.length ? m : topics.slice(0, 3)).map(t => ({ title: t.title, description: t.description, url: t.url, source: 'CURATED FALLBACK' })));
            state.textContent = 'Unable to reach Wikipedia. Showing curated offline references instead. Try Refresh when connected.';
        }
    } async function search() {
        const q = input.value.trim(); active?.abort(); active = null; if (!q) {
            result.replaceChildren();
            state.textContent = 'Enter a topic to search.';
            return;
        } const controller = new AbortController(); active = controller; result.replaceChildren(); state.replaceChildren(el('span', 'spinner'), document.createTextNode(' Loading articles from Wikipedia…')); const timer = setTimeout(() => controller.abort(), 8000); try {
            const params = new URLSearchParams({ action: 'query', list: 'search', srsearch: q, srlimit: '6', format: 'json', origin: '*', utf8: '1' });
            const response = await fetch('https://en.wikipedia.org/w/api.php?' + params, { signal: controller.signal });
            if (!response.ok)
                throw Error('HTTP ' + response.status);
            const json = await response.json();
            if (!Array.isArray(json.query?.search))
                throw Error('Invalid response');
            if (active !== controller)
                return;
            const items = json.query.search.map(i => ({ title: i.title, description: new DOMParser().parseFromString(i.snippet, 'text/html').body.textContent, url: 'https://en.wikipedia.org/?curid=' + encodeURIComponent(i.pageid), source: 'LIVE · WIKIPEDIA' }));
            if (!items.length) {
                state.textContent = 'No results. Try a different topic.';
                return;
            }
            display(items);
            state.textContent = `${items.length} live results from Wikipedia.`;
            const cache = read('apiCache', {});
            cache[q.toLowerCase()] = items;
            try {
                write('apiCache', cache);
            }
            catch { /* optional cache */ }
        }
        catch (err) {
            if (active === controller)
                fallback(q);
        }
        finally {
            clearTimeout(timer);
        }
    } $id('apiSearch').addEventListener('click', search); $id('refreshApi').addEventListener('click', search); input.addEventListener('keydown', e => {
        if (e.key === 'Enter')
            search();
    }); document.querySelectorAll('.api-topic').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.query; search(); })); search();
}
initShared();
const page = document.body.dataset.page;
if (page === 'articles')
    initLibrary();
if (page === 'roadmap')
    initRoadmap();
if (page === 'resources')
    initApi();
if (['signup', 'login', 'contact'].includes(page))
    initForms();
if (page === 'profile')
    initProfile();
