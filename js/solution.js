var app = angular.module('BoundaryEntry', ['chart.js']);
var map;
var panel;
var selectedGrid; // selected feature object
var selectedFeature; //  JSON selected grid
var results;
var milePerMeter = 0.000621371;
var infowindow;
var infoWindowMarker;

var defaultMapName = "Unnamed Map";
var defaultMapDescription = "No Description";

// Google Map Overlays
var bsdOverlay;
var mapGrids;

var maxAccidentRate = [10,8,12,8,7,10];
var minAccidentRate = [0, 0, 2, 0, 0, 0];

var schoolData = {
    hs: [
        { id: 0, dbName: 'Aloha',  displayName: 'Aloha', color: 'blue', capacity: 2176, location: { lat: 45.4857177, lng: -122.8695357 } },
        { id: 1, dbName: 'Beaverton',  displayName: 'Beaverton', color: 'orange', capacity: 2122, location: { lat: 45.4862121, lng: -122.8111987 } },
        { id: 2, dbName: 'Cooper',  displayName: 'Cooper Mtn', color: 'green', capacity: 2176, location: { lat: 45.4263618, lng: -122.853657 } },
        { id: 3, dbName: 'Southridge',  displayName: 'Southridge', color: 'red', capacity: 1850, location: { lat: 45.4507757, lng: -122.8063213 } },
        { id: 4, dbName: 'Sunset',  displayName: 'Sunset', color: 'purple', capacity: 2203, location: { lat: 45.5275752, lng: -122.8188107 } },
        { id: 5, dbName: 'Westview',  displayName: 'Westview', color: 'pink', capacity: 2421, location: { lat: 45.5489509, lng: -122.8663216 } }
    ],
    ms: [

        { id: 6, dbName: 'Cedar Park',  displayName: 'Cedar Park', color: 'purple' },
        { id: 7, dbName: 'Conestoga',  displayName: 'Conestoga', color: 'orange' },
        { id: 8, dbName: 'Five Oaks',  displayName: 'Five Oaks', color: 'pink' },
        { id: 9, dbName: 'Highland Park',  displayName: 'Highland Park', color: 'blue' },
        { id: 10, dbName: 'Meadow Park',  displayName: 'Meadow Park', color: 'red' },
        { id: 11, dbName: 'Mountain View',  displayName: 'Mountain View', color: 'green' },
        { id: 12, dbName: 'Stoller',  displayName: 'Stoller', color: 'Peru' },
        { id: 13, dbName: 'Whitford',  displayName: 'Whitford', color: 'PaleVioletRed' },
        { id: 14, dbName: 'New Middle',  displayName: 'New Middle', color: 'yellow' }
    ],
    es: [
        { id: 15, dbName: 'Aloha-Huber Park',  displayName: 'Aloha-Huber Park', color: 'AliceBlue', stats: [{ year: 2015,frl: 0.817540323}] },
        { id: 16, dbName: 'Barnes',  displayName: 'Barnes', color: 'Brown', stats: [{ year: 2015,frl: 0.702956989}] },
        { id: 17, dbName: 'Beaver Acres',  displayName: 'Beaver Acres', color: 'Chartreuse', stats: [{ year: 2015,frl: 0.602564103}] },
        { id: 18, dbName: 'Bethany',  displayName: 'Bethany', color: 'Coral', stats: [{ year: 2015,frl: 0.138461538}] },
        { id: 19, dbName: 'Bonny Slope',  displayName: 'Bonny Slope', color: 'DarkGreen', stats: [{ year: 2015,frl: 0.087349398}] },
        { id: 20, dbName: 'Cedar Mill',  displayName: 'Cedar Mill', color: 'DarkMagenta', stats: [{ year: 2015,frl: 0.1179941}] },
        { id: 21, dbName: 'Chehalem',  displayName: 'Chehalem', color: 'DeepSkyBlue', stats: [{ year: 2015,frl: 0.599601594}] },
        { id: 22, dbName: 'Cooper Mountain',  displayName: 'Cooper Mountain', color: 'DarkOrange', stats: [{ year: 2015,frl: 0.163424125}] },
        { id: 23, dbName: 'Elmonica',  displayName: 'Elmonica', color: 'Gold', stats: [{ year: 2015,frl: 0.465870307}] },
        { id: 24, dbName: 'Errol Hassells',  displayName: 'Errol Hassell', color: 'HotPink', stats: [{ year: 2015,frl: 0.343621399}] },
        { id: 25, dbName: 'Findley',  displayName: 'Findley', color: 'Tomato', stats: [{ year: 2015,frl: 0.055012225}] },
        { id: 26, dbName: 'Fir Grove',  displayName: 'Fir Grove', color: 'MediumOrchid', stats: [{ year:2015,frl: 0.539370079}] },
        { id: 27, dbName: 'Greenway',  displayName: 'Greenway', color: 'Peru', stats: [{ year: 2015,frl: 0.670673077}] },
        { id: 28, dbName: 'Hazeldale',  displayName: 'Hazeldale', color: 'OrangeRed', stats: [{ year: 2015,frl: 0.519274376}] },
        { id: 29, dbName: 'Hiteon',  displayName: 'Hiteon', color: 'PaleGreen', stats: [{ year: 2015,frl: 0.278901734}] },
        { id: 30, dbName: 'Jacob Wismer',  displayName: 'Jacob Wismer', color: 'PaleVioletRed', stats: [{ year: 2015,frl: 0.056164384}] },
        { id: 31, dbName: 'Kinnaman',  displayName: 'Kinnaman', color: 'LightBlue', stats: [{ year: 2015,frl: 0.681502086}] },
        { id: 32, dbName: 'McKay',  displayName: 'Mckay', color: 'PaleVioletRed', stats: [{ year: 2015,frl: 0.568364611}] },
        { id: 33, dbName: 'McKinley',  displayName: 'Mckinley', color: 'Red', stats: [{ year: 2015,frl: 0.60949464}] },
        { id: 34, dbName: 'Montclair',  displayName: 'Montclair', color: 'Sienna', stats: [{ year: 2015,frl: 0.296089385}] },
        { id: 35, dbName: 'Nancy Ryles',  displayName: 'Nancy Ryles', color: 'SeaGreen', stats: [{ year: 2015,frl: 0.236462094}] },
        { id: 36, dbName: 'Oak Hills',  displayName: 'Oak Hills', color: 'Teal', stats: [{ year: 2015,frl: 0.166956522}] },
        { id: 37, dbName: 'Raleigh Hills',  displayName: 'Raleigh Hills', color: 'MediumVioletRed', stats: [{ year: 2015,frl: 0.407986111}] },
        { id: 38, dbName: 'Raleigh Park',  displayName: 'Raleigh Park', color: 'Navy', stats: [{ year: 2015,frl: 0.385572139}] },
        { id: 39, dbName: 'Ridgewood',  displayName: 'Ridgewood', color: 'YellowGreen', stats: [{ year: 2015,frl: 0.192743764}] },
        { id: 40, dbName: 'Rock Creek',  displayName: 'Rock Creek', color: 'SteelBlue', stats: [{ year: 2015,frl: 0.241509434}] },
        { id: 41, dbName: 'Scholls Heights',  displayName: 'Scholls Heights', color: 'RosyBrown', stats: [{ year: 2015,frl: 0.13271028}] },
        { id: 42, dbName: 'Sexton Mountain',  displayName: 'Sexton Mountain', color: 'RoyalBlue', stats: [{ year: 2015,frl: 0.146825397}] },
        { id: 43, dbName: 'Springville',  displayName: 'Springville', color: 'MediumTurquoise', stats: [{ year: 2015,frl: 0.192865106}] },
        { id: 44, dbName: 'Terra Linda',  displayName: 'Terra Linda', color: 'SaddleBrown', stats: [{ year: 2015,frl: 0.349168646}] },
        { id: 45, dbName: 'Vose',  displayName: 'Vose', color: 'SlateGray', stats: [{ year: 2015,frl: 0.853115727}] },
        { id: 46, dbName: 'West TV',  displayName: 'West Tualatin View', color: 'Yellow', stats: [{ year: 2015,frl: 0.078488372}] },
        { id: 47, dbName: 'William Walker',  displayName: 'William Walker', color: 'Salmon', stats: [{ year: 2015,frl: 0.823643411}] }
    ]
};

