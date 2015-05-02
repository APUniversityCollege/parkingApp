angular.module('parkingapp.controllers', ['leaflet-directive', 'ionic'])

.controller('MapController', function($scope, $rootScope, $timeout, StorageService, AddressService, ZoneService, TariffService){
	var c = {};
	if($rootScope.foundAddress){
		c = $rootScope.foundAddress;
	}
	else{
		c.lat = 51.221311;
		c.lng = 4.399160;
	}
	
	$scope.map = new L.Map('map'); 
	
	L.tileLayer('http://otile4.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
            maxZoom: 20,
			zoomControl: false,
			doubleClickZoom: false,
			scrollWheelZoom: true,
			touchZoom: true,
			path: {
				weight: 10,
				color: '#800000',
				opacity: 1
			},
			markers: []
         }).addTo($scope.map);
         
    $scope.map.attributionControl.setPrefix('');
    $scope.map.setView(new L.LatLng(c.lat, c.lng), 17);
	
	var markerCount = 0;
	// Request object parkingZones from StorageService
	// If the object does not yet exist, then pull it from server
	var zones = StorageService.getObject('parkingZones');
	if (JSON.stringify(zones) === '{}') {
		ZoneService.getZones().then(function(z) {
			zones = z;
			StorageService.setObject('parkingZones', zones);
		});
	}

	// Colour the parking zones
	for(var i = 0; i < zones.length; i++){
		console.log(zones[i].tariefkleur);
		var coordinates = JSON.parse(zones[i].geometry).coordinates[0];
		var polygonPoints = [];
		for(var j = 0; j < coordinates.length; j++){
			polygonPoints.push(new L.LatLng(coordinates[j][1], coordinates[j][0]));
		}
		var colour = '';
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
    		fillOpacity: 0.5
		});
        $scope.map.addLayer(polygon);
	}
	
	// normal click
	$scope.$on('leafletDirectiveMap.click', function(event, locationEvent){
		console.log('OK');
		setTimeout(addMarker(locationEvent), 1000);
	});

	// double click
	// $scope.$on('leafletDirectiveMap.dblclick', function(event, locationEvent){ });

	// right-click
	$scope.$on('leafletDirectiveMap.contextmenu', function(event, locationEvent){
		$scope.map.markers = [];
    	$scope.markerCount = 0;
    	StorageService.setObject('mapMarkers', $scope.map.markers);
	});

	setTitle = function(msg){
		document.getElementById('title').innerHTML = '<h1 class="title">' + msg + '</h1>';
	};

	locate = function(){
		setTitle('Even geduld, positie wordt bepaald...');
		navigator.geolocation.getCurrentPosition(function(position){
			var center = {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
				zoom : 17
			};
			$timeout(function(){
        		$scope.map.center = center;
        		setTitle('');
    		}, 3000);
			StorageService.setObject('center', center);
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

	addMarker = function(locationEvent) {
		var lat = locationEvent.leafletEvent.latlng.lat;
		var lng = locationEvent.leafletEvent.latlng.lng;
		var tariff;
		for (var i = 0; i < zones.length; i++) {
			var geo = JSON.parse(zones[i].geometry);
			var coordinates = geo.coordinates[0];
			if (inPolygon([lng, lat], coordinates)) {
				tariff = zones[i].tariefkleur;
				break;
			}
		}

		AddressService.getAddress(lat, lng).then(function(data) {
			if (data.address.neighbourhood != undefined && tariff != undefined) {
				var tarief = TariffService.getTariffText(tariff);
				var marker = {
					lat: lat,
					lng: lng,
					message: data.address.neighbourhood + ' / ' + tarief,
					focus: true,
					draggable: false
				};
				$scope.map.markers[markerCount] = marker;
				markerCount++;
			}
			else if (data.address.city_district != undefined && tariff != undefined) {
				var tarief = TariffService.getTariffText(tariff);
				var marker = {
					lat: lat,
					lng: lng,
					message: data.address.city_district + ' / ' + tarief,
					focus: true,
					draggable: false
				};
				$scope.map.markers[markerCount] = marker;
				markerCount++;
			}
		});
		
	};
})

.controller('DataController', function($scope, $rootScope, $timeout, $http, $location, AddressService){
	setTitle = function(msg){
		document.getElementById('title').innerHTML = '<h1 class="title">' + msg + '</h1>';
	};
	$scope.search = {};
	$rootScope.foundAddress = {};
	
	$scope.searchAddress = function() {
		console.log($scope.search.address);
		AddressService.getCoordinates($scope.search.address).then(function(data) {
			$rootScope.foundAddress.lat = parseFloat(data[0].lat);
			$rootScope.foundAddress.lng = parseFloat(data[0].lon);
			$location.path("#/tab/map");
		});
	}
});
