/* Matt Lohier — portfolio behaviour
   Progressive enhancement only: every bit of content is in the HTML and
   visible without JavaScript. This file adds filtering, the private-project
   overlay, click-to-copy and the resume interstitial. */

(function () {
	'use strict';

	var SCROLL_OFFSET = 120;

	/* ---------------------------------------------------------------
	   Resume interstitial
	   --------------------------------------------------------------- */

	function showPopupAndRedirect(url) {
		var overlay = document.getElementById('popup-overlay');
		if (!overlay) { window.location.href = url; return; }

		var message = document.getElementById('popup-message');
		overlay.style.display = 'flex';

		window.setTimeout(function () {
			if (message) message.style.borderColor = 'var(--tag-ux)';
			window.setTimeout(function () {
				overlay.style.display = 'none';
				window.location.href = url;
			}, 700);
		}, 1100);
	}

	// The resume link is a real href, so it works with JS disabled. When JS is
	// available we intercept it to fire the analytics event and show the
	// interstitial before navigating.
	function initResumeLink() {
		var link = document.getElementById('resume-link');
		if (!link) return;

		link.addEventListener('click', function (e) {
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
			e.preventDefault();

			if (typeof window.gtag === 'function') {
				window.gtag('event', 'Resume Click', {
					event_category: 'Button',
					event_label: 'Resume Download'
				});
			}
			showPopupAndRedirect(link.getAttribute('href'));
		});
	}

	/* ---------------------------------------------------------------
	   Smooth in-page scrolling with a header offset
	   --------------------------------------------------------------- */

	function initSmoothScroll() {
		document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
			anchor.addEventListener('click', function (e) {
				var target = this.getAttribute('href');
				if (target === '#') {
					e.preventDefault();
					window.scrollTo({ top: 0, behavior: 'smooth' });
					return;
				}
				var el;
				try { el = document.querySelector(target); } catch (err) { return; }
				if (!el) return;

				e.preventDefault();
				var top = el.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
				window.scrollTo({ top: top, behavior: 'smooth' });
			});
		});
	}

	/* ---------------------------------------------------------------
	   Tag filtering
	   --------------------------------------------------------------- */

	function showFilterPopup(color) {
		var popup = document.getElementById('filter-popup');
		var text = document.getElementById('filter-popup-text');
		if (!popup) return;
		if (text && color) text.style.color = color;
		popup.classList.add('visible');
		window.setTimeout(function () { popup.classList.remove('visible'); }, 800);
	}

	function cardMatches(card, lowerType) {
		var dataType = (card.getAttribute('data-type') || '').toLowerCase();
		if (dataType && dataType.indexOf(lowerType) !== -1) return true;

		var labels = card.querySelectorAll('p.tag, b');
		for (var i = 0; i < labels.length; i++) {
			if (labels[i].textContent.toLowerCase().indexOf(lowerType) !== -1) return true;
		}
		return false;
	}

	function filterProjects(type, color) {
		var lowerType = (type || 'all').toLowerCase();
		var showAll = lowerType === 'all';

		document.querySelectorAll('section.tiles article').forEach(function (tile) {
			var tileType = (tile.getAttribute('data-type') || '').toLowerCase();
			var visible = showAll || tileType.indexOf(lowerType) !== -1;
			tile.hidden = !visible;
			tile.style.display = visible ? '' : 'none';
		});

		document.querySelectorAll('.container.articles-container').forEach(function (container) {
			var anyVisible = false;
			container.querySelectorAll('.card').forEach(function (card) {
				var visible = showAll || cardMatches(card, lowerType);
				card.style.display = visible ? '' : 'none';
				if (visible) anyVisible = true;
			});
			container.style.display = anyVisible ? '' : 'none';
		});

		// A tiles section whose every tile is filtered out should collapse too.
		document.querySelectorAll('section.tiles').forEach(function (section) {
			var anyVisible = Array.prototype.some.call(
				section.querySelectorAll('article'),
				function (t) { return t.style.display !== 'none'; }
			);
			section.style.display = anyVisible ? '' : 'none';
		});

		document.querySelectorAll('.filter-bar p').forEach(function (button) {
			var isActive = (button.getAttribute('data-type') || '').toLowerCase() === lowerType;
			button.classList.toggle('active', isActive);
			button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
		});

		showFilterPopup(color);
	}

	function initFilters() {
		document.querySelectorAll('.filter-bar p').forEach(function (button) {
			button.setAttribute('role', 'button');
			button.setAttribute('tabindex', '0');
			button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');

			function activate() {
				filterProjects(
					button.getAttribute('data-type'),
					window.getComputedStyle(button).color
				);
			}

			button.addEventListener('click', activate);
			button.addEventListener('keydown', function (e) {
				if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
			});
		});
	}

	/* ---------------------------------------------------------------
	   Private projects
	   --------------------------------------------------------------- */

	function initPrivateProjects() {
		document.querySelectorAll('a.private-project').forEach(function (link) {
			link.addEventListener('click', function (e) {
				e.preventDefault();

				var article = this.closest('article');
				var imageContainer = article ? article.querySelector('.image') : null;
				if (!imageContainer) return;

				if (imageContainer.querySelector('.private-overlay-image')) return;

				var link = this;
				var overlay = document.createElement('div');
				overlay.className = 'private-overlay-image';
				overlay.innerHTML =
					'<span class="first-line">Private project 🔒</span>' +
					'<span class="second-line">Reach out and I\'ll walk you through it</span>';
				imageContainer.appendChild(overlay);

				// Fade the tile's own title and tag out first. Without this the
				// notice lands on top of them and the two sets of text collide.
				link.classList.add('is-revealing');

				requestAnimationFrame(function () { overlay.classList.add('is-visible'); });

				window.setTimeout(function () {
					overlay.classList.remove('is-visible');
					link.classList.remove('is-revealing');
					window.setTimeout(function () { overlay.remove(); }, 450);
				}, 2400);
			});
		});
	}

	/* ---------------------------------------------------------------
	   Click to copy
	   --------------------------------------------------------------- */

	function showCopiedToast(target, label) {
		var toast = document.createElement('div');
		toast.className = 'copy-toast';
		toast.setAttribute('role', 'status');
		toast.textContent = label;
		document.body.appendChild(toast);

		var rect = target.getBoundingClientRect();
		toast.style.top = (rect.top + window.pageYOffset - 44) + 'px';
		toast.style.left = (rect.left + window.pageXOffset) + 'px';

		requestAnimationFrame(function () { toast.classList.add('is-visible'); });

		window.setTimeout(function () {
			toast.classList.remove('is-visible');
			window.setTimeout(function () { toast.remove(); }, 300);
		}, 1800);
	}

	function initCopyTargets() {
		document.querySelectorAll('[data-copy]').forEach(function (el) {
			el.addEventListener('click', function (e) {
				e.preventDefault();
				var value = el.getAttribute('data-copy');

				var done = function () { showCopiedToast(el, 'Copied to clipboard'); };
				var failed = function () { showCopiedToast(el, value); };

				if (navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(value).then(done).catch(failed);
				} else {
					failed();
				}
			});
		});
	}

	/* ---------------------------------------------------------------
	   Boot
	   --------------------------------------------------------------- */

	function init() {
		initResumeLink();
		initSmoothScroll();
		initFilters();
		initPrivateProjects();
		initCopyTargets();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
