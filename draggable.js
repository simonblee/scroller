/**
 * Makes an element draggable within it's parent. 
 * 
 * @require jquery 1.7
 */

(function( $ ){

	var Draggable = function( o, element ){
		this.element = element;
		this.move = false;
		this.prevX = null;
		this.prevY = null;
		this.clickX = 0;
		this.clickY = 0;
		this.moveHorizontal = true;
		this.moveVertical = true;
		this.atBound = {
			left: false,
			top: false
		};

		// Options can be overidden
		this.options = {
			bound: false,
			lock: 'none',
			onMove: function () {}
		}
		
		// Extend the options
		$.extend( this.options, o );

		// Init the plugin
		this.init();
	};    
	
	Draggable.prototype = {

		constructor: Draggable,

		init : function () {
			// Set to absolute positioning and parent to relative
			this.element.css( 'position', 'absolute').parent().css('position', 'relative');

			//Set the size function to call from jQuery
            this.func = this.options.orientation === 'vertical' ? ['height', 'outerHeight'] : ['width', 'outerWidth'];
            this.dim = this.options.orientation === 'vertical' ? 'top' : 'left';

			// Bind events
			this.bindEvents();

			// Check for a direction lock
			this.lock( this.options.lock );
		},

		// Prevent the object from being dragged in a particular direction
		lock: function ( direction ) {
			if ( direction === 'horizontal' ) {
				this.moveHorizontal = false;
				this.moveVertical = true;
			} else if ( direction == 'vertical' ) {
				this.moveHorizontal = true;
				this.moveVertical = false;
			} else if ( direction === 'both' ) {
				this.moveHorizontal = false;
				this.moveVertical = false;
			}
		},

		// Disable by removing events
		disable: function () {
			this.element.off( 'mousedown.draggable' );
			$(document).trigger( 'mouseup.draggable' );
		},

		// Re-bind the events to enable
		enable: function () {
			this.bindEvents();
		},

		bindEvents: function () {
			var self = this;

			// On mouse down, START moving the element
			this.element.on( 'mousedown.draggable', function ( event ) {
				// Set movable
				self.move = true;

				// Set the position of click on the element
				self.clickX = event.pageX - self.element.offset().left;
				self.clickY = event.pageY - self.element.offset().top;

				// Set the initial coordinates
				self.prevX = event.pageX;
				self.prevY = event.pageY;

				// Bind and trigger the mouse move event to calculate previous position
				// Use document as mouse will most likely move out of element during draggable
				$(document).on( 'mousemove.draggable', function ( event ) {
					if( self.move ){
						self.onMouseMove( event );
					}
				});

				// On mouse up, STOP moving the element
				$(document).on( 'mouseup.draggable', function () {
					self.move = false;
				});

				//Prevent default 
				event.preventDefault();
			});
		},

		// Move the element by the difference in mouse move from last move
		onMouseMove: function ( event ) {
			var pos = this.element.position(),
				difX = event.pageX - this.prevX,
				difY = event.pageY - this.prevY;	

			// Move the element the difference of the previous and current mouse position
			if( this.prevX !== null ){
				if( this.moveVertical ){
					this.moveElement( 'top', pos.top + difY, event );
				}

				if( this.moveHorizontal ){
					this.moveElement( 'left', pos.left + difX, event );
				}
			}

			// Set the previous position
			this.prevX = event.pageX;
			this.prevY = event.pageY;
		},

		// Move an element along a particular dimension. This method can be called
		// externally to move the draggable element. When calling externally, leave
		// 'event' undefined.
		moveElement: function ( dim, val, event ) {
			var move = ( 0 <= val && val <= this.getMaxBounds( dim ) );

			// If we have an event (must be mouse move) check if
			// mouse is out of bounds
			if( typeof event !== 'undefined' ){
				move = this.mouseInClickBounds( dim, event );
			}

			//Set position
			if( typeof move === 'number' ) {
				// If 'move' is -1 or val < 0, must be at lower bound
				val = ( move === -1 || val < 0 ) ? 0 : this.getMaxBounds( dim );
			} else if( move == false ){
				// Set to one of the bounds
				val = ( val < 0 ) ? 0 : this.getMaxBounds( dim );
			}
			this.element.css( dim, val + 'px' );

			// Call the callback - set element as 'this', pass in direction
			this.options.onMove.call( this.element );
		},

		// Returns true if the mouse is in the bound of both the parent
		// and the click position of the element. This causes the element 
		// to not move if the mouse is outside the parent AND if the mouse 
		// is outside its original click position. The click coordinates
		// add an offset to the parent element, acting like a padding equal
		// to the x and y position of the click inside the element. This means
		// the element can be moved only when the mouse gets back to the same 
		// position it was clicked on, not before
		mouseInClickBounds: function ( dim, event ) {
			var os = this.element.parent().offset(),
				clickDim = dim === 'top' ? this.clickY : this.clickX,
				eventDim = dim === 'top' ? event.pageY : event.pageX;

			// If element not bound, mouse always in bounds
			if( this.options.bound ){
				if( ( os[dim] + clickDim ) <= eventDim && eventDim <= ( os[dim] + this.getMaxBounds( dim ) + clickDim ) ){
					return true;
				} else if( eventDim < ( os[dim] + clickDim ) ){
					return -1;
				} else {
					return 1;
				}
			} else {
				return true;
			}
		},

		// Calculate the max bounds of the element
		getMaxBounds: function ( dim ) {
			if( dim === 'top' ){
				return this.element.parent().outerHeight() - this.element.outerHeight( true );
			} else {
				return this.element.parent().outerWidth() - this.element.outerWidth( true );
			}
		}
	};
	
	
	$.fn.draggable = function( method ) {
		var ret,
			data,
			args = arguments;

		this.each(function(){
			// Grab the object or create if not exist
			data = $(this).data( 'draggable' );            
			if( !data ){
				data = $(this).data( 'draggable', { 
					o : new Draggable( method, $(this) ) 
				}).data( 'draggable' );
			}

			// Call method if it exists
			if ( data.o[method] ) {
				ret = data.o[ method ].apply( data.o, Array.prototype.slice.call( args, 1 ));
			}
			return typeof ret === 'undefined' ? $(this) : ret;
		});
	};
})( jQuery );