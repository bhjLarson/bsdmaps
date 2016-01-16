var app = angular.module('BoundaryEntry', ['chart.js']);
var map;
var panel;
var selectedGrid; // selected feature object
var selectedFeature; //  JSON selected grid
var results;
var milePerMeter = 0.000621371;

// Google Map Overlays
var bsdOverlay;
var mapGrids;

var schoolData = {schools:[
    {id:0, dbName:'Aloha', displayName:'Aloha', color:'blue', capacity:2176, location:{ lat: 45.4846754, lng: -122.8711176 }},
    {id:1, dbName:'Beaverton', displayName:'Beaverton', color:'orange', capacity:2122, location:{ lat: 45.4862466, lng: -122.8127043 }},
    {id:2, dbName:'Cooper', displayName:'Cooper Mtn', color:'green', capacity:2176, location:{ lat: 45.4246773, lng: -122.8589781 }},
    {id:3, dbName:'Southridge', displayName:'Southridge', color:'red', capacity:1850, location:{ lat: 45.450176, lng: -122.8097826 }},
    {id:4, dbName:'Sunset', displayName:'Sunset', color:'purple', capacity:2203, location:{ lat: 45.5275796, lng: -122.8188543 }},
    {id:5, dbName:'Westview', displayName:'Westview', color:'pink', capacity:2421, location:{ lat: 45.55027, lng: -122.8682147}},
    ]};

