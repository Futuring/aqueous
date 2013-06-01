/**
Aqueous HTML Designer
Copyright (C) 2013  shuttercard.com

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, version 3 of the License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/
(function(Aqueous, $){

	/*!
	  * $script.js Async loader & dependency manager
	  * https://github.com/ded/script.js
	  * (c) Dustin Diaz 2013
	  * License: MIT
	  */
	(function(e,t,n){typeof module!="undefined"&&module.exports?module.exports=n():typeof define=="function"&&define.amd?define(n):t[e]=n()})("$script",this,function(){function v(e,t){for(var n=0,r=e.length;n<r;++n)if(!t(e[n]))return f;return 1}function m(e,t){v(e,function(e){return!t(e)})}function g(e,t,a){function d(e){return e.call?e():r[e]}function b(){if(!--p){r[h]=1,c&&c();for(var e in s)v(e.split("|"),d)&&!m(s[e],d)&&(s[e]=[])}}e=e[l]?e:[e];var f=t&&t.call,c=f?t:a,h=f?e.join(""):t,p=e.length;return setTimeout(function(){m(e,function(e){if(e===null)return b();if(u[e])return h&&(i[h]=1),u[e]==2&&b();u[e]=1,h&&(i[h]=1),y(!n.test(e)&&o?o+e+".js":e,b)})},0),g}function y(n,r){var i=e.createElement("script"),s=f;i.onload=i.onerror=i[d]=function(){if(i[h]&&!/^c|loade/.test(i[h])||s)return;i.onload=i[d]=null,s=1,u[n]=2,r()},i.async=1,i.src=n,t.insertBefore(i,t.firstChild)}var e=document,t=e.getElementsByTagName("head")[0],n=/^https?:\/\//,r={},i={},s={},o,u={},a="string",f=!1,l="push",c="DOMContentLoaded",h="readyState",p="addEventListener",d="onreadystatechange";return!e[h]&&e[p]&&(e[p](c,function b(){e.removeEventListener(c,b,f),e[h]="complete"},f),e[h]="loading"),g.get=y,g.order=function(e,t,n){(function r(i){i=e.shift(),e.length?g(i,r):g(i,t,n)})()},g.path=function(e){o=e},g.ready=function(e,t,n){e=e[l]?e:[e];var i=[];return!m(e,function(e){r[e]||i[l](e)})&&v(e,function(e){return r[e]})?t():!function(e){s[e]=s[e]||[],s[e][l](t),n&&n(i)}(e.join("|")),g},g.done=function(e){g([null],e)},g})	
	
	Aqueous = {
		addTool : function(name, options, callback){
			var self = this;
			if(typeof self.tools[name] == 'undefined'){
				options.name = name;
				self.tools[name] = new Tool(options,callback);
			}
		},
		tools : [], 	// array container for added tools
		loading : [],	// scripts to load
		is_loaded : 0, 	// a check to see if we have alread ran the loading process
		webfonts : ['Open Sans','Droid Serif'],
		web_font_config : {
    		google: { families: [ 'Source+Sans:400italic,700italic,400,700:latin','Droid+Serif:400,700,400italic,700italic:latin' ] }
  		}
	};

	// Designer
	function Designer(element, options) {

		var self = this;
					
		var __contructor = function(){
		
			// check for only the callback
			if(typeof options === 'function'){
				callback = options;
				options = {};
			}
			
			// Merge the users options with our defaults
			$.extend(self, {
				aqueous : Aqueous,
				element : $(element), // element
				use : ['add', 'remove','bold', 'italic', 'color','font','size','image','layer','settings'], // tools to use
				tools : [], // active tools for this designer
				beforeLoad : function(self){
				},
				afterLoad : function(self){
				},
				blocks : [], // all instantiated blocks
				block_ids : 0,
				zindex_start : 1000,
				selected_block : null, // the current/selected block
				dialog : null
			}, options);
		}();
		
		// Build it
		self.build = function(){
			loadScripts(function(){
				validate();
				prep();
				loadBelt();
				loadTools();
				loadBlocks();
			});
		};

		// PUBLIC 
		
		// over writing jquery append to append to safe_line div
		self.append = function(element){
			self.safe_line.append(element);
		};

		// Get the element's content
		self.getContent = function(){
			return self.element.html();
		};
	
		// highlight the tools 
		// the selected block uses
		self.updateToolbar = function() {
		};
		
		// add a block to the designer
		self.addBlock = function(options){
				
			var block = new Block(options); 
			self.blocks[block.id] = block;
			block.add(self);
			resetTools();
			
			return block;
		
		};
		
		// remove a block from the designer
		self.removeBlock = function(){
			self.selected_block.remove();
			delete self.blocks[self.selected_block.id];
			self.selected_block = null;
			resetTools();
		};
		
		// toggle safeline
		self.toggleSafeLine = function(){
			self.safe_line.toggle();
		};
	
		// show dialog
		self.showDialog = function(options){
			// we only allow one dialog at a time
			self.dialog = new Dialog(options);
			self.dialog.show(self);
		};

		// PRIVATE 

		// we only need to load scripts once per request not per designer instantiation
		function loadScripts(callback){

			if(!self.aqueous.is_loaded){

				if(typeof options.base === 'undefined'){
					options.base = '';
				}

				// load fonts
				loadWebFonts();

				// load css files
				var css_files = ['aqueous','font-awesome','spectrum','jqueryui'];
				$.each(css_files,function(index, file){
					$('head').append('<link rel="stylesheet" type="text/css" href="' + options.base + 'css/' + file + '.css" >');
				});

				if(typeof $.draggable !== 'function' || typeof $.resizable !== 'function'){
					self.aqueous.loading.push('jqueryui');
					$script(options.base + 'scripts/jqueryui.js', 'jqueryui');
				}

				if(typeof $.spectrum !== 'function'){
					self.aqueous.loading.push('spectrum');
					$script(options.base + 'scripts/spectrum.js', 'spectrum');
				}

				if(self.aqueous.loading.length > 0){
					$script.ready(self.aqueous.loading, function() {
						self.aqueous.is_loaded = true;
  						callback();
					});
				}
			}
			else{
				callback();
			}
		}

		// Validate incoming data
		function loadWebFonts(){

			var WebFontConfig = self.aqueous.web_font_config;

      		self.aqueous.loading.push('webfonts');
      		$script('https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js','webfonts');

		}

		// Validate incoming data
		function validate(){

			if(typeof self.beforeLoad !== 'function'){
				throw 'beforeLoad must be a function or not set';
			}

			if(typeof self.afterLoad !== 'function'){
				throw 'afterLoad must be a function or not set';
			}

		}
		
		// Prepare the target div
		function prep(){
		
			self.element.css({padding : '5px', border : '#ccc 1px solid'});
			self.element.height(self.height);
			self.element.width(self.width);
			
			self.height = self.element.height();
			self.width = self.element.width();
			
			self.safe_line = $('<div class="aqueous-safe-line" />');
			self.safe_line.css({height: self.height-13 + 'px', width: self.width-13 + 'px'});
			
			self.element.wrapInner(self.safe_line);
		
		}

		// Load Tools
		function loadTools(){
			$.each(self.use, function(name,tool){
				if(typeof self.aqueous.tools[tool] !== 'undefined'){
					self.tools[name] = self.aqueous.tools[tool].add(self);
				}
			});
		}
	
		// Load Belt
		function loadBelt(){
			self.belt = $('<div class="aqueous-belt"></div>');
			self.belt.css({width : (self.width +10) +'px'});
			self.element.before(self.belt);
		}
	
		// instantiate the pre-existing blocks
		function loadBlocks(){
			
		}
	
		// reset Tools
		function resetTools(){
			$.each(self.use, function(name,tool){
				self.aqueous.tools[tool].reset();
			});
		}
	
	} // end 
	
	// Block
	function Block(options, callback) {
		
		var self = this;

		var __contructor = function(){
			// Merge the users options with our defaults
			$.extend(self, {
				id : 0,
				classes : '',
				type : 'text',
				container : null
			}, options);
			
		}();
			
			// Add the block
		self.add = function(designer){
			
			self.designer = designer;
			build();
			self.designer.append(self.container);
			bind();

		};
		
			// Erase the block
		self.remove = function(){
			self.container.remove();
			};
				
		// set style to the selected block
		self.setStyle = function(name, value) {
			console.log(name);
			self.editable.css(name, value);
		};
	
		// has style for the selected block
		self.hasStyle = function(name, value) {
			return self.editable.css(name) == value;
		};
	
		// has style for the selected block
		self.getStyle = function(name) {
			return self.editable.css(name);
		};
		
			// Get the element's content
		self.getContent = function(){
			return self.html();
		};
	
		// PRIVATE
	
		// build
		function build(){
		
			self.id = self.designer.block_ids++;
			self.container = $('<div class="aqueous-text aqueous-block" id="aqueous-block-'+ self.id +'">');
			self.container.css({'z-index' : self.designer.zindex_start+self.id, position : 'absolute'});
			self.handle = $('<div class="aqueous-block-handle icon-move"></div>');
			self.editable = $('<div class="aqueous-block-editable" contenteditable="true"></div>');
			if(self.type == 'text'){
				self.editable.html('add your text here');
			}
			self.container.append(self.handle);
			self.container.append(self.editable);
		}
	
		// bind
		function bind(){
		
			// start dragable
			self.container.draggable({
				grid: [ 5,5 ],
				handle: '.aqueous-block-handle'
			});
			
			// start resizable
			self.editable.resizable({
				ghost: true
			});
			
			// show/hide drag handle
			self.container.mouseover(function() {
				$(this).find('.aqueous-block-handle').show();
			}).mouseout(function(){
				$(this).find('.aqueous-block-handle').hide();
			});
			
			// tool binding
			self.container.on('click', 
				function(e){
				e.preventDefault();
				
				self.designer.selected_block = self;
				
				// enable all the tools now
				for(var name in self.designer.tools) {
					tool = self.designer.tools[name];
					tool.enable(); // enable them for use
					tool.hung(); // but make sure all tools are put away first
					// check to see if the block is using them now
					if(typeof tool.using === 'function' && tool.using.call(tool,self)){
						tool.inuse.call(tool,self);
					}
				}
				
			});
		}
	
	}

	// Tool
	function Tool(options) {
		
		var self = this;

		var __contructor = function(){
		// Merge the users options with our defaults
		$.extend(self, {
			icon : '',
			disabled : false,
			container : null,
			designer : null,
			html : '',
			position : {},
			menu : {},
			use : function(){
			}, 
			reset : function(){
				if(self.disabled){
					self.disable();
				}
				self.hung();
			}, 
			inuse : function(){
				self.container.addClass('inuse');
			}, 
			hung : function(){
				self.container.removeClass('inuse');
			}, 
			enable : function(){
				self.container.removeClass('disabled');
			},
			disable : function(){
				self.container.addClass('disabled');
			}
		}, options);
		
		validate();
		
			if(typeof self.onLoad === 'function'){
				self.onLoad();
			}
		}();
			
		// Use the Tool
		self.add = function(designer){
		
			self.designer = designer;
			
			build();
			
			if(self.disabled){
				self.disable();
			}
			
			if(typeof self.bind === 'function'){
				self.bind(); // custom version
			}
			else{
				bind(); // onlick version
			}
			
			return self;
		};
		
	
		// tool position
		self.getPosition = function(){
			self.position = self.container.position();
		};
	
		// has menu
		self.hasMenu = function(){
			return typeof self.menu.items === 'object' || typeof self.menu.items === 'function';
		};
		
		// PRIVATE

		// Validate incoming data
		function validate(){
			if(typeof self.title === 'undefined'){
				self.title = self.name;
			}

			var functions = ['use','bind','hang', 'onLoad', 'using'];
			$.each(functions, function(index, func){
				if(typeof self[func] !== 'undefined' && typeof self[func] !== 'function'){
					throw 'the '+ func +' callback must be a function if used';
				}
			});

		}
	
		// bind
		function bind(){
			self.container.on('click', 
				function(e){
					e.preventDefault();
					if(self.disabled){
						if($(this).hasClass('inuse')){
							self.hang.call(self, self.designer.selected_block);
							self.hung.call(self);
						}
						else{
							self.use.call(self, self.designer.selected_block);
							self.inuse.call(self);
						}
					}
					else{
						self.use.call(self, self.designer.selected_block);
					}
					
					if(self.hasMenu()){
						self.menu.toggle();
					}
				
				}
			);
		}
	
		// Build the tool container
		function build(){ 
		
			self.container = $('<a href="javascript:void(0);" class="aqueous-tool '+self.icon+'" title="'+self.title+'"></a>');
			self.designer.belt.append(self.container );
			
			if(self.html !== ''){
				self.container.html(self.html);
			}
			
			// get its position
			self.getPosition();
			
			if(self.hasMenu()){
				self.menu = new Menu(self.menu);
				self.menu.add(self);
				self.container.after(self.menu.container);
			}
		}
	}
	
	// Create a menu/dropdown
	function Menu(options){
		var self = this;
		$.extend(self, {
			title:'',
			tool: null,
			items : null,
			position : {}
		}, options);

		// PUBLIC
		self.add = function(tool){
			self.tool = tool;
			
			self.container = $('<div class="aqueous-menu" />');
			position();
			buildTitle();
			buildItems();
				
		};
		
		// toggle menu
		self.toggle = function(){
			// always hide all other menus
			$('.aqueous-menu').not(self.container).hide();
			console.log(self.container);
			self.container.toggle();
		};
		
		// PRIVATE
		
		// location
		function position(){
					
			self.position.top = self.tool.position.top + 38;
			self.position.left = self.tool.position.left -2;
			self.container.css({top : self.position.top , left : self.position.left});
		}
		
		// build title
		function buildTitle(){
			if(self.title !== ''){
				self.container.append('<div class="aqueous-menu-title">'+self.title +'</div>');
			}
		}
		
		//build and bind items
		function buildItems() {

			if(typeof self.items === 'function'){
				self.items = self.items.apply(self);
			}

			$.each(self.items,function(index, item){
			
				self.items[index].container = $('<a class="aqueous-menu-item" href="javascript:void(0);" />');
				self.items[index].container.html(item.label);
				self.items[index].container.on('click',function(){
					if(typeof item.use === 'function'){
						
						if(self.tool.disabled){
							item.use.call(self,self.tool.designer.selected_block);
						}
						else{
							item.use.call(self);
						}
						
					}
					else{
						if(self.tool.disabled){
							self.use.call(self,self.tool.designer.selected_block);
						}
						else{
							self.use.call(self);
						}
					}
					
				});
				
				self.container.append(self.items[index].container);
			}); 
		}
	}

	// Create a dialog
	function Dialog(options){
		var self = this;
		$.extend(self, {
			title:'',
			tool: {},
			tabs : [],
			buttons:[],
			confirm : null
		}, options);

		// PUBLIC

		// show only allow one dialog at a time to we show it not add it
		self.show = function(designer){
			self.designer = designer;
			
			self.container = $('<div class="aqueous-dialog aqueous-clear" />');
			buildTitle();
			buildBody();
			buildOverlay();
			buildTabs();
			$('body').append(self.container);
			buildButtons();
			
		};
		
		// close dialog
		self.close = function(){
			self.container.remove();
			self.overlay.remove();
		};
		
		// PRIVATE
		
		// build title
		function buildTitle(){
			if(self.title !== ''){
				self.container.append('<div class="aqueous-dialog-title">'+self.title +'</div>');
			}
		}
		
		// build html
		function buildBody(){
			
			self.body = $('<div class="aqueous-dialog-body"/>');
			self.body.html(self.html);
			self.container.append(self.body);
			
		}

		// build overlay
		function buildOverlay(){
			
			self.overlay = $('<div class="aqueous-dialog-overlay" />');
			// put it behind the container
			self.overlay.css({
				'z-index' : self.container.css('z-index') -1,
				height : $(window).height(),
				width : $(window).width()});
			self.overlay.on('click',function(e){
				e.preventDefault();
			})
			$('body').append(self.overlay);
			
		}
		
		// build tabs
		function buildTabs(){
			if(self.tabs.length > 0){
			
			}
		}
		
		// build and bind buttons
		function buildButtons() {
			
			self.button_container = $('<div class="aqueous-dialog-buttons" />');
			
			self.buttons.unshift({label:'Cancel', click : function(){
				self.close();
			}});
			
			if(typeof self.confirm === 'function'){
				self.buttons.push({
					label:'Continue', 
					click : function(){
						self.confirm.call(self);
						self.close();
					}
				});
			}
			
			$.each(self.buttons,function(index, button){
			
				self.buttons[index].container = $('<a class="aqueous-button" href="javascript:void(0);" />');
				self.buttons[index].container.html(button.label);
				self.buttons[index].container.on('click',function(){
					if(typeof button.click === 'function'){
						button.click.call(self, self.buttons[index]);
					} 
				
			});
			
			self.button_container.append(self.buttons[index].container);
			});
			
			self.container.append(self.button_container);
		}
	}

	// Add Tools to
	Aqueous.addTool('bold',
		{
			icon : 'icon-bold',
			disabled : true,
			use : function(block){
				block.setStyle('font-weight', 'bold');
			},
			hang : function(block){
				block.setStyle('font-weight', 'normal');
			},
			using : function(block){
				return block.hasStyle('font-weight', 'bold');
			}
		}

	);

	Aqueous.addTool('italic',
		{
			icon : 'icon-italic',
			disabled : true,
			use : function(block){
				block.setStyle('font-style', 'italic');
			},
			hang : function(block){
				block.setStyle('font-style', 'normal');
			},
			using : function(block){
				return block.hasStyle('font-style', 'italic');
			}
		}

	);

	Aqueous.addTool('add',
		{
			icon : 'icon-plus-sign',
			title : 'add a text block',
			use : function(){
				var self = this;
				var block = self.designer.addBlock();
			}
		}

	);

	Aqueous.addTool('remove',
		{
			icon : 'icon-remove-sign',
			title : 'remove a block',
			disabled : true,
			use : function(){
				var self = this;
				
				if(!self.designer.selected_block){
					return false;
				}
				self.designer.showDialog({
					title: 'Are your sure you want to remove this block?',
					confirm : function(){
						self.designer.removeBlock();
					}
				});
			}
		}

	);

	Aqueous.addTool('color',
		{
			html : '<input type="text" />',
			disabled : true,
			title : 'text color',
			enable : function(){
				var self = this;
				$('input',self.container).spectrum('enable');
			},
			disable : function(){
				var self = this;
				$('input',self.container).spectrum('disable');
			},
			bind : function(){
				var self = this;
				
				$('input',self.container).spectrum({
					color: '#000',
					disabled: true,
					change: function(color) {
						self.designer.selected_block.setStyle({color : color.toHexString()});
					}
				}); 
			},
			using : function(block){
				var self = this;
				var color = block.getStyle('color');
				
				if(color){
					$('input',self.container).spectrum('set', color);
				}
				return false;
			}
		}

	);

	Aqueous.addTool('font',
		{
			icon : 'icon-font',
			title : 'change font',
			menu : {
				title: 'Font',
				items: [
					{ label: 'toggle safe line',
						checkbox : function(){
							var self = this;
							self.designer.toggleSafeLine();
						}
					},
					{ label: 'toggle block borders',
						checkbox : function(){
							var self = this;
							self.designer.toggleBlockBorders();
							}
						}
				]},
			use : function(){}
		}

	);

	Aqueous.addTool('size',
		{
			html : '12',
			title : 'change size',
			disabled : true,
			menu : {
				title: 'text size',
				items: function(){
					var self = this;

					var items = [];
					var sizes = ['8','9','10','11','12','14','16','18','20','22','24','26','28','36','48','72']
					$.each(sizes,function(index, size){
						items.push({ 
							label: '<span style="line-height:' + size + 'px;font-size:' + size + 'px">' + size + '</span>',
							use : function(block){
								var self = this;
								block.setStyle('font-size', size + 'px');
								block.setStyle('line-height', size + 'px');
								self.tool.container.html(size);
							}
						});
					});
					return items;
				}
			},
			hang : function(block){
				var self = this;
				self.container.html('12');
			},
			using : function(block){
				var self = this;
				var size = block.getStyle('font-size').replace('px', '');
				self.container.html(size);

				return false;
			}
		}

	);

	Aqueous.addTool('image',
		{
			icon : 'icon-picture',
			title : 'add image',
			use : function(){}
		}

	);

	Aqueous.addTool('layer',
		{
			icon : 'icon-reorder',
			title : 'move forward or back',
			menu : {
				title: 'move forward or back',
				items: [
					{ label: 'toggle safe line',
						checkbox : function(){
							var self = this;
							self.designer.toggleSafeLine();
						}
					},
					{ label: 'toggle block borders',
						checkbox : function(){
							var self = this;
							self.designer.toggleBlockBorders();
							}
						}
				]},
			use : function(){}
		}

	);

	Aqueous.addTool('settings',
		{
			icon : 'icon-cog',
			menu : {
				title: 'Settings',
				items: [
					{ text: 'toggle safe line',
						checkbox : function(){
							var self = this;
							self.designer.toggleSafeLine();
						}
					},
					{ text: 'toggle block borders',
						checkbox : function(){
							var self = this;
							self.designer.toggleBlockBorders();
							}
						}
				]},
			title : 'designer settings',
			use : function(){}
		}

	);

	// Bind the plugin to jquery
	$.fn.aqueous = function(options){
		return this.each(function(){
			var designer = new Designer(this, options);
			return designer.build();
		});
	};

})(window.Aqueous || {}, jQuery);