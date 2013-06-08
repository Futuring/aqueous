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
	
	var defaults = {
		addTool : function(name, options, callback){
			var self = this;
			if(typeof self.tools[name] == 'undefined'){
				options.name = name;
				self.tools[name] = new Tool(options,callback);
			}
		},
		tools : [], 	// array container for added tools
		loading : [],	// scripts to load
		is_loaded : false, 	// a check to see if we have alread ran the loading process
		fonts : {
			default : {name: 'Arial', style: "arial,helvetica,sans-serif"},
			system : 
				[{name: 'Arial', style: "arial,helvetica,sans-serif"},
				{name: 'Comic Sans', style: "'comic sans ms',cursive"},
				{name: 'Courier New', style: "'courier new',courier,monospace"},
				{name: 'Georgia', style: 'georgia,serif'},
				{name: 'Tahoma', style: 'tahoma,geneva,sans-serif'},
				{name: 'Times New Roman', style: "'times new roman',times,serif"}
			], 
			web :
				[{name: 'Open Sans', style: 'Open+Sans:400italic,700italic,400,700:latin'},
				{name: 'Droid Serif', style: 'Droid+Serif:400,700,400italic,700italic:latin'}
			] 
		},
		web_font_config : window.WebFontConfig || {},
		sizes : ['8','9','10','11','12','14','16','18','20','22','24','26','28','36','48','72'],
		base: ''
	};

	Aqueous = $.extend({},defaults,Aqueous);

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
				use : ['add', 'remove','bold','italic','color','background-color','font','size','image','level','settings'], // tools to use
				tools : [], // active tools for this designer
				beforeLoad : function(self){
				},
				afterLoad : function(self){
				},
				blocks : [], // all instantiated blocks
				block_ids : 0,
				zindex_start : 1000,
				selected_block : null, // the current/selected block
				dialog : null,
				safe_line_border : true,
				block_borders : true
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
		self.toggleSafeLineBorder = function(){
			self.safe_line_border = self.safe_line_border ? 'none' : '#ccc 1px dashed'; 
			self.safe_line.css('border', self.safe_line_border);
			self.safe_line_border = self.safe_line_border == 'none' ? false : true;

		};
		
		// toggle block borders
		self.toggleBlockBorders = function(){

			self.block_borders = self.block_borders ? 'none' : '#ccc 1px dotted'; 
			$('.aqueous-block-editable').css('border', self.block_borders);
			self.block_borders = self.block_borders == 'none' ? false : true;
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

				// load fonts
				loadWebFonts();

				// load css files
				var css_files = ['aqueous','font-awesome','spectrum','jqueryui'];
				$.each(css_files,function(index, file){
					$('head').append('<link rel="stylesheet" type="text/css" href="' + self.aqueous.base + 'css/' + file + '.css" >');
				});

				if(typeof $.draggable !== 'function' || typeof $.resizable !== 'function'){
					self.aqueous.loading.push('jqueryui');
					$script(self.aqueous.base + 'js/jqueryui.js', 'jqueryui');
				}

				if(typeof $.spectrum !== 'function'){
					self.aqueous.loading.push('spectrum');
					$script(self.aqueous.base + 'js/spectrum.js', 'spectrum');
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

			if(typeof Aqueous.fonts.web !== 'undefined' && Aqueous.fonts.web.length){
				
				var families = [];
				$.each(Aqueous.fonts.web, function(name, font){
					families.push(font.style);
				});

				// the web font convention is to only load webfonts from google
				if(families.length){
					Aqueous.web_font_config.google = { families: families };
				}
			}

			// otherwise allow webfonts from anywhere
			var WebFontConfig = Aqueous.web_font_config;
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

			// binding
			self.element.on('click', function(e){$('.aqueous-menu').hide();});
			
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
			self.belt = $('<div class="aqueous-belt aqueous-clear"></div>');
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
			
			// set default font
			self.editable.css('font-family', Aqueous.fonts.default);
			if(!self.designer.block_borders){
				self.editable.css('border', 'none');
			}

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
			'class' : '',
			disabled : false,
			container : null,
			designer : null,
			html : '',
			css : {'width' : '15px'},
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
		
			self.container = $('<a href="javascript:void(0);" class="aqueous-tool '+self['class']+'" title="'+self.title+'"></a>');
			self.container.css(self.css);
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
			self.container.toggle();
		};
		
		// PRIVATE
		
		// location
		function position(){
					
			self.position.top = self.tool.position.top + 38;
			self.position.left = self.tool.position.left -1;
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
			self.container.css('width', self.designer.width -10);
			buildTitle();
			buildBody();
			buildTabs();
			self.designer.belt.after(self.container);
			buildButtons();
			self.container.slideDown('slow');
			
		};
		
		// close dialog
		self.close = function(){
			self.container.slideUp('slow',function(){
				self.container.remove();
			});
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
			'class' : 'icon-bold',
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
			'class' : 'icon-italic',
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
			'class' : 'icon-plus-sign',
			title : 'add a text block',
			use : function(){
				var self = this;
				var block = self.designer.addBlock();
			}
		}

	);

	Aqueous.addTool('remove',
		{
			'class' : 'icon-remove-sign',
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
			css : {'width':'30px'},
			'class' : 'color',
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
					color: '#fff',
					disabled: true,
					showAlpha: true,
					showInput: true,
					show : function(color){
						$('.sp-preview-inner',self.container).css({'background-color' : '#fff'});
					},
					move : function(color){
						$('.sp-preview-inner',self.container).css({color : color.toRgbString()});
						$('.sp-preview-inner',self.container).css({'background-color' : '#fff'});
					},
					change: function(color) {
						self.designer.selected_block.setStyle({color : color.toRgbString()});
					}
				});

				$('.sp-preview-inner',self.container).text('T');
			},
			using : function(block){
				var self = this;
				var color = block.getStyle('color');
				
				if(color){
					$('input',self.container).spectrum('set', color);
					$('.sp-preview-inner',self.container).css({color : color});
					$('.sp-preview-inner',self.container).css({'background-color' : '#fff'});
				}
				return false;
			}
		}

	);

	Aqueous.addTool('background-color',
		{
			html : '<input type="text" />',
			css : {'width':'30px'},
			'class' : 'background-color',
			disabled : true,
			title : 'background color',
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
				
				$('sp-preview',self.container).prepend('<div>T<div/>');

				$('input',self.container).spectrum({
					color: '#fff',
					disabled: true,
					showAlpha: true,
					showInput: true,
					change: function(color) {
						self.designer.selected_block.setStyle({'background-color' : color.toRgbString()});
					}
				}); 
			},
			using : function(block){
				var self = this;
				var color = block.getStyle('background-color');
				
				if(color){
					$('input',self.container).spectrum('set', color);
				}
				return false;
			}
		}

	);

	Aqueous.addTool('font',
		{
			html : Aqueous.fonts.default.name.substring(0,5),
			css : {'width':'50px'},
			title : 'change font',
			disabled : true,
			menu : {
				title: 'Font',
				items: function(){
					var self = this;

					var items = [];
					if(Aqueous.fonts.system.length){
						$.each(Aqueous.fonts.system,function(index, font){
							items.push({ 
								label: '<span style="font-family:' + font.style + '">' + font.name + '</span>',
								use : function(block){
									var self = this;
									block.setStyle('font-family', font.style);
									self.tool.container.html(font.name.substring(0,5));
								}
							});
						});
					}

					if(items.length){
						items.push({label : '<hr />'});
					}

					if(Aqueous.fonts.web.length){
						$.each(Aqueous.fonts.web,function(index, font){
							items.push({ 
								label: '<span style="font-family:\''+ font.name + '\'">' + font.name + '</span>',
								use : function(block){
									var self = this;
									block.setStyle('font-family', font.name);
									self.tool.container.html(font.name.substring(0,5));
								}
							});
						});
					}
					return items;
				}
			},
			hang : function(block){
				var self = this;
				self.container.html(Aqueous.fonts.default.name.substring(0,5));
			},
			using : function(block){
				var self = this;
				var font_name = '';
				var font_style = block.getStyle('font-family').replace(/ |'/g,'');
				if(Aqueous.fonts.system.length){
					$.each(Aqueous.fonts.system,function(index, font){
						if(font.style.replace(/ |'/g,'') == font_style){
							font_name = font.name;
							return false;
						}
					});
				}

				if(Aqueous.fonts.web.length){
					$.each(Aqueous.fonts.web,function(index, font){
						if(font.name.replace(/ |'/g,'') == font_style){
							font_name = font.name;
							return false;
						}
					});
				}
				self.container.html(font_name.substring(0,5));

				return false;
			}
		}

	);

	Aqueous.addTool('size',
		{
			html : '12',
			title : 'change size',
			disabled : true,
			menu : {
				title: 'Text Size',
				items: function(){
					var self = this;

					var items = [];
					$.each(Aqueous.sizes,function(index, size){
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
			'class' : 'icon-picture',
			title : 'add image',
			use : function(){}
		}

	);

	Aqueous.addTool('level',
		{
			'class' : 'icon-reorder',
			title : 'move forward or back',
			disabled : true,
			menu : {
				title: 'Move forward or back',
				items: [
					{ 
						label: 'forward a level',
						use : function(block){
							var self = this;
							var zindex = parseInt(block.container.css('z-index'), 10) + 1;
							block.container.css('z-index', zindex);

						}
					},
					{ 
						label: 'back a level',
						use : function(block){
							var self = this;

							var zindex = parseInt(block.container.css('z-index'), 10) - 1;
							block.container.css('z-index', zindex);

						}
					}
				]
			}
		}

	);

	Aqueous.addTool('settings',
		{
			'class' : 'icon-cog',
			menu : {
				title: 'Settings',
				items: [
					{ 
						label: 'toggle safe line',
						use : function(){
							var self = this;
							self.tool.designer.toggleSafeLineBorder();
						}
					},
					{ 
						label: 'toggle block borders',
						use : function(){
							var self = this;
							self.tool.designer.toggleBlockBorders();
							}
						}
				]},
			title : 'designer settings'
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