app.controller('BoundaryController', function ($scope, $http) {
    $scope.data = {
        "proposedHigh":"Cooper",
        "paintBy":"ES",
        "gc": 0,
        "hs2020": 0,
        "reducedLunch": 0,
        "high": "",
        "middle": "",
        "elementary": "",
        "centroid": [0,0],
        "schools": [],
        "distance":[[0, 0, 0, 0, 0, 0]],
        "time": [0, 0, 0, 0, 0, 0],
        "total_transitions": 0,
        "milesTraveled":0,
        "students": [
            [2500, 2500, 2500, 2500, 2500, 2500],  // student count
            [0, 0, 0, 0, 0, 0]],                   // school capacity
        "capacity_p": [[0, 0, 0, 0, 0, 0]],        // percent of capacity
        "transitions": [[0, 0, 0, 0, 0, 0]],
        "frl_p": [[0, 0, 0, 0, 0, 0]],
        "solutionName":"",
        "solutionDescription":"",
        "solutionUsername": "",
        "solutionEmail": "",
        "solutionUrl": "",
        "searchName": "",
        "searchDescription": "",
        "searchUsername": "",
        "searchEmail": "",
        "solutions":[],
        "primaryObjectives": [],
        "otherObjectives": [],
        "solutionSaveResponse":""
    };

    $scope.DBRefresh = function () {
        map.data.revertStyle();
        $http.get('/GetFeatures').then(function (response) {
            // Load current high school as proposed high school
            response.data.forEach(function AddSolution(grid){
                grid.properties.proposedHigh = grid.properties.high;
            });
            // FIXME: is this still necessary?
            $scope.data.students[0] = ComputeStudents(response.data);
            RefreshFromGrids(response.data);
            Configure($scope);
        });
    };
	
	var SaveJsonToFile = (function () {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		return function (data, defaultFileName) {
			var json = JSON.stringify(data),
				blob = new Blob([json], {type: "octet/stream"}),
				url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = defaultFileName;
			a.click();
			window.URL.revokeObjectURL(url);
		};
	}());	
	
    $scope.SaveToFile = function() {

		map.data.toGeoJson(function (geoJson) {
			var solution = SolutionToJson($scope.data, geoJson.features, results);
            var defaultFileName = "solution.json";
			SaveJsonToFile(solution, defaultFileName);
		}); 		
    };	
    
    $scope.SaveSolution = function () {
        map.data.toGeoJson(function (geoJson) {
            var solution = SolutionToJson($scope.data, geoJson.features, results);
            $http.post('/NewSolution', solution).then(function (response) {
                $scope.data.solutionSaveResponse = response.toString();
            });
        });
    };

    
    $scope.LoadFromDB = function () {
        var queryString = {};
        
        if ($scope.data.searchName) {
            queryString.solutionName = $scope.data.searchName;
        }
        if ($scope.data.searcDescription) {
            queryString.searcDescription = $scope.data.searcDescription;
        }
        if ($scope.data.searchUsername) {
            queryString.searchUsername = $scope.data.searchUsername;
        }
        
        if ($scope.data.searchEmail) {
            queryString.searchEmail = $scope.data.searchEmail;
        }
        
        $http.post('/Solution', queryString).then(function (response) {

            $scope.data.solutions = response.data;
            $scope.$apply();


        });
    };
    
    $scope.SelectSolution = function () {
        var selectedSolution = $scope.data.selectedSolution;

        map.data.toGeoJson(function (geoJson) {
            JsonToSolution(selectedSolution[0], geoJson.features);
            
            var newData = new google.maps.Data({ map: map });
            var features = newData.addGeoJson(geoJson);
            
            // No error means GeoJSON was valid!
            map.data.setMap(null);
            map.data = newData;
            mapGrids = features;
            
            results = Results(geoJson.features, schoolData);
            $scope.data.transitions = results.transitions;
            for (var i = 0; i < results.schools.length; i++) {
                $scope.data.students[0][i] = results.schools[i].students;
            }
            $scope.data.milesTraveled = milePerMeter * results.distance;
            Configure($scope);
            $scope.$apply();
        });
    };
      	
	
    $scope.series = ['Students', 'Capacity 35/90'];


    function initMap() {
        // Initialise the map.
        var myLatLng = { lat: 45.4834817, lng: -122.8216516 };
        var mapProp = {
            center: myLatLng,
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        map = new google.maps.Map(document.getElementById('map-holder'), mapProp);

        // Add the BSD boundary overlay
        var imageBounds = {
            north: 45.577690,
            south: 45.415266,
            east: -122.730426,
            west: -122.921350,
        };

        bsdOverlay = new google.maps.GroundOverlay('http://bsdmaps.monkeyblade.net/bsd-boundary-existing-overlay.png', imageBounds);
        bsdOverlay.setMap(map);

        panel = document.getElementById('panel');

        var schools = [];
        var capacity = [];

        for(var i=0; i< schoolData.schools.length; i++)
        {
            schools[i] = schoolData.schools[i].displayName;
            capacity[i] = schoolData.schools[i].capacity;
        }

        $scope.data.schools = schools;
        $scope.data.students[1] = capacity;

        $http.get('/GetFeatures').then(function (response) {
            response.data.forEach(function AddSolution(grid){
                grid.properties.proposedHigh = grid.properties.high;
            });

            // FIXME: we do this assignment in a few places, need to refactor
            results = Results(response.data, schoolData);
            for(var i=0; i<results.schools.length; i++)
            {
                $scope.data.students[0][i] = results.schools[i].students;
                $scope.data.capacity_p[0][i] = (100*results.schools[i].students/capacity[i]).toFixed(2);
                $scope.data.distance[0][i] = results.schools[i].distance;
                $scope.data.transitions[0][i] = results.schools[i].transitions;
                $scope.data.frl_p[0][i] = results.schools[i].frl_p;
            }
            $scope.data.milesTraveled = results.distance;
            $scope.data.total_transitions = results.transitions;

            RefreshFromGrids(response.data);
            Configure($scope);
        });
    };

    initMap();
});

function RefreshFromGrids(grids) {
    try {
        var geoJsonData = { "type": "FeatureCollection", "features": grids };

        var newData = new google.maps.Data({map: map});
        var features = newData.addGeoJson(geoJsonData);

        // No error means GeoJSON was valid!
        map.data.setMap(null);
        map.data = newData;
        mapGrids = features;

    } catch (error) {
        newData.setMap(null);
        if (geoJsonInput.value !== "") {
            setGeoJsonValidity(false);
        } else {
            setGeoJsonValidity(true);
        }
        return;
    }
};


function Configure($scope) {
    // Initialise the map.
    map.data.setControls(['LineString', 'Polygon']);

    map.data.setStyle(function (feature) {
        var highSchool = feature.getProperty('proposedHigh');

        var color = 'grey';
        for(var i=0; i<schoolData.schools.length && color == 'grey'; i++)
        {
            var school = schoolData.schools[i];
            if(highSchool == school.dbName)
            {
                color = school.color;
            }
        }

        return { editable: false, draggable: false, strokeWeight: 0, fillColor: color };
    });

    map.data.addListener('addfeature' , function (ev) {
        map.data.revertStyle();
        newFeature = null;
        ev.feature.toGeoJson(function (grid) {
            newFeature = grid;
        });
    });

    map.data.addListener('mouseover', function (event) {
        if (selectedGrid == null) {
            map.data.revertStyle();
            map.data.overrideStyle(event.feature, { strokeWeight: 1 });
        }
    });
    
    map.data.addListener('mouseout', function (event) {
        if (selectedGrid == null) {
            map.data.revertStyle();
        }
    });
    
    map.data.addListener('click', selectGrid = function (event) {
        map.data.revertStyle();
        
        var proposedHigh = $scope.data.proposedHigh;
        if (proposedHigh) {
            // Record selected grid and grid data
            selectedGrid = event.feature;
            selectedGrid.setProperty('proposedHigh', proposedHigh);
            selectedES = selectedGrid.getProperty('elementary');
            
            console.log("click proposedHigh=" + proposedHigh + " elementary=" + selectedES);
            
            var numEsGrids = 0;
            if ($scope.data.paintBy == "ES") {
                mapGrids.forEach(function (grid) {
                    if (grid.getProperty('elementary') == selectedES) {
                        grid.setProperty('proposedHigh', proposedHigh);
                        numEsGrids++;
                    }
                });
            }

            console.log("click elementary grids=" + numEsGrids);
            
            // FIXME: This is done multiple places
            results = MapResults(mapGrids, schoolData);
            for (var i = 0; i < results.schools.length; i++) {
                $scope.data.students[0][i] = results.schools[i].students;
                $scope.data.capacity_p[0][i] = results.schools[i].capacity_p;
                $scope.data.distance[0][i] = results.schools[i].distance;
                $scope.data.transitions[0][i] = results.schools[i].transitions;
                $scope.data.frl_p[0][i] = results.schools[i].frl_p;
            }
            $scope.data.milesTraveled = results.distance;
            $scope.data.total_transitions = results.transitions;            
            $scope.$apply();
        }
    });
};

function SolutionToJson(formData, gridData, resultsData)
{
    var solution = {
        solutionName: formData.solutionName, 
        solutionDescription: formData.solutionDescription, 
        solutionUsername: formData.solutionUsername, 
        email: formData.solutionEmail, 
        url: formData.solutionUrl,
        grids: [], 
        results: resultsData
    };
	for(var i=0; i<gridData.length; i++)
	{
		solution.grids[i] = {gc:gridData[i].properties.gc, proposedHigh:gridData[i].properties.proposedHigh};
	}

	return solution;
}

function JsonToSolution(solution, gridData)
{
	for(var i=0; i< solution.grids.length; i++)
	{
		if(gridData[i].properties.gc = solution.grids[i].gc)
		{
			gridData[i].properties.proposedHigh = solution.grids[i].proposedHigh;
		}
		else
		{
			console.log("Unexpected grid code index " + solution.grids[i].gc);
		}
	}
}

function MapResults(mapGrids, schoolData) {
    var numSchools = schoolData.schools.length;
    var results = { transitions: 0, distance: 0, schools: [] };
    for (var i = 0; i < numSchools; i++) {
        results.schools[i] = { dbname: schoolData.schools[i].dbName, students: 0, capacity_p: 0, distance: 0, transitions: 0, frl: 0, frl_p: 0 };
    }
    
    mapGrids.forEach(function (grid) {
        var proposedHs = grid.getProperty('proposedHigh') ;
        var distance = grid.getProperty('distance');
        for (var i = 0; i < numSchools; i++) {
            // Compute proposed school stats
            var projectedStudents = grid.getProperty('hs2020');
            if (proposedHs == schoolData.schools[i].dbName) {
                results.schools[i].students += projectedStudents;
                results.schools[i].distance += projectedStudents * distance[i] ;
                results.schools[i].frl += grid.getProperty('reducedLunch');
            }
            // Compute transitions by existing school
            var currentHs = grid.getProperty('high');
            if (currentHs == schoolData.schools[i].dbName && proposedHs != currentHs) {
                results.schools[i].transitions += projectedStudents;
            }
        }
    });
    
    // Calculate per results from grid totals calculated above
    // Convert native results distance to miles
    for (var i = 0; i < numSchools; i++) {
        results.schools[i].capacity_p = 100 * results.schools[i].students / schoolData.schools[i].capacity;
        results.schools[i].distance *= milePerMeter;
        results.distance += results.schools[i].distance;
        results.transitions += results.schools[i].transitions;
        if (results.schools[i].students) {
            results.schools[i].frl_p = 100 * results.schools[i].frl / (results.schools[i].students);
        }
        
        
        // Reduce decimal places to 2 (FIXME this is formatting and should be elsewhere)
        results.schools[i].capacity_p = (results.schools[i].capacity_p).toFixed(2);
        results.schools[i].distance = (results.schools[i].distance).toFixed(2);
        results.schools[i].frl_p = (results.schools[i].frl_p).toFixed(2);
    }
    results.distance = results.distance.toFixed(2);
    
    return results;
}

function Results(grids, schoolData)
{
    var numSchools = schoolData.schools.length;
    var results = {transitions:0, distance:0, schools:[]};
    for(var i=0; i<numSchools; i++)
    {
        results.schools[i] = {dbname:schoolData.schools[i].dbName, students:0, capacity_p:0, distance:0, transitions:0, frl:0, frl_p:0};
    }

    grids.forEach(function (grid){
        var hs = grid.properties.proposedHigh;
        for(var i=0; i<numSchools; i++)
        {
            // Compute proposed school stats
            if(hs == schoolData.schools[i].dbName)
            {
                results.schools[i].students += grid.properties.hs2020;
                results.schools[i].distance += grid.properties.hs2020*grid.properties.distance[i];
                results.schools[i].frl += grid.properties.reducedLunch;
            }
            // Compute transitions by existing school
            if(grid.properties.high == schoolData.schools[i].dbName && hs != grid.properties.high)
            {
                results.schools[i].transitions += grid.properties.hs2020;
            }
        }
    });

    // Calculate per results from grid totals calculated above
    // Convert native results distance to miles
    for(var i=0; i<numSchools; i++)
    {
        results.schools[i].capacity_p = 100*results.schools[i].students/schoolData.schools[i].capacity;
        results.schools[i].distance *= milePerMeter;
        results.distance += results.schools[i].distance;
        results.transitions += results.schools[i].transitions;
        if (results.schools[i].students) {
            results.schools[i].frl_p = 100*results.schools[i].frl/(results.schools[i].students);
        }


        // Reduce decimal places to 2 (FIXME this is formatting and should be elsewhere)
        results.schools[i].capacity_p = (results.schools[i].capacity_p).toFixed(2);
        results.schools[i].distance = (results.schools[i].distance).toFixed(2);
        results.schools[i].frl_p = (results.schools[i].frl_p).toFixed(2);
    }
    results.distance = results.distance.toFixed(2);

    return results;
}

function ComputeStudents(db)
{
    var numSchools = schoolData.schools.length;
    var students = Array.apply(null, new Array(numSchools)).map(Number.prototype.valueOf,0);

    db.forEach(function (grid){
        var hs = grid.properties.proposedHigh;
        for(var i=0; i<numSchools; i++)
        {
            if(hs == schoolData.schools[i].dbName)
            {
                students[i] += grid.properties.hs2020;
            }
        }
    });
    return students;
}

function Transitions(db)
{
    var transitions = 0;
    db.forEach(function (grid){
        if(grid.properties.proposedHigh != grid.properties.high)
        {
            transitions += grid.properties.hs2020;
        }
    });
    return transitions;
}


