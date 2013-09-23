var Crimson = Crimson || {};

Crimson.Interstitials = (function($) {
	var GLOBAL_INTERVAL = 2;  // Number of Page Views required to trigger an interstitial
	var COOKIE_NAME = 'crimson.interstitials';
	var COOKIE_OPTIONS = { expires: 20 * 365, path: '/' };

	var MODAL_SELECTOR = '#modal';
	var CONTENT_SELECTOR = '#interstitial';

	var globalElapsed = 1;
	var interstitials = {};
	var $modal;
	var $content;

	var create = function(name, options) {
		var defaults = {
			url: '', // URL for the interstitial code
			excludeUrls: [], // URLs where the interstitial won't be DISPLAYED. These URLs still count for Page Views
			interval: 3, // Number of days between interstitial showings
			delay: 0, // Time delay (in ms) between page load and intersitial display
			autorun: true, // Puts interstitial in queue to be automatically displayed
			lastShown: new Date(0) // Last time this interstitial was displayed
		};
		options = $.extend(defaults, options);

		if (name === '')
			throw new Error('Crimson.Interstitial.create(): ' +
				'must provide unique name for interstitial');
		if (name in interstitials) 
			throw new Error('Crimson.Interstitial.create(): ' + 
				'interstitial with this name already exists');
		if (options.url === '')
			throw new Error('Crimson.Interstitial.create(): ' + 
				'must specify url for interstitial');

		interstitials[name] = options;
		return options;
	};

	var show = function(name) {
		if ($(window).width() > 640) {
			interstitials[name].lastShown = new Date();
			$content.load(interstitials[name].url, function() {
				$(document.body).addClass('modal-open');
				$modal.fadeIn(400);
				setTimeout(function() {
					$content.slideDown(300);
				}, 265);
			});
			_writeCookie();
		}
	};

	var hide = function() {
		$content.slideUp(300);
		setTimeout(function() {
			$modal.fadeOut(400);
		}, 200);
		$(document.body).removeClass('modal-open');
		Crimson.Interstitials.onHide();
	};

	var reset = function() {
		$.removeCookie(COOKIE_NAME, COOKIE_OPTIONS);
	}

	var _loadElements = function() {
		$modal = $(MODAL_SELECTOR);
		$content = $(CONTENT_SELECTOR);
	}

	var _writeCookie = function() {
		var data = {
			lastVisited: Date.now(),
			globalElapsed: (++globalElapsed % GLOBAL_INTERVAL),
			interstitials: {}
		};
		$.each(interstitials, function(name, options) {
			data.interstitials[name] = options.lastShown.getTime();
		});
		$.cookie(COOKIE_NAME, data, COOKIE_OPTIONS);
	};

	var _readCookie = function() {
		var cookie = $.cookie(COOKIE_NAME);
		if (cookie) {
			lastVisited = new Date(cookie.lastVisited);
			if (lastVisited.getDate() == (new Date()).getDate()) {
				globalElapsed = cookie.globalElapsed;
			}
			$.each(cookie.interstitials, function(name, date) {
				try {
					interstitials[name].lastShown = new Date(date);
				}
				catch (TypeError) {}
			});
		}
	};

	var _listenForClose = function() {
		$content.on('click', '.interstitial-close', hide);
		$content.on('click', function(e) { e.stopPropagation() });
	};

	var _findAndShow = function () {
		if (globalElapsed != 0) return;

		$.each(interstitials, function(name, options) {
			if ($.inArray(window.location.pathname, options.excludeUrls) == -1) {
				var elapsed = Date.now() - options.lastShown;
				if (elapsed > 1000 * 60 * 60 * 24 * options.interval && options.autorun) {
					setTimeout(function() { show(name); }, options.delay);
					return false; // Makes it so one PV only has one interstitial!
								  //   Only the first interstitial is put in queue, the rest are ignored
								  //   and will be shown after the next PV cycle -- assuming this interstitial
								  //   is shown so next time this code won't be reached for that interstitial
				}
			}
		});
	};

	var onHide = function() {}

	$(document).ready(function() {
		$.cookie.json = true;
		_loadElements();
		_readCookie();
		_findAndShow();
		_writeCookie();
		_listenForClose();
	});

	return {
		reset: reset,
		create: create,
		show: show,
		hide: hide,
		onHide: onHide
	};
}(jQuery));