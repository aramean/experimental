'use strict'

app.module.geolocalize = {
  watch: function () {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(this.set)
    }
  },

  set: function (position) {
    x.innerHTML = "Latitude: " + position.coords.latitude +
      "<br>Longitude: " + position.coords.longitude
  }
}