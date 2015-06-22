;(function(window) {
	var defaults = {
		container: 'body',
		scrollSpeed: 200,
		themeClass: 'default',
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
					api_key: ""
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
						imgObj.id + "_" + imgObj.secret + ".jpg";
			},

			dataHierarchy: ["photos", "photo"],
			imageHierarchy: ["id"],
			titleHierarchy: ["title"]
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

		for (var attr in defaults) {
			if (defaults.hasOwnProperty(attr)) {
				if (options[attr] !== undefined) {
					this.config[attr] = options[attr];
				} else {
					this.config[attr] = defaults[attr];
				}
			}
		}

		this._init();
	}

	SimpleLightBox.prototype = {
		constructor: SimpleLightBox,
		
		//semi-private methods and attributes
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

		_findContainer: function() {
			var container;

			if (typeof this.config.container === "string") {
				container = window.document.querySelectorAll(this.config.container);

				if (!container.length > 0) {
					this._throwError("container selector does not match any elements on the page: ", this.config.container);
				} else {
					this.container = container[0];
				}
			} else if (thing instanceof(HTMLElement)) {
				container = this.container = this.config.container;
			}
			
			return container;
		},

		_requestImages: function() {
			var service = services[this.config.photoService];
			this.trigger("beforeImageRequest");
			
			this._ajax({
				url: service.getUrl({
					api_key: this.config.photoServiceApiKey
				}),
				success: function(resp) {
					this._renderImages(services.traverseHierarchy(resp, service.dataHierarchy));
				},
				error: function() {

				}
			});

			this.trigger("afterImageRequest");
		},

		_renderImages: function(imageArr) {
			var service = services[this.config.photoService];
			var imgWrapper = this.el.querySelectorAll(".images-wrapper")[0];
			var imgList = [];
			var thisImg, imgTitle, imgUrl;

			for (var i = 0; i < imageArr.length; i++) {
				thisImg = imageArr[i];
				imgUrl = service.constructImageUrl(thisImg);
				imgTitle = services.traverseHierarchy(thisImg, service.titleHierarchy);
				imgList.push("<li class='image-outter-wrapper'><h4>" + imgTitle + "</h4><div class='image-wrapper'><img src='" + imgUrl + "'/></div></li>");
			}

			imgWrapper.insertAdjacentHTML("beforeend", imgList.join(""));
		},

		_bindElms: function() {
			this.el = this.container.querySelectorAll(".simple-light-box")[0];
			
			if (this.config.showOverlay) { 
				this.overlay = document.body.querySelectorAll(".simple-light-box-overlay")[0];
			}
		},

		_ajax: function(opts) {
			var self = this;
			var request = new XMLHttpRequest();

			opts || (opts = {});
			opts.type || (opts.type = 'GET');
			opts.success || (opts.success = function(resp) { self.imageSet = resp; });
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
				opts.error.call(self);
			};

			request.send();
		},

		_throwError: function(msg) {
			throw new Error("SimpleLightBox Error: " + msg);
		},

		render: function() {
			var overlayStyles = "background-color: " + this.config.overlayColor + 
				"; opacity: ." + this.config.overlayOpacity + ";";

			this.trigger("beforeRender");

			this.container.insertAdjacentHTML("beforeend", "<div class='simple-light-box-overlay hidden' style='" + overlayStyles + "'></div>");
			this.container.insertAdjacentHTML("beforeend", "<div class='simple-light-box " + this.config.themeClass + " hidden'><ul class='images-wrapper'></ul></div>");

			this._bindElms();
			this.trigger("afterRender");
		},

		open: function() {
			this.trigger("beforeOpen");
			this.el.classList.remove("hidden");
			if (this.config.showOverlay) {
				this.overlay.classList.remove("hidden")
			}
			this.trigger("afterOpen");
		},

		close: function() {
			this.trigger("beforeClose");
			this.el.classList.add("hidden");
			if (this.config.showOverlay) {
				this.overlay.classList.add("hidden")
			}
			this.trigger("afterClose");
		},

		destroy: function() {
			this.trigger("beforeDestroy");
			this.el.remove();
			this._events.length = 0;
		},

		next: function() {
			this.trigger("beforeNext");

			this.trigger("afterNext");
		},

		prev: function() {
			this.trigger("beforePrev");

			this.trigger("afterPrev");
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

		off: function(evtName) {
			var evt = this._events[evtName];

			if (!evt) { return; }

			delete this._events[evtName];
		},

		once: function(evtName, callback, ctx) {
			this.on(evtName, callback, ctx, true);
		}

	}

	//allows lightbox library to be used as a module
	if (typeof define === 'function' && define.amd) {
		define(function() {
			window.SimpleLightBox = SimpleLightBox;
			return SimpleLightBox;
		});
	} else {
		window.SimpleLightBox = SimpleLightBox;
	}

})(window);