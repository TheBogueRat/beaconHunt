//
// JavaScript code for the BLE Beacon Hunt.
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
var dataStore; // Holds treasure hunt data for quick display
var clueStatus = []; // Which clues have been given.
var beaconsDiscovered = 0; // Number of beacons that have been located by device
var beaconsPossible; // Number of beacons available to be found.
var currentBeaconHint; // Which beacon# is being displayed, for use in array

// BLE device scanning will be made with this interval in milliseconds.
app.scanInterval = 5000;

// Track whether scanning is ongoing to avoid multiple intervals.
app.isScanning = false;

// Time for last scan event. This is useful for
// when the device does not support continuous scan.
app.lastScanEvent = 0;

app.getData = function() {
        // Grab Treasure Hunt Information from Server if not Available
        // TODO: Add validation - Date check
        $.getJSON('http://boguerat.com/treasureHunt/treasureHunt.php?jsonp=?', function(data) {
            if (data.length !== 0) {
                console.log("treasureHunt Data Retrieved...storing...");
                localStorage.setItem('treasure.hunt.data', JSON.stringify(data));
                localStorage.setItem('treasure.hunt.hasRecords', JSON.stringify(true));
                //dataStore = data;
            } else {
                console.log("No treasureHunt data was retrieved.");
            }
        });
        $.getJSON('http://boguerat.com/treasureHunt/treasureHuntInfo.php?jsonp=?', function(data) {
            if (data.length !== 0) {
                console.log("treasureHuntInfo Data Retrieved...storing...");
                localStorage.setItem('treasure.hunt.info', JSON.stringify(data));
            } else {
                console.log("No treasureHuntInfo data was retrieved.");
            }
        });
        console.log("JSONp complete.");
    } // End getData

app.verifyLocalData = function() {
        // Check to see if local data already exists, Retrieve it as necessary.
        // TODO: Add validation - Date check
        var dataCheck = window.localStorage.getItem('treasure.hunt.hasRecords');
        if (dataCheck != 'true') { // Retrieve Remote Data
            console.log("gettingData...");
            app.getData();
        }
        // Retrieve values to populate the app (need to pull from localStorage since straight from JSONP was failing)
        dataStore = JSON.parse(window.localStorage.getItem('treasure.hunt.data'));
    } // End verifyLocalData

var currentHint = 1;
app.resetClues = function(hintsNum) {
    // reset counter
    currentHint = 1;
    // change display to default
    $("#hint1").text("Clue 1:  " + dataStore[hintsNum].clue1);
    $("#hint2").text("Clue 2:");
    $("#hint3").text("Clue 3:");
    $("#showNext").show();
	$("#hintImgs").attr("src", ".\\images\\"+dataStore[hintsNum].picture);  //Change image src to current hint.
	console.log("hintImage changed to: "+ "/images/"+dataStore[hintsNum].picture);
}

app.showNextClue = function() {
    // TODO: Remember settings
    if (currentHint == 1) {
        //Display 2nd Hint
        $("#hint2").text("Clue 2:  " + dataStore[currentBeaconHint].clue2);
        currentHint++;
    } else if (currentHint == 2) {
        // Display 3rd Hint
        $("#hint3").text("Clue 3:  " + dataStore[currentBeaconHint].clue3);
        // Hide button
        $("#showNext").hide();
        // display "All Clues are Displayed"

    } else {
        // Should have already hidden this
    }
    console.log("currentHint: " + currentHint);
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
                app.foundBeacon(currentBeaconHint); // Change UI
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
        var hint = dataStore[foundDevice].badgeName;
        $("#nextHint").hide();
        $("#deviceState").text("n/a");
        var foundLink = $("#huntList").find("li a").eq(foundDevice);
        foundLink.text("FOUND: The " + hint);
        foundLink.removeClass("ui-icon-carat-r").addClass("ui-icon-check");
        foundLink.prop("href", "");
        foundLink.css("background-color", "lime");
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
			$("#gameStatus").text=("<b>Congratulations for finding all the beacons.</b>  Now return to the start and present your score to the game coordinator.");
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
    app.connect(event.data.address, event.data.name);
    document.getElementById('hintNameHeader').innerHTML = event.data.name;
};

app.connect = function(address, name) {
    //app.stopLeScan();
    // TODO:  if correct beacon found, use the next line...
    document.getElementById('hintNameHeader').innerHTML = name;
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

    // Populate Name of the hunt.
    var huntInfo = JSON.parse(window.localStorage.getItem('treasure.hunt.info'));
    $("#huntName").text(huntInfo[0].huntName + " List:");
    // Populate huntList items
    $.each(dataStore, function(i, item) {
        // grab specific key/value from each record
        var res = dataStore[i].hintName;
        var p = document.getElementById('huntList');
        var li = document.createElement('li');
		//var $im = $("<img src=.\\images\\"+dataStore[i].picture+">"); //Add Thumbnail Pic
		//$(li).append($im);
        var $a = $("<a href=\"#connected\"><img src=.\\images\\"+dataStore[i].picture+">" + res + "</a>");
        $(li).append($a);
        $a.bind("click", {
                address: dataStore[i].badgeID,
                name: dataStore[i].hintName
            },
            app.eventDeviceClicked);
        p.appendChild(li);
        // Store the number of beacons needed to finish the game
        beaconsPossible = i + 1;
    });
	app.updateNumFound();
    console.log("Number of possible beacons: " + beaconsPossible);
	// Start the clock...
};

app.startTimer = function() {
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