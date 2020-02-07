jQuery(document).ready(function($){
	var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
	var transitionsSupported = ( $('.csstransitions').length > 0 );
	//if browser does not support transitions - use a different event to trigger them
	if( !transitionsSupported ) transitionEnd = 'noTransition';
	
	//should add a loding while the events are organized 

	function SchedulePlan( element ) {
		this.element = element;
		this.timeline = this.element.find('.timeline');
		this.timelineItems = this.timeline.find('li');
		this.timelineItemsNumber = this.timelineItems.length;
    // this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
		this.timelineStart = getScheduleTimestamp($(this.timeline).data('start'))
    //need to store delta (in our case half hour) timestamp
		this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());

		this.eventsWrapper = this.element.find('.events');
		this.eventsGroup = this.eventsWrapper.find('.events-group');
		this.singleEvents = this.eventsGroup.find('.single-event');
		this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();

		this.modal = $('.event-modal');
		this.modalHeader = this.modal.find('.header');
		this.modalHeaderBg = this.modal.find('.header-bg');
		this.modalBody = this.modal.find('.body'); 
		this.modalBodyBg = this.modal.find('.body-bg'); 
		this.modalMaxWidth = 800;
		this.modalMaxHeight = 480;

		this.animating = false;

		this.initSchedule();
	}

	SchedulePlan.prototype.initSchedule = function() {
		this.scheduleReset();
    this.loadRemoteData();
	};

	SchedulePlan.prototype.scheduleReset = function() {
		var mq = this.mq();
    
    if( true ) {
			//in this case you are on a mobile version (first load or resize from desktop)
			this.element.removeClass('js-full loading');
			this.eventsGroup.children('ul').add(this.singleEvents).removeAttr('style');
			this.eventsWrapper.children('.grid-line').remove();
			this.element.hasClass('modal-is-open') && this.checkEventModal();
		} else {
			this.element.removeClass('loading');
		}
	};

	SchedulePlan.prototype.loadRemoteData = function() {
		var self = this;
    
    jQuery.ajax({
      url: 'https://raw.githubusercontent.com/padraicm/festival_tickets/master/data/films.json', 
      success: function( data, status, xhr ) {
        self.films = JSON.parse(data)
        
        jQuery.ajax({
          url: 'https://raw.githubusercontent.com/padraicm/festival_tickets/master/data/events.json', 
          success: function( data, status, xhr ) {
            self.events = JSON.parse(data)
        		self.initEvents();
          }
        });
        
        
      }
    });
  }

	SchedulePlan.prototype.initEvents = function() {
		var self = this;
    

    
    html = '<ul>'
    $.each( this.events.groups, function(key, group) {
      html += '<li class="events-group">'
      html += '<div class="top-info"><span>' + group.label + '</span></div>'
      html += '<ul>'
      $.each( group.events , function(key, event) {
        html += "<li class='single-event half-left' data-content='event-abs-circuit' data-event='event-1'>"
        html += "<span class='event-clickable'>"
        html += "<a class='event-ticket' target='new_window' href='" + event.ticket.url + "'>" + event.ticket.price + " Tickets</a>"
        html += "<span class='event-ticket-name'>" + event.ticket.name + "</span>"
        html += "<span class='event-date'>" + event.time + "</span>"
        html += "<span class='event-venue'>" + event.location + "</span>"
        html += "</span>"
        
        $.each( event.films, function(key, film_title) {
          film = self.films.films.find( function(film) { return film.title == film_title})
          if(film === undefined) { console.log("Missing film for title " + film_title)}
          html += "<div class='event'>"
          html += '<a class="event-name" href="javascript:">'
          html += film.title
          html += "<span class='event-time'>" + film.details + '</span>'
          html += "</a>"

          html += "<div class='event-toggle'>"
            html += "<div class='event-description'>"
            html += film.description
            html += "</div>"
          
            if(film.url ) {
              html += "<div class='event-link'>"
              html += '<a href="' + film.url + '">' + film.url + '</a>'
              html += "</div>"
            }
            
            if( film.video && film.video.includes('vimeo') ) {
              id = film.video.match("vimeo.com\/(\\d*)")[1]
              html += "<div class='event-video'>"
              html += '<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/' + id + '?title=0&byline=0&portrait=0" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>'
              html += "</div>"
          
            }
            html += "</div>"
          html += "</div>"
        })
        html += "</li>"
      });
      html += '</li>'
      html += '</ul>'
      
    });
    html += '</ul>'
    $('.events').append(html)
    
    $('.event-name').on( 'click', function() {
      $(this).siblings(".event-toggle").toggle()
    })

		//close modal window
		this.modal.on('click', '.close', function(event){
			event.preventDefault();
			if( !self.animating ) self.closeModal(self.eventsGroup.find('.selected-event'));
		});
		this.element.on('click', '.cover-layer', function(event){
			if( !self.animating && self.element.hasClass('modal-is-open') ) self.closeModal(self.eventsGroup.find('.selected-event'));
		});
	};

	SchedulePlan.prototype.placeEvents = function() {
		var self = this;
		this.singleEvents.each(function(){
			//place each event in the grid -> need to set top position and height
			var start = getScheduleTimestamp($(this).attr('data-start')),
				duration = getScheduleTimestamp($(this).attr('data-end')) - start;

			var eventTop = self.eventSlotHeight*(start - self.timelineStart)/self.timelineUnitDuration,
				eventHeight = self.eventSlotHeight*duration/self.timelineUnitDuration;
			
        $(this).css({
				top: (eventTop -1) +'px',
				height: (eventHeight+1)+'px'
			});
		});
    
    
    totalHeight = $(this.timeline).find('ul').outerHeight() + 1
    // totalHeight = this.singleEvents.length * 70;
    this.eventsGroup.css({height: totalHeight + 'px'});
    this.element.css({height: 100 + totalHeight + 'px'})

		this.element.removeClass('loading');
	};
  

	SchedulePlan.prototype.openModal = function(event) {
		var self = this;
		var mq = self.mq();
		this.animating = true;
    $('.event-modal-wrapper').scrollTop(0);
    
		//update event name and time
    // this.modalHeader.find('.event-name').html(event.find('.event-name').html());
		this.modalHeader.find('.event-date').text(event.find('.event-date').text());
		this.modalHeader.find('.event-venue').text(event.data('venue'));
		this.modalHeader.css('background',event.css('background'));

    ticket_url = event.parent().data('ticket')
    if(ticket_url)
    {
      this.modalHeader.find('.event-ticket').attr('href',ticket_url)
      this.modalHeader.find('.event-ticket').show()      
    }
    else
      this.modalHeader.find('.event-ticket').hide()


		this.modal.attr('data-event', event.attr('data-event'));

    this.modalBody.find('.event-info').html(event.find('.event-data').html().autoLink({target: "_new_window"}))

		//update event content
    // this.modalBody.find('.event-info').load(event.parent().attr('data-content')+'.html .event-info > *', function(data){
    //   //once the event content has been loaded
    //   self.element.addClass('content-loaded');
    // });

		this.element.addClass('modal-is-open');
		$('body').addClass('modal-is-open');

		setTimeout(function(){
			//fixes a flash when an event is selected - desktop version only
			event.parent('li').addClass('selected-event');
		}, 10);

		if( mq == 'mobile' || true ) {
			self.modal.one(transitionEnd, function(){
				self.modal.off(transitionEnd);
				self.animating = false;
			});
		} else {
			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var windowWidth = $(window).width(),
				windowHeight = $(window).height();

			var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
				modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

			var modalTranslateX = parseInt((windowWidth - modalWidth)/2 - eventLeft),
				modalTranslateY = parseInt((windowHeight - modalHeight)/2 - eventTop);
			
			var HeaderBgScaleY = modalHeight/eventHeight,
				BodyBgScaleX = (modalWidth - eventWidth);
			//change modal height/width and translate it
			self.modal.css({
				top: eventTop+'px',
				left: eventLeft+'px',
				height: modalHeight+'px',
				width: modalWidth+'px',
			});
			transformElement(self.modal, 'translateY('+modalTranslateY+'px) translateX('+modalTranslateX+'px)');

			//set modalHeader width
			self.modalHeader.css({
				width: eventWidth+'px',
			});
			//set modalBody left margin
			self.modalBody.css({
				marginLeft: eventWidth+'px',
			});

			//change modalBodyBg height/width ans scale it
			self.modalBodyBg.css({
				height: eventHeight+'px',
				width: '1px',
			});
			transformElement(self.modalBodyBg, 'scaleY('+HeaderBgScaleY+') scaleX('+BodyBgScaleX+')');

			//change modal modalHeaderBg height/width and scale it
			self.modalHeaderBg.css({
				height: eventHeight+'px',
				width: eventWidth+'px',
			});
			transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
			
			self.modalHeaderBg.one(transitionEnd, function(){
				//wait for the  end of the modalHeaderBg transformation and show the modal content
				self.modalHeaderBg.off(transitionEnd);
				self.animating = false;
				self.element.addClass('animation-completed');
			});
		}

		//if browser do not support transitions -> no need to wait for the end of it
		if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
	};

	SchedulePlan.prototype.closeModal = function(event) {
		var self = this;
		var mq = self.mq();

		this.animating = true;

		if( mq == 'mobile' || true ) {
			this.element.removeClass('modal-is-open');
  		$('body').removeClass('modal-is-open');
			this.modal.one(transitionEnd, function(){
				self.modal.off(transitionEnd);
				self.animating = false;
				self.element.removeClass('content-loaded');
				event.removeClass('selected-event');
			});
		} else {
			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var modalTop = Number(self.modal.css('top').replace('px', '')),
				modalLeft = Number(self.modal.css('left').replace('px', ''));

			var modalTranslateX = eventLeft - modalLeft,
				modalTranslateY = eventTop - modalTop;

			self.element.removeClass('animation-completed modal-is-open');

			//change modal width/height and translate it
			this.modal.css({
				width: eventWidth+'px',
				height: eventHeight+'px'
			});
			transformElement(self.modal, 'translateX('+modalTranslateX+'px) translateY('+modalTranslateY+'px)');
			
			//scale down modalBodyBg element
			transformElement(self.modalBodyBg, 'scaleX(0) scaleY(1)');
			//scale down modalHeaderBg element
			transformElement(self.modalHeaderBg, 'scaleY(1)');

			this.modalHeaderBg.one(transitionEnd, function(){
				//wait for the  end of the modalHeaderBg transformation and reset modal style
				self.modalHeaderBg.off(transitionEnd);
				self.modal.addClass('no-transition');
				setTimeout(function(){
					self.modal.add(self.modalHeader).add(self.modalBody).add(self.modalHeaderBg).add(self.modalBodyBg).attr('style', '');
				}, 10);
				setTimeout(function(){
					self.modal.removeClass('no-transition');
				}, 20);

				self.animating = false;
				self.element.removeClass('content-loaded');
				event.removeClass('selected-event');
			});
		}

		//browser do not support transitions -> no need to wait for the end of it
		if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
	}

	SchedulePlan.prototype.mq = function(){
		//get MQ value ('desktop' or 'mobile') 
		var self = this;
		return window.getComputedStyle(this.element.get(0), '::before').getPropertyValue('content').replace(/["']/g, '');
	};

	SchedulePlan.prototype.checkEventModal = function(device) {
		this.animating = true;
		var self = this;
		var mq = this.mq();

		if( mq == 'mobile' || true ) {
			//reset modal style on mobile
			self.modal.add(self.modalHeader).add(self.modalHeaderBg).add(self.modalBody).add(self.modalBodyBg).attr('style', '');
			self.modal.removeClass('no-transition');	
			self.animating = false;	
		} else if( mq == 'desktop' && self.element.hasClass('modal-is-open') ) {
			self.modal.addClass('no-transition');
			self.element.addClass('animation-completed');
			var event = self.eventsGroup.find('.selected-event');

			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var windowWidth = $(window).width(),
				windowHeight = $(window).height();

			var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
				modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

			var HeaderBgScaleY = modalHeight/eventHeight,
				BodyBgScaleX = (modalWidth - eventWidth);

			setTimeout(function(){
				self.modal.css({
					width: modalWidth+'px',
					height: modalHeight+'px',
					top: (windowHeight/2 - modalHeight/2)+'px',
					left: (windowWidth/2 - modalWidth/2)+'px',
				});
				transformElement(self.modal, 'translateY(0) translateX(0)');
				//change modal modalBodyBg height/width
				self.modalBodyBg.css({
					height: modalHeight+'px',
					width: '1px',
				});
				transformElement(self.modalBodyBg, 'scaleX('+BodyBgScaleX+')');
				//set modalHeader width
				self.modalHeader.css({
					width: eventWidth+'px',
				});
				//set modalBody left margin
				self.modalBody.css({
					marginLeft: eventWidth+'px',
				});
				//change modal modalHeaderBg height/width and scale it
				self.modalHeaderBg.css({
					height: eventHeight+'px',
					width: eventWidth+'px',
				});
				transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
			}, 10);

			setTimeout(function(){
				self.modal.removeClass('no-transition');
				self.animating = false;	
			}, 20);
		}
	};

	var schedules = $('.cd-schedule');
	var objSchedulesPlan = [],
		windowResize = false;
	
	if( schedules.length > 0 ) {
		schedules.each(function(){
			//create SchedulePlan objects
			objSchedulesPlan.push(new SchedulePlan($(this)));
		});
	}

	$(window).on('resize', function(){
		if( !windowResize ) {
			windowResize = true;
			(!window.requestAnimationFrame) ? setTimeout(checkResize) : window.requestAnimationFrame(checkResize);
		}
	});

	$(window).keyup(function(event) {
		if (event.keyCode == 27) {
			objSchedulesPlan.forEach(function(element){
				element.closeModal(element.eventsGroup.find('.selected-event'));
			});
		}
	});

	function checkResize(){
		objSchedulesPlan.forEach(function(element){
			element.scheduleReset();
		});
		windowResize = false;
	}
  
  function convert12hour(time) {
    hours = time.substr(0, 2) % 12 || 12
    
    return hours + time.substr(2,3);
  }

	function getScheduleTimestamp(time) {
		//accepts hh:mm format - convert hh:mm to timestamp
		time = time.replace(/ /g,'');
		var timeArray = time.split(':');
		var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
		return timeStamp;
	}

	function transformElement(element, value) {
		element.css({
		    '-moz-transform': value,
		    '-webkit-transform': value,
			'-ms-transform': value,
			'-o-transform': value,
			'transform': value
		});
	}
});