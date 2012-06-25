/**
 * Makes an element draggable within it's parent. 
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
		this.clickX = 0;
		this.clickY = 0;
		this.moveHorizontal = null;
		this.moveVertical = null;
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

				// Set the position of click on the element
				self.clickX = event.pageX - self.element.offset().left;
				self.clickY = event.pageY - self.element.offset().top;

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
			var pos = this.element.position(),
				difX = event.pageX - this.prevX,
				difY = event.pageY - this.prevY;	

			// Move the element the difference of the previos and current mouse position
			if( this.prevX !== null ){
				if( this.moveVertical ){
					this.moveElementAlongDim( 'top', pos.top + difY, event );
				}

				if( this.moveHorizontal ){
					this.moveElementAlongDim( 'left', pos.left + difX, event );
				}
			}

			// Set the previous position
			this.prevX = event.pageX;
			this.prevY = event.pageY;

			// Call the callback - set element as 'this'
			this.options.onMove.call( this.element );
		},

		// Move an element along a particular dimension
		moveElementAlongDim: function ( dim, val, event ) {
			var canMove = this.canMove( dim, val, event );

			//Set position depending on bounds
			if( canMove === true ) {
				this.element.css( dim, val + 'px' );
			} else if( canMove === -1 ) {
				this.element.css( dim, '0px' );
			} else if( canMove === 1 ) {
				this.element.css( dim, this.getMaxBounds( dim ) + 'px' );
			}
		},

		// Returns true if 'val' is in the bounds of the given dimension
		// 'dim'. If out of bounds, return '-1' for top or left bound and 
		// returns '1' for bottom and right bound. If the mouse is not in
		// bounds for the given dimension.

		// NOTE the 'mouseleave' event is not used to determine if the mouse
		// is out of one dimension as it only fires once allowing only a single
		// dimension to be checked. 'mousemove' allows continuous checking
		canMove: function ( dim, val, event ) {
			var ret = false;

			if( this.options.bound ){
				// If mouse not in bounds, move to edge along dimension
				// or if at edge, return false to do nothing
				if( !this.mouseInClickBounds( dim, event ) ){
					if( val < 0 ){
						ret = -1;
					} else {
						ret = 1;
					}

					// Check if the element is already bound
					if( this.atBound[dim] ){
						return false;
					}
					this.atBound[dim] = true;
					return ret;
				}
			} 

			// If here can move, even if element is bounded
			this.atBound[dim] = false;
			return true;
		},

		// Returns true if the mouse is in the bound of both the parent
		// and the click position of the element. This causes the element 
		// to not move if the mouse is outside the parent AND if the mouse 
		// is outside it's original click position. The click coordinates
		// add an offset to the parent element, acting like a padding equal
		// to the x and y position of the click inside the element.
		mouseInClickBounds: function ( dim, event ) {
			var os = this.element.parent().offset();
			if( dim === 'top' ){
				return ( os.top + this.clickY ) <= event.pageY 
					&& event.pageY <= ( os.top + this.element.parent().outerHeight() - ( this.element.height() - this.clickY ) );
			} else {
				return ( os.left + this.clickX ) <= event.pageX 
					&& event.pageX <= ( os.left + this.element.parent().outerWidth() - ( this.element.width() - this.clickX ) );
			}
		},

		// Calculate the max bounds of the element
		getMaxBounds: function ( dim ) {
			if( dim === 'top' ){
				return this.element.parent().outerHeight() - this.element.outerHeight();
			} else {
				return this.element.parent().outerWidth() - this.element.outerWidth();
			}
		},

		// Move the element to a set position. Will not exceed bounds.
		moveTo: function ( position ) {

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