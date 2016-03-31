var app = angular.module('BoundaryEntry', ['chart.js']);
var app = angular.module('BoundaryEntry', ['chart.js']);
var map;
var heatmap;
var directionsService;
var directionsDisplay;
var geocoder;
var infowindow;
var panel;
var selectedGrid; // selected feature object
var selectedFeature; //  JSON selected grid
var results;
var milePerMeter = 0.000621371;
var sections = [];
var routes = [];
var overlapPolylines = [];
var newRoute;
var maxAccidentRate = 20;
var minAccidentRate = 0;

var countyIdcountyId = 34;
var districtId = 2243;


app.controller('BoundaryController', function ($scope, $http) {
    $scope.data = {
        "schoolsJson":{}, // School GeoJson data
		"schools": {}, //Sorted school data
        "district": {},
        "high": [],
        "plotData": [],
        "gridsJson": {},
        "studentsJson": {},
        "constructionJson": {},
        "plotYears": [],
        "mapYears":[],
        "plotSchool":0,
        "graphType": "year",
        "permits": {},
        "permitLookup":{},
        "permitPlot": {},
        "schoolPermits": districtId, 
        "construction":0
    };
    
    $scope.onClick = function (points, evt) {
        console.log(points, evt);
    };
    
    $scope.PlotChange = function ()
    {
    	if($scope.data.graphType == "year"){
    		LoadDistrictData($scope.data, $scope.data.plotSchool[0], $scope.data.plotYears, true);    		
    	}
    	else if($scope.data.graphType == "cohort" && $scope.data.plotSchool[0] && $scope.data.plotYears[0]){
    		LoadDistrictCohortData($scope.data, $scope.data.plotSchool[0], $scope.data.plotYears[0])
    	}
		else if($scope.data.graphType == "model_actual")
		{
			LoadModelvsActualData($scope.data, $scope.data.plotSchool[0]); 
		}
    }
    
    $scope.PermitPlotChange = function (){
        PlotPermitData($scope.data, $scope.data.schoolPermits);
    }
    
    $scope.ComputeEnrollment = function ()
    {
        console.log("ComputeEnrollment");
        //StudentsToGrids($scope.data.studentsJson, $scope.data.gridsJson);
        //console.log("Students assigned to grids");
		
        //console.log("Construction assigned to grids");
		//$http.post('/SetBSData', $scope.data.gridsJson);
        console.log("Posted to DB");
		$http.get('/GetBSData').then(function (bsdData) {
			console.log("/GetBSData " + bsdData.statusText);			
			if(bsdData.statusText == "OK" && bsdData.data)
			{
				$scope.data.gridsJson = bsdData.data;
				ConstructionToGrids($scope.data.constructionJson, $scope.data.gridsJson);
				BSD2020Estimate($scope.data.gridsJson);
				console.log("ComputedEstimate");				
			}
		});
    }
    


    function init() {
        SchoolInit($http, $scope.data, function(){
			// Initialise the map.
			var myLatLng = { lat: 45.498, lng: -122.82 };
			var mapProp = {
				center: myLatLng,
				zoom: 12,
				zoom: 12,
				mapTypeId: google.maps.MapTypeId.ROADMAP
            };

			map = new google.maps.Map(document.getElementById('safety-map-holder'), mapProp);
			directionsService = new google.maps.DirectionsService;
			var renderOptions = { preserveViewport: true };
			directionsDisplay = new google.maps.DirectionsRenderer(renderOptions);
			geocoder = new google.maps.Geocoder;
            infowindow = new google.maps.InfoWindow;
            LoadPermits($http, function (permits) {
                $scope.data.permits = { "type": "FeatureCollection", "features": [] };                
                permits.features.forEach(function (feature) {
                    if (feature.properties.gc) {
                        $scope.data.permits.features.push(feature); 
                    }
                    $scope.data.permitLookup[feature.properties.activity] = feature;
                });
                
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: getPoints($scope.data.permits, $scope.data.mapYears),
                    map: map
                });
                LoadGeoJson($http, $scope, map);	
            });
        });
    };

    init();
});


function SchoolInit( $http, data, callback)
{
    LoadSchools($http, function (schoolsObj) {
        data.schools = schoolsObj;

        ParseHighSchoolData(data);

        LoadDistrictData(data, 34);

        callback();
    });
}

