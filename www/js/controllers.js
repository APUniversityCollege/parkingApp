angular.module('parkingapp.controllers', ['ionic'])

.controller('MapController', function($scope, $rootScope, StorageService, AddressService, ZoneService, TariffService){
	// Give the map the height of the window without the overlay bars
	$('#map').height($( window ).height()-$('.tabs-icon-top').outerHeight()-$('#title').outerHeight());
	// Place map beneath the title bar
	$('#map').css('margin-top', $('#title').outerHeight());
	var center = {};
	if ($rootScope.foundAddress) {
		//$scope.map.setView($rootScope.foundAddress
		center = $rootScope.foundAddress;
		zoom = 16;
	}
	else { // Grote Markt, Antwerpen
		center.lat = 51.221311;
		center.lng = 4.399160;
		zoom = 12;
	}
	
	//$scope.map = new L.Map('map');
	$scope.map = new L.map('map', {
		center: center,
		zoom: zoom,
		maxZoom: 20,
		zoomControl: false,
		doubleClickZoom: false,
		scrollWheelZoom: true,
		touchZoom: true,
		/*path: {
			weight: 10,
			color: '#800000',
			opacity: 1
		}*/
	});
	L.tileLayer('http://otile4.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {}).addTo($scope.map);
	$scope.map.attributionControl.setPrefix('');
	
	// Request object parkingZones from StorageService
	// If the object does not yet exist, then pull it from server
	var zones = StorageService.getObject('parkingZones');
	if (JSON.stringify(zones) === '{}') {
		ZoneService.getZones().then(function(z) {
			zones = z;
			StorageService.setObject('parkingZones', zones);
			colourParkingZones(z);
		});
	}
	else {
		colourParkingZones(zones);
	}

	// Colour the parking zones
	function colourParkingZones(zones){
		for(var i = 0; i < zones.length; i++){
			var coordinates = JSON.parse(zones[i].geometry).coordinates[0];
			var polygonPoints = [];
			for(var j = 0; j < coordinates.length; j++){
				polygonPoints.push(new L.LatLng(coordinates[j][1], coordinates[j][0]));
			}
			var colour = '';
			var fillColour = '';
			switch(zones[i].tariefkleur){
				case 'Rood':
					colour = 'red';
					fillColour = '#f03';
					break;
				case 'Lichtgroen':
					colour = 'lightgreen';
					fillColour = '#33FF33';
					break;
				case 'Donkergroen':
					colour = 'darkgreen';
					fillColour = '#336633';
					break;
				case 'Geel':
					colour = 'yellow';
					fillColour = '#FFFF33';
					break;
				case 'Oranje':
					colour = 'orange';
					fillColour = '#FF9933';
					break;
				case 'Blauw':
					colour = 'blue';
					fillColour = '#3366FF';
					break;
			}
			var polygon = new L.Polygon(polygonPoints,{
				color: colour,
				fillColor: fillColour,
				fillOpacity: 0.3
			});
			$scope.map.addLayer(polygon);
		}
	}
	
	var circlecenter = L.circle(center, 500, {
		color: 'blue',
		fillColor: '#00F',
		fillOpacity: 0.5
	});
	$scope.map.addLayer(circlecenter);
	
	// normal click
	$scope.map.on('click', function(e){
		addMarker(e);
	});

	// double click
	// $scope.map.on('dblclick', function(event, locationEvent){ });

	// right-click
	//$scope.map.on('contextmenu', function(e){ });

	$scope.map.on('zoomstart', function(e) {
	});
	$scope.map.on('zoomend', function(e) {
	});

	setTitle = function(msg){
		document.getElementById('title').innerHTML = '<h1 class="title">' + msg + '</h1>';
	};

	locate = function(){
		//$scope.map.locate({setView: true, maxZoom: 16});
		setTitle('Even geduld, positie wordt bepaald...');
		navigator.geolocation.getCurrentPosition(function(position) {
			var marker = L.marker([position.coords.latitude, position.coords.longitude]).addTo($scope.map); // Create marker
			marker.bindPopup('<b>U bent hier</b>').openPopup(); // Bind popup to marker
			$scope.map.setView([position.coords.latitude, position.coords.longitude], 12); // Set view of map to location and change zoom
			setTitle(''); // Empty title bar
		}, function(err){ console.log(err); });
	};
	
	/* http://alienryderflex.com/polygon/
	The basic idea is to find all edges of the polygon that span the 'x' position of the point you're testing against. 
	Then you find how many of them intersect the vertical line that extends above your point. If an even number cross above the point, 
	then you're outside the polygon. If an odd number crosses above, then you're inside. */
	inPolygon = function(location, polyLoc){
		//console.log(location);
		//console.log(polyLoc);
		var lastPoint = polyLoc[polyLoc.length-1];
		var isInside = false;
		var x = location[0];

		for(var i = 0; i < polyLoc.length; i++){
			var point = polyLoc[i];
			var x1 = lastPoint[0];
			var x2 = point[0];
			var dx = x2 - x1;
			
			if(Math.abs(dx) > 180.0){
				if(x > 0){
					while(x1 < 0)
						x1 += 360;
					while(x2 < 0)
						x2 += 360;
				}
				else{
					while(x1 > 0)
						x1 -= 360;
					while(x2 > 0)
						x2 -= 360;
				}
				dx = x2 - x1;
			}
			
			if((x1 <= x && x2 > x) || (x1 >= x && x2 < x)){
				var grad = (point[1] - lastPoint[1]) / dx;
				var intersectAtLat = lastPoint[1] + ((x - x1) * grad);

				if(intersectAtLat > location[1])
					isInside = !isInside;
			}
			lastPoint = point;
		}
		return isInside;
	};
	
	addMarker = function(e) {
		var lat = e.latlng.lat;
		var lng = e.latlng.lng;
		var tariff;
		var popup = L.popup();
		for(var i = 0; i < zones.length; i++) {
			var geo = JSON.parse(zones[i].geometry);
			var coordinates = geo.coordinates[0];
			if (inPolygon([lng, lat], coordinates)) {
				tariff = zones[i].tariefkleur;
				break;
			}
		}

		AddressService.getAddress(lat, lng).then(function(data) {
			if(data.address.neighbourhood != undefined && tariff != undefined) {
				var tarief = TariffService.getTariffText(tariff);
				popup.setLatLng(e.latlng).setContent(data.address.neighbourhood + ' : ' + tarief).openOn($scope.map);
			}
			else if(data.address.city_district != undefined && tariff != undefined) {
				var tarief = TariffService.getTariffText(tariff);
				popup.setLatLng(e.latlng).setContent(data.address.city_district + ' : ' + tarief).openOn($scope.map);
			}
			else {
				popup.setLatLng(e.latlng).setContent('Geen tarief').openOn($scope.map);
			}
		});
	};
})

.controller('SearchController', function($scope, $rootScope, $timeout, $http, $location, AddressService) {
	setTitle = function(msg){
		document.getElementById('title').innerHTML = '<h1 class="title">' + msg + '</h1>';
	};
	$scope.search = {};
	$rootScope.foundAddress = undefined;
	
	$scope.searchAddress = function() {
		AddressService.getCoordinates($scope.search.address).then(function(data) {
			$rootScope.foundAddress = {};
			$rootScope.foundAddress.lat = parseFloat(data[0].lat);
			$rootScope.foundAddress.lng = parseFloat(data[0].lon);
			$location.path("#/tab/map");
		});
	}
})

.controller('DataController', function($scope, $rootScope, $location) {
	$scope.airplaneMode = true;
});
