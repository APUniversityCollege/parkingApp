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