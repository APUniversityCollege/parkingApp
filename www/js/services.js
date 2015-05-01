angular.module('parkingapp.services', [])

.factory('AddressService', ['$http', '$q', function($http, $q) {
	return {
		getCoordinates: function(address) {
			var q = $q.defer();
			$http.get('http://nominatim.openstreetmap.org/search?q=' + address + '&format=json').
				success(function(data, status, headers, config) {
					q.resolve(data);
				});
			return q.promise;
		},
		getAddress: function(lat, lng) {
			var q = $q.defer();
			$http.get('http://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1').
			success(function(data, status, headers, config) {
					q.resolve(data);
				});
			return q.promise;
		}
	}
}])

.factory('ZoneService', ['$http', '$q', function($http, $q) {
	return {
		getZones: function() {
			var q = $q.defer();
			$http.get('http://datasets.antwerpen.be/v4/gis/paparkeertariefzones.json').
				success(function(data, status, headers, config) {
					q.resolve(data.data);
				});
			return q.promise;
		}
	}
}])

.factory('TariffService', function() {
	//["Rood", "Lichtgroen", "Donkergroen", "Geel", "Oranje", "Blauw"]
	var tariffs = [
		{'kleur': 'Rood', 'max': 3, 'start': 9, 'einde': 22, 'dagen': ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
		'tarief': [1.60, 2.70, 3.80]},
		{'kleur': 'Donkergroen', 'max': 10, 'start': 9, 'einde': 19, 'dagen': ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
		'tarief': [0.70, 1.10], 'dagticket': 3.80},
		{'kleur': 'Lichtgroen', 'max': 10, 'start': 9, 'einde': 19, 'dagen': ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
		'tarief': [0.70, 1.10]},
		{'kleur': 'Geel', 'max': 10, 'start': 9, 'einde': 19, 'dagen': ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
		'tarief': [0.50]},
		{'kleur': 'Oranje', 'max': 10, 'start': 9, 'einde': 19, 'dagen': ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
		'tarief': [0.50], 'dagticket': 2.70},
		{'kleur': 'Blauw', 'max': 2, 'start': 9, 'einde': 18, 'dagen': ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
		'tarief': [0]}
	];
	
	return {
		getTariff: function(zone) {
			
		}
	}
})

.factory('StorageService', ['$window', function($window){
   return{
	  set: function(key, value){
		$window.localStorage[key] = value;
	  },
	  get: function(key, defaultValue){
		return $window.localStorage[key] || defaultValue;
	  },
	  setObject: function(key, value){
		$window.localStorage[key] = JSON.stringify(value);
	  },
	  getObject: function(key){
		return JSON.parse($window.localStorage[key] || '{}');
	  }
   }
}]);