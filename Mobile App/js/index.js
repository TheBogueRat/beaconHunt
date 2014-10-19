//
// JavaScript code for the BLE Beacon Hunt.
//
// TODO: Fix 'found' image display in <li>
//       Save status on exit (counter, found items, number of hints/item)
//       Use resume button when restarting app with game in progress.
//		

var timer;

$(document).ready(function() {
    /** Add event handler for when the first page is shown. */
    $(document).on('pageshow', '#first', function(data) {
        // Start device discovery.
	});
});
	
/** BLE plugin, is loaded asynchronously so the
	variable is redefined in the onDeviceReady handler. */
var ble = null;

// Application object.
var app = {};

// Game Variables (probably should change format to app.xxxxxxxxx)
var dataStore; 				// Holds treasure hunt data for quick display
var huntInfo;				// Holds hunt info/version
var clueStatus = []; 		// Which clues have been given.
var beaconsDiscovered = 0; 	// Number of beacons that have been located by device
var beaconsPossible; 		// Number of beacons available to be found.
var currentBeaconHint; 		// Which beacon# is being displayed, for use in array
var currentHint = 1;   		// Tracks number of hints shown

// BLE device scanning will be made with this interval in milliseconds.
app.scanInterval = 5000;

// Track whether scanning is ongoing to avoid multiple intervals.
app.isScanning = false;

// Time for last scan event. This is useful for
// when the device does not support continuous scan.
app.lastScanEvent = 0;

app.getData = function() {
	// Grab Treasure Hunt Information from Server
	// TODO: use promises to eliminate duplication in treasureHuntInfo retrieval code.
	$.getJSON('http://boguerat.com/treasureHunt/treasureHunt.php?jsonp=?', function(data) {
		if (data.length !== 0) {
			console.log("treasureHunt Data Retrieved...storing...");
			localStorage.setItem('treasure.hunt.data', JSON.stringify(data));
			localStorage.setItem('treasure.hunt.hasRecords', JSON.stringify(true));
			dataStore = data;
			// Get hunt info
			$.getJSON('http://boguerat.com/treasureHunt/treasureHuntInfo.php?jsonp=?', function(data) {
				if (data.length !== 0) {
					console.log("treasureHuntInfo Data Retrieved...");
					localStorage.setItem('treasure.hunt.info', JSON.stringify(data));
					app.populateTheGame();
				} else {
					console.log("getInfo Err, No treasureHuntInfo data was retrieved. No Connection?");
					// Alert or message to user indicating connection required?
				}
			});
			// Retrieve values to populate the app (need to pull from localStorage since straight from JSONP was failing)
			//dataStore = JSON.parse(window.localStorage.getItem('treasure.hunt.data'));
		} else {
			console.log("No treasureHunt data was retrieved.");
		}
	});
	console.log("JSONp complete.");
} // End getData

app.verifyLocalData = function() {
	// Check to see if local data already exists, Retrieve it as necessary.
	if (window.localStorage.getItem("treasure.hunt.hasRecords")) {
		console.log("treasure.hunt.hasRecords exists");
		var hasData = JSON.parse(window.localStorage.getItem('treasure.hunt.hasRecords'));
	} else {
		hasData = false;
	}

	if (hasData != true) { // Retrieve Remote Data
		console.log("hasData: not true; getting data...");
		// TODO: need to get treasure hunt info, too.
		
		app.getData();
		return;
	}
	
	huntInfo = JSON.parse(window.localStorage.getItem('treasure.hunt.info'));
	
	// Data Exists, but is it the latest info.
	var dateCheck;
	// Retrieve beacon hunt data version date from server
	$.getJSON('http://boguerat.com/treasureHunt/treasureHuntInfo.php?jsonp=?', function(data) {
		if (data.length !== 0) {
			console.log("treasureHuntInfo Data Retrieved for date check...");
			dateCheck = data;

			console.log("Evaluating for newer data...");
			if (dateCheck[0].huntVersion > huntInfo[0].huntVersion) {
				console.log("Newer Data Available");
				// Store newer hunt Info
				localStorage.setItem('treasure.hunt.info', JSON.stringify(dateCheck));
				// get updated data
				app.getData();
			} else {
				// Data is current so process info
				dataStore = JSON.parse(window.localStorage.getItem('treasure.hunt.data'));
				app.populateTheGame();
			}
		} else {
			console.log("Err, No treasureHuntInfo data was retrieved. No Connection?");
			// Alert or message to user indicating connection required?
		}
	});

} // End verifyLocalData

