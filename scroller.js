/**
 * Content Scroller.
 * 
 * Requires:
 *      - drag.js
 *      - jquery.mousewheel.js
 *      - jquery.mousehold.js
 */

(function( $ ){

    var Scroller = function( o ){ 
        this.element = null;
        this.options = {
            orientation: 'vertical',
            scrollDistance : 60,
            scrollUpDirection : 1,
            scrollDownDirection : -1,
            mouseholdTO : 50 //Mousehold timeout (ms)
        };

        // Extend the input options
        $.extend( this.options, o );
    };    
    
    Scroller.prototype = {

        constructor: Scroller,

        init : function(){           
            var self = this;

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

            // Size the scroller
            

            // Make the handle draggable
            this.element.find('.scroll-handle').drag({

            });
        },
        
        _initScroller : function(){
            //Refernece DOM objects accessed a lot
            this.scrollPane = this.element.closest(".scroll-pane");
            this.scrollContent = this.scrollPane.find(".scroll-content");
            this.scrollContainer = this.scrollPane.closest(".tab-container");
            this.scrollUp = this.scrollPane.find(".scroll-up");
            this.scrollDown = this.scrollPane.find(".scroll-down");
            this.sliderElem = this.element.find(".scroll-bar");
            this.defaultContent = this.scrollContent.html();
            
            //change overflow to hidden now that slider handles the scrolling
            this.scrollPane.css( "overflow", "hidden" );
            
            //Adjust height of scroll-bar-wrap so handle is always visible
            this.sizeScrollBar();
            this._bindScrollEvents();
            
            //Create overlay
            this._initOverlay();
        },

        sizeScrollBar : function(){
            var hide,
                handleHeight,
                minHandleHeight = 13;

            //CSS must have display:block so we can measure the height
            if(this.scrollContainer.css('display') == 'none'){
                hide = true;
                this.scrollContainer.removeClass('tabhidden').addClass('tabshown');
            }
            if(this.scrollContent.height() < this.scrollPane.height()){
                handleHeight = 0;
            }
            else{
                handleHeight = this.scrollPane.height() * (this.scrollPane.height()/this.scrollContent.height())
                                - (2 * this.element.find('.scroll-up').height());
                //Check the handle is not too small
                if(handleHeight < minHandleHeight){
                    handleHeight = minHandleHeight;
                }
            }
            this.element.find( ".ui-slider-handle" ).height(handleHeight);

            //Re-size the wrap to ensure the handle is always visible
            this.element.find(".scroll-bar-wrap").height(
                this.scrollPane.height() - handleHeight - (2 * this.element.find('.scroll-up').height())
            ).css('padding-top', handleHeight);

            //Reflow content
            this._reflowContent();

            //Reset tab display to hidden
            if(hide){
                this.scrollContainer.removeClass('tabshown').addClass('tabhidden');
            }
        },

        _reflowContent : function(){
            var scrVal = this.sliderElem.slider( "option", "value" ),
                margin = this.scrollContent.css("margin-top");

            // Get the margin as an integer
            margin = parseInt(margin.replace("px",""));

            // If visible space below content, set to current value to trigger a content reflow
            if(this.scrollPane.height() > (this.scrollContent.height() - margin)){
                this.sliderElem.slider( "option", "value" , scrVal);
            } else { //If content added/removed, adjust slider value to match new content size
                var newVal = Math.round(
                            100 * (1 - margin / (this.scrollPane.height() - (this.scrollContent.height() )))
                );
                this.sliderElem.slider( "option", "value", newVal );
            }            
        },

        _bindScrollEvents : function(){

            //Move the scroller with the mousewheel using the event helper
            this.scrollPane.bind('mousewheel.scroller', {self: this}, function(event, delta){
                event.data.self._scroll(delta);
                //Stop the window from scrolling
                event.preventDefault();
            });
            //Move the scroller with up/down buttons
            this.scrollUp.bind('mousedown.scroller mousehold.scroller', {self: this}, function(event){
                event.data.self._scroll(event.data.self.options.scrollUpDirection)
            });
            this.scrollDown.bind('mousedown.scroller mousehold.scroller', {self: this}, function(event){
                event.data.self._scroll(event.data.self.options.scrollDownDirection)
            });
            //Mousehold on the buttons
            var self = this;
            this.scrollUp.mousehold(this.options.mouseholdTO, function(i){  
                self._scroll(self.options.scrollUpDirection);
            });
            this.scrollDown.mousehold(this.options.mouseholdTO, function(i){  
                self._scroll(self.options.scrollDownDirection);
            });
        },

        _scroll : function(direction){
            // Set the pixel scroll distance
            if(this.element.find( ".ui-slider-handle" ).height() != 0){
                this.sliderElem.slider( "option", "value" , this.sliderElem.slider( "option", "value" ) +
                    direction * this._getScrollWeight(this.options.scrollDistance)
                );
            }
        },

        _getScrollWeight : function(scrollDelta){
            return - 100 * scrollDelta / ( this.scrollPane.height() - this.scrollContent.height() );
        },
                
        putDefContent : function(){
            var items = this.scrollContent.find('.sci').length;
            if( items == 0 ){
                this.scrollContent.append(this.defaultContent);
            }
        },

        // 
        _moveContent : function( event, ui ){
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
                    o : new Scroller( method ) 
                }).data( 'scroller' );

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