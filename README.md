# Active Directory Attack & Detection Lab

Hands-on lab documentation covering 50+ Active Directory attack techniques paired with
detection strategies, Sigma rules, and curated study resources.

[![GitHub Pages](https://img.shields.io/badge/Live%20Docs-GitHub%20Pages-blue?logo=github)](https://theHangingDog.github.io/active-directory-attack-detection-lab/)

---

## 📖 Topics Covered

| Module | Contents |
|--------|----------|
| ⚔️ **Attacks** | LLMNR/NBT-NS Poisoning, DACL Abuse (GenericAll/Write/WriteDACL/WriteOwner), AS-REP Roasting, Kerberoasting, Unconstrained/Constrained Delegation, RBCD, DCSync, NTDS.DIT, SAM Hive, Golden/Silver/Diamond/Sapphire Tickets, ReadGMSAPassword … |
| 🛡️ **Detections** | Event log analysis and detection logic for every attack above |
| 📋 **Sigma Rules** | Deployable Sigma detection rules (SMB Enumeration and more) |
| 🔗 **Study Links** | Curated external references per module |

---

## 🚀 Deploy to GitHub Pages

The documentation site is a **pure static site** — no build tools required.

### Option A — Quick Deploy

1. Fork or clone this repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment** set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Click **Save**.

GitHub will publish your site at:
```
https://<your-username>.github.io/active-directory-attack-detection-lab/
```

### Option B — Custom Domain

1. Add a `CNAME` file to the repo root containing your domain name.
2. Configure your DNS as instructed by GitHub.

> **Tip:** Add a `.nojekyll` file to the repo root if any folder names start with `_`.

---

## 🗂️ File Structure

```
/
├─ index.html             ← Main SPA shell & landing page
├─ manifest.json          ← Navigation tree (auto-generated from original export)
├─ README.md
├─ res/
│  ├─ docs.css            ← Documentation theme CSS
│  ├─ docs.js             ← Sidebar navigation, search, prev/next JS
│  └─ styles4.css         ← Legacy CherryTree CSS (used by content pages)
├─ images/                ← Screenshot images referenced by content pages
└─ Active_Directory-*.html  ← ~100 lab content pages (CherryTree export)
```

### How it works

`index.html` is a single-page application shell that:

1. Fetches `manifest.json` to build the left-sidebar navigation tree.
2. On page selection, uses `fetch()` to load the target `.html` file, extracts
   its `<body>` content, and injects it into the main area — no `<iframe>` needed.
3. Updates the URL hash (`#filename.html`) so pages are bookmarkable/shareable.
4. Provides client-side search across all page titles via the top search bar and
   sidebar filter.

### Updating the manifest

If you add new HTML pages, update `manifest.json` manually (it is a simple JSON
tree) or re-run the extraction script:

```bash
python3 -c "
import re, json

with open('index_original.html') as f:
    html = f.read()

# ... (see scripts/ for full extractor)
"
```

---

## 🛠️ Local Development

Because the site uses `fetch()`, you need a local HTTP server (browsers block
`fetch` on `file://` URLs):

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

Then open <http://localhost:8080>.

---

## ⚠️ Legal & Ethical Disclaimer

All content in this repository is intended **solely for authorized lab environments
and educational purposes**. Do not use any of these techniques on systems you do not
own or have explicit written permission to test. The author assumes no liability for
misuse.

---

## 📄 License

Personal educational use. All rights reserved by the author.
