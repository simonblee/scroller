/**
 * Makes a
 * 
 * Requires:
 *      - jquery 1.7 or higher
 */

(function( $ ){

	var Drag = function( o ){
		this.element = null;
		this.move = false;
		this.prevX = null;
		this.prevY = null;
		this.moveHorizontal = null;
		this.moveVertical = null;

		// Options can be overidden
		this.options = {
			bound: false,
			lock: 'none',
			onMove: function () {}
		}
		
		// Extend the options
		$.extend( this.options, o );
	};    
	
	Drag.prototype = {

		constructor: Drag,

		init : function () {
			// Set to absolute positioning and parent to relative
			this.element.css(
				'position', 'absolute'
			).parent().css(
				'position', 'relative'
			);

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
			} else if ( direction === 'none' ) {
				this.moveHorizontal = true;
				this.moveVertical = true;
			}
		},

		// Disable by removing events
		disable: function () {
			this.element.off( 'mousemove.drag', 'mousedown.drag', 'mouseup.drag' );
		},

		// Re-bind the events to enable
		enable: function () {
			this.bindEvents();
		},

		bindEvents: function () {
			var self = this;

			// On mouse down, START moving the element
			this.element.on( 'mousedown.drag', function ( event ) {
				// Set movable
				self.move = true;

				// Set the initial coordinates
				self.prevX = event.pageX;
				self.prevY = event.pageY;

				// Bind and trigger the mouse move event to calculate previous position
				// Use document as mouse will most likely move out of element during drag
				$(document).on( 'mousemove.drag', function ( event ) {
					if( self.move ){
						self.moveElement( event );
					}
				});

				// On mouse up, STOP moving the element
				$(document).one( 'mouseup.drag', function () {
					self.move = false;
				});

				//Prevent default 
				event.preventDefault();
			});
		},

		// Move the element by the difference in mouse move from last move
		moveElement: function ( event ) {
			var top,
				left,
				pos = this.element.position(),
				difX = event.pageX - this.prevX,
				difY = event.pageY - this.prevY;	

			// Move the element (only if have a previous to compare with - not first event)
			if( this.prevX !== null ){
				top = pos.top + difY;
				if( this.moveVertical && this.canMove( 'top', top ) ){
					this.element.css( "top", top + 'px' );
				}

				left = pos.left + difX;
				if( this.moveHorizontal && this.canMove( 'left', left ) ){
					this.element.css( "left", left + 'px' );
				}
			}

			// Set the previous position
			this.prevX = event.pageX;
			this.prevY = event.pageY;

			// Call the callback - set element as 'this'
			this.options.onMove.call( this.element );
		},

		canMove: function ( dim, val ) {
			if( this.options.bound ){
				if( dim === 'top' ){
					return ( 0 <= val ) &&
						( val + this.element.height() <= this.element.parent().height() )
				} else if( dim === 'left' ){
					return ( 0 <= val ) &&
						( val + this.element.width() <= this.element.parent().width() )
				}
			} else {
				return true;
			}
		}
	};
	
	
	$.fn.drag = function( method ) {
		var ret,
			data,
			args = arguments;

		this.each(function(){
			// Grab the object or create if not exist
			data = $(this).data( 'drag' );            
			if( !data ){
				data = $(this).data( 'drag', { 
					o : new Drag( method ) 
				}).data( 'drag' );

				//Set the jQuery object
				data.o.element = $(this);
				data.o.init();
			}

			// Call method if it exists
			if ( data.o[method] ) {
				ret = data.o[ method ].apply( data.o, Array.prototype.slice.call( args, 1 ));
			}          
		}); 

		//Return 'this' OR method return value
		return typeof ret === 'undefined' ? this : ret;
	};
})( jQuery );