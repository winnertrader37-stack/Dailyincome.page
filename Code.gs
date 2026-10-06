/*******************************************************
 * LIVE LOCATION SHARE
 * SATELLITE MAP + LIVE MARKER + ACCURACY CIRCLE
 *******************************************************/

const CONFIG = {

  SHARE_ID:
    "AKfycbyO6ith0ZzQRKIHD8xfQPhKnSH91w9fAp46LhjC1GWPLHpIAIQN-q4C_3aSs7BK2edW",

  WEB_APP_URL:
    "https://script.google.com/macros/s/AKfycbzPp9A96uilwISd_ftxAh4u_r5o01rQv2WL7ZyePGdOaiLDmhOwRZe49Fnx1sDhnem6ag/exec",

  NOTIFY_EMAIL:
    "winnertrader37@gmail.com"
};


/* =====================================================
   MAIN
===================================================== */

function doGet(e) {

  e = e || {};

  const p = e.parameter || {};

  const action = p.action || "";


  if (action === "update") {

    return updateLocation_(p);

  }


  if (action === "location") {

    return getLocation_(p);

  }


  if (action === "view") {

    return viewLocation_(p);

  }


  return HtmlService

    .createHtmlOutput(
      getHomeHtml_()
    )

    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}



/* =====================================================
   RECEIVE LOCATION
===================================================== */

function updateLocation_(p) {

  const id =
    String(p.id || "").trim();


  if (id !== CONFIG.SHARE_ID) {

    return textOutput_(
      "INVALID_ID"
    );

  }


  const lat =
    Number(p.lat);


  const lng =
    Number(p.lng);


  const accuracy =
    Number(p.accuracy || 0);


  if (
    !isFinite(lat) ||
    !isFinite(lng)
  ) {

    return textOutput_(
      "INVALID_LOCATION"
    );

  }


  const data = {

    id: id,

    lat: lat,

    lng: lng,

    accuracy: accuracy,

    time:
      new Date().toISOString(),

    timestamp:
      Date.now()

  };


  PropertiesService

    .getScriptProperties()

    .setProperty(

      "LIVE_LOCATION_" + id,

      JSON.stringify(data)

    );



  /* =================================================
     SEND EMAIL ONLY FIRST TIME
  ================================================= */

  const props =
    PropertiesService
      .getScriptProperties();


  const notifiedKey =
    "NOTIFIED_" + id;


  if (
    props.getProperty(notifiedKey)
    !== "YES"
  ) {

    const viewUrl =

      CONFIG.WEB_APP_URL +

      "?action=view&id=" +

      encodeURIComponent(id);


    try {

      MailApp.sendEmail({

        to:
          CONFIG.NOTIFY_EMAIL,

        subject:
          "📍 Location Shared With You",

        body:

          "A user has allowed location sharing.\n\n" +

          "Their current location is available.\n\n" +

          "View Location:\n" +

          viewUrl,

        htmlBody:

          "<div style='font-family:Arial,sans-serif;padding:10px'>" +

          "<h2>📍 Location Shared</h2>" +

          "<p>" +

          "The user has allowed location sharing." +

          "</p>" +

          "<p>" +

          "Their current location is now available." +

          "</p>" +

          "<a href='" +

          viewUrl +

          "'" +

          " style='" +

          "display:inline-block;" +

          "padding:15px 25px;" +

          "background:#111827;" +

          "color:#ffffff;" +

          "text-decoration:none;" +

          "border-radius:10px;" +

          "font-weight:bold;" +

          "'>" +

          "📍 View Location" +

          "</a>" +

          "</div>"

      });


      props.setProperty(

        notifiedKey,

        "YES"

      );


    } catch (error) {

      console.log(
        "Email error: " +
        error
      );

    }

  }


  return textOutput_("OK");
}



/* =====================================================
   GET LOCATION
===================================================== */

function getLocation_(p) {

  const id =
    String(p.id || "").trim();


  if (id !== CONFIG.SHARE_ID) {

    return jsonOutput_({

      ok: false,

      error:
        "INVALID_ID"

    });

  }


  const raw =

    PropertiesService

      .getScriptProperties()

      .getProperty(

        "LIVE_LOCATION_" + id

      );


  if (!raw) {

    return jsonOutput_({

      ok: true,

      available: false

    });

  }


  try {

    const data =
      JSON.parse(raw);


    return jsonOutput_({

      ok: true,

      available: true,

      location: data

    });


  } catch (error) {

    return jsonOutput_({

      ok: false,

      error:
        "DATA_ERROR"

    });

  }

}



/* =====================================================
   SATELLITE LIVE MAP
===================================================== */

