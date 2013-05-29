/*
 * Aqueous - jQuery Plugin
 * Copyright (c) 2013 Jon Zumbrun - shuttercard.com
 */
(function($){
	
	// Aqueous Module
	var Aqueous = {
		addTool : function(name, options, callback){
			if(typeof this.tools[name] == 'undefined'){
				options.name = name;
				this.tools[name] = new Tool(options,callback);
			}
		},
		tools : [],
		scripts : function(options){
			
			this.js = [{jqueryui : }];
			if(){

			}			


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
				use : ['bold', 'italic', 'color', 'text', 'erase','settings'], // tools to use
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
			validate();
			prep();
			loadBelt();
			loadTools();
			loadBlocks();
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
		
		// erase a block from the designer
		self.eraseBlock = function(){
			self.selected_block.erase();
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
				self.tools[name] = self.aqueous.tools[tool].add(self);
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
		self.erase = function(){
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
					if(typeof tool.using === 'function' && tool.using(self)){
						tool.inuse(self);
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
			return typeof self.menu.items === 'object';
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
						self.hang(self.designer.selected_block);
						self.hung();
					}
					else{
						self.use(self.designer.selected_block);
						self.inuse();
					}
				}
				else{
					self.use(self.designer.selected_block);
				}
				
				if(self.hasMenu()){
					self.menu.toggle();
				}
			
			});
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
				self.container.append(self.menu.container);
			}
		}
	}
	
	// Create a menu/dropdown
	function Menu(options){
		var self = this;
		$.extend(self, {
			title:'',
			tool: null,
			items : [],
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
			$.each(self.items,function(index, item){
			
				self.items[index].container = $('<a class="aqueous-menu-item" href="javascript:void(0);" />');
				self.items[index].container.html(item.text);
				self.items[index].container.on('click',function(){
					if(typeof item.click === 'function'){
						item.click.apply(self, self.items[index]);
					}
					else{
						self.use.apply(self, self.items[index]);
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
						self.confirm.apply(self);
						self.close();
					}
				});
			}
			
			$.each(self.buttons,function(index, button){
			
				self.buttons[index].container = $('<a class="aqueous-button" href="javascript:void(0);" />');
				self.buttons[index].container.html(button.label);
				self.buttons[index].container.on('click',function(){
					if(typeof button.click === 'function'){
						button.click.apply(self, self.buttons[index]);
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

	Aqueous.addTool('text',
	{
		icon : 'icon-font',
		title : 'add a text block',
		use : function(){
			var self = this;
			var block = self.designer.addBlock();
		}
	}

	);

	Aqueous.addTool('erase',
	{
		icon : 'icon-eraser',
		title : 'erase a block',
		disabled : true,
		use : function(){
			var self = this;
			
			if(!self.designer.selected_block){
				return false;
			}
			self.designer.showDialog({
				title: 'Are your sure you want to erase this block?',
				confirm : function(){
					self.designer.eraseBlock();
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

		// Load scripts
		Aqueous.scripts(options);

		return this.each(function(){
			var designer = new Designer(this, options);
			return designer.build();
		});
	};

})(jQuery);