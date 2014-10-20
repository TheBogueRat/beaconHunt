//
// JavaScript code for the Beacon Hunt.
//
// Source: Evothings BLE Discovery example for BLE detection (all 'connect' code removed)
//
// TODO: Fix 'found' image display in <li>
//       Save status on exit (counter, found items, number of hints/item)
//       Use resume button when restarting app with game in progress.
// 		 Multi-timer mode
//		 	Have timer count down time retrieved from db, stop game at 0.
//		 Graceful exit, store settings to prevent cheating the clock.
//		 Add timeout/loading img/ or some method to identify no connection.
//       Stop adding things to this list:-)

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
			localStorage.setItem('treasure.hunt.data', JSON.stringify(data));
			localStorage.setItem('treasure.hunt.hasRecords', JSON.stringify(true));
			dataStore = data;
			// Get hunt info
			$.getJSON('http://boguerat.com/treasureHunt/treasureHuntInfo.php?jsonp=?', function(data) {
				if (data.length !== 0) {
					localStorage.setItem('treasure.hunt.info', JSON.stringify(data));
					app.populateTheGame();
				} else {
					console.log("getInfo Err, No treasureHuntInfo data was retrieved. No Connection?");
				}
			});
		} else {
			console.log("No treasureHunt data was retrieved.");
		}
	});
} // End getData

app.verifyLocalData = function() {
	// Check to see if local data already exists, Retrieve it as necessary.
	if (window.localStorage.getItem("treasure.hunt.hasRecords")) {
		var hasData = JSON.parse(window.localStorage.getItem('treasure.hunt.hasRecords'));
	} else {
		hasData = false;
	}
	if (hasData != true) { // Retrieve Remote Data
		app.getData();
		return;
	}
	
	huntInfo = JSON.parse(window.localStorage.getItem('treasure.hunt.info'));
	
	// Data Exists, but is it the latest info.
	var dateCheck;
	// Retrieve beacon hunt data version date from server
	$.getJSON('http://boguerat.com/treasureHunt/treasureHuntInfo.php?jsonp=?', function(data) {
		if (data.length !== 0) {
			dateCheck = data;
			if (dateCheck[0].huntVersion > huntInfo[0].huntVersion) {
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
}

app.resetClues = function(hintsNum) {
    // Show appropriate clues for current hint.
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
}

app.showNextClue = function() {
    // TODO: Remember settings
    if (currentHint == 1) {
        //Display 2nd Hint
        $("#hint2").text("Clue 2:  " + dataStore[currentBeaconHint].clue2);
        currentHint++;
		clueStatus[currentBeaconHint] = 2
    } else {
        // Display 3rd Hint
        $("#hint3").text("Clue 3:  " + dataStore[currentBeaconHint].clue3);
        // Hide button
        $("#showNext").hide();
        clueStatus[currentBeaconHint] = 3
    }
}

// Bind Event Listeners
//
// Bind any events that are required on startup. Common events are:
// 'load', 'deviceready', 'offline', and 'online'.
app.bindEvents = function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
};

// deviceready Event Handler
app.onDeviceReady = function() {
    // The plugin was loaded asynchronously and can here be referenced.
    ble = evothings.ble;
    app.startLeScan();
};

var discovered = [];

app.startLeScan = function() {

    app.stopLeScan();
    app.isScanning = true;
    app.lastScanEvent = new Date();
    //app.runScanTimer();
    $("#deviceState").text("");
    ble.startScan(function(r) {  //r has: address, rssi, name, scanRecord
        // compare detected beacon against current clue page.
        if (r.name == dataStore[currentBeaconHint].badgeName && !discovered[currentBeaconHint]) {
                // Display signal strength continuously
                // replace with status bar? This is not accurate as distance.
            $("#deviceState").text(-(r.rssi + 40) / 2);
            //within range, mark as found, return to main. (try different values)
            if (r.rssi > - 60) {
                app.foundBeacon(currentBeaconHint); // Change UI, tally score.
                //Mark as found
                discovered[currentBeaconHint] = true;
            } 
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
    // Show clues for current Hint
    app.resetClues(currentBeaconHint);
    $("hintNameHeader")
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
	// Update UI when number change
	$("#found").text("Found " + beaconsDiscovered + " of " + beaconsPossible);
}

// Application Constructor
app.initialize = function() {
    this.bindEvents();
    // Get Data
    app.verifyLocalData();
};

app.startTimer = function() {
	// Start the clock...
	if (timer) {  // TODO: intended to prevent multiple starts, not working
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
	timer.mode(1);  //Count up = 1; count down = 0
	timer.start();
}