app.populateTheGame = function() {
	// This function is called after validating the game version with the server
	//    or after retrieving new data from the server.
	//
	// Populate Name of the hunt.
    huntInfo = JSON.parse(window.localStorage.getItem('treasure.hunt.info'));
    $("#huntName").text(huntInfo[0].huntName + " List:");
    // Populate huntList items
    $.each(dataStore, function(i, item) {
        // grab specific key/value from each record
        var res = dataStore[i].hintName;
        var p = document.getElementById('huntList');
        var li = document.createElement('li');
        //var $a = $("<a href=\"#connected\"><img src=.\\images\\"+dataStore[i].picture+".jpg>" + res + "</a>");
        var $a = $("<a href=\"#connected\"><img src=\"./images/"+dataStore[i].picture+".jpg\">" + res + "</a>");
        $(li).append($a);
        $a.bind("click", {
            address: dataStore[i].badgeID,
            name: dataStore[i].hintName
        }, app.eventDeviceClicked);
        p.appendChild(li);
        // Store the number of beacons needed to finish the game
        beaconsPossible = i + 1;
		// Set all items to reveal first clue
		clueStatus[i] = 1;
    });
	$("#found").text("Found "+beaconsDiscovered+" of "+beaconsPossible);
	console.log("Number of possible beacons: " + beaconsPossible);
}

app.resetClues = function(hintsNum) {
    // reset counter	
	console.log("hintsNum = "+hintsNum+"..switch clueStatus[hintsNum]=" + clueStatus[hintsNum]);
	
    switch(clueStatus[hintsNum]) {
		case 1:
		// change display to default
			$("#hint1").text("Clue 1:  " + dataStore[hintsNum].clue1);
			$("#hint2").text("Clue 2:");
			$("#hint3").text("Clue 3:");
			$("#showNext").show();
			currentHint=1;
			break;
		case 2:
			$("#hint1").text("Clue 1:  " + dataStore[hintsNum].clue1);
			$("#hint2").text("Clue 2: " + dataStore[hintsNum].clue2);
			$("#hint3").text("Clue 3:");
			$("#showNext").show();
			currentHint=2;
			break;
		case 3:
			$("#hint1").text("Clue 1:  " + dataStore[hintsNum].clue1);
			$("#hint2").text("Clue 2: " + dataStore[hintsNum].clue2);
			$("#hint3").text("Clue 3: " + dataStore[hintsNum].clue3);
			$("#showNext").hide();
			currentHint=3;
			break;
	}
	$("#hintImgs").attr("src", ".\\images\\"+dataStore[hintsNum].picture+".jpg");  //Change image src to current hint.
	console.log("hintImage changed to: "+ "./images/"+dataStore[hintsNum].picture+".jpg");
}

app.showNextClue = function() {
    // TODO: Remember settings
    if (currentHint == 1) {
        //Display 2nd Hint
        $("#hint2").text("Clue 2:  " + dataStore[currentBeaconHint].clue2);
        currentHint++;
		clueStatus[currentBeaconHint] = 2
		console.log("currentBeaconHint:"+currentBeaconHint);
    } else {
        // Display 3rd Hint
        $("#hint3").text("Clue 3:  " + dataStore[currentBeaconHint].clue3);
        // Hide button
        $("#showNext").hide();
        clueStatus[currentBeaconHint] = 3
    }
	// Testing.....Don't need to actually find a beacon
	//app.foundBeacon(currentBeaconHint);
}


// Bind Event Listeners
//
// Bind any events that are required on startup. Common events are:
// 'load', 'deviceready', 'offline', and 'online'.
app.bindEvents = function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
};

// deviceready Event Handler
//
// The scope of 'this' is the event. In order to call the 'receivedEvent'
// function, we must explicity call 'app.receivedEvent(...);'
app.onDeviceReady = function() {
    // The plugin was loaded asynchronously and can here be referenced.
    ble = evothings.ble;
    app.receivedEvent('deviceready');
    app.startLeScan();
};

// TODO: Update DOM on a Received Event.
// Currently logging event.
app.receivedEvent = function(id) {
    console.log('Received Event: ' + id);
};

// Collection of known devices not used for treasure hunt
app.knownDevices = {};

var discovered = [];

