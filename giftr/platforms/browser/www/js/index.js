db = "";

var app = {


	modal: null,
	db: null,
	initialize: function () {
		document.addEventListener('deviceready', this.onDeviceReady);

	},

	onDeviceReady: function () {

		console.log("device is ready");
		db = window.sqlitePlugin.openDatabase({
			name: "Gift.db",
			location: 'default'
		}, function (db) {
			db.transaction(app.populateDB, app.errorCB, app.successCB);
		}, function (err) {
			console.log('Open database ERROR: ' + JSON.stringify(err));
		});


	},

	populateDB: function (tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS Profile (id INTEGER , app_key TEXT, app_id TEXT)');
		console.log("Table created");

	},

	queryDB: function (tx, results) {

		tx.executeSql('SELECT app_id FROM Profile', [], app.querySuccess, app.errorCB);

	},


	successCB: function () {
		db.transaction(app.queryDB, app.errorCB);
	},

	querySuccess: function (tx, results) {
		console.log("Returned rows = " + results.rows.length);
		if (results.rows.length > 0) {
			app.showList();
		} else {
			document.getElementById("register").className = "show";
			document.getElementById("btnregister").addEventListener("click", app.register);

		}
	},
	errorCB: function (err) {
		console.log("Error processing SQL: " + err.message);

	},

	register: function () {
		var emailid = document.getElementById("email").value;
		var formData = new FormData();
		formData.append("email", emailid);
		console.log(emailid);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', encodeURI('https://griffis.edumedia.ca/giftr/register.php'));
		xhr.send(formData);
		xhr.onload = function () {
			if (xhr.status == 200) {
				var userInfo = JSON.parse(xhr.responseText);
				console.log("App key is:" + userInfo.details.app_key);
				var appkey = userInfo.details.app_key;

				db.transaction(function (tx) {
					var s = "INSERT INTO Profile (id, app_key, app_id) VALUES (1,'" + appkey + "','" + emailid + "')";
					tx.executeSql(s);

					console.log("Record inserted");
					document.getElementById("register").className = "hide";
					document.getElementById("listofpeople").className = "show";
					document.getElementById("addpeople").addEventListener("click", app.addPeople);

				}, function (err) {
					console.log("Insert error " + err.message);
				});

			} else if (xhr.status !== 200) {
				console.log('Request failed' + xhr.status);
			}
		}


	},

	addPeople: function () {
		document.getElementById("listofpeople").className = "hide";
		document.getElementById("addperson").className = "show";
		document.getElementById("btnsave").addEventListener("click", app.savepeople);

	},
	savepeople: function () {
		console.log(document.getElementById("txtname").value);
		var name = document.getElementById("txtname").value;
		var formData = new FormData();
		db.transaction(function (tx) {
			var s = 'SELECT app_key from Profile';
			tx.executeSql(s, [], function (tx, results) {
				var key = results.rows.item(0)['app_key'];
				console.log("App key is :" + key);
				formData.append("app_key", key);
				formData.append("name", name);
				var xhr = new XMLHttpRequest();
				xhr.open('POST', encodeURI('https://griffis.edumedia.ca/giftr/add-person.php'));
				xhr.send(formData);
				xhr.onload = function () {
					if (xhr.status == 200) {
						var personinfo = xhr.responseText;
						console.log("Person Added:" + personinfo);
						app.showUpdatedList();
					} else if (xhr.status !== 200) {
						console.log("Adding person failed:" + xhr.status);
					}

				}

			}, function (err) {
				console.log("select failed" + err.message);
			});




		}, function (err) {
			console.log("App key not retrieved " + err.message);
		});


	},
	showUpdatedList: function () {

		document.getElementById("peoplelist").innerHTML = "";
		app.showList();
	},
	showList: function () {

		document.getElementById("register").className = "hide";
		document.getElementById("listofpeople").className = "show";
		var formData = new FormData();
		db.transaction(function (tx) {
				var s = 'SELECT app_key from Profile';
				tx.executeSql(s, [], function (tx, results) {
						var key = results.rows.item(0)['app_key'];
						window.localStorage.setItem("appkey", key);
						console.log("Key is:" + key);
						formData.append("app_key", key);
						var xhr = new XMLHttpRequest();
						xhr.open('POST', 'https://griffis.edumedia.ca/giftr/list-people.php');
						xhr.send(formData);
						xhr.onload = function () {
							if (xhr.status == 200) {
								document.getElementById("addperson").className = "hide";
								document.getElementById("listofpeople").className = "show";
								var response = xhr.responseText;
								console.log("List of people is:" + response);
								var ul = document.getElementById("peoplelist");

								var name = JSON.parse(response);


								var length = name.people.length;

								for (var i = 0; i < length; i++) {
									var li = document.createElement("li");
									li.appendChild(document.createTextNode(name.people[i].name));

									ul.appendChild(li);

								}
								var peopleli = document.getElementById('peoplelist').getElementsByTagName('li');
								ul.onclick = function (event) {
									var target = app.getEventTarget(event);
									var id;
									for (var i = 0; i < length; i++) {
										if (target.innerHTML == name.people[i].name) {
											id = name.people[i].person_id;
										}
									}
									window.localStorage.setItem("personid", id);
								}
								for (var j = 0; j < peopleli.length; j++) {
									peopleli[j].addEventListener('click', app.showgifts, false);
								}
							} else if (xhr.status !== 200) {
								console.log("Fetch failed" + xhr.status);
							}
						}
					},
					function (err) {
						console.log("select failed" + err.message);
					});
				document.getElementById("addpeople").addEventListener("click", app.addPeople);


			},
			function (err) {
				console.log("Insert error " + err.message);
			});


	},

	showgifts: function () {
		document.getElementById("listofpeople").className = "hide";
		document.getElementById("listofgifts").className = "show";
		var personid = window.localStorage.getItem("personid");
		var key = window.localStorage.getItem("appkey");
		var formData = new FormData();
		formData.append("app_key", key);
		formData.append("person_id", personid);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', encodeURI('https://griffis.edumedia.ca/giftr/list-gifts.php'));
		xhr.send(formData);
		xhr.onload = function () {
			if (xhr.status == 200) {
				var personinfo = xhr.responseText;
				console.log("Gifts listed:" + personinfo);
				var ul = document.getElementById("giftlist");

				var name = JSON.parse(personinfo);


				var length = name.gifts.length;

				for (var i = 0; i < length; i++) {
					var li = document.createElement("li");
					li.appendChild(document.createTextNode(name.gifts[i].idea));

					ul.appendChild(li);

				}
				var giftli = document.getElementById('giftlist').getElementsByTagName('li');
				ul.onclick = function (event) {

					var target = app.getEventTarget(event);
					var giftid;
					var giftname;
					var latlong;
					for (var i = 0; i < length; i++) {
						if (target.innerHTML == name.gifts[i].idea) {
							giftid = name.gifts[i].gift_id;
							giftname = name.gifts[i].idea;
							latlong = name.gifts[i].lat_lng;

						}
					}
					console.log(giftname);
					window.localStorage.setItem("giftid", giftid);
					window.localStorage.setItem("giftidea", giftname);
					window.localStorage.setItem("latlng", latlong);

				}

				for (var j = 0; j < giftli.length; j++) {
					giftli[j].addEventListener('click', app.editgift, false);
				}

			} else if (xhr.status !== 200) {
				console.log("Retrieving list of gifts failed:" + xhr.status);
			}



		}


		console.log("App key is :" + key);


		document.getElementById("btnaddgifts").addEventListener('click', app.addgifts, false);
	},

	editgift: function () {

		document.getElementById("listofgifts").className = "hide";
		document.getElementById("editgifts").className = "show";
		document.getElementById("txtgiftdisplay").value = window.localStorage.getItem("giftidea");
		console.log("Gift Idea:" + window.localStorage.getItem("giftidea"));
		document.getElementById("btnedit").addEventListener('click', app.sendgift, false);
		document.getElementById("btndelete").addEventListener('click', app.deletegift, false);

	},
	deletegift: function () {
		var formData = new FormData();
		var appkey = window.localStorage.getItem("appkey");
		var giftid = window.localStorage.getItem("giftid");
		var personid = window.localStorage.getItem("personid");
		formData.append("app_key", appkey);
		formData.append("gift_id", giftid);
		formData.append("person_id", personid);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', encodeURI('https://griffis.edumedia.ca/giftr/delete-gift.php'));
		xhr.send(formData);
		xhr.onload = function () {
			if (xhr.status == 200) {
				var personinfo = xhr.responseText;
				console.log("Gift successfully deleted" + personinfo);


			} else if (xhr.status !== 200) {
				console.log("Delete gift failed" + xhr.status);
			}

		}

	},
	sendgift: function () {

		var key = window.localStorage.getItem("appkey");
		var idea = document.getElementById("txtgiftdisplay").value;
		var giftid = window.localStorage.getItem("giftid");
		var latLong = window.localStorage.getItem("latlng");
		var formData = new FormData();
		formData.append("app_key", key);
		formData.append("idea", idea);
		formData.append("gift_id", giftid);
		formData.append("lat_lng", latLong);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', encodeURI('https://griffis.edumedia.ca/giftr/edit-gift.php'));
		xhr.send(formData);
		xhr.onload = function () {
			if (xhr.status == 200) {
				var personinfo = xhr.responseText;
				console.log("Edit Gift" + personinfo);


			} else if (xhr.status !== 200) {
				console.log("Edit gift failed" + xhr.status);
			}

		}
	},
	addgifts: function () {
		document.getElementById("listofgifts").className = "hide";
		document.getElementById("addgifts").className = "show";
		document.getElementById("btngeolocation").addEventListener('click', app.currloc, false);

	},
	currloc: function () {

		navigator.geolocation.getCurrentPosition(app.onSuccess, app.onError);
	},

	onSuccess: function (position) {
		var longitude = position.coords.longitude;
		var latitude = position.coords.latitude;
		var latLong = new google.maps.LatLng(latitude, longitude);
		console.log(latitude);
		console.log(longitude);
		var mapOptions = {
			center: latLong,
			zoom: 13,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};

		var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

		var marker = new google.maps.Marker({
			position: latLong,
			map: map,
			title: 'my location'
		});
		console.log(marker);
		var idea = document.getElementById("txtgiftname").value;
		console.log("Name of person selected:" + window.localStorage.getItem("personid"));
		var personid = window.localStorage.getItem("personid");
		var key;
		db.transaction(function (tx) {
			var s = 'SELECT app_key from Profile';

			tx.executeSql(s, [], function (tx, results) {
				key = results.rows.item(0)['app_key'];

				var formData = new FormData();
				formData.append("app_key", key);
				formData.append("idea", idea);
				formData.append("person_id", personid);
				formData.append("lat_lng", latLong);

				var xhr = new XMLHttpRequest();
				xhr.open('POST', encodeURI('https://griffis.edumedia.ca/giftr/add-gift.php'));
				xhr.send(formData);
				xhr.onload = function () {
					if (xhr.status == 200) {
						var personinfo = xhr.responseText;
						console.log("Gift Added:" + personinfo);


					} else if (xhr.status !== 200) {
						console.log("Adding gift failed:" + xhr.status);
					}

				}

				console.log("App key is :" + key);
			}, function (err) {
				console.log("select failed" + err.message);
			})

		})



	},

	onError: function (error) {
		alert("the code is " + error.code + ". \n" + "message: " + error.message);
	},


	getEventTarget: function (e) {
		e = e || window.event;
		return e.target || e.srcElement;
	},
}


app.initialize();