var selecting = false,
    selectedMarkers = [];

window.onkeydown = function (e) {
    selecting = ((e.keyIdentifier == 'Control') || (e.ctrlKey == true));
}
window.onkeyup = function (e) {
    selecting = false;
}

/*
 * This filter permits the printing of dynamically generated html that sce would
 * otherwise prevent. This is used, for example, by the GenStatsTable function.
 */
app.filter('html', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
});

app.constant("keyCodes", {
    ONE     : 49,
    TWO     : 50,
    THREE   : 51,
    FOUR    : 52,
    FIVE    : 53,
    SIX     : 54,
    SEVEN   : 55,
    EIGHT   : 56,
    NINE    : 57,
});

app.directive("keyboard", function($document, keyCodes) {
    return {
        link: function(scope, element, attrs) {

            var keysToHandle = scope.$eval(attrs.keyboard);
            var keyHandlers  = {};

            // Registers key handlers
            angular.forEach(keysToHandle, function(callback, keyName){
                var keyCode = keyCodes[keyName];
                keyHandlers[keyCode] = { callback: callback, name: keyName };
            });

            // Bind to document keydown event
            $document.on("keydown", function(event) {
                /* Don't process hotkeys when input fields are in focus */
                if (event.target.tagName == "INPUT") {
                    return;
                }
                var keyDown = keyHandlers[event.keyCode];

                // Handler is registered
                if (keyDown) {
                    event.preventDefault();

                    // Invoke the handler and digest
                    scope.$apply(function() {
                        keyDown.callback(keyDown.name, event.keyCode);
                    })
                }
            });
        }
    };
});