app.startLeScan = function() {
    console.log('startScan');

    app.stopLeScan();
    app.isScanning = true;
    app.lastScanEvent = new Date();
    //app.runScanTimer();
    $("#deviceState").text("");
    ble.startScan(function(r) {
        //address, rssi, name, scanRecord
        // compare detected beacon against current clue page.
        if (r.name == dataStore[currentBeaconHint].badgeName && !discovered[currentBeaconHint]) {
            console.log(r.name + ":" + dataStore[currentBeaconHint].badgeName)
                // Display signal strength continuously
                // replace with status bar?
            $("#deviceState").text(-(r.rssi + 40) / 2);
            //within range, mark as found, return to main.
            console.log(r.rssi)
            if (r.rssi > -70) {
                app.foundBeacon(currentBeaconHint); // Change UI, tally score.
                // Add to list of known(found) devices
                app.knownDevices[r.address] = r;
                //Mark as found
                discovered[currentBeaconHint] = true;
                // Add points
                //
                console.log("App.KnownDevice found: " + app.knownDevices[r.address].name)
            } else {
                return;
            }
        }
        // Don't think this is needed, check if detected previously
        if (app.knownDevices[r.address]) {
            return;
        }
    });
}; // End startLeScan

var score = 0;

app.foundBeacon = function(foundDevice) { //foundDevice is #
		// Replace clue picture with full image
		$("#huntList").find("li a img").eq(currentBeaconHint).attr("src", "./images/" + dataStore[foundDevice].picture + "_revealed.jpg");
        var hint = dataStore[foundDevice].badgeName;
        $("#deviceState").text("n/a");
		// Get list item corresponding to the beacon that was located.
		var foundLink = $("#huntList").find("li a").eq(foundDevice);
		// Change icon to checkmark
		foundLink.removeClass("ui-icon-carat-r").addClass("ui-icon-check");
		// Change background color of clue
		foundLink.css("background-color", "lime");
        // Remove link
		foundLink.prop("href", "");
		// TODO:  Every time I try to change the text, the picture disappears. Tried .replace, same result.
		//foundLink.text("Found: The "+dataStore[foundDevice].badgeName);
		
		beaconsDiscovered++;
		switch(currentHint) {
			case 1:
				score = score + 20;
				break;
			case 2:
				score = score + 10;
				break;
			case 3:
				score = score + 5;
				break;
		}
		$("#score").text("Score: "+score);
		if (beaconsDiscovered==beaconsPossible) {
			timer.stop;
			$("#gameStatus").text("Congratulations for finding all the beacons.  Now return to the start and present your score to the game coordinator.");
		}
		app.updateNumFound();
        alert("You Found the " + hint);
        history.back();
    } // End foundBeacon

/** Handler for when device in devices list was clicked. */
app.eventDeviceClicked = function(event) {
    // Actually, passes the address:name from the list item clicked
    currentBeaconHint = parseInt(event.data.address) - 1;
    // TODO:  Fill out hints
    app.resetClues(currentBeaconHint);
	console.log("currentBeaconHint passed to resetClues: "+currentBeaconHint);
    //app.connect(event.data.address, event.data.name);
    document.getElementById('hintNameHeader').innerHTML = event.data.name;
};

// Stop scanning for devices.
app.stopLeScan = function() {
    ble.stopScan();
    app.isScanning = false;
    clearTimeout(app.scanTimer);
};

// Run a timer to restart scan in case the device does
// not automatically perform continuous scan.
app.runScanTimer = function() {
    if (app.isScanning) {
        var timeSinceLastScan = new Date() - app.lastScanEvent;
        if (timeSinceLastScan > app.scanInterval) {
            if (app.scanTimer) {
                clearTimeout(app.scanTimer);
            }
            app.startLeScan(app.callbackFun);
        }
        app.scanTimer = setTimeout(app.runScanTimer, app.scanInterval);
    }
};

app.updateNumFound = function() {
	//var foundLink = $("#huntList").find("li a").eq(foundDevice);
	$("#found").text("Found "+beaconsDiscovered+" of "+beaconsPossible);
}

// Application Constructor
app.initialize = function() {
    this.bindEvents();
    // Get Data
    app.verifyLocalData();
	//app.updateNumFound();

};

app.startTimer = function() {

	// Start the clock...
	if (timer) {
		if (timer.getStatus==1) { //don't start another timer
			return;
		}
	}
	timer = new _timer(
		function(time) {
			if(time == 0) {
				timer.stop();
				alert('time out');
			}
		}
	);
	timer.reset(0); //Set time to 0
	timer.mode(1);  //Count up
	timer.start();
}