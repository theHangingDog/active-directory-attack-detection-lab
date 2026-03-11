/* ============================================================
   AD Attack & Detection Lab — Navigation & Search JS
   ============================================================ */

(function () {
  'use strict';

  /* ── State ── */
  var manifest = null;
  var flatPages = [];       // ordered flat list for prev/next
  var currentFile = null;

  /* ── Category metadata ── */
  var CATEGORIES = {
    '01-Attacks': {
      icon: '⚔️',
      badgeClass: 'badge-attacks',
      badgeText: 'Attack',
      sectionIcon: '⚔️'
    },
    '02-Detections': {
      icon: '🛡️',
      badgeClass: 'badge-detections',
      badgeText: 'Detect',
      sectionIcon: '🛡️'
    },
    '04-Sigma_Rules(Mandetory)': {
      icon: '📋',
      badgeClass: 'badge-sigma',
      badgeText: 'Sigma',
      sectionIcon: '📋'
    },
    '05- Links_From_Which_I_Study': {
      icon: '🔗',
      badgeClass: 'badge-links',
      badgeText: 'Links',
      sectionIcon: '🔗'
    }
  };

  /* ── Pretty labels ── */
  function prettyTitle(raw) {
    return raw
      .replace(/^\d{2}-/, '')
      .replace(/_/g, ' ')
      .replace(/\(Mandetory\)/i, '(Mandatory)')
      .replace(/^M(\d+)-/, 'M$1 – ')
      .trim();
  }

  /* ── Flatten nav tree (depth-first, skipping parent section nodes if desired) ── */
  function flatten(nodes, parentPath) {
    if (!nodes) return;
    parentPath = parentPath || [];
    nodes.forEach(function (node) {
      var path = parentPath.concat(node.title);
      if (node.file) {
        flatPages.push({ title: node.title, file: node.file, path: path });
      }
      if (node.children) flatten(node.children, path);
    });
  }

  /* ── DOM helpers ── */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function qs(sel) { return document.querySelector(sel); }

  /* ── Build sidebar nav ── */
  function buildSidebar(nodes) {
    var tree = qs('#nav-tree');
    tree.innerHTML = '';

    nodes.forEach(function (section) {
      var key = section.title;
      var cat = CATEGORIES[key] || { icon: '📄', badgeClass: 'badge-links', badgeText: '', sectionIcon: '📄' };
      var pretty = prettyTitle(key);

      /* Section wrapper */
      var secDiv = el('div', 'nav-section');
      secDiv.setAttribute('data-section', key);

      /* Header */
      var header = el('div', 'nav-section-header');
      header.innerHTML =
        '<span class="nav-section-icon">' + cat.sectionIcon + '</span>' +
        '<span>' + pretty + '</span>' +
        (cat.badgeText ? '<span class="nav-section-badge ' + cat.badgeClass + '">' + cat.badgeText + '</span>' : '') +
        '<span class="nav-chevron">▼</span>';
      header.setAttribute('data-file', section.file || '');

      /* Body */
      var body = el('div', 'nav-section-body');

      if (section.children) {
        buildNavItems(section.children, body, 1, key);
      }

      /* Toggle section */
      header.addEventListener('click', function (e) {
        var chevron = header.querySelector('.nav-chevron');
        var isCollapsed = header.classList.contains('collapsed');
        header.classList.toggle('collapsed', !isCollapsed);
        body.classList.toggle('hidden', !isCollapsed);
      });

      /* Click on header title area loads the section page */
      header.addEventListener('click', function (e) {
        var file = header.getAttribute('data-file');
        if (file) loadPage(file);
      });

      secDiv.appendChild(header);
      secDiv.appendChild(body);
      tree.appendChild(secDiv);
    });
  }

  function buildNavItems(nodes, container, depth, sectionKey) {
    if (!nodes) return;
    nodes.forEach(function (node) {
      var hasChildren = node.children && node.children.length > 0;
      var item = el('div', 'nav-item nav-depth-' + depth);
      item.setAttribute('data-file', node.file || '');

      /* Icon */
      var icon = hasChildren ? '📁' : '📄';
      if (sectionKey === '01-Attacks' && !hasChildren) icon = '⚡';
      if (sectionKey === '02-Detections' && !hasChildren) icon = '🔍';
      if (sectionKey && sectionKey.indexOf('Sigma') !== -1) icon = '📋';
      if (sectionKey && sectionKey.indexOf('Links') !== -1) icon = '🔗';

      item.innerHTML =
        '<span class="nav-item-icon">' + icon + '</span>' +
        '<span class="nav-item-label">' + node.title + '</span>' +
        (hasChildren ? '<span class="nav-item-chevron">▼</span>' : '');

      if (hasChildren) {
        /* Children container */
        var childDiv = el('div', 'nav-children');

        item.addEventListener('click', function (e) {
          var isCollapsed = item.classList.contains('collapsed');
          item.classList.toggle('collapsed', !isCollapsed);
          childDiv.classList.toggle('hidden', !isCollapsed);
          if (node.file) loadPage(node.file);
          e.stopPropagation();
        });

        buildNavItems(node.children, childDiv, depth + 1, sectionKey);
        container.appendChild(item);
        container.appendChild(childDiv);
      } else {
        item.addEventListener('click', function () {
          if (node.file) loadPage(node.file);
        });
        container.appendChild(item);
      }
    });
  }

  /* ── Load page content via fetch ── */
  function loadPage(file) {
    if (!file) return;
    currentFile = file;

    /* Update URL hash (for bookmarking) */
    history.replaceState(null, '', '#' + file);

    /* Highlight active nav item */
    setActiveNav(file);

    /* Update breadcrumbs */
    updateBreadcrumbs(file);

    /* Show content area, hide home */
    qs('#home-screen').style.display = 'none';
    qs('#page-content').classList.add('visible');
    qs('#loading').style.display = 'block';
    qs('#page-content').style.display = 'none';

    fetch(file)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        /* Extract body content */
        var bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        var rawContent = bodyMatch ? bodyMatch[1] : html;

        /* Remove any existing script tags from loaded content */
        rawContent = rawContent.replace(/<script[\s\S]*?<\/script>/gi, '');

        /* Inject into doc-content */
        var docDiv = qs('#doc-content');
        docDiv.innerHTML = rawContent;

        /* Apply doc-content styles: wrap .page divs */
        var pages = docDiv.querySelectorAll('div.page, div[class~="page"]');
        pages.forEach(function (p) {
          p.classList.add('doc-content');
        });
        if (!pages.length) {
          docDiv.classList.add('doc-content');
        }

        /* Fix local file:/// hrefs in links (from CherryTree export) */
        docDiv.querySelectorAll('a[href^="file:///"]').forEach(function (a) {
          a.removeAttribute('href');
          a.style.cursor = 'default';
          a.style.color = 'inherit';
        });

        /* Update prev/next */
        updatePageNav(file);

        qs('#loading').style.display = 'none';
        qs('#page-content').style.display = 'block';

        /* Scroll to top */
        qs('#content-scroll').scrollTop = 0;
      })
      .catch(function (err) {
        qs('#loading').style.display = 'none';
        var docDiv = qs('#doc-content');
        docDiv.className = 'doc-content';
        docDiv.innerHTML =
          '<div style="padding:40px;text-align:center;color:#8b949e">' +
          '<p style="font-size:2rem;margin-bottom:8px">⚠️</p>' +
          '<p>Could not load page: <code>' + file + '</code></p>' +
          '<p style="font-size:0.8rem;margin-top:8px">Error: ' + err.message + '</p>' +
          '</div>';
        qs('#page-content').style.display = 'block';
      });
  }

  /* ── Highlight active nav item ── */
  function setActiveNav(file) {
    document.querySelectorAll('.nav-item.active').forEach(function (el) {
      el.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(function (item) {
      if (item.getAttribute('data-file') === file) {
        item.classList.add('active');
        /* Expand all ancestors */
        var parent = item.parentElement;
        while (parent) {
          if (parent.classList.contains('nav-children')) {
            parent.classList.remove('hidden');
            /* un-collapse the sibling .nav-item above */
            var prev = parent.previousElementSibling;
            if (prev && prev.classList.contains('nav-item')) {
              prev.classList.remove('collapsed');
            }
          }
          if (parent.classList.contains('nav-section-body')) {
            parent.classList.remove('hidden');
            var h = parent.previousElementSibling;
            if (h) h.classList.remove('collapsed');
          }
          parent = parent.parentElement;
        }
        /* Scroll item into view in sidebar */
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  /* ── Breadcrumbs ── */
  function updateBreadcrumbs(file) {
    var bc = qs('#breadcrumbs');
    bc.innerHTML = '';

    /* Find path in flatPages */
    var found = null;
    flatPages.forEach(function (p) { if (p.file === file) found = p; });

    var parts = found ? found.path : [file];

    /* Home */
    var homeEl = el('span', 'breadcrumb-item');
    homeEl.innerHTML = '🏠 Home';
    homeEl.addEventListener('click', showHome);
    bc.appendChild(homeEl);

    parts.forEach(function (part, i) {
      var sep = el('span', 'breadcrumb-sep', '›');
      bc.appendChild(sep);
      var crumb = el('span', 'breadcrumb-item' + (i === parts.length - 1 ? ' current' : ''));
      crumb.textContent = part;
      if (i < parts.length - 1 && found) {
        /* Find that node's file */
        var nodeFile = findFileForTitle(part, manifest.nav);
        if (nodeFile) {
          crumb.addEventListener('click', loadPage.bind(null, nodeFile));
        }
      }
      bc.appendChild(crumb);
    });
  }

  function findFileForTitle(title, nodes) {
    if (!nodes) return null;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].title === title) return nodes[i].file;
      var r = findFileForTitle(title, nodes[i].children);
      if (r) return r;
    }
    return null;
  }

  /* ── Prev / Next navigation ── */
  function updatePageNav(file) {
    var idx = -1;
    flatPages.forEach(function (p, i) { if (p.file === file) idx = i; });

    var prevBtn = qs('#prev-btn');
    var nextBtn = qs('#next-btn');

    if (idx > 0) {
      var prev = flatPages[idx - 1];
      prevBtn.style.display = 'flex';
      prevBtn.querySelector('.nav-title').textContent = prev.title;
      prevBtn.onclick = function () { loadPage(prev.file); };
    } else {
      prevBtn.style.display = 'none';
    }

    if (idx >= 0 && idx < flatPages.length - 1) {
      var next = flatPages[idx + 1];
      nextBtn.style.display = 'flex';
      nextBtn.querySelector('.nav-title').textContent = next.title;
      nextBtn.onclick = function () { loadPage(next.file); };
    } else {
      nextBtn.style.display = 'none';
    }
  }

  /* ── Show home ── */
  function showHome() {
    currentFile = null;
    history.replaceState(null, '', window.location.pathname);
    qs('#home-screen').style.display = 'block';
    qs('#page-content').classList.remove('visible');
    qs('#page-content').style.display = 'none';
    qs('#loading').style.display = 'none';
    qs('#breadcrumbs').innerHTML = '<span class="breadcrumb-item current">🏠 Home</span>';
    document.querySelectorAll('.nav-item.active').forEach(function (el) {
      el.classList.remove('active');
    });
  }

  /* ── Sidebar search / filter ── */
  function initSidebarSearch() {
    var input = qs('#sidebar-search');
    if (!input) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      filterSidebar(q);
    });
  }

  function filterSidebar(q) {
    if (!q) {
      /* Reset — show everything */
      document.querySelectorAll('.nav-item, .nav-section').forEach(function (el) {
        el.classList.remove('hidden');
      });
      document.querySelectorAll('.nav-no-results').forEach(function (el) {
        el.remove();
      });
      return;
    }

    /* Check each nav-item against query */
    document.querySelectorAll('.nav-item').forEach(function (item) {
      var label = (item.querySelector('.nav-item-label') || item).textContent.toLowerCase();
      var match = label.indexOf(q) !== -1;
      item.classList.toggle('hidden', !match);
      /* If matches, ensure parents visible */
      if (match) {
        var p = item.parentElement;
        while (p) {
          if (p.classList.contains('nav-children') || p.classList.contains('nav-section-body')) {
            p.classList.remove('hidden');
            var prev = p.previousElementSibling;
            if (prev) { prev.classList.remove('hidden'); prev.classList.remove('collapsed'); }
          }
          if (p.classList.contains('nav-section')) {
            p.classList.remove('hidden');
          }
          p = p.parentElement;
        }
      }
    });
  }

  /* ── Header search (results overlay) ── */
  function initHeaderSearch() {
    var wrap = qs('#header-search');
    if (!wrap) return;
    var input = wrap.querySelector('input');
    var results = qs('#search-results');

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (!q) { results.classList.remove('open'); return; }
      var hits = flatPages.filter(function (p) {
        return p.title.toLowerCase().indexOf(q) !== -1 ||
               p.path.join(' ').toLowerCase().indexOf(q) !== -1;
      }).slice(0, 12);

      if (!hits.length) {
        results.innerHTML = '<div class="search-no-results">No results for "' + input.value + '"</div>';
      } else {
        results.innerHTML = hits.map(function (p) {
          var pathStr = p.path.slice(0, -1).map(prettyTitle).join(' › ');
          return '<div class="search-result-item" data-file="' + p.file + '">' +
                 '<span class="search-result-title">' + p.title + '</span>' +
                 (pathStr ? '<span class="search-result-path">' + pathStr + '</span>' : '') +
                 '</div>';
        }).join('');
        results.querySelectorAll('.search-result-item').forEach(function (item) {
          item.addEventListener('click', function () {
            loadPage(item.getAttribute('data-file'));
            input.value = '';
            results.classList.remove('open');
          });
        });
      }
      results.classList.add('open');
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target) && e.target !== results) {
        results.classList.remove('open');
      }
    });
  }

  /* ── Home card clicks ── */
  function initHomeCards() {
    document.querySelectorAll('.home-card[data-section]').forEach(function (card) {
      card.addEventListener('click', function () {
        var sectionKey = card.getAttribute('data-section');
        /* Find the section file */
        var sectionNode = manifest.nav.find(function (n) { return n.title === sectionKey; });
        if (sectionNode && sectionNode.file) loadPage(sectionNode.file);
        /* Expand the section in sidebar */
        var secEl = document.querySelector('.nav-section[data-section="' + sectionKey + '"]');
        if (secEl) {
          var header = secEl.querySelector('.nav-section-header');
          var body = secEl.querySelector('.nav-section-body');
          if (header && body) {
            header.classList.remove('collapsed');
            body.classList.remove('hidden');
          }
        }
      });
    });
  }

  /* ── Mobile sidebar toggle ── */
  function initMobileMenu() {
    var btn = qs('#menu-toggle');
    var sidebar = qs('#sidebar');
    var overlay = qs('#sidebar-overlay');
    if (!btn || !sidebar) return;

    btn.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });

    if (overlay) {
      overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }
  }

  /* ── Logo / home link ── */
  function initHomeLink() {
    var logo = qs('.site-logo');
    if (logo) logo.addEventListener('click', function (e) { e.preventDefault(); showHome(); });
    var homeLink = qs('#home-link');
    if (homeLink) homeLink.addEventListener('click', function (e) { e.preventDefault(); showHome(); });
  }

  /* ── Init ── */
  function init(data) {
    manifest = data;

    /* Flatten for prev/next */
    flatten(manifest.nav, []);

    /* Build sidebar */
    buildSidebar(manifest.nav);

    /* Init features */
    initSidebarSearch();
    initHeaderSearch();
    initHomeCards();
    initMobileMenu();
    initHomeLink();

    /* Handle hash-based navigation */
    var hash = window.location.hash.replace('#', '');
    if (hash) {
      loadPage(decodeURIComponent(hash));
    } else {
      showHome();
    }
  }

  /* ── Bootstrap: fetch manifest then init ── */
  fetch('manifest.json')
    .then(function (r) { return r.json(); })
    .then(function (data) { init(data); })
    .catch(function (err) {
      console.error('Failed to load manifest.json', err);
      qs('#nav-tree').innerHTML =
        '<div class="nav-no-results">Navigation unavailable.<br>Make sure manifest.json exists.</div>';
    });

})();