app.controller('BoundaryController', function ($scope, $http, $sce) {
    this.keys = {
        ONE    : function(name, code) { $scope.data.proposedHigh = schoolData.hs[0].dbName },
        TWO    : function(name, code) { $scope.data.proposedHigh = schoolData.hs[1].dbName },
        THREE  : function(name, code) { $scope.data.proposedHigh = schoolData.hs[2].dbName },
        FOUR   : function(name, code) { $scope.data.proposedHigh = schoolData.hs[3].dbName },
        FIVE   : function(name, code) { $scope.data.proposedHigh = schoolData.hs[4].dbName },
        SIX    : function(name, code) { $scope.data.proposedHigh = schoolData.hs[5].dbName },
        SEVEN  : function(name, code) { $scope.data.proposedHigh = "Closest" },
        EIGHT  : function (name, code) { $scope.data.proposedHigh = "Safest" },
        NINE   : function(name, code) { $scope.data.proposedHigh = "Unassigned" }
    };

    $scope.data = {
        "proposedHigh":"Cooper",
        "paintBy":"ES",
        "dragFunc":"pan",
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
        "total_students": 0,
        "total_capacity_p": 0,
        "milesTraveled":0,
        "total_transitions": 0,
        "total_split_es": 0,
        "total_split_ms": 0,
        "total_frl_p": 0,
        "students": [
            [2500, 2500, 2500, 2500, 2500, 2500],  // student count
            [0, 0, 0, 0, 0, 0]],                   // school capacity
        "capacity_p": [[0, 0, 0, 0, 0, 0]],        // percent of capacity
        "transitions": [[0, 0, 0, 0, 0, 0]],
        "split_es": [[0, 0, 0, 0, 0, 0]],
        "split_ms": [[0, 0, 0, 0, 0, 0]],
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
        "solutionSaveResponse":"",
        "mapName":defaultMapName,
        "mapDescription": defaultMapDescription,
        "accidentRate": [ [0, 0, 0, 0, 0, 0]],
        "totalAccidentRate": 0,
        "colorMap": "Proposed"
    };

    $scope.DBRefresh = function () {
        map.data.revertStyle();
        $http.get('/GetFeatures').then(function (response) {
            // Load current high school as proposed high school
            response.data.forEach(function AddSolution(grid){
                grid.properties.proposedHigh = grid.properties.high;
            });
            // FIXME: is this still necessary?
            // Perhaps we should call UpdateScopeData here instead?
            $scope.data.students[0] = ComputeStudents(response.data);
            $scope.data.solutionSaveResponse = "";

            RefreshFromGrids(response.data);
            Configure($scope);
        });
    };

    $scope.ChangeDragFunc = function () {
        var mapOptions = { draggable: ($scope.data.dragFunc=="pan")};
        map.setOptions(mapOptions)
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
        $scope.data.solutionSaveResponse = "Saving ..."
        map.data.toGeoJson(function (geoJson) {
            var solution = SolutionToJson($scope.data, geoJson.features, results);
            $http.post('/NewSolution', solution).then(function (response) {
                if (response.statusText == "OK") {
                    $scope.data.solutionSaveResponse = response.data;
                } else {
                    $scope.data.solutionSaveResponse = "Failed to save map: " + response.statusText;
                }
            });
        });
    };

    $scope.EditSolution = function () {
        $scope.data.solutionSaveResponse = "Editing ..."
        map.data.toGeoJson(function (geoJson) {
            var solution = SolutionToJson($scope.data, geoJson.features, results);
            solution._id = $scope.data.selectedSolution[0]._id;
            $http.post('/EditSolution', solution).then(function (response) {
                if (response.statusText == "OK") {
                    $scope.data.solutionSaveResponse = response.data;
                } else {
                    $scope.data.solutionSaveResponse = "Failed to edit map: " + response.statusText;
                }
            });
        });
    };

    $scope.DeleteSolution = function () {
        $scope.data.solutionSaveResponse = "Deleting ..."
        map.data.toGeoJson(function (geoJson) {
            var solution = SolutionToJson($scope.data, geoJson.features, results);
            solution._id = $scope.data.selectedSolution[0]._id;
            $http.post('/DeleteSolution', solution).then(function (response) {
                if (response.statusText == "OK") {
                    $scope.data.solutionSaveResponse = response.data;
                } else {
                    $scope.data.solutionSaveResponse = "Failed to delete map: " + response.statusText;
                }
            });
        });
    };


    $scope.LoadFromDB = function () {
        var queryString = {};

        if ($scope.data.searchName) {
            queryString.solutionName = $scope.data.searchName;
        }
        if ($scope.data.searchDescription) {
            queryString.solutionDescription = $scope.data.searchDescription;
        }
        if ($scope.data.searchUsername) {
            queryString.solutionUsername = $scope.data.searchUsername;
        }

        if ($scope.data.searchEmail) {
            queryString.email = $scope.data.searchEmail;
        }

        $http.post('/Solution', queryString).then(function (response) {
            $scope.data.solutions = response.data;
        });
    };

    $scope.SelectSolution = function () {
        var selectedSolution = $scope.data.selectedSolution;
        if (selectedSolution[0]["solutionName"]) {
            $scope.data.mapName = selectedSolution[0]["solutionName"];
        }
        if (selectedSolution[0]["solutionDescription"]) {
            $scope.data.mapDescription = selectedSolution[0]["solutionDescription"];
        }

        map.data.toGeoJson(function (geoJson) {
            JsonToSolution(selectedSolution[0], geoJson.features);

            var newData = new google.maps.Data({ map: map });
            var features = newData.addGeoJson(geoJson);

            // No error means GeoJSON was valid!
            map.data.setMap(null);
            map.data = newData;
            mapGrids = features;

            $scope.data.solutionName = selectedSolution[0]["solutionName"];
            $scope.data.solutionDescription = selectedSolution[0]["solutionDescription"];
            //$scope.data.solutionUsername = selectedSolution[0]["solutionUsername"];
            //$scope.data.solutionEmail = selectedSolution[0]["email"];
            $scope.data.solutionUrl = selectedSolution[0]["url"];

            results = Results(geoJson.features, schoolData);
            UpdateScopeData($scope, results);
            Configure($scope);
        });
    };


    /* Dynamically generate the stats table. This requires the angular sce
     * filter to trust the output as html */
    $scope.GenStatsTable = function () {
        var out = "";
        out += '<div class="stats-table">';
        out += '<div class="stats-header-row">';
        out += '    <div class="stats-header-cell">School</div>';
        out += '    <div class="stats-header-cell">Students<sup><a href="enrollmenterror.html">3</a></sup></div>';
        out += '    <div class="stats-header-cell">Capacity</div>';
        out += '    <div class="stats-header-cell">Proximity (miles)</div>';
        out += '    <div class="stats-header-cell">Crash Rate<sup><a href="crashrate.html">2</a></sup></div>';
        out += '    <div class="stats-header-cell">Transitions</div>';
        out += '    <div class="stats-header-cell">Split ES<sup>1</sup></div>';
        out += '    <div class="stats-header-cell">Split MS<sup>1</sup></div>';
        out += '    <div class="stats-header-cell">FRL</div>';
        out += '</div>';
        for (var i = 0; i < $scope.data.schools.length; i++) {
            out += '<div class="stats-row">';
            out += '    <div class="stats-cell">' + $scope.data.schools[i] + '</div>';
            out += '    <div class="stats-cell">' + Math.round($scope.data.students[0][i]) + '</div>';
            out += '    <div class="stats-cell">' + $scope.data.capacity_p[0][i] + '%</div>';
            out += '    <div class="stats-cell">' + $scope.data.distance[0][i] + '</div>';
            out += '    <div class="stats-cell">' + $scope.data.accidentRate[0][i] + '</div>';
            out += '    <div class="stats-cell">' + Math.round($scope.data.transitions[0][i]) + '</div>';
            out += '    <div class="stats-cell">' + $scope.data.split_es[0][i] + '</div>';
            out += '    <div class="stats-cell">' + $scope.data.split_ms[0][i] + '</div>';
            out += '    <div class="stats-cell">' + $scope.data.frl_p[0][i] + '%</div>';
            out += '</div>';
        }
        out += '<div class="stats-footer-row">';
        out += '    <div class="stats-footer-cell">District Total</div>';
        out += '    <div class="stats-footer-cell">' + Math.round($scope.data.total_students) + '</div>';
        out += '    <div class="stats-footer-cell">' + $scope.data.total_capacity_p + '%</div>';
        out += '    <div class="stats-footer-cell">' + $scope.data.milesTraveled + '</div>';
        out += '    <div class="stats-footer-cell">' + $scope.data.totalAccidentRate + '</div>';
        out += '    <div class="stats-footer-cell">' + Math.round($scope.data.total_transitions) + '</div>';
        out += '    <div class="stats-footer-cell">' + $scope.data.total_split_es + '</div>';
        out += '    <div class="stats-footer-cell">' + $scope.data.total_split_ms + '</div>';
        out += '    <div class="stats-footer-cell">' + $scope.data.total_frl_p + '%</div>';
        out += '</div>';
        out += '</div> <!-- Stats Table -->';
        return out;
    };

    /* Dynamically generate the stats summary table. This uses less precision
     * and a more compact layout to fit in the unprinted right panel. This
     * requires the angular sce filter to trust the output as html */
    $scope.GenStatsSummaryTable = function () {
        var out="";
        out += '<div class="stats-summary-table">';
        out += '<div class="stats-header-row">';
        out += '    <div class="stats-header-cell">School</div>';
        out += '    <div class="stats-header-cell">Cap</div>';
        out += '    <div class="stats-header-cell">Prox</div>';
        out += '    <div class="stats-header-cell">Crash</div>';
        out += '    <div class="stats-header-cell">Trans</div>';
        out += '    <div class="stats-header-cell">Split</div>';
        out += '    <div class="stats-header-cell">FRL</div>';

        out += '</div>';
        for (var i = 0; i < $scope.data.schools.length; i++) {
            out += '<div class="stats-row">';
            out += '    <div class="stats-cell">' + $scope.data.schools[i] + '</div>';
            out += '    <div class="stats-cell">' + Math.round($scope.data.capacity_p[0][i]) + '</div>';
            out += '    <div class="stats-cell">' + Math.round($scope.data.distance[0][i]) + '</div>';
            out += '    <div class="stats-cell">' + Math.round($scope.data.accidentRate[0][i]) + '</div>';
            out += '    <div class="stats-cell">' + Math.round($scope.data.transitions[0][i]) + '</div>';
            out += '    <div class="stats-cell">' + Math.round($scope.data.split_es[0][i]) + '</div>';
            out += '    <div class="stats-cell">' + Math.round($scope.data.frl_p[0][i]) + '</div>';
            out += '</div>';
        }
        out += '<div class="stats-footer-row">';
        out += '    <div class="stats-footer-cell">Total</div>';
        out += '    <div class="stats-footer-cell">' + Math.round($scope.data.total_capacity_p) + '</div>';
        out += '    <div class="stats-footer-cell">' + Math.round($scope.data.milesTraveled) + '</div>';
        out += '    <div class="stats-footer-cell">' + Math.round($scope.data.totalAccidentRate) + '</div>';
        out += '    <div class="stats-footer-cell">' + Math.round($scope.data.total_transitions) + '</div>';
        out += '    <div class="stats-footer-cell">' + Math.round($scope.data.total_split_es) + '</div>';
        out += '    <div class="stats-footer-cell">' + Math.round($scope.data.total_frl_p) + '</div>';
        out += '</div>';
        out += '</div> <!-- Stats Table -->';
        return out;
    };

    $scope.ColorMap = function () {
        Configure($scope);
 //       $scope.$apply();
    };

    function initMap() {
        // Initialise the map.
        //var myLatLng = { lat: 45.4834817, lng: -122.8216516 };
        var myLatLng = { lat: 45.4980000, lng: -122.8216516 };
        var mapProp = {
            center: myLatLng,
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        map = new google.maps.Map(document.getElementById('map-holder'), mapProp);
        
        infowindow = new google.maps.InfoWindow;
        infoWindowMarker = new google.maps.Marker();

        // Add the BSD boundary overlay
        var imageBounds = {
            north: 45.577690,
            south: 45.415266,
            east: -122.730426,
            west: -122.921350,
        };

        bsdOverlay = new google.maps.GroundOverlay('http://bsdmaps.monkeyblade.net/bsd-boundary-existing-overlay.png', imageBounds);
        bsdOverlay.setMap(map);

        /*
         * Add google markers for each high school
         * Include the first letter of the name in the pin icon
         * Use the displayName in a tooltip
         * Set clickable to false and pass clicks through to the underlying GC
         */
        var hs_markers = new Array(schoolData.hs.length);
        for (var i = 0; i < schoolData.hs.length; i++) {
            hs_markers[i] = new google.maps.Marker({
                position: schoolData.hs[i].location,
                map: map,
                clickable: false,
                label: schoolData.hs[i].displayName,
                title: schoolData.hs[i].displayName
            });
        }

        panel = document.getElementById('panel');

        var schools = [];
        var capacity = [];

        for(var i=0; i< schoolData.hs.length; i++) {
            schools[i] = schoolData.hs[i].displayName;
            capacity[i] = schoolData.hs[i].capacity;
        }

        /* save immutable data - doesn't change with boundary changes */

        $scope.data.schools = schools;
        $scope.data.students[1] = capacity;

        $http.get('/GetFeatures').then(function (response) {
            response.data.forEach(function AddSolution(grid){
                grid.properties.proposedHigh = grid.properties.high;
            });

            results = Results(response.data, schoolData);
            UpdateScopeData($scope, results);
            RefreshFromGrids(response.data);
            Configure($scope);
        });
    };

    initMap();
});

function RefreshFromGrids(grids) {
    try {
        var geoJsonData = { "type": "FeatureCollection", "features": grids };

        geoJsonData.features.forEach(function (grid, iGrid) {
            if (grid._id) {
                grid.properties.id = grid._id;
            }
        });

        var newData = new google.maps.Data({map: map});
        var features = newData.addGeoJson(geoJsonData);

        // No error means GeoJSON was valid!
        map.data.setMap(null);
        map.data = newData;
        mapGrids = features;

    } catch (error) {
        if (newData) { newData.setMap(null); }
        if (geoJsonInput.value !== "") {
            setGeoJsonValidity(false);
        } else {
            setGeoJsonValidity(true);
        }
        return;
    }
};

/* Update all the $scope.data from the calculated results */
function UpdateScopeData($scope, results) {
    var cap = 0;
    var students = 0;
    var frl = 0;

    for (var i = 0; i < results.schools.length; i++) {
        $scope.data.students[0][i] = results.schools[i].students;
        $scope.data.capacity_p[0][i] = results.schools[i].capacity_p;
        $scope.data.distance[0][i] = results.schools[i].distance;
        $scope.data.transitions[0][i] = results.schools[i].transitions;
        $scope.data.split_es[0][i] = results.schools[i].split_es;
        $scope.data.split_ms[0][i] = results.schools[i].split_ms;
        $scope.data.frl_p[0][i] = results.schools[i].frl_p;
        $scope.data.accidentRate[0][i] = results.schools[i].accidentRate.toFixed(2);

        students += $scope.data.students[0][i];
        cap += $scope.data.students[1][i];
        frl += results.schools[i].frl;
    }

    $scope.data.total_students = students;
    $scope.data.total_capacity_p = (100 * students/cap).toFixed(2);
    $scope.data.milesTraveled = results.distance;
    $scope.data.total_transitions = results.transitions;
    $scope.data.total_split_es = results.split_es;
    $scope.data.total_split_ms = results.split_ms;    
    $scope.data.total_frl_p = (100 * frl / students).toFixed(2);
    $scope.data.totalAccidentRate = results.totalAccidentRate.toFixed(2);

    $scope.data.solutionSaveResponse = "";
}

function Configure($scope) {
    // Initialise the map.
    map.data.setControls(['LineString', 'Polygon']);

    map.data.setStyle(function (feature) {
        var highSchool = feature.getProperty('proposedHigh');
        var gc = feature.getProperty('gc');
        var color = 'grey';

        if ($scope.data.colorMap == 'Proposed') {
            var school = FindSchool(highSchool, schoolData);
            if (school) {
                color = school.color;
            }
        } 
        else if ($scope.data.colorMap == 'Distance') {
            for (var i = 0; i < schoolData.hs.length; i++) {
                if (highSchool == schoolData.hs[i].dbName) {
                    var distances = feature.getProperty('distance');
                    var distance = distances[i];
                    color = HeatMapRG(1000, 5000, distance);
                }
            }
        }
        else {
            if ($scope.data.colorMap != 'Safety') {
                highSchool = $scope.data.colorMap;
            }
            for (var i = 0; i < schoolData.hs.length; i++) {
                if (highSchool == schoolData.hs[i].dbName) {
                    var accidentRates = feature.getProperty('accidentRate');
                    var accidentRate = accidentRates[i];
                    color = HeatMapRG(minAccidentRate[i], maxAccidentRate[i], accidentRates[i]);
                }
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
        map.data.revertStyle();
        infoWindowMarker.setMap(null);
        map.data.overrideStyle(event.feature, { strokeWeight: 1 });

        if (event.Fb.buttons & 0x1 && $scope.data.dragFunc == "paint") {
            var proposedHigh = $scope.data.proposedHigh;
            if (proposedHigh) {
                // Record selected grid and grid data
                selectedGrid = event.feature;
                selectedGrid.setProperty('proposedHigh', ProposedHigh(proposedHigh, selectedGrid));
                selectedES = selectedGrid.getProperty('elementary');

                var numEsGrids = 0;
                if ($scope.data.paintBy == "ES") {
                    mapGrids.forEach(function (grid) {
                        if (grid.getProperty('elementary') == selectedES) {
                            grid.setProperty('proposedHigh', ProposedHigh(proposedHigh, grid));
                            numEsGrids++;
                        }
                    });
                }

                map.data.toGeoJson(function (geoJson) {
                    results = Results(geoJson.features, schoolData);
                });

                $scope.data.mapName = defaultMapName;
                $scope.data.mapDescription = defaultMapDescription;

                UpdateScopeData($scope, results);
                $scope.$apply();
            }
        }
    });

    map.data.addListener('mouseout', function (event) {
        map.data.revertStyle();
    });


    map.data.addListener('click', selectGrid = function (event) {
        if (selecting) {
            var thisGrid = event.feature;
        
            var accidentNum = thisGrid.getProperty("accidentRate");
            var accidentStr = [];
            accidentNum.forEach(function (rate, iRate) {
                accidentStr.push(rate.toFixed(2));
            });
        
            thisGrid.getProperty("accidentRate");
        
            var msg = "gc:" + thisGrid.getProperty("gc") +
                    "<br>High School:" + thisGrid.getProperty("high") +
                    "<br>Proposed:" + thisGrid.getProperty("proposedHigh") +
                    "<br>Students:" + thisGrid.getProperty("hs2020") +
                    "<br>Dist:" + thisGrid.getProperty("distance") +
                    "<br>Crash:" + accidentStr;
            
            infoWindowMarker.setMap(null);          

            infowindow.setContent(msg);
            infowindow.open(map, infoWindowMarker);
            var centroid = thisGrid.getProperty("centroid");
            infoWindowMarker.setPosition({ lat: centroid[1], lng: centroid[0] });
            infoWindowMarker.setVisible(false);
            infoWindowMarker.setMap(map);
        }
        else {
            var proposedHigh = $scope.data.proposedHigh;
            if (proposedHigh) {
                // Record selected grid and grid data
                selectedGrid = event.feature;
                selectedGrid.setProperty('proposedHigh', ProposedHigh(proposedHigh, selectedGrid));
                selectedES = selectedGrid.getProperty('elementary');
                
                var numEsGrids = 0;
                if ($scope.data.paintBy == "ES") {
                    mapGrids.forEach(function (grid) {
                        if (grid.getProperty('elementary') == selectedES) {
                            grid.setProperty('proposedHigh', ProposedHigh(proposedHigh, grid));
                            numEsGrids++;
                        }
                    });
                }
                
                console.log("click elementary grids=" + numEsGrids);
                
                map.data.toGeoJson(function (geoJson) {
                    results = Results(geoJson.features, schoolData);
                });
                
                $scope.data.mapName = defaultMapName;
                $scope.data.mapDescription = defaultMapDescription;
                
                UpdateScopeData($scope, results);
                $scope.$apply();
            }
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
    //var gcSearch = 910;
    //solution.grids.forEach(function (grid, iGrid) {
    //    if (grid.gc == gcSearch) {
    //        console.log("Solution found "+ gcSearch + " index " + iGrid + " proposedHS " + grid.proposedHigh);
    //    }
    //});

    //gridData.forEach(function (grid, iGrid) {
    //    if (grid.properties.gc == gcSearch) {
    //        console.log("Grids found " + gcSearch + " index " + iGrid + " proposedHS " + grid.properties.proposedHigh);
    //    }
    //});


    for (var i = 0; i < gridData.length; i++) {
        if(gridData[i].properties.gc == solution.grids[i].gc)
        {
            gridData[i].properties.proposedHigh = solution.grids[i].proposedHigh;
        }
        else { // Exhaustive search is definately not the best method but did not see a better search build in to JS
            var findGC = gridData[i].properties.gc;
            var solutionLength = solution.grids.length;
            var match = 0;
            for (var index = 0; index < solutionLength /*&& !match*/; index++){
                if (gridData[i].properties.gc == solution.grids[index].gc) {
                    match++;
                    gridData[i].properties.proposedHigh = solution.grids[index].proposedHigh;
                }
            }
            if (match == 0) {
                gridData[i].properties.proposedHigh = gridData[i].properties.high;
                console.log("Grid code index " + solution.grids[i].gc + " not found in solution");
            }
            else if (match > 1) {
                console.log("Grid code index " + solution.grids[i].gc + " found "+ match+ " times in solution.");
            }
        }
    }
}

function Results(grids, schoolData)
{
    var numSchools = schoolData.hs.length;
    var split_es = {};
    var split_ms = {};
    var results = {transitions:0, distance:0, schools:[], split_es:0, split_ms:0};
    for(var i=0; i<numSchools; i++)
    {
        results.schools[i] = {dbname:schoolData.hs[i].dbName, students:0, capacity_p:0, distance:0, transitions:0, split_es:0, split_ms:0, frl:0, frl_p:0, accidentRate:0};
    }

    results.totalAccidentRate = 0;

    grids.forEach(function (grid){
        var hs = grid.properties.proposedHigh;
        var ms = grid.properties.middle;
        var es = grid.properties.elementary;
        for(var i=0; i<numSchools; i++)
        {
            // Compute proposed school stats
            if(hs == schoolData.hs[i].dbName)
            {
                results.schools[i].students += grid.properties.hs2020;
                results.schools[i].distance += grid.properties.hs2020*grid.properties.distance[i];
                results.schools[i].frl += FrlFit(grid.properties);

                if (grid.properties.accidentRate) {
                    results.schools[i].accidentRate += grid.properties.hs2020 * grid.properties.accidentRate[i] * 2*365/1e6;
                }
            }
            // Compute transitions by existing school
            if(grid.properties.high == schoolData.hs[i].dbName && hs != grid.properties.high){
                results.schools[i].transitions += grid.properties.hs2020;
            }
        }

        // Create a dictionary key:es value [] of hs the es feeds to
        if (!(es in split_es)) {
            split_es[es] = [];
        }
        if (split_es[es].indexOf(hs) == -1) {
            split_es[es].push(hs);
        }

        if (!(ms in split_ms)) {
            split_ms[ms] = [];
        }
        if (split_ms[ms].indexOf(hs) == -1) {
            split_ms[ms].push(hs);
        }
    });

    // Calculate per results from grid totals calculated above
    // Convert native results distance to miles
    for(var i=0; i<numSchools; i++)
    {
        results.schools[i].capacity_p = 100*results.schools[i].students/schoolData.hs[i].capacity;
        results.schools[i].distance *= milePerMeter;
        results.distance += results.schools[i].distance;
        results.transitions += results.schools[i].transitions;
        if (results.schools[i].students) {
            results.schools[i].frl_p = 100*results.schools[i].frl/(results.schools[i].students);
        }

        /*
         * For every split elementary school, if this high school is listed,
         * increment the split_es for this high school.
         */
        for (key in split_es) {
            if (split_es[key].length > 1) {
                if (split_es[key].indexOf(results.schools[i].dbname) >= 0) {
                    results.schools[i].split_es += 1;
                }
            }
        }
        
        for (key in split_ms) {
            if (split_ms[key].length > 1) {
                if (split_ms[key].indexOf(results.schools[i].dbname) >= 0) {
                    results.schools[i].split_ms += 1;
                }
            }
        }

        if (results.schools[i].accidentRate) {
            results.totalAccidentRate += results.schools[i].accidentRate;
        }

        // Reduce decimal places to 2 (FIXME this is formatting and should be elsewhere)
        results.schools[i].capacity_p = (results.schools[i].capacity_p).toFixed(2);
        results.schools[i].distance = (results.schools[i].distance).toFixed(2);
        results.schools[i].frl_p = (results.schools[i].frl_p).toFixed(2);
    }
    results.distance = results.distance.toFixed(2);

    // Sum the number of split elementary schools
    for (key in split_es) {
        if (split_es[key].length > 1) {
            results.split_es++;
        }
    }
    
    for (key in split_ms) {
        if (split_ms[key].length > 1) {
            results.split_ms++;
        }
    }

    return results;
}

function ComputeStudents(db)
{
    var numSchools = schoolData.hs.length;
    var students = Array.apply(null, new Array(numSchools)).map(Number.prototype.valueOf,0);

    db.forEach(function (grid){
        var hs = grid.properties.proposedHigh;
        for(var i=0; i<numSchools; i++)
        {
            if(hs == schoolData.hs[i].dbName)
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

function FrlFit(properties) {
    var frlFit = 0;
    
    for (var i = 0; i < schoolData.es.length && frlFit == 0; i++) {
        if (schoolData.es[i].dbName == properties.elementary) {
            frlFit = schoolData.es[i].stats[0].frl;
        }
    }
    
    // Fit elementary FRL enrollment to high school FRL enrollment
    switch(properties.high)
    {
        case "Aloha":
            frlFit *= 0.94329553;
            break;
        case "Beaverton":
            frlFit *= 0.874746656;
            break;
        case "Southridge":
            frlFit *= 0.860929557;
            break;
        case "Sunset":
            frlFit *= 0.843979058;
            break;
        case "Westview":
            frlFit *= 1.027689031;
            break;
    }

    if (frlFit == 0) {
        console.log("frlFit did not find " + properties.elementary);
    }

    return frlFit*properties.hs2020;
}

function ProposedHigh(inProposedHigh, grid) {
    var proposedHigh = inProposedHigh;

    if (proposedHigh == 'Closest') {
        var distance = grid.getProperty('distance');
        if (distance && distance.length > 1) {
            var minDistance = distance[0];
            var proposedHigh = schoolData.hs[0].dbName;

            for (var i = 0; i < distance.length; i++) {
                if (distance[i] < minDistance) {
                    minDistance = distance[i];
                    proposedHigh = schoolData.hs[i].dbName;
                }
            }
        }
    }

    if (proposedHigh == 'Safest') {
        var accidentRate = grid.getProperty('accidentRate');
        var distance = grid.getProperty('distance');
        if (accidentRate && accidentRate.length > 1) {
            var minRate = accidentRate[0];
            var proposedHigh = schoolData.hs[0].dbName;

            for (var i = 0; i < accidentRate.length; i++) {
                if (accidentRate[i] <= minRate) {
                    minRate = accidentRate[i];
                    proposedHigh = schoolData.hs[i].dbName;
                }
            }
        }
    }

    return proposedHigh;
}

function FindSchool(schoolName, schoolsData) {
    var school;
    for (var i = 0; i < schoolData.hs.length && school == null; i++) {
        if (schoolName == schoolData.hs[i].dbName) {
            school = schoolData.hs[i];
        }
    }
    return school;
}