function viewLocation_(p) {

  const id =
    String(p.id || "").trim();


  if (id !== CONFIG.SHARE_ID) {

    return HtmlService

      .createHtmlOutput(
        "<h2>Invalid location link</h2>"
      );

  }


  const html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width,
initial-scale=1.0,
maximum-scale=1.0,
user-scalable=no">


<title>Live Satellite Location</title>


<!-- LEAFLET -->

<link
rel="stylesheet"
href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>


<script
src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
</script>


<style>

html,
body{

  width:100%;

  height:100%;

  margin:0;

  padding:0;

  overflow:hidden;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

}


/* MAP */

#map{

  width:100%;

  height:100%;

  background:#111;

}


/* TOP PANEL */

.panel{

  position:fixed;

  z-index:9999;

  top:12px;

  left:12px;

  right:12px;

  padding:14px;

  border-radius:15px;

  background:
    rgba(0,0,0,.78);

  color:white;

  backdrop-filter:
    blur(12px);

  box-shadow:
    0 5px 30px
    rgba(0,0,0,.45);

}


.title{

  font-size:18px;

  font-weight:bold;

}


.status{

  margin-top:5px;

  color:#50ff8a;

  font-size:13px;

}


.coords{

  margin-top:4px;

  color:#ddd;

  font-size:11px;

}


/* LIVE DOT */

.live-dot{

  display:inline-block;

  width:9px;

  height:9px;

  border-radius:50%;

  background:#00ff72;

  margin-right:5px;

  box-shadow:
    0 0 10px #00ff72;

}


/* CUSTOM MARKER */

.live-marker{

  width:26px;

  height:26px;

  background:#ff1744;

  border:4px solid white;

  border-radius:50%;

  box-shadow:
    0 0 0 5px
    rgba(255,23,68,.25),
    0 4px 15px
    rgba(0,0,0,.5);

}


/* LOCATION INFO */

.info{

  position:fixed;

  bottom:20px;

  left:50%;

  transform:
    translateX(-50%);

  z-index:9999;

  width:90%;

  max-width:420px;

  background:
    rgba(0,0,0,.78);

  color:white;

  padding:12px;

  border-radius:12px;

  text-align:center;

  font-size:12px;

  backdrop-filter:
    blur(10px);

}


/* LEAFLET CONTROL */

.leaflet-control-layers{

  border-radius:10px !important;

}

</style>

</head>


<body>


<!-- TOP STATUS -->

<div class="panel">

  <div class="title">

    🛰️ Live Satellite Location

  </div>


  <div
    class="status"
    id="status">

    <span class="live-dot"></span>

    Connecting...

  </div>


  <div
    class="coords"
    id="coords">

    Waiting for location...

  </div>

</div>


<!-- MAP -->

<div id="map"></div>


<!-- BOTTOM INFO -->

<div
  class="info"
  id="info">

  Waiting for GPS location...

</div>



<script>


/* =====================================================
   CONFIG
===================================================== */

const API =
"${CONFIG.WEB_APP_URL}";


const SHARE_ID =
"${CONFIG.SHARE_ID}";


/* =====================================================
   MAP
===================================================== */

let map =
  L.map(
    "map",
    {

      zoomControl:true,

      attributionControl:true

    }
  );


/* =====================================================
   SATELLITE TILE
===================================================== */

const satellite =
  L.tileLayer(

    "https://server.arcgisonline.com/ArcGIS/rest/services/" +
    "World_Imagery/MapServer/tile/{z}/{y}/{x}",

    {

      maxZoom:19,

      attribution:
        "Satellite imagery © Esri"

    }

  );


satellite.addTo(map);


/* =====================================================
   STREET MAP OPTIONAL
===================================================== */

const street =

  L.tileLayer(

    "https://{s}.tile.openstreetmap.org/" +
    "{z}/{x}/{y}.png",

    {

      maxZoom:19,

      attribution:
        "© OpenStreetMap"

    }

  );


/* =====================================================
   LAYER SWITCHER
===================================================== */

L.control.layers(

  {

    "🛰️ Satellite":
      satellite,

    "🗺️ Street":
      street

  },

  null,

  {

    position:
      "topright"

  }

).addTo(map);



/* =====================================================
   VARIABLES
===================================================== */

let marker = null;

let accuracyCircle = null;

let firstLocation = true;

let lastLat = null;

let lastLng = null;



/* =====================================================
   CUSTOM LIVE ICON
===================================================== */

const liveIcon =

  L.divIcon({

    className:
      "",

    html:
      "<div class='live-marker'></div>",

    iconSize:
      [26,26],

    iconAnchor:
      [13,13]

  });



