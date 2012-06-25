/**
 * Content Scroller. Waps a content area in a scroller, allowing the 
 * content to be scrolled and the scroll bar to be styled.
 *
 * Author: Simon Blee (The Gift Mansion) (simblee@gmail.com, simon@thegiftmansion.com.au)
 * Date: See latest commit
 * Requires:
 *      - drag.js
 *      - jquery.mousewheel.js (from Remy Sharp)
 *      - jquery.mousehold.js (from Brandon Aaron)
 * Example: $("div").scroller({
 *              showHandles: true,
 *              
 *          });
 */

(function( $ ){

    var Scroller = function( o, element ){ 
        this.element = element;
        this.parent = null;
        this.upBtn = null;
        this.downBtn = null;
        this.handle = null;
        this.direction = null;
        this.options = {
            minHandleHeight: 10,
            orientation: 'vertical',
            scrollDistance: 60, // Distance in pixels of each scroll
            scrollUpDirection: 1,
            scrollDownDirection: -1,
            mouseholdDeadTime: 1000, // Time to continue holding
            mouseholdTO: 50 // Mousehold timeout (ms)
        };

        // Init the scroller
        this.init( o );
    };    
    
    Scroller.prototype = {

        constructor: Scroller,

        init : function( o ){           
            var self = this;

            // Extend the input options
            $.extend( this.options, o );

            // Wrap the element and add scroller template
            this.element.wrap('<div class="scrollable" />');
            this.element.addClass('scroll-content').css({
                'position': 'relative',
                'top': '0px'
            });

            //Add in the required elements
            this.element.parent().append(
                '<div class="scroller">'+
                    '<div class="scroller-up scroller-up-down" direction="-1"></div>'+
                    '<div class="scroller-handle-wrap">'+
                        '<div class="scroller-handle"></div>'+
                    '</div>'+
                    '<div class="scroller-down scroller-up-down" direction="1"></div>'+
                '</div>'
            ).css(
                'position', 'relative'
            );

            // Create quick reference elements
            this.parent = this.element.parent();
            this.upBtn = this.parent.find(".scroller-up");
            this.downBtn = this.parent.find(".scroller-down");
            this.handle = this.parent.find(".scroller-handle");

            // Make the handle draggable
            this.handle.draggable({
                bound: true,
                lock: 'horizontal',
                onMove: function ( direction ) {
                    if ( self.element.height() > self.parent.height() ) {
                        self._scrollContent();
                    }
                }
            });

            //Adjust height of scroll-bar-wrap so handle is always visible
            this.sizeScrollerHandle();
            this._bindEvents();
        },

        // Calculate the height of the scroller handle based on the amount
        // height difference between the scroller container and the content 
        // div.
        sizeScrollerHandle: function () {
            var handleHeight;

            // Calculate the handle height
            if( this.element.height() < this.parent.height() ){
                handleHeight = 0;
            } else{
                handleHeight = this.parent.height() * ( this.parent.height() / this.element.height() )
                                - ( 2 * this.upBtn.outerHeight() );
                //Check the handle is not too small
                if( handleHeight < this.minHandleHeight ){
                    handleHeight = this.minHandleHeight;
                }
            }

            //Set the handle height and wrap height
            this.handle.height( 
                handleHeight 
            ).parent().height(
                this.parent.height() - ( 2 * this.upBtn.outerHeight() )
            );
        },

        _reflowContent : function () {
         
        },

        // Bind all the events to move the scroller
        _bindEvents : function () {
            var self = this;

            // Move the scroller with the mousewheel using the event helper
            this.parent.on('mousewheel.scroller', function ( event, delta, deltaX, deltaY ) {
                delta = deltaY ? deltaY : deltaX;
                self._scrollHandle( -1 * delta );
                event.preventDefault();
            });

            // Adjust the default moushold timeout and deadtime TODO: create new mousehold plugin


            // Move the scroller with up/down clicks and mouseholds
            this.parent.find('.scroller-up-down').on('mousedown.scroller mousehold.scroller', function ( event ) {
                self._scrollHandle( parseInt( $(this).attr('direction') ) );
            });
        },

        // Move the scroller handle (events will need to call this)
        _scrollHandle : function( direction ){
            var val,
                weight,
                dim = this.options.orientation === 'vertical' ? 'top' : 'left';

            // Calculate the handle scroll value (must correspond to a scroll of
            // this.options.scrollDistance pixels in the content).
            weight = this.options.scrollDistance * ( this.handle.parent().height() - this.handle.height() ) / 
                ( this.element.height() - this.parent.height() )
            val = this.handle.position()[ dim ] + direction * weight;

            //Save the direction for the content scroll
            this.direction = direction;

            // Move the scroll handle
            this.handle.draggable( "moveElement", dim, val );
        },

        // Scroll the content
        _scrollContent : function( val ){
            var dim = this.options.orientation === 'vertical' ? 'top' : 'left';

            // Calculate the element position
            val = - this.handle.position().top * ( this.element.height() - this.parent.height() ) / 
                                    ( this.handle.parent().height() - this.handle.height() );

            // Move the content by the specified scroll distance
            if( val <= 0 && Math.abs( val ) + this.parent.height() < this.element.height() ){
                this.element.css( dim, val + 'px' );
            } else if( 0 < val ) {
                this.element.css( dim, 0 + 'px' );
            } else {
                this.element.css( dim, - ( this.element.height() - this.parent.height() ) + 'px' );
            }
        }
    };
    
    
    $.fn.scroller = function( method ) {
        var ret,
            data,
            args = arguments;

        return this.each(function(){
            // Grab the object or create if not exist
            data = $(this).data( 'scroller' );            
            if( !data ){
                data = $(this).data( 'scroller', { 
                    o : new Scroller( method, $(this) ) 
                }).data( 'scroller' );
            }

            // Call method if it exists
            if ( data.o[method] ) {
                ret = data.o[ method ].apply( data.o, Array.prototype.slice.call( args, 1 ));
            }  
            return typeof ret === 'undefined' ? $(this) : ret;        
        }); 
    };
})( jQuery );