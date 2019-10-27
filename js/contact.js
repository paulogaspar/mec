/* JS Document */

/******************************

[Table of Contents]

1. Vars and Inits
2. Set Header
3. Init Menu
4. Init Date Picker
5. Init Select
6. Init Google Map


******************************/

$(document).ready(function()
{
	"use strict";

	/* 

	1. Vars and Inits

	*/

	var header = $('.header');
	var ctrl = new ScrollMagic.Controller();
	var map;

	setHeader();

	$(window).on('resize', function()
	{
		setHeader();

		setTimeout(function()
		{
			$(window).trigger('resize.px.parallax');
		}, 375);
	});

	$(document).on('scroll', function()
	{
		setHeader();
	});

	initMenu();
	initSelect();
	prepareForm();
	setupStripe();
	populateForm();


	/* Setup input form elements. */
	function prepareForm()
	{
		$('#thirdPersonGroup').hide();
		$('#forthPersonGroup').hide();
		$("#plan2").change(function() {
		    $('#plan2-extra-people').show();
		    $('#extra1inputFirstName').attr('required', '');
		    $('#extra1inputLastName').attr('required', '');
		    $('#extra1inputBirthdate').attr('required', '');
		    $('#payment').show();
		});
		$("#plan1").change(function() {
		    $('#plan2-extra-people').hide();
		    $('#extra1inputFirstName').removeAttr('required', '');
		    $('#extra1inputLastName').removeAttr('required', '');
		    $('#extra1inputBirthdate').removeAttr('required', '');
		    $('#payment').show();
		});

		$("#addExtraPerson").click(function() {
			if ($('#thirdPersonGroup').is(':hidden')){
				$('#thirdPersonGroup').show();
			}
			else if ($('#forthPersonGroup').is(':hidden')){
				$('#forthPersonGroup').show();
				$('#addExtraPerson').hide();
			}
		});

		var searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has('sendenabled'))
		{
			$('#send-form-button').show();
			$("#send-form-button").click(function() {
				sendForm();
			});
		}
	}


	/* Setup Stripe payments. */
	var planID1 = "", planID2 = "";
    function setupStripe()
    {
    	var host = "https://server.medico.casa";
    	/*var host = "http://localhost:8084";*/

    	/* Get your Stripe public key to initialize Stripe.js */
		fetch(host + "/setup")
		  .then(function(result) {
		    return result.json();
		  })
		  .then(function(json) {
		    var publicKey = json.publicKey;
		    planID1 = json.Plan1;
		    planID2 = json.Plan2;

		    var stripe = Stripe(publicKey);
		    
		    // Setup event handler to create a Checkout Session when button is clicked
		    var checkoutButton = $('#checkout-button');
		  	checkoutButton.click(async function () {
		  		// confirm form validity
		  		if (!document.querySelector('#contact_form').reportValidity()) {return;};

		  		// disable button
		  		$('#checkout-button').text('Por favor aguarde...')
		  		$('#checkout-button').attr("disabled", true);

		  		// Build data object
		  		var dataObj = buildFormObject();

		  		// Create Checkout Session
		  		var createCheckoutSession = await fetch(host + "/create-checkout-session", {
				    method: "POST",
				    headers: {"Content-Type": "application/json"},
				    body: JSON.stringify(dataObj)
				  });
		  		var checkoutSession = await createCheckoutSession.json();
		  		
		        // Call Stripe.js method to redirect to the new Checkout page
		        stripe.redirectToCheckout({sessionId: checkoutSession.sessionId})
		            .then(function (result) {
					      if (result.error) {
					        // If 'redirectToCheckout' fails due to a browser or network
					        // error, display a localized error message to the customer.
					        /*var displayError = document.getElementById('error-message');
					        displayError.textContent = result.error.message;*/
					        failedConnection();
					      }
					});
	  		});
		  });
    }

    function getParam(name)
    {
    	 name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); 
    	 var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), 
    	 	results = regex.exec(location.search); 
    	 	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " ")); 
    }


    function populateForm()
    {
    	// select plan based on query string
		var plan = parseInt(getParam('numberOfPersons'));
		if (plan == 1)
		{
			$("#plan1").prop('checked', true);
		}
		else if (plan > 1) 
		{
			$("#plan2").prop('checked', true);
			$('#plan2-extra-people').show();
			if (plan > 2) 	
				$('#thirdPersonGroup').show();
			if (plan > 3) 	
				$('#forthPersonGroup').show();
		}

		// Auto-populate form fields based on query string
		$('input:text, input[type=email], input[type=number], input[type=date]').each(function() {
			var paramValue = getParam(this.id);
			if(this.value == "" && paramValue != "")
				this.value = paramValue;
		});
    }

    function failedConnection()
    {
    	$('#checkout-button').text('PROCEDER PARA PAGAMENTO')
		$('#checkout-button').attr("disabled", false);
		$('error-message').show();
    }
    
    async function sendForm()
    {
    	// Phone number required
    	if ($('#inputTelefone').val() == '') {
    		return 0;
    	}

    	// Get data to send form
    	var dataObj = buildFormObject();

    	// Sending method
    	dataObj['send_sms'] = true;

    	// Contact server to send message with link
    	var sendFormRequest = await fetch(host + "/send", {
				    method: "POST",
				    headers: {"Content-Type": "application/json"},
				    body: JSON.stringify(dataObj)
				  });
  		var result = await sendFormRequest.json();

  		// Error sending message
  		if (result.success == false) {
  			return 1;
  		}

  		// Success
  		return 2;    }

    function buildFormObject()
    {

  		// get selected plan
  		var selectedPlan = $("input[name='PlanSelection']:checked").val();
  		var selectedPlanID = "";
  		if (selectedPlan == "plan1") {
  			selectedPlanID = planID1;
  		} else {
  			selectedPlanID = planID2;
  		}

  		// Build data object
  		var dataObj = { inputFirstName: $('#inputFirstName').val(),
		    		inputLastName: $('#inputLastName').val(),
		    		inputBirthdate: $('#inputBirthdate').val(),
		    		inputAddress: $('#inputAddress').val(),
		    		inputAddress2: $('#inputAddress2').val(),
		    		inputZip: $('#inputZip').val(),
		    		inputCity: $('#inputCity').val(),
		    		inputTelefone: $('#inputTelefone').val(),
		    		inputEmail: $('#inputEmail').val(),
		    		inputNIF: $('#inputNIF').val(),
		    		planId: selectedPlanID,
		    		numberOfPersons: 1}

		if (selectedPlan == "plan2") {
			dataObj['extra1inputFirstName'] = $('#extra1inputFirstName').val().trim();
			dataObj['extra1inputLastName'] = $('#extra1inputLastName').val().trim();
			dataObj['extra1inputBirthdate'] = $('#extra1inputBirthdate').val();
			dataObj['numberOfPersons'] = 2;
			
			if ($('#thirdPersonGroup').is(':visible') && ($('#extra2inputFirstName').val().trim().length != 0)) {
				dataObj['extra2inputFirstName'] = $('#extra2inputFirstName').val().trim();
				dataObj['extra2inputLastName'] = $('#extra2inputLastName').val().trim();
				dataObj['extra2inputBirthdate'] = $('#extra2inputBirthdate').val();
				dataObj['numberOfPersons'] = 3;
			}
			if ($('#forthPersonGroup').is(':visible') && ($('#extra3inputFirstName').val().trim().length != 0)) {
				dataObj['extra3inputFirstName'] = $('#extra3inputFirstName').val().trim();
				dataObj['extra3inputLastName'] = $('#extra3inputLastName').val().trim();
				dataObj['extra3inputBirthdate'] = $('#extra3inputBirthdate').val();	
				dataObj['numberOfPersons'] = 4;
			}
		}

		return dataObj;
    }

	/* 

	2. Set Header

	*/

	function setHeader()
	{
		if($(window).scrollTop() > 91)
		{
			header.addClass('scrolled');
		}
		else
		{
			header.removeClass('scrolled');
		}
	}

	/* 

	3. Init Menu

	*/

	function initMenu()
	{
		var hamb = $('.hamburger');
		var menu = $('.menu');
		var menuOverlay = $('.menu_overlay');
		var menuClose = $('.menu_close_container');

		hamb.on('click', function()
		{
			menu.toggleClass('active');
			menuOverlay.toggleClass('active');
		});

		menuOverlay.on('click', function()
		{
			menuOverlay.toggleClass('active');
			menu.toggleClass('active');
		});

		menuClose.on('click', function()
		{
			menuOverlay.toggleClass('active');
			menu.toggleClass('active');
		});
	}

	/* 

	4. Init Date Picker

	*/

	function initDatePicker()
	{
		var dp = $('#datepicker');
		dp.datepicker();
	}

	/* 

	5. Init Select

	*/

	function initSelect()
	{
		if($('.contact_select').length)
		{
			var select = $('.contact_select');
			select.each(function()
			{
				var selected = $(this);
				selected.change(function()
				{
					selected.addClass('selected');
				});
			});
		}
	}

	/* 

	6. Init Google Map

	*/

	function initGoogleMap()
	{
		var myLatlng = new google.maps.LatLng(34.063685,-118.272936);
    	var mapOptions = 
    	{
    		center: myLatlng,
	       	zoom: 14,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			draggable: true,
			scrollwheel: false,
			zoomControl: true,
			zoomControlOptions:
			{
				position: google.maps.ControlPosition.RIGHT_CENTER
			},
			mapTypeControl: false,
			scaleControl: false,
			streetViewControl: false,
			rotateControl: false,
			fullscreenControl: true,
			styles:
			[
			  {
			    "featureType": "road.highway",
			    "elementType": "geometry.fill",
			    "stylers": [
			      {
			        "color": "#ffeba1"
			      }
			    ]
			  }
			]
    	}

    	// Initialize a map with options
    	map = new google.maps.Map(document.getElementById('map'), mapOptions);

		// Re-center map after window resize
		google.maps.event.addDomListener(window, 'resize', function()
		{
			setTimeout(function()
			{
				google.maps.event.trigger(map, "resize");
				map.setCenter(myLatlng);
			}, 1400);
		});
	}

});
