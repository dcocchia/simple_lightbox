;(function(window) {
	var defaults = {
		container: 'body',
		scrollSpeed: 600,
		startingSlide: 1,
		themeClass: 'default',
		showDots: true,
		showOverlay: true,
		overlayOpacity: 85,
		overlayColor: "#000",
		closeOnOverlayClick: true,
		photoService: "",
		photoServiceApiKey: "",
		renderOnInit: true,
		requestImagesOnInit: true
	};

	var services = {
		flickr: {
			getUrl: function(options) {
				var config = {};
				var i = 0;
				var url = "https://api.flickr.com/services/rest/";
				var flickDefaults = {
					method: "flickr.interestingness.getList",
					format: "json",
					primary_photo_extras: "url_o",
					nojsoncallback: 1,
					api_key: "",
					per_page: 20
				}

				if (!options.api_key) {
					this._throwError("flickr calls require an api_key");
					return;
				} 

				for (var attr in flickDefaults) {
					if (flickDefaults.hasOwnProperty(attr)) {
						if (options[attr] !== undefined) {
							config[attr] = options[attr];
						} else {
							config[attr] = flickDefaults[attr];
						}

						if (i > 0) {
							url += "&" + attr + "=" + config[attr];
						} else {
							url += "?" + attr + "=" + config[attr];
						}
					}

					i++;
				}

				return url;

			},

			constructImageUrl: function(imgObj) {
				return "https://farm" + imgObj.farm + 
						".staticflickr.com/" + imgObj.server + "/" + 
						imgObj.id + "_" + imgObj.secret + "_b.jpg";
			},

			dataHierarchy: ["photos", "photo"],
			imageHierarchy: ["id"],
			titleHierarchy: ["title"]
		},

		instagram: {
			getUrl: function(clientId, accessToken) {
				if (!accessToken) {
					return "https://api.instagram.com/v1/media/popular?client_id=" + clientId;
				} else {
					return "https://api.instagram.com/v1/media/popular?client_id=" + clientId 
							+ "&access_token=" + access_token;
				}
				
			},

			constructImageUrl: function(imgObj) {
				return imgObj.images.standard_resolution;
			},

			dataHierarchy: ["data"],
			imageHierarchy: ["images", "standard_resolution"],
			titleHierarchy: ["caption", "text"]
		},

		traverseHierarchy: function(obj, hierarchy) {
			var currentObj = obj;

			for (var i = 0; i < hierarchy.length; i++) {
				currentObj = currentObj[hierarchy[i]];
			}

			return currentObj;
		}
	}

	var SimpleLightBox = function(options) {
		options || (options = {});
		this.config = {};
		this._events = {};
		this.imageSet = [];
		this.elms = {};

		for (var attr in defaults) {
			if (defaults.hasOwnProperty(attr)) {
				if (options[attr] !== undefined) {
					this.config[attr] = options[attr];
				} else {
					this.config[attr] = defaults[attr];
				}
			}
		}

		this.status = {
			currentSlide: this.config.startingSlide,
			isSliding: false
		};

		this.instanceId = Math.floor((Math.random() * 100000) + 1);

		this._init();
	}

	SimpleLightBox.prototype = {
		constructor: SimpleLightBox,

		_ajax: function(opts) {
			var self = this;
			var request = new XMLHttpRequest();

			opts || (opts = {});
			opts.type || (opts.type = 'GET');
			opts.success || (opts.success = function(resp) { 
								self.imageSet = resp; 
							});
			opts.error || (opts.error = function(){});

			request.open(opts.type, opts.url, true);

			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					var resp = JSON.parse(request.responseText);
					opts.success.call(self, resp);
				} else {
					opts.error.call(self, request.status);
				}
			};

			request.onerror = function() {
				opts.error.call(self, request.status + 
					" -- " + request.statusText);
			};

			request.send();
		},

		_bindDots: function() {
			var dots = this.el.querySelectorAll(".dots > li");
			var boundDotClick = this._dotClick.bind(this);

			for (var i = 0; i < dots.length; i++) {
				dots[i].removeEventListener('click', boundDotClick);
				dots[i].addEventListener('click', boundDotClick);
			}
		},

		_bindElms: function() {
			var body = document.body;
			var boundClose = this.close.bind(this);
			var boundChecKey = this._checkKey.bind(this);
			var elms = this.elms;

			this.el.removeEventListener('keydown', boundChecKey);
			this.el.addEventListener('keydown', boundChecKey);

			this.elms.imagesWrapper.removeEventListener('keydown', boundChecKey);
			this.elms.imagesWrapper.addEventListener('keydown', boundChecKey);
			
			elms.closeBtn.removeEventListener('click', boundClose);
			elms.closeBtn.addEventListener('click', boundClose);
			elms.closeBtn.removeEventListener('keydown', boundChecKey);
			elms.closeBtn.addEventListener('keydown', boundChecKey);

			elms.arrowLeft.removeEventListener('click', this.prev.bind(this));
			elms.arrowLeft.addEventListener('click', this.prev.bind(this));
			elms.arrowLeft.removeEventListener('keydown', boundChecKey);
			elms.arrowLeft.addEventListener('keydown', boundChecKey);

			elms.arrowRight.removeEventListener('click', this.next.bind(this));
			elms.arrowRight.addEventListener('click', this.next.bind(this));
			elms.arrowRight.removeEventListener('keydown', boundChecKey);
			elms.arrowRight.addEventListener('keydown', boundChecKey);

			if (this.config.closeOnOverlayClick) {
				elms.overlay.removeEventListener('click', boundClose);
				elms.overlay.addEventListener('click', boundClose);
			}

		},

		_checkOptions: function(opts) {
			var ready = true;

			if (!opts["photoService"]) { 
				this._throwError("SimpleLightBox requires a photoService to work."); 
				ready = false;
			}

			if (!opts["photoServiceApiKey"]) { 
				this._throwError("SimpleLightBox requires a photoServiceApiKey to work."); 
				ready = false;
			}

			return ready;
		},

		_checkKey: function(e) {
			if (e.keyCode === 13) {
				e.target.click();
			} else if (e.keyCode === 27) {
				this.close();
			}
		},

		_dotClick: function(e) {
			var itemIndex = parseInt(e.currentTarget.dataset.slide);

			this.slideTo(itemIndex);
		},

		_findContainer: function() {
			var container;

			if (typeof this.config.container === "string") {
				container = window.document.querySelectorAll(this.config.container);

				if (!container.length > 0) {
					this._throwError("container selector does not match any " + 
						"elements on the page: ", this.config.container);
				} else {
					this.container = container[0];
				}
			} else if (thing instanceof(HTMLElement)) {
				container = this.container = this.config.container;
			}
			
			return container;
		},

		_findElms: function() {
			//find and cache commonly used elements
			this.el = this.container.querySelector(
				"[data-simple-lightbox-id='" + this.instanceId + "']"
			);

			this.elms = {
				arrowLeft: this.el.querySelector('.arrow.left'),
				arrowRight: this.el.querySelector('.arrow.right'),
				closeBtn: this.el.querySelector(".close-btn"),
				dots: this.el.querySelector('.dots'),
				imagesWrapper: this.el.querySelector('.images-wrapper'),
				loader: this.el.querySelector('.loader'),
				overlay: document.body.querySelector(
					"[data-simple-lightbox-overlay-id='" + this.instanceId + "']"
				)
			}
		},

		_hideLoader: function() {
			this.elms.loader.classList.add('hidden');
		},	
		
		_init: function() {
			this.trigger("beforeInit", this);

			if (!this._checkOptions(this.config)) { return; }
			if (!this._findContainer()) { return; }

			if (this.config.renderOnInit) {
				this.render();
			}

			if (this.config.requestImagesOnInit) {
				this._requestImages();
			}
			
			this.trigger("afterInit", this);
		},

		_renderDots: function(imageArr) {
			var dotsHTML = [];
			var current;

			for (var i = 0; i < imageArr.length; i++) {
				if (i + 1 === this.config.startingSlide) {
					current = "current";
				} else {
					current = "";
				}

				dotsHTML.push(
					"<li class='" + current + "' data-slide=" + 
					(i + 1) + " tabindex=0 role='button' aria-label='go to slide " + 
					(i + 1) + "'></li>"
				);
			}

			return dotsHTML.join("");
		},

		_renderImages: function(imageArr) {
			var scrollSpeed = this.config.scrollSpeed / 1000; //convert to millseconds
			var photoWrapperStyles = "-webkit-transition-duration: " + scrollSpeed +
				"s; -o-transition-duration: " + scrollSpeed +
				"s; transition-duration: " + scrollSpeed + "s;";
			var service = services[this.config.photoService];
			var imgWrapper = this.el.querySelectorAll(".images-wrapper")[0];
			var imgList = [];
			var dots = this._renderDots(imageArr);
			var thisImg, imgTitle, imgUrl, current;

			this.imageSet = this.imageSet.concat(imageArr);

			for (var i = 0; i < imageArr.length; i++) {
				if (i + 1 === this.config.startingSlide) { 
					current = "current"; 
				} else { 
					current = ""; 
				}

				thisImg = imageArr[i];
				imgUrl = service.constructImageUrl(thisImg);
				imgTitle = services.traverseHierarchy(thisImg, service.titleHierarchy);

				imgList.push("<li class='image-outter-wrapper " + current + 
					"' style='" + photoWrapperStyles + "'>" + "<h4>" + 
					imgTitle + "</h4><div class='image-wrapper'><img src='" + 
					imgUrl + "'alt='" + imgTitle + "'/></div></li>");
			}

			imgWrapper.insertAdjacentHTML("beforeend", imgList.join(""));
			this.elms.dots.insertAdjacentHTML("beforeend", dots);
			this._bindDots();
		},

		_requestImages: function() {
			var service = services[this.config.photoService];
			this.trigger("beforeImageRequest", this);
			
			this._showLoader();

			this._ajax({
				url: service.getUrl({
					api_key: this.config.photoServiceApiKey
				}),
				success: function(resp) {
					this.trigger("imageRequestResponse");
					this._hideLoader();
					this._renderImages(services.traverseHierarchy(resp, service.dataHierarchy));
				},
				error: function(error) {
					this.trigger("imageRequestResponseError");
					this._hideLoader();
					this._throwError(error);
				}
			});

			this.trigger("afterImageRequest", this);
		},

		_setIndicator: function(slideNum) {
			this.elms.dots.querySelector('.current').classList.remove('current');
			this.elms.dots.querySelector('[data-slide="' + slideNum + '"]').classList.add('current');
		},

		_showLoader: function() {
			this.elms.loader.classList.remove('hidden');
		},

		_throwError: function(msg) {
			throw new Error("SimpleLightBox Error: " + msg);
		},

		close: function() {
			this.trigger("beforeClose", this);
			this.el.classList.add("hidden");
			this.el.setAttribute("aria-hidden", "true");
			if (this.config.showOverlay) {
				this.elms.overlay.classList.add("hidden")
				this.elms.overlay.setAttribute("aria-hidden", "true");
			}
			this.trigger("afterClose", this);
		},

		destroy: function() {
			this.trigger("beforeDestroy", this);
			this.el.remove();
			this._events.length = 0;
		},

		next: function() {
			this.trigger("beforeNext", this);
			this.slideTo(this.status.currentSlide + 1);
			this.trigger("afterNext", this);
		},

		off: function(evtName) {
			var evt = this._events[evtName];

			if (!evt) { return; }

			delete this._events[evtName];
		},

		on: function(evtName, callback, ctx, isOnce) {
			if (!this._events[evtName]) {
				this._events[evtName] = [];
			}

			this._events[evtName].push({
				callback: callback,
				ctx: ctx,
				once: isOnce
			});

		},

		once: function(evtName, callback, ctx) {
			this.on(evtName, callback, ctx, true);
		},

		open: function() {
			this.trigger("beforeOpen", this);
			this.el.classList.remove("hidden");
			this.el.removeAttribute("aria-hidden");
			if (this.config.showOverlay) {
				this.elms.overlay.classList.remove("hidden")
				this.elms.overlay.removeAttribute("aria-hidden");
			}
			this.trigger("afterOpen", this);
		},

		prev: function() {
			this.trigger("beforePrev", this);
			this.slideTo(this.status.currentSlide - 1);
			this.trigger("afterPrev", this);
		},

		render: function() {
			var overlayStyles = "background-color: " + 
				this.config.overlayColor + "; " + 
				"opacity: ." + this.config.overlayOpacity + ";";

			var dots = (this.config.showDots) 
				? "<ol class='dots'></ol>"
				: "<ol class='dots hidden'></ol>"

			this.trigger("beforeRender", this);

			this.container.insertAdjacentHTML(
				"beforeend", 
				"<div class='simple-light-box-overlay hidden' " + 
				"data-simple-lightbox-overlay-id='" + this.instanceId + 
				"' style='" + overlayStyles + "' aria-hidden='true'></div>"
			);

			this.container.insertAdjacentHTML(
				"beforeend", 
				"<div class='simple-light-box " + this.config.themeClass + 
				" hidden' data-simple-lightbox-id='" + this.instanceId + "'" +
				" aria-hidden='true' aria-live='polite'>" + 
				"<button class='close-btn' aria-label='close photo gallery'></button>" + 
				"<ul class='images-wrapper'></ul>" + 
				"<div role='button' aria-label='previous slide' tabindex=0 class='arrow left'></div>" + 
				"<div role='button' aria-label='next slide' tabindex=0 class='arrow right'></div>" +
				"<div class='loader hidden'></div>" +
				dots + "</div>");

			this._findElms();
			this._bindElms();
			this.trigger("afterRender", this);
		},

		slideTo: function(slideNum) {
			var currentSlide, nextSlide, direction;

			if (this.status.isSliding) { return; }

			this.trigger("slideStart", this);

			this.status.isSliding = true;

			direction = (slideNum > this.status.currentSlide) ? "left" : "right";

			currentSlide = this.elms.imagesWrapper.querySelector(".image-outter-wrapper.current");

			if (direction === "left") {
				if (slideNum > this.imageSet.length) {
					nextSlide = this.elms.imagesWrapper.firstChild;
				} else if (Math.abs(slideNum - this.status.currentSlide) === 1) {
					nextSlide = currentSlide.nextSibling;
				} else {
					nextSlide = this.elms.imagesWrapper.children[slideNum - 1];
				}
				
				nextSlide.classList.add("next");
			} else {
				if (slideNum < 1) {
					nextSlide = this.elms.imagesWrapper.lastChild;
				} else if (Math.abs(slideNum - this.status.currentSlide) === 1) {
					nextSlide = currentSlide.previousSibling;
				} else {
					nextSlide = this.elms.imagesWrapper.children[slideNum - 1];
				}

				nextSlide.classList.add("prev");
			}
			
			nextSlide.offsetWidth;
			nextSlide.classList.add(direction);
			currentSlide.classList.add(direction);

			if (slideNum > this.imageSet.length) {
				slideNum = 1;
			} else if (slideNum < 1) {
				slideNum = this.imageSet.length;
			}

			this._setIndicator(slideNum);

			var timer = setTimeout(function() {
				currentSlide.classList.remove('current', direction);
				nextSlide.classList.add('current');
				nextSlide.classList.remove("next", "prev", direction);

				this.status.currentSlide = slideNum;	
				this.status.isSliding = false;

				this.trigger("slideDone", this);
			}.bind(this), this.config.scrollSpeed + 100);

		},

		trigger: function(evtName, data) {
			var listener;
			var evt = this._events[evtName];

			if (!evt) { return; }

			for (var i = 0; i < evt.length; i++) {
				listener = evt[i];

				if (!listener.once || !listener.called) {
					listener.callback.call(listener.ctx, data);
					listener.called = true;
				}
			}
		}

	}

	window.SimpleLightBox = SimpleLightBox;

	//allows lightbox library to be used as a module
	if (typeof define === 'function' && define.amd) {
		define(function() { return SimpleLightBox; });
	}

})(window);