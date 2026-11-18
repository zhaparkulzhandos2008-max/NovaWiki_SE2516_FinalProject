# NovaWiki — Web Technologies Final Project
Team: Alikhan, Zhandos, Adilzhan | SE-2516 | Astana IT University

Nine-page responsive learning encyclopedia based on Assignment 6. HTML, CSS, JavaScript and bundled jQuery 3.7.1 slim. No backend, build tools or API key.

Run using VS Code Live Server or `python -m http.server 8000` in this folder, then open http://localhost:8000/. HTTPS and localhost support Web Crypto and Clipboard APIs. Use fictional data and test passwords only. Demo account data and salted password digests are stored locally; this is not production authentication.

Pages: Home, Library, Roadmap, Live resources, About, Contact, Sign up, Log in, Profile. The last three are linked through account actions. Theme, saved topics and progress persist. Wikipedia MediaWiki API provides live search with timeout and clearly labeled cached/curated fallback. Contact messages are saved locally, never sent.

Demo credentials (create account first): Demo Learner, demo@example.com, +7 700 123 4567, NovaDemo1!.

Deploy: copy the contents of this folder into the repository root (index.html must be at the root), commit and push. GitHub Settings > Pages > Deploy from a branch > main / (root) > Save. Verify the resulting Pages URL and all features. This package has not been deployed.
