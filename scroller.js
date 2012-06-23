/**
 * TGM Content Scroller. Based upon the scoller content in the jQuery UI slider
 * example.
 * 
 * Requires:
 *      - jquery.ui.widget.js
 *      - jquery.ui.mouse.js
 *      - jquery.ui.slider.js
 *      - jquery.mousewheel.js
 *      - jquery.mousehold.js
 */

(function( $ ){

    var TGMScroller = function(){        
        this.options = {
            imgUrl : "/css/images/ajax-loader.gif",
            itemTmpl: '<div class="sci-add" title="Add"></div>'+
                      '<div class="sci-remove" title="Remove" style="display:none;"></div>',
            count : 0,
            scrollDistance : 60,
            scrollUpDirection : 1,
            scrollDownDirection : -1,
            uiSliderStep : 0.1,
            uiSliderValue : 100,
            uiSliderAnimate : 'normal',
            overlayText : 'Contacting server...',
            mouseholdTO : 50 //Mousehold timeout (ms)
        };
    };    
    
    TGMScroller.prototype = {

        constructor: TGMScroller,

        init : function(o){
            $.extend(this.options,o);            
            var self = this;
            $(this.element).find(".scroll-bar").slider({
                orientation: 'vertical',
                step: self.options.uiSliderStep,
                value: self.options.uiSliderValue,
                animate: self.options.uiSliderAnimate,
                slide: function( event, ui ) {self._moveContent.call(self, event, ui)},
                change: function( event, ui ) {self._moveContent.call(self, event, ui)},
                create: function() {self._initScroller.call(self)}
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
            //CSS must have display:block so we can measure the height
            if(this.scrollContainer.css('display') == 'none'){
                var hide = true;
                this.scrollContainer.removeClass('tabhidden').addClass('tabshown');
            }
            var handleHeight;
            var minHandleHeight = 13;
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
            var scrVal = this.sliderElem.slider( "option", "value" );
            //Get the margin as an integer
            var margin = this.scrollContent.css("margin-top");
            margin = parseInt(margin.replace("px",""));
            //If visible space below content, set to current value to
            //trigger a content reflow
            if(this.scrollPane.height() > (this.scrollContent.height() - margin)){
                this.sliderElem.slider( "option", "value" , scrVal);
            }
            //If content added/removed, adjust slider value to match new content size
            else{
                var newVal = Math.round(
                            100 * (1 - margin / (this.scrollPane.height() - (this.scrollContent.height() )))
                );
                //this.sliderElem.slider( "value" , newVal);
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
            //Set the pixel scroll distance
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
        },
        
        remContent : function(){
            this.scrollContent.empty();
        },

        remMsg : function(){
            if(this.scrollContent.find(".scroll-content-message").length > 0){
                this.scrollContent.find(".scroll-content-message").empty();
            }
        },

        //Find the closest item before item with idNum and idText in their id
        appendAfter : function(toContainer, idNum, idText){
            var maxCheck = 1000;
            var i = 0;
            var prevItem = false;
            //Scan through each item from current to find closest lower ID
            var selection = toContainer.find('.sci');
            if( (selection.length > 0 && idNum < maxCheck) ){                
                while(!selection.is('#'+idText+'-'+String(idNum - i))){
                    if(i == idNum){
                        prevItem = false;
                        break;
                    }
                    else{
                        prevItem = idText+'-'+String(idNum - i - 1);
                    }
                    i++;
                }
            }
            return prevItem;
        },

        //Add a new content item to the DOM
        addItem : function(content, removeMsg, from){
            var mkp;            
            //Remove 'scroll-content-message' class in the destination
            if(removeMsg){
               this.remMsg(); 
            }
            
            //Create the sci
            //TODO: Remove 'from', should be set externally
            if( typeof from === 'undefined' ){
                from = this.element.closest('.tab-container').attr('id');
            }
            mkp = '<div class="sci '+from+'">'+
                       this.options.itemTmpl+
                       '<div class="sci-content"></div>'+
                  '</div>';
                      
            //Add to the other content
            this.scrollContent.append( mkp );
            this.scrollContent.find('.sci:last')
                              .attr('id', from+'-'+this.options.count)
                              .find('.sci-content').html(content);            
            
            //Resize the scroller handle
            this.sizeScrollBar();
            //Increment the current count
            this.options.count++;
            //Check if we should have a bottom border on the div
            this.sciBorder();
            //TODO: Attach a tooltip if necessary
            
            //Return the itemid
            return $('#'+from+'-'+(this.options.count-1) );
        },        
        
//        _attachTooltip : function(contentItem, content){
//            $(contentItem).find('.sci-content-text').qtip({
//               content: content,
//               show: 'mouseover',
//               style: {width: {max: 250}},
//               hide: 'mouseout',
//               position: {
//                  corner: {
//                     target: 'bottomMiddle',
//                     tooltip: 'topMiddle'
//                  }
//               }
//            });
//        },        
        
        sciBorder : function(){
            //Set all items to have border
            this.scrollContent.find('.bottom').removeClass('bottom');
            this.scrollContent.find('.sci').last().addClass('bottom');
        },        
        
        getItemCount : function(){
            return this.options.count;
        },

        _initOverlay : function(){
            //Insert the overlay            
            var overlay = '<div class="ajax-overlay">'+
                                '<img src="'+this.options.imgUrl+'"/>'+
                                '<h3>'+this.options.overlayText+'</h3>'+
                          '</div>';
            this.scrollPane.append(overlay);
            this.overlay = this.scrollPane.find('.ajax-overlay');
            //Size the overlay and content            
            this.hideOverlay();
        },        
        
        _reflowOverlay : function(){
            //Container parameters
            var height = this.scrollPane.outerHeight();
            var width = this.scrollPane.outerWidth();

            //Match container size and make sure it is on top
            this.overlay.css({
                'height': String( height )+'px', 
                'width': String( width )+'px'
            });
        },        
        
        hideOverlay : function(){
            this.overlay.hide();
        },

        showOverlay : function(){
            this.overlay.show();
            this._reflowOverlay();
        },        
        
        setOverlayText : function(text){
            this.overlay.find('h3').text(text);
        }
    };
    
    
    $.fn.scroller = function( method ) {
        var args = arguments,ret,data;
        this.each(function(){     
                data = $(this).data('scroller');            
                if( !data ){
                    $(this).data('scroller', { o : new TGMScroller() });                
                    data = $(this).data('scroller');
                    $.extend(data.o,{ element: $(this) });
                }
                // Plugin logic
                if ( data.o[method] ) {
                    ret = data.o[ method ].apply( data.o, Array.prototype.slice.call( args, 1 ));
                }else if( typeof method === 'object' || ! method ) {
                    ret = data.o.init.apply( data.o, args );
                }            
        });         
        //Return 'this' OR method return value
        return typeof ret === 'undefined' ? this : ret;
    };
})( jQuery );