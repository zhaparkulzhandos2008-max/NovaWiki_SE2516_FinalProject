/* Apply the saved theme before the stylesheet is rendered. */
try { document.documentElement.dataset.theme = localStorage.getItem('nova.theme') === 'dark' ? 'dark' : 'light'; } catch { document.documentElement.dataset.theme = 'light'; }
