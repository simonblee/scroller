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
        this.options = {
            minHandleHeight: 10,
            orientation: 'vertical',
            scrollDistance : 60,
            scrollUpDirection : 1,
            scrollDownDirection : -1,
            mouseholdTO : 50 //Mousehold timeout (ms)
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
            this.element.addClass('scroll-content');

            //Add in the required elements
            this.element.parent().append(
                '<div class="scroller">'+
                    '<div class="scroller-up scroller-up-down"></div>'+
                    '<div class="scroller-handle-wrap">'+
                        '<div class="scroller-handle"></div>'+
                    '</div>'+
                    '<div class="scroller-down scroller-up-down"></div>'+
                '</div>'
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
                onMove: function () {
                    self.scroll();
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
            var newVal,
                scrVal = this.sliderElem.slider( "option", "value" ),
                margin = this.scrollContent.css( "margin-top" );

            // Get the margin as an integer
            margin = parseInt( margin.replace("px","") );

            // If visible space below content, set to current value to trigger a content reflow
            if( this.parent.height() > ( this.element.height() - margin ) ){
                this.sliderElem.slider( "option", "value" , scrVal);
            } else { //If content added/removed, adjust slider value to match new content size
                newVal = Math.round(
                            100 * ( 1 - margin / ( this.parent.height() - ( this.element.height() ) ) )
                );
                this.sliderElem.slider( "option", "value", newVal );
            }            
        },

        _bindEvents : function () {
            var self = this;

            //Move the scroller with the mousewheel using the event helper
            this.element.on('mousewheel.scroller', function ( event, delta ) {
                self._scrollHandle( delta );

                //Stop the window from scrolling
                event.preventDefault();
            });

            //Move the scroller with up/down buttons
            this.upBtn.on('mousedown.scroller mousehold.scroller', function ( event ) {
                self._scrollHandle( -1 );
            });
            this.downBtn.on('mousedown.scroller mousehold.scroller', function ( event ) {
                self._scrollHandle( 1 );
            });
        },

        // Move the scroller handle (events will need to call this)
        _scrollHandle : function( direction ){
            // Get the scroll weight

            // Move the scroll handle


            // Set the pixel scroll distance
            if(this.element.find( ".ui-slider-handle" ).height() != 0){
                this.sliderElem.slider( "option", "value" , this.sliderElem.slider( "option", "value" ) +
                    direction * this._getScrollWeight(this.options.scrollDistance)
                );
            }
        },

        // Scroll the content
        _scrollContent : function( event, ui ){
            if ( this.scrollContent.height() > this.scrollPane.height() ) {
                    var newMargin = Math.round(
                            (100 - ui.value) / 100 * ( this.scrollPane.height() - this.scrollContent.height() )
                    ) + "px" ;
                    //Stop the previous animation(s) to speed things up
                    this.scrollContent.stop(true, false);
                    //Start the next animation
                    this.scrollContent.css( "margin-top", newMargin );
            } else {
                    this.scrollContent.css( "margin-top", 0 );
            }
        },

        _getScrollWeight : function( scrollDelta ){
            return - 100 * scrollDelta / ( this.scrollPane.height() - this.scrollContent.height() );
        },
                
        putDefContent : function(){
            var items = this.scrollContent.find('.sci').length;
            if( items == 0 ){
                this.scrollContent.append(this.defaultContent);
            }
        }
    };
    
    
    $.fn.scroller = function( method ) {
        var ret,
            data,
            args = arguments;

        this.each(function(){
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
        }); 

        //Return 'this' OR method return value
        return typeof ret === 'undefined' ? this : ret;
    };
})( jQuery );