function LoadDistrictData(data, schoolId, years, withFeeders)
{
	
	var iKey = ['"7/1/1999"','"7/1/2000"','"7/1/2001"','"7/1/2002"','"7/1/2003"','"7/1/2004"','"7/1/2005"','"7/1/2006"','"7/1/2007"','"7/1/2008"','"7/1/2009"','"7/1/2010"','"7/1/2011"','"7/1/2012"','"7/1/2013"','"7/1/2014"','"7/1/2015"'];

    if (data.schools && data.schools[schoolId]) {
    	var school = data.schools[schoolId];
        data.district = { "enrollment": [], "construction": [], "grade": ["k", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], "year": [] };
		
		if(years && years.length > 0)
		{
			//var keys = Object.keys(school.enrollment);
			years.forEach(function(year){
				var key = iKey[Number(year)];
				data.district.year = year;
				var enrollment = school.enrollment[key];
				var enrollmentNum = [];
				if(enrollment)
				{
					enrollment.grade.forEach(function (value, index){
						enrollmentNum[index] = Number(value);
					});					
				}
				data.district.enrollment.push(enrollmentNum);			
			});			
		}
		else
		{
		   for (var date in school.enrollment) {
				data.district.year.push(date.replace(/['"]+/g, ''));
				var enrollment = school.enrollment[date];
				var enrollmentNum = [];
				enrollment.grade.forEach(function (value, index){
					enrollmentNum[index] = Number(value);
				});				
				data.district.enrollment.push(enrollmentNum);
				//console.log(school.displayName +": "+ enrollmentNum);
			}			
		}
    }

    if(withFeeders)
    {
    	data.gridsJson.features.forEach(function(grid)
    	{
			var hs = SchoolToId(grid.properties.HIGH_DESC);			
			if(hs == schoolId || schoolId == 2243)
			{
				var es = data.schools[SchoolToId(grid.properties.ELEM_DESC)];
				var ms = data.schools[SchoolToId(grid.properties.MID_DESC)];

				years.forEach(function(year, iYear){
					var key = iKey[Number(year)];
					var esEnrolement = es.enrollment[key];
					var msEnrolement = ms.enrollment[key];
					if(!data.district.construction[iYear])
                    {
                    	data.district.construction[iYear] = [0,0,0,0,0,0,0,0,0,0,0,0,0];
                    }	
					if(esEnrolement && schoolId != 2243)
					{
						for(var i = 0; i<=8; i++)
						{
							data.district.enrollment[iYear][i] += grid.properties.students[i] * Number(esEnrolement.grade[i]) / es.norm[i];
						}
					}

					if(msEnrolement && schoolId != 2243)
					{
						for(var i = 6; i<=8; i++)
						{
							data.district.enrollment[iYear][i] += grid.properties.students[i] * Number(msEnrolement.grade[i]) / ms.norm[i];
						}						
                    }
                    var constStudents = EstStudentsFromConstruciton(grid, data, year + 1999);
                    for (var i = 0; i < constStudents.length; i++) {
                        data.district.construction[iYear][i] += constStudents[i];
                    }

					//if(esEnrolement){
						//console.log(grid.properties.PA_NUMBER+" year:"+year+" HS:"+school.displayName +" MS:" + es.displayName +" "+esEnrolement.StudCnt+ + " MS:" + ms.displayName+ " " +msEnrolement.StudCnt);
						//console.log("esStudCnt:" + esEnrolement.StudCnt + " esNorm:" + es.norm+ " msStudCnt:" + msEnrolement.StudCnt + " msNorm:" + ms.norm);					
					//}
					//console.log("students:" + grid.properties.students[i]);
					//console.log("Enrollment:"+data.district.enrollment[iYear]);

                });
			}
    	});
    }

	//var calendarYear =  years[0] + 1999;
    //console.log("Year:"+calendarYear+ " Students From Construction:" + data.district.construction[0]);
	
	//if(years)
	//{
	//	var iYear = iKey[Number(years[0])];
	//	console.log(data.schools[schoolId].displayName + ", "+data.district.enrollment[0]);		
	//}
}

function LoadDistrictCohortData(data, schoolId, year)
{
	var iKey = ['"7/1/1999"','"7/1/2000"','"7/1/2001"','"7/1/2002"','"7/1/2003"','"7/1/2004"','"7/1/2005"','"7/1/2006"','"7/1/2007"','"7/1/2008"','"7/1/2009"','"7/1/2010"','"7/1/2011"','"7/1/2012"','"7/1/2013"','"7/1/2014"','"7/1/2015"'];
	var gradeOffset = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
	var school = data.schools[schoolId];
    data.district = { "enrollment": [], "grade": ["PreK", "k", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], "year": [year] };

    if (data.schools && data.schools[schoolId]) {

		data.district.enrollment[0] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    	// High school data from school database
		for(var iCohart = 0; iCohart <= 12; iCohart++){
			var key = iKey[Number(year) + iCohart];
			var enrollment = school.enrollment[key];
			if(enrollment)
			{
				data.district.enrollment[0][iCohart+1] = Number(enrollment.grade[iCohart]);					
			}						
		}

		// Feeder schools weighted by enrollment per grid
		data.gridsJson.features.forEach(function(grid)
		{
			var hs = SchoolToId(grid.properties.HIGH_DESC);			
			if(hs == schoolId)
			{
				var es = data.schools[SchoolToId(grid.properties.ELEM_DESC)];
				var ms = data.schools[SchoolToId(grid.properties.MID_DESC)];

				for(var iCohart = 0; iCohart <= 8; iCohart++){
					var key = iKey[Number(year) + iCohart];
					var esEnrolement = es.enrollment[key];
					var msEnrolement = ms.enrollment[key];		

					if(esEnrolement)
					{
						data.district.enrollment[0][iCohart+1] += grid.properties.students[iCohart] * Number(esEnrolement.grade[iCohart]) / es.norm[iCohart];
					}

					if(msEnrolement)
					{
						data.district.enrollment[0][iCohart+1] += grid.properties.students[iCohart] * Number(msEnrolement.grade[iCohart]) / ms.norm[iCohart];						
					}

					//if(esEnrolement){
						//console.log(grid.properties.PA_NUMBER+" year:"+year+" HS:"+school.displayName +" MS:" + es.displayName +" "+esEnrolement.StudCnt+ + " MS:" + ms.displayName+ " " +msEnrolement.StudCnt);
						//console.log("esStudCnt:" + esEnrolement.StudCnt + " esNorm:" + es.norm+ " msStudCnt:" + msEnrolement.StudCnt + " msNorm:" + ms.norm);					
					//}
					//console.log("students:" + grid.properties.students[i]);
					//console.log("Enrollment:"+data.district.enrollment[iYear]);
				}
			}
		});
    }
    else{
    	console.log("LoadDistrictCohortData school data not available");
    }				
}

function LoadModelvsActualData(data, schoolId)
{
	var iKey = ['"7/1/1999"','"7/1/2000"','"7/1/2001"','"7/1/2002"','"7/1/2003"','"7/1/2004"','"7/1/2005"','"7/1/2006"','"7/1/2007"','"7/1/2008"','"7/1/2009"','"7/1/2010"','"7/1/2011"','"7/1/2012"','"7/1/2013"','"7/1/2014"','"7/1/2015"','"7/1/2016"','"7/1/2017"','"7/1/2018"','"7/1/2019"','"7/1/2020"'];
	var school = data.schools[schoolId];

	var predictedEnrollment = [];
	for(var i=0; i< 16; i++)
	{
		data.construction = 0;
		LoadDistrictData(data, schoolId, [i], true);
		var students = [];
		for(var j=0; j<data.district.enrollment[0].length; j++)
		{
			students[j] = data.district.enrollment[0][j] + data.district.construction[0][j];
        }
        var prediction = EstProgression(students);
        
        var calendarYear = i + 1999;
        console.log(school + " year " + calendarYear + " prediction " + prediction + " enrollment " + data.district.enrollment[0] + " construction " + data.district.construction[0]);
        //EstStudentsFromGridConstruciton(grid, data, year)
		predictedEnrollment[i+6] = prediction;
		console.log(i + "constuction:"+data.construction);
	}
	
    data.district = { "enrollment": [], "grade": iKey, "set": ["actual", "model"] };
	data.district.enrollment[1] = predictedEnrollment;

    // Historic high school data from school database
	data.district.enrollment[0] = [];
	iKey.forEach(function (year, iYear){
		var enrollment = school.enrollment[year];
		if(enrollment)
		{
			var actualStudents = Number(enrollment.StudCnt912)
			if(schoolId == 2243)
			{
				actualStudents = Number(data.schools[1186].enrollment[year].StudCnt912);
				actualStudents += Number(data.schools[1187].enrollment[year].StudCnt912);
				actualStudents += Number(data.schools[2783].enrollment[year].StudCnt912);
				actualStudents += Number(data.schools[1188].enrollment[year].StudCnt912);
				actualStudents += Number(data.schools[1320].enrollment[year].StudCnt912);
			}

			data.district.enrollment[0][iYear] = actualStudents;					
		}
	});
}

function PlotPermitData(data, schoolId) {
    var plotData = [[]];
    var xLables = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];

    data.gridsJson.features.forEach(function (feature) { 
        if (feature.properties.permits) {
            for (var permitKey in feature.properties.permits) {
                var permitData = data.permitLookup[permitKey];
                var year = Year(permitData.properties.acc_date);
                var type = Number(permitData.properties.class);
                var units = Number(permitData.properties.housecount);
                var school = SchoolToId(feature.properties.HIGH_DESC);
                if(schoolId[0]==2243 || school == schoolId[0])
                {
					if (!plotData[0][year - 2000]) {
						plotData[0][year - 2000] = units;
					}
					else {
						plotData[0][year - 2000] += units;
					}  	
                }
            }
        }
    });
    //chart-data="data.permitPlot.data"
    //chart-labels="data.permitPlot.lables" chart-legend="true" chart-series="data.permitPlot.xAxis"'
    data.permitPlot = { "data": plotData, "xAxisLables": xLables, "seriesLabels": ["BSD"] };

}

function Year(dateStr) {
    var d = Date.parse(dateStr);
    var minutes = 1000 * 60;
    var hours = minutes * 60;
    var days = hours * 24;
    var years = days * 365;
    var y = Math.trunc(1970 + d / years);
    return y;
}

function ParseHighSchoolData(data) {
    if (data.schools) {
        
        for (var schoolId in data.schools) {
            var hsStudents = false;
            var school = data.schools[schoolId];
            
            var keys = Object.keys(school.enrollment);
            var isHs = false;
            for (var iKey = 0; iKey < keys.length && !isHs; iKey++) {
                var numHsStudents = Number(school.enrollment[keys[iKey]].StudCnt912);
                if (numHsStudents > 0) {
                    isHs = true;
                }
            }
            if (isHs) {
                data.high.push([Number(schoolId), school.displayName]);
            }
        }
    }
}

function LoadGeoJson($http, $scope, map) {
    
    LoadGeoJsonFiles($http, function (constructionJson, studentsJson, schoolsJson) {
        $scope.data.constructionJson = constructionJson;
        $scope.data.studentsJson = studentsJson;
        $scope.data.schoolsJson = schoolsJson;

        LoadBSDGrids($http, function (gridsJson) {
            $scope.data.gridsJson = gridsJson;
            // Add geometry limits to speed matching
            AddFeatureBounds($scope.data.gridsJson);
            AddFeatureBounds($scope.data.constructionJson);
            
            var newData = new google.maps.Data({ map: map });
            newData.addGeoJson($scope.data.gridsJson);
            newData.addGeoJson(constructionJson);
            //newData.addGeoJson($scope.data.permits);
            //newData.addGeoJson(studentsJson);
            //newData.addGeoJson(schoolsJson);
            
            // No error means GeoJSON was valid!
            map.data.setMap(null);
            map.data = newData;
            
            FindSchoolEnrollment2020($scope.data.gridsJson, $scope.data.schools);
            ProjectEnrollment($scope.data.gridsJson, $scope.data.schools);
            PlotPermitData($scope.data, 0);
            
            Configure($scope);
        });
    });
}

// 
function FindSchoolEnrollment2020(grids, schools)
{
	var schoolPA = {};
	grids.features.forEach(function(grid){
		var ELEM_DESC = grid.properties.ELEM_DESC;
		var MID_DESC = grid.properties.MID_DESC;
		var HIGH_DESC = grid.properties.HIGH_DESC;
		var DDP_DISP = grid.properties.DDP_DISP;

		ELEM_DESC = ELEM_DESC.replace(" ES", "");
		ELEM_DESC = ELEM_DESC.replace(" K8", "");
		MID_DESC = MID_DESC.replace(" MS", "");

		if(schoolPA[ELEM_DESC])
		{
			schoolPA[ELEM_DESC] += DDP_DISP;
		}
		else
		{
			schoolPA[ELEM_DESC] = DDP_DISP;
		}

		if(schoolPA[MID_DESC])
		{
			schoolPA[MID_DESC] += DDP_DISP;
		}
		else
		{
			schoolPA[MID_DESC] = DDP_DISP;
		}		
	});

	for (var key in schoolPA)
	{
		var schoolName = key;
		var matches = [];
		
		for(var key in schools)
		{
			var schoolFullName = schools[key].fullName.replace('-', ' ');
			var match = schoolFullName.match(schoolName);
			if(match)
			{
				matches.push({match, key});
			}
		}
		
		schools[matches[0].key].DDP_DISP = schoolPA[schoolName];
	}
}

function ProjectEnrollment(grids, schools)
{
	for (var key in schools)
	{	
		schools[key].norm = [0,0,0,0,0,0,0,0,0,0,0,0,0];	
	}

	// use enrollment per grid as normilization factor beause annual enrollment per grid is unavailable
	grids.features.forEach(function(grid){
		var elem = SchoolToId(grid.properties.ELEM_DESC);
		var mid = SchoolToId(grid.properties.MID_DESC);
		var high = SchoolToId(grid.properties.HIGH_DESC);

		for(var i=0; i<=12; i++)
		{
			schools[elem].norm[i] += grid.properties.students[i];
			schools[mid].norm[i] += grid.properties.students[i];
			schools[high].norm[i] += grid.properties.students[i];
		}
	});
	
	// Write out for checked
	//for(var key in schools){
	//	console.log(schools[key].displayName);
	//	if(schools[key].enrollment['"7/1/2014"']){
	//		console.log(schools[key].enrollment['"7/1/2014"'].grade);			
	//	}
	//	console.log(schools[key].norm);
	//}
}


function Configure($scope) {
    // Initialise the map.
    //map.data.setControls(['LineString', 'Polygon']);
    
    map.data.setStyle(function (feature) {
        var highSchool = feature.getProperty('HIGH_DESC');
        var gc = Number(feature.getProperty('PA_NUMBER'));
        var color = 'grey';
        
        //if ($scope.data.colorMap == 'Proposed') {
        //    var school = FindSchool(highSchool, schoolData);
        //    if (school) {
        //        color = school.color;
        //    }
        //} 
        //else if ($scope.data.colorMap == 'Distance') {
        //    for (var i = 0; i < schoolData.hs.length; i++) {
        //        if (highSchool == schoolData.hs[i].dbName) {
        //            var distances = feature.getProperty('distance');
        //            var distance = distances[i];
        //            color = HeatMapRG(1000, 5000, distance);
        //        }
        //    }
        //}
        //else {
        //    if ($scope.data.colorMap != 'Safety') {
        //        highSchool = $scope.data.colorMap;
        //    }
        //    for (var i = 0; i < schoolData.hs.length; i++) {
        //        if (highSchool == schoolData.hs[i].dbName) {
        //            var accidentRates = feature.getProperty('accidentRate');
        //            var accidentRate = accidentRates[i];
        //            color = HeatMapRG(minAccidentRate[i], maxAccidentRate[i], accidentRates[i]);
        //        }
        //    }
        //}
        
        return { editable: false, draggable: false, strokeWeight: 1, fillColor: color };
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
        //infoWindowMarker.setMap(null);
        map.data.overrideStyle(event.feature, { strokeWeight: 1 });
        
        //if (selecting == 1 && ($scope.data.dragFunc == "paint")) {
        //    var proposedHigh = $scope.data.proposedHigh;
        //    if (proposedHigh) {
        //        // Record selected grid and grid data
        //        selectedGrid = event.feature;
        //        selectedGrid.setProperty('proposedHigh', ProposedHigh(proposedHigh, selectedGrid));
        //        selectedES = selectedGrid.getProperty('elementary');
                
        //        //var numEsGrids = 0;
        //        //if ($scope.data.paintBy == "ES") {
        //        //    mapGrids.forEach(function (grid) {
        //        //        if (grid.getProperty('elementary') == selectedES) {
        //        //            grid.setProperty('proposedHigh', ProposedHigh(proposedHigh, grid));
        //        //            numEsGrids++;
        //        //        }
        //        //    });
        //        //}
                
        //        //map.data.toGeoJson(function (geoJson) {
        //        //    results = Results(geoJson.features, schoolData);
        //        //});
                
        //        //$scope.data.mapName = defaultMapName;
        //        //$scope.data.mapDescription = defaultMapDescription;
                
        //        //UpdateScopeData($scope, results);
        //        $scope.$apply();
        //    }
        //}
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


function StudentsToGrids(students, grids)
{
    grids.features.forEach(function (feature) {
        feature.properties.students = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    });    

    students.features.forEach(function(student){
        var location = student.geometry.coordinates;
        var grade = student.properties.GRD;
        var iGrid = FindGridIndex(location, grids);

        grids.features[iGrid].properties.students[grade]++;
    });
}


function GridJsonToPolygon(grid) 
{
    var paths = [];
    var exteriorDirection;
    var interiorDirection;
    for (var i = 0; i < grid.geometry.coordinates.length; i++) {
        var path = [];
        for (var j = 0; j < grid.geometry.coordinates[i].length; j++) {
            var ll = new google.maps.LatLng(grid.geometry.coordinates[i][j][1], grid.geometry.coordinates[i][j][0]);
            path.push(ll);
        }
        paths.push(path);
    }

    googleObj = new google.maps.Polygon({paths: paths});
    if (grid.properties) {
        googleObj.set("geojsonProperties", grid.properties);
    }
    return googleObj;
}

function CCW(path) {
    var isCCW;
    var a = 0;
    for (var i = 0; i < path.length - 2; i++) {
        a += ((path[i + 1].lat() - path[i].lat()) * (path[i + 2].lng() - path[i].lng()) - (path[i + 2].lat() - path[i].lat()) * (path[i + 1].lng() - path[i].lng()));
    }
    if (a > 0) {
        isCCW = true;
    }
    else {
        isCCW = false;
    }
    return isCCW;
};

function ConstructionToGrids(construction, grids)
{
	grids.features.forEach(function(grid){
		grid.properties.TYPE = [];
		grid.properties.SHAPE_Area = [];
		grid.properties.TTL_DU = [];	
	});

	
    construction.features.forEach(function(development){
        var devPoly = development.geometry.coordinates[0];
        var TTL_DU = development.properties.TTL_DU; // Total development units
        var TYPE = development.properties.TYPE; // Type of contstruction
        var SHAPE_Area = development.properties.SHAPE_Area; // Construction area
        var iGrid = FindIntersectionIndex(development, grids); //

        grids.features[iGrid].properties.TTL_DU.push(TTL_DU);
       	grids.features[iGrid].properties.TYPE.push(TYPE);
       	grids.features[iGrid].properties.SHAPE_Area.push(SHAPE_Area);      	
    });
}

function PolygonFromGeoJson(polygon)
{
	var pointString = [];
	
	polygon[0].forEach(function(pt){
		pointString += pt[0].toString() +","+pt[0].toString()+" ";
	});
	
	var svgPolygon = document.createElementNS('http://www.w3.org/2000/svg','polygon');
	svgPolygon.setAttribute("points", pointString);
	
	var poly = new Polygon(svgPolygon);
	
	return poly;
}

function FindIntersectionIndex(devPoly, grids){
	var gridIndex;
	var stdyArea = devPoly.properties.STDYAREA;

	for(var iGrid = 0; iGrid<grids.features.length && !gridIndex; iGrid++)
	{
		var grid = grids.features[iGrid];
		if (stdyArea == grid.properties.STDYAREA)
		{
			gridIndex = iGrid;
		}
	}		
    return gridIndex;
}

function BoundsOverlap(poly, grids)
{
	var gridIndex;
	var maxX = poly[0][0][0];
	var minX = poly[0][0][0];
	var maxY = poly[0][0][1];
	var minY = poly[0][0][1];
	
	poly[0].forEach(function(pt)
	{
		if(pt[0] < minX)
		{
			minX = pt[0];
		}
		if(pt[0] > maxX)
		{
			maxX = pt[0];
		}
		if(pt[1] < minY)
		{
			minY = pt[1];
		}
		if(pt[1] > maxY)
		{
			maxY = pt[1];
		}
	});

	var centerX = (minX + maxX)/2;
	var centerY = (minY + maxY)/2;
	
	var overlapedGrids = {};
	
	for(var iGrid = 0; iGrid<grids.features.length; iGrid++)
	{
		var grid = grids.features[iGrid];

		if(centerX >= grid.properties.bounds[0][0] && centerX <= grid.properties.bounds[1][0]){
			if(centerY >= grid.properties.bounds[0][1] && centerY <= grid.properties.bounds[1][1]){
				overlapedGrids[iGrid] = grid;
				console.log("Cstn Bounds ["+minX+","+minY+"], ["+maxX+","+maxY+"]");
				console.log( grid.properties.PA_NUMBER +" Bounds [" + grid.properties.bounds[0] +"], [" + grid.properties.bounds[0]+"]");
				gridIndex = iGrid;				
			}
		}
	}

	return gridIndex;
}

function BSD2020Estimate(grids)
{
	var totalProgression = 0;
	var totalNewConstruction = 0;
    grids.features.forEach(function (grid){
        var constStudents = EstConstruciton(grid);
        //var estProgression = EstProgression(grid.properties.students, constStudents);
        var estConstruction = EstConstruciton(grid);
        var estProgression = EstProgression(grid.properties.students);


		totalProgression += estProgression + constStudents;
		
		var estStudents = estProgression + estConstruction;
		var difference = estStudents - grid.properties.DDP_DISP;
		console.log("Grid:" + grid.properties.PA_NUMBER + " BSD2020:" + grid.properties.DDP_DISP, " recompted:" + estStudents + " estProgression:"+estProgression+" difference:" + difference);
		//if(/*estProgression > 0.1 && estProgression <= 1.2 &&*/ grid.properties.TTL_DU.length > 0)
		//{
		//	var TTL = 0
		//	for(var iTTL = 0; iTTL<grid.properties.TTL_DU.length; iTTL++)
		//	{
		//		TTL += grid.properties.TTL_DU[iTTL];
		//	}
		//	var scaleFactorWithProgression  = (grid.properties.DDP_DISP - estProgression)/TTL;
		//	var scaleFactorWitoutProgression = (grid.properties.DDP_DISP)/TTL;
		//	var constType = grid.properties.TYPE;
		//	console.log("Grid:" + grid.properties.PA_NUMBER + " BSD2020:" + grid.properties.DDP_DISP+ " recompted:" + estStudents + " difference:" + difference);
		//	console.log(constType + " sfp:" + scaleFactorWithProgression + " sfnp:" + scaleFactorWitoutProgression);
		//}
	});

	console.log("totalProgression:"+totalProgression+" totalNewConstruction:"+totalNewConstruction);
}

function EstProgression(students/*, constStudents*/)
{
	var estStudents = 0;
	var yearProgression = 6
	var progression = [0,0,0,1.013055,0.989824,0.930494,0.923087,0,0,0,0,0,0];
	for(var i=9-yearProgression; i<=12-yearProgression; i++)
	{
		estStudents += students[i]*progression[i];
		//if(constStudents[i]){
		//	estStudents += constStudents[i]*progression[i];
		//}
	}
	return estStudents;
}

function EstConstruciton(grid)
{
    var sfdRate = 0.16;

    switch (grid.properties.ELEM_DESC) {
        case "Bonny Slope ES":
        case "Cedar Mill ES":
        case "Jacob Wismer ES":
        case "Springville K8":
			sfdRate = 0.22;
            break;
    }  
    var estStudents = 0; 
	if(grid.properties.TTL_DU && grid.properties.TTL_DU.length)
	{
		for(var i=0; i<grid.properties.TTL_DU.length; i++)
		{
			var TTL_DU = grid.properties.TTL_DU[i];
			if(grid.properties.TYPE[i] == "SFD"){
				estStudents += sfdRate*TTL_DU;
				//estStudents += 0.20*TTL_DU;
			}
			else if(grid.properties.TYPE[i] == "SFA"){
				estStudents += 0.04*TTL_DU;			
			}
			else if(grid.properties.TYPE[i] == "MFA"){
			estStudents += 0.066*TTL_DU;			
			}
			else if(grid.properties.TYPE[i] == "APT"){
			estStudents += 0.065*TTL_DU;			
			}		
		}
	}
	return estStudents;
}


function EstStudentsFromGridConstruciton(grid, data, year) {
    var sfdRate = 0.16;
    switch (grid.properties.ELEM_DESC) {
        case "Bonny Slope ES":
        case "Cedar Mill ES":
        case "Jacob Wismer ES":
        case "Springville K8":
            sfdRate = 0.22;
            break;
    }
    var estStudents = 0;
    if (grid.properties.permits) {
        for (var permitKey in grid.properties.permits) {
            var permit = data.permitLookup[permitKey];
            if (permit && year == Year(permit.properties.acc_date)) {
                var permitData = data.permitLookup[permitKey];
                var type = permitData.properties.class;
                var units = permitData.properties.housecount;

                if (type == "101") {
                    estStudents += sfdRate * units;
                }
                else if (grid.properties.TYPE[i] == "105") {
                    estStudents += 0.065 * units;
                }
            }
        }
    }

    return estStudents;
}

function EstStudentsFromConstruciton(grid, data, year) {
      var estStudents = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
      var esg = 0.41/6.0;
      var msg = 0.13/3.0;
    
      var studentGeneration;
      switch (grid.properties.ELEM_DESC) {
          case "Bonny Slope ES":
          case "Cedar Mill ES":
          case "Jacob Wismer ES":
          case "Springville K8":
              studentGeneration = {
                  "SFD": [esg, esg, esg, esg, esg, esg, msg, msg, msg, 0.1/4.0, 0.1/4.0, 0.1/4.0, 0.1/4.0],
                  "SFA": [0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.05/3.0, 0.05/3.0, 0.05/3.0, 0.05/4.0, 0.05/4.0, 0.05/4.0, 0.05/4.0], 
                  "MFA": [0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.04/3.0, 0.04/3.0, 0.04/3.0, 0.06/4.0, 0.06/4.0, 0.06/4.0, 0.06/4.0], 
                  "APT": [0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.04/3.0, 0.04/3.0, 0.04/3.0, 0.06/4.0, 0.06/4.0, 0.06/4.0, 0.06/4.0],
              };
              break;
          default:
              studentGeneration = {
                  "SFD": [0.33/6.0, 0.33/6.0, 0.33/6.0, 0.33/6.0, 0.33/6.0, 0.33/6.0, 0.11/3.0, 0.11/3.0, 0.11/3.0, 0.1/4.0, 0.1/4.0, 0.1/4.0, 0.1/4.0],
                  "SFA": [0.07/6.0, 0.07/6.0, 0.07/6.0, 0.07/6.0, 0.07/6.0, 0.07/6.0, 0.03/3.0, 0.03/3.0, 0.03/3.0, 0.04/4.0, 0.04/4.0, 0.04/4.0, 0.04/4.0], 
                  "MFA": [0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.04/3.0, 0.04/3.0, 0.04/3.0, 0.06/4.0, 0.06/4.0, 0.06/4.0, 0.06/4.0], 
                  "APT": [0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.10/6.0, 0.04/3.0, 0.04/3.0, 0.04/3.0, 0.06/4.0, 0.06/4.0, 0.06/4.0, 0.06/4.0],
              };
    }
    
    var estStudents = [0,0,0,0,0,0,0,0,0,0,0,0,0];
    if (grid.properties.permits) {
        for (var permitKey in grid.properties.permits) {
            var permit = data.permitLookup[permitKey];
            if (permit && year == Year(permit.properties.acc_date)) {
                var permitData = data.permitLookup[permitKey];
                var type = permitData.properties.class;
                var units = Number(permitData.properties.housecount);
                data.construction += units;
                
                if (type == "101") {
                    for (var i = 0; i < estStudents.length; i++) {
                        estStudents[i] += studentGeneration["SFD"][i] * units;
                    }
                }
                else if (type == "105") {
                    for (var i = 0; i < estStudents.length; i++) {
                        estStudents[i] += studentGeneration["APT"][i] * units;
                    }
                }
            }
        }
    }
    return estStudents;
}

function getPoints(permits, years) {
    var locations = [];
    permits.features.forEach(function(feature){
		locations.push(new google.maps.LatLng(feature.geometry.coordinates[1],feature.geometry.coordinates[0]));
    });
    return locations;
}