/* =====================================================
   GET LOCATION
===================================================== */

function loadLocation(){

  const url =

    API +

    "?action=location" +

    "&id=" +

    encodeURIComponent(
      SHARE_ID
    ) +

    "&t=" +

    Date.now();


  fetch(url)

    .then(
      function(response){

        return response.json();

      }
    )

    .then(
      function(data){

        if(
          !data.ok ||
          !data.available
        ){

          document
            .getElementById(
              "status"
            )
            .innerHTML =

            "⏳ Waiting for location...";


          document
            .getElementById(
              "info"
            )
            .textContent =

            "The user has not shared a location yet.";

          return;

        }


        const loc =
          data.location;


        const lat =
          Number(loc.lat);


        const lng =
          Number(loc.lng);


        const accuracy =
          Number(
            loc.accuracy || 0
          );


        /* STATUS */

        document
          .getElementById(
            "status"
          )
          .innerHTML =

          "<span class='live-dot'></span>" +
          "LIVE";


        /* COORDINATES */

        document
          .getElementById(
            "coords"
          )
          .textContent =

          lat.toFixed(6) +

          " , " +

          lng.toFixed(6);


        /* INFO */

        document
          .getElementById(
            "info"
          )
          .textContent =

          "📍 Accuracy: " +

          Math.round(
            accuracy
          ) +

          " m";


        /* ==========================================
           CREATE MARKER
        ========================================== */

        if(
          marker === null
        ){

          marker =
            L.marker(

              [lat,lng],

              {

                icon:
                  liveIcon,

                zIndexOffset:
                  1000

              }

            ).addTo(map);


          marker.bindPopup(

            "<b>📍 Live Location</b><br>" +

            "Accuracy: " +

            Math.round(
              accuracy
            ) +

            " m"

          );


        } else {

          marker.setLatLng(
            [lat,lng]
          );

        }


        /* ==========================================
           ACCURACY CIRCLE
        ========================================== */

        if(
          accuracyCircle === null
        ){

          accuracyCircle =

            L.circle(

              [lat,lng],

              {

                radius:
                  accuracy,

                color:
                  "#ff1744",

                fillColor:
                  "#ff1744",

                fillOpacity:
                  0.15,

                weight:
                  2

              }

            ).addTo(map);

        } else {

          accuracyCircle
            .setLatLng(
              [lat,lng]
            );

          accuracyCircle
            .setRadius(
              accuracy
            );

        }


        /* ==========================================
           AUTO FOLLOW
        ========================================== */

        if(
          firstLocation
        ){

          firstLocation =
            false;


          map.setView(

            [lat,lng],

            18,

            {

              animate:true

            }

          );

        }


        /*
         * If location moves significantly,
         * follow the user.
         */

        if(
          lastLat !== null &&
          lastLng !== null
        ){

          const distance =
            map.distance(

              [lastLat,lastLng],

              [lat,lng]

            );


          if(
            distance > 5
          ){

            map.panTo(

              [lat,lng],

              {

                animate:true,

                duration:.8

              }

            );

          }

        }


        lastLat =
          lat;


        lastLng =
          lng;

      }
    )

    .catch(
      function(){

        document
          .getElementById(
            "status"
          )
          .textContent =

          "Connection problem";

      }
    );

}


/* =====================================================
   START
===================================================== */

map.setView(
  [0,0],
  2
);


loadLocation();


/* =====================================================
   LIVE REFRESH
===================================================== */

setInterval(

  loadLocation,

  3000

);


</script>


</body>

</html>

`;


  return HtmlService

    .createHtmlOutput(html)

    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}



/* =====================================================
   TEXT RESPONSE
===================================================== */

function textOutput_(text) {

  return ContentService

    .createTextOutput(text)

    .setMimeType(
      ContentService.MimeType.TEXT
    );

}



/* =====================================================
   JSON RESPONSE
===================================================== */

function jsonOutput_(obj) {

  return ContentService

    .createTextOutput(
      JSON.stringify(obj)
    )

    .setMimeType(
      ContentService.MimeType.JSON
    );

}



/* =====================================================
   HOME
===================================================== */

function getHomeHtml_() {

  return `

<!DOCTYPE html>

<html>

<head>

<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>Location Share Server</title>

<style>

body{

  font-family:Arial;

  background:#111;

  color:white;

  text-align:center;

  padding:60px 20px;

}

.box{

  max-width:400px;

  margin:auto;

  padding:30px;

  border-radius:20px;

  background:#1b1b1b;

}

</style>

</head>

<body>

<div class="box">

<h2>
📍 Location Share
</h2>

<p>
Server is online.
</p>

</div>

</body>

</html>

`;

}
