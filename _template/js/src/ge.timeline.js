/*! 
* GE UI Timeline 
* Build a timeline event of 24h of GE
*
*/

(function($) {
	
	var pluginName    = "timeline",
		initSelector  = ".geui-" + pluginName,

		_tpl = '<div class="container">'+
					'<div class="span12">'+
			            '<h3>The GE world in the last 24 hours</h3>'+
			            '<span class="today"></span>'+
			            '<div class="chart">'+
			                '<div class="bg">'+
			                    '<div class="grid">'+
			                        '<span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span class="last"></span>'+
			                    '</div>'+
			                    '<div class="date-line">'+
			                        '<span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span><!--'+
			                        '--><span></span>'+
			                    '</div>'+
			                    '<div class="date">'+
			                        '<span class="date-yesterday"></span>'+
			                        '<span class="hour"></span><!--'+
			                        '--><span class="hour"></span><!--'+
			                        '--><span class="hour"></span><!--'+
			                        '--><span class="hour"></span><!--'+
			                        '--><span class="hour"></span><!--'+
			                        '--><span class="date-today"></span>'+
			                    '</div>'+
			                '</div>'+
			                '<div class="events-dots">'+
			                '</div>'+
			                '<div class="grid-bar-container">'+
			                    '<span class="grid-bar"></span>'+
			                '</div>'+
			            '</div>'+
			        '</div>'+
				'</div>'+
			    '<div class="drag">'+
			       '<div class="container">'+
			            '<div class="span12">'+
			                '<span class="bar">'+
			                   '<span  class="bar-arrow bar-arrow-left"><</span>'+
			                    '<span class="txt">DRAG</span>'+
			                    '<span class="bar-arrow bar-arrow-right">></span>'+
			                '</span>'+
			            '</div>'+
			        '</div>'+
			    '</div>',

		/* Util */

		_getDate = function(){

			var t = new Date();
			var m = t.getMinutes();

			if( m != 0) //Has to be rounded UP
			{
				var time = t.getTime();
				if ( m > 30 )
				{	
					time += ( ( 3600 - ( m * 60 ) ) * 1000 );
				}
				else
				{	
					time -= ( m * 60 * 1000 );
				}

				t.setTime(time);
			}

			return t;

		},

		_getDateTM1 = function(){

			var t = _dateT;
			var y = new Date();
			y.setTime( t.getTime() - ( 24 * 3600 ) * 1000 );
			return y;

		},

		_getStrTime = function(nb){

			if(nb < 10)
			{
				nb = "0"+ nb;
			}
			return nb;
		},

	 	_parseISO8601 = function (str) {

			// we assume str is a UTC date ending in 'Z'
			var parts = str.split('T'),
			dateParts = parts[0].split('-'),
			timeParts = parts[1].split('Z'),
			timeSubParts = timeParts[0].split(':'),
			timeSecParts = timeSubParts[2].split('.'),
			timeHours = Number(timeSubParts[0], 10),
			_date = new Date();

			_date.setFullYear(Number(dateParts[0]));
			//_date.setUTCDate(1);
			_date.setMonth(Number(dateParts[1])-1);
			_date.setDate(Number(dateParts[2]));
			_date.setHours(timeHours);
			_date.setMinutes(Number(timeSubParts[1]));
			_date.setSeconds(Number(timeSecParts[0]));
			if (timeSecParts[1]) {
				_date.setMilliseconds(Number(timeSecParts[1]));
			}

			// by using setUTC methods the date has already been converted to local time(?)
			return _date;

		},

		_changeToCurrentDate = function(event){

			//var t = event.date.getTime();
			var tM1 = _dateTM1.getTime();

			//add milliseconds randomly
			var ms = tM1 + Math.floor( Math.random() * 24 * 3600 * 1000 );

			event.date.setTime(ms);

		},

		_isInit 	= false,
		_isDebug 	= false,
		_isDragging = false,
		_isTablet   = false,
		_startDate  = {
			hour   : 6,
			minute : 0,
			AM     : false
		}, 
		_dateT      = _getDate(),
		_dateTM1    = _getDateTM1(),
		_aMonths    = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
		_gridItemWidth = 0,
		_gridItemHeight = 97,

		_event = {
			margin : 16,
			width  : 356,
			current : null
		},

		_$aDots = null,

		_mouse = {
			x : 0,
			y : 0
		},

		_barHandler = {
			x      : 0,
			margin : 53,
			xMin   : 0,
			xMax   : 0
		},

		_$ = {
			timeline        : null,
			BgContainer		: null,
			eventsDotsContainer : null,
			dotsContainer 	: null,
			gridItem 	 	: null,

			//drag
			gridBar			: null,
			dragTxt	    	: null,
			bar 			: null
		},

		/* Events */

		_aEvents = [],

		_getDataFromJson = function(dataSource)
		{
			//ajax

			_$.timeline.addClass("geui-loader");
			
		    jQuery.ajax({
				type: 'GET', 
			 	url: dataSource,
			 	dataType: 'json',
				success: function(data, textStatus, jqXHR) {
					_$.timeline.removeClass("geui-loader"); 
					_bindMouseEvent();
					_initEvents(data);
					
				},
				error: function(jqXHR, textStatus, errorThrown) {
				    console.log(jqXHR, textStatus, errorThrown)
				}
			});
		},

		_initEvents = function(data){

			var t = new Date(); //real

			var todayH = _dateT.getHours();
			if(todayH >= 12)
			{
				todayH -= 12;
			}

			var yesterdayH = _dateTM1.getHours();
			if(yesterdayH >= 12)
			{
				yesterdayH -= 12;
			}

			var today = _aMonths[t.getMonth()] + " " + t.getDate() + ", " + _getStrTime(todayH) + ":"+ _getStrTime(t.getMinutes()) + ":" +t.getSeconds();
			if(t.getHours() >= 12)
			{
				today += "PM";
			}
			else
			{
				today += "AM";
			}


			var todayGrid = "Today, "+_getStrTime(todayH) + ":"+ _getStrTime(_dateT.getMinutes());
			if(_dateT.getHours() >= 12)
			{
				todayGrid += "PM";
			}
			else
			{
				todayGrid += "AM";
			}

			var yesterday  = /*_aMonths[_dateTM1.getMonth()].substr(0, 3) + " " + _dateTM1.getDate()+ ", " + */_getStrTime(yesterdayH) + ":" + _getStrTime(_dateTM1.getMinutes());
			if(_dateTM1.getHours() >= 12)
			{
				yesterday += "PM";
			}
			else
			{
				yesterday += "AM";
			}

			_$.timeline.find(".today").html(today);
			_$.timeline.find(".date-yesterday").html(yesterday);
			_$.timeline.find(".date-today").html(todayGrid);

			// Init Event
			for (var i = 0; i < data.events.length ; i++){

				var event = data.events[i];
				event.date = _parseISO8601(event.date); //UTC (Month -1)

				if(_isDebug)
				{
					_changeToCurrentDate(event);
				}

				if (event.date.getTime() < ( _dateTM1.getTime() - ( 3600 * 1000 ) ) || event.date.getTime() > _dateT.getTime())
				{
					continue;
				}
				else
				{
					_aEvents.push(event);
				}
			}

			delete i;

			for (var j = 0; j < _aEvents.length ; j++){
				var event = _aEvents[j];
				_createEvent(event);
			}

			delete j;
			// End Init Event

			// Init grid
			$.each(_$.timeline.find(".hour"),function(i, item){

				var h = _dateTM1.getHours() + (4 * (i+1) );

				if( h >= 24)
				{
					h -= 24;
				}

				if(h >= 12)
				{
					h -= 12;
					h += ":00PM";
				}
				else
				{
					h += ":00AM";
				}

				$(item).html(h);
			})

			// Break the timeline
			$.each(_$.timeline.find(".grid span"), function(i, span){

				var h = _dateTM1.getHours() +  (i+1);

				//h = 23 : break the timeline
				if(h == 24){

					$(span).html( '<span>' + _aMonths[_dateTM1.getMonth()] + " " + _dateTM1.getDate() + '</span>' ).addClass("break");

				}

			});

			_$aDots = _$.eventsDotsContainer.find(".dot");

			/* Event */

			//Direct access (tablet)
			/*
			_$aDots.on("click", function(e){

				e.preventDefault();

				_barHandler.x = $(this).position().left;

				if (_$aDots != null)
		        {
		        	_$aDots.removeClass("active");
		        }

		        if(_event.current != null)
		        {
		        	_event.current.evt.$.hide();
		        }

				_gotoEvent();
			})
			*/

			_$.eventsDotsContainer.on("click", function(e){

				e.preventDefault();

				if (_$aDots != null)
		        {
		        	_$aDots.removeClass("active");
		        }

		        if(_event.current != null)
		        {
		        	_event.current.evt.$.hide();
		        }

			}).children(".dot").on("click", function(e){

				e.preventDefault();
				e.stopPropagation();

				_barHandler.x = $(this).position().left;

				if (_$aDots != null)
		        {
		        	_$aDots.removeClass("active");
		        }

		        if(_event.current != null)
		        {
		        	_event.current.evt.$.hide();
		        }

				_gotoEvent();
			})

			_isInit = true;
		},

		_createEvent = function(event){

			var classDot = "";
			event.dot = {}; //init

			switch(event.type){
				case "twitter" : classDot = "twitter"; event.dot.height = 8;  event.dot.width = 8; break;
				case "event"   : classDot = "evt";     event.dot.height = 16; event.dot.width = 16;break;
				case "social"  : classDot = "social";  event.dot.height = 8;  event.dot.width = 8; break;
			}

			/* DOT */

			var $dot = $('<span class="dot '+ classDot +'"><span class="front"></span><span class="back"></span></span>');
			event.dot.$ = $dot;

			_positionDotEvent(event);
			_$.eventsDotsContainer.append($dot);

			/* EVENT */

			event.evt = {};

			var classEvt = "";
			if(event.dot.x < _$.eventsDotsContainer.width() / 2)
			{
				classEvt = "left";
			}

			var hour = event.date.getHours();
			var minute = _getStrTime (event.date.getMinutes());

			if(hour > 12)
			{

				hour -= 12;

				minute += "PM";
			}
			else
			{
				minute += "AM";
			}

			event.evt.$ = $('<div class="event evt '+ classEvt +'">'+
	                        '<span class="geui-circle geui-circle-small-icon"><i class="geui-icon geui-icon-white geui-icon-moving"></i></span>'+
	                        '<div class="event-content">'+
	                            '<div class="title"><h4>'+ event.title +'</h4><span class="date">'+ _getStrTime(hour) +':'+ minute +'</span></div>'+
	                            '<p>'+ event.text +'</p>'+
	                        '</div>'+
	                    '</div>');

			_positionEvent(event);	        
	        _$.eventsDotsContainer.append(event.evt.$);

		},

		_positionDotEvent = function(event){

			//hour
			var hour = event.date.getHours();
			var minute = event.date.getMinutes();

			//has to be rounded UP (just for the display)?
			if (event.date.getTime() < _dateTM1.getTime() ){
				//hour ++;
				hour = _dateTM1.getHours();

				if(hour == 24)
				{
					//+1day
					hour = 0;
				}

				minute = 0;
			}


			var indexHour = hour - _dateTM1.getHours();
			if(indexHour < 0 ) //day after
			{
				indexHour = 24 -  _dateTM1.getHours() + hour;
			}

			// /console.log(event, hour, _dateTM1.getHours(), indexHour)

			//minute
			var minute = (_gridItemWidth / 60) * event.date.getMinutes();

			//If 11PM, EXCEPTION
			if(hour == 23){
				
				minute = (_gridItemWidth / 60) * 27;
				indexHour += 1;
				if(indexHour > 24)
				{	
					indexHour == 22;
				}

			}

			//left
			var left = (indexHour * _gridItemWidth) + minute;

			//Not to close
			if( left < ( event.dot.width + (event.dot.width / 2) ) )  // + (event.dot.width / 2) = hover
			{
				left =  event.dot.width + (event.dot.width / 2);
			}
			else if ( left > (_$.eventsDotsContainer.width() - (event.dot.width + (event.dot.width / 2) ) ) )
			{
				left = _$.eventsDotsContainer.width() - (event.dot.width + (event.dot.width / 2) );
			}

			if(!_isInit) //calculate random top position
			{
				var top = 20 + Math.floor( Math.random() * (_gridItemHeight + 1 - event.dot.height - 36 ) ) 
				event.dot.$.css({left : left, top : top});
			}
			else
			{
				event.dot.$.css({left : left });
			}

			event.dot.x = left;


		},

		_positionEvent = function(event){

			var leftEvent = 0;
	        if(event.dot.x < _$.eventsDotsContainer.width() / 2)
	        {
	        	leftEvent = event.dot.x - _event.margin;

	        	if(leftEvent < 0)
	        	{
	        		leftEvent = 0;
	        	}
	        }
	        else
	        {
	        	leftEvent = event.dot.x  - _event.width + (event.dot.width / 2) + _event.margin;

	        	if(leftEvent + _event.width > _$.eventsDotsContainer.width())
	        	{
	        		leftEvent = _$.eventsDotsContainer.width() - _event.width;
	        	}
	        }

	        event.evt.$.css({ left : leftEvent});

		},

		_gotoEvent = function(){

			var eventR = null,
			 	eventL = null;

			//reset
			_event.current = null;

			//+1h
			for (var i = 0; i < _aEvents.length ; i++){
				var event = _aEvents[i];
				if( event.dot.x >= _barHandler.x && event.dot.x <= _barHandler.x + _gridItemWidth )
				{
					eventR = event;
					break;
				}
			}

			delete i;

			//-1h
			for (var j = 0; j < _aEvents.length ; j++){
				var event = _aEvents[j];
				if( event.dot.x <= _barHandler.x && event.dot.x >= _barHandler.x - _gridItemWidth )
				{
					eventL = event;
					break;
				}
			}

			delete j;

			if(eventR != null || eventL != null )
			{

				if(eventR != null && eventL != null)
				{
					//console.log("test", eventL.dot.x + eventL.dot.width, eventR.dot.x, _barHandler.x, eventR.dot.x - _barHandler.x,  _barHandler.x - (eventL.dot.x + eventL.dot.width), ( eventR.dot.x - _barHandler.x ) < ( _barHandler.x - eventL.dot.x + eventL.dot.width ))
					_event.current = ( ( eventR.dot.x - _barHandler.x ) < ( _barHandler.x - (eventL.dot.x + eventL.dot.width) ) ) ? eventR : eventL;
				}
				else if (eventR == null && eventL != null)
				{
					_event.current = eventL;
				}
				else if (eventR != null && eventL == null)
				{
					_event.current = eventR;
				}

			}
			
			
			if (_event.current != null)
			{

				//dots
				_$aDots.removeClass("active");
				_event.current.dot.$.addClass("active");

				//bar
				_$.bar.stop().animate({ left : _event.current.dot.x - _barHandler.margin + (_event.current.dot.width / 2) }, { duration: 300 });
	            _$.gridBar.stop().animate({ left : _event.current.dot.x + (_event.current.dot.width / 2) }, { duration: 300 });

	            //event
	            _event.current.evt.$.show();
			}
		},

		/* Mouse Event */

		_bindMouseEvent = function(){

			$(document.body).on("mousedown", ".bar", function (e) {

				console.log("mouseup")

		        _isDragging = true;
		        _mouse.x    = e.pageX - _$.bar.position().left ;

		        if (_$aDots != null)
		        {
		        	_$aDots.removeClass("active");
		        }

		        if(_event.current != null)
		        {
		        	_event.current.evt.$.hide();
		        }

		        e.preventDefault();
		    });

		    $(document.body).on("mouseup", function (e) {
		        _isDragging = false;
		        _$.dragTxt.html("DRAG");
		        _gotoEvent();
		    }).on("mouseout", function(e){

		    	//out of window
		    	if(e.relatedTarget == null ||  e.relatedTarget.nodeName == "HTML")
		    	{
		    		if(_isDragging)
		    		{
		    			$(document.body).trigger("mouseup")
		    		}	
		    	}
		    });

		    $(document.body).on("mousemove", _onDrag);

		},

		_onDrag = function(e){

			if (_isDragging) {
	            
	            var left = e.pageX - _mouse.x;

	            if(left < _barHandler.xMin)
	           	{
	           		left = _barHandler.xMin;
	           	}
	           	else if(left > _barHandler.xMax)
	           	{
	           		left = _barHandler.xMax;
	           	}

	           	_barHandler.x = left + _barHandler.margin; //coord in grid

	           	var yH = _dateTM1.getHours();
	           	var yM = _dateTM1.getMinutes();

	           	var minutes = parseInt( _barHandler.x * ( 60 / _gridItemWidth ) );
	           	var hour  	= Math.floor(minutes / 60);

	           	var dragH = yH + hour;
	           	var dragM = _getStrTime( minutes % 60);

	           	if(dragH == 23)
	           	{
	           		dragH = "DRAG";
	           	}
	           	else {

	           		if( dragH >= 24)
					{
						dragH -= 24;
					}

					if(dragH >= 12)
					{
						dragH -= 12;
						dragH += ":"+ dragM +"PM";
					}
					else
					{
						dragH += ":"+ dragM +"AM";
					}

	           	}

	           	

	            _$.bar.css({ left : left });
	            _$.gridBar.css({ left : left + _barHandler.margin });
	            _$.dragTxt.html(dragH);
	        }

	         e.preventDefault();
		},

		/* Window Event */

		_onResize = function(e){

			_barHandler.xMin = - _barHandler.margin;
			_barHandler.xMax = _$.eventsDotsContainer.width() - _barHandler.margin;

			if( $(window).width() >= 1200)
      		{
      			_gridItemWidth    = 48.75;//_$.gridItem.outerWidth();
      		}
			else if( $(window).width() >= 768 && $(window).width() <= 979)
      		{
      			_gridItemWidth    = 30.1666667//_$.gridItem.outerWidth();
      		}
      		else
			{
				_gridItemWidth    = 39.1666667//_$.gridItem.outerWidth();
			}

			for (var j = 0; j < _aEvents.length ; j++){

				var event = _aEvents[j];

				_positionDotEvent(event);
				_positionEvent(event)
			}

			delete j;
		},

		

		methods = {
			_create: function(){
				// Disable for mobile
				if(Modernizr.mq('only all and (max-width: 767px)'))
				{
					return false;
				}

				//is Tablet
				if(Modernizr.mq('only all and (max-width: 979px) and (min-width: 768px)'))
				{
					_isTablet = true;
				}

				/*
				if (navigator.userAgent.match(/iPad|iPhone|Android|IEMobile|BlackBerry/i)) 
				{
					return false;
				}
				*/

				$( this )
					.trigger( "beforecreate." + pluginName )
					[ pluginName ]( "_init" )
					[ pluginName ]( "_bindEventListeners" )
					.trigger( "create." + pluginName );
			},
			_init: function(){

				var $timeline = _$.timeline = $( this );

  				if(window.location.hash.substring(1) == "debug") 
  				{
  					_isDebug = true;
  				}

				$timeline.html(_tpl);

				$timeline.attr('unselectable', 'on')
                 			.css('user-select', 'none')
                 			.on('selectstart', false);

				_$.eventsDotsContainer 	= $timeline.find(".events-dots");
				_$.BgContainer 	= $timeline.find(".bg");
				//_$.dotsContainer 	= $timeline.find(".dots");
				_$.gridItem 		= $timeline.find(".grid span:eq(0)");
				


				_$.gridBar 			= $timeline.find(".grid-bar");
				_$.bar 				= $timeline.find(".bar");
				_$.dragTxt 			= _$.bar.find(".txt");

				return $timeline;

			},
			_bindEventListeners : function(){

				var $timeline = $( this );

			    $(window).resize(_onResize);
			    _onResize();

			    //Get Data
			    var dataSource =  $timeline.data("source");

			    if(dataSource == undefined)
			    {
			    	dataSource = '/data/timeline.json';
			    	_getDataFromJson(dataSource);
			    }	
			    else
			    {
			    	//get data direct from source
				    if(dataSource.indexOf(".json") == -1){
				    	_bindMouseEvent();
				    	_initEvents(JSON.parse($("#" + dataSource).html()))
				    }
				    else {
				    	_getDataFromJson(dataSource);
				    }
			    }

				return $timeline;
			},
			destroy: function(){
				
			}
		};
		
	// Collection method.
	$.fn[ pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {

			// if it's a method
			if( arrg && typeof( arrg ) === "string" ){
				return $.fn[ pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			
			// don't re-init
			if( $( this ).data( pluginName + "data" ) ){
				return $( this );
			}
			
			// otherwise, init
			$( this ).data( pluginName + "active", true );
			$.fn[ pluginName ].prototype._create.call( this );
		});
	};
	
	// add methods
	$.extend( $.fn[ pluginName ].prototype, methods ); 
	
	// DOM-ready auto-init
	$( function(){
		$( initSelector )[ pluginName ]();
	} );

}(jQuery));