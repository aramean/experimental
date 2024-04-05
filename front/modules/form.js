'use strict'

app.module.form = {
  __autoload: function (options) {

    for (var i = 0; i < document.forms.length; i++) {
      var form = document.forms[i]
      console.log('josef')
      //form.addEventListener("submit", myListener, false)
    }


    // Override form submission with Ajax
    function myListener(e) {
      alert('hej')
      // Prevent the default form submission
      e.preventDefault();

      // Serialize form data
      var formData = serializeForm(this);

      // Perform Ajax request
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "your_ajax_endpoint", true);

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Update the content dynamically
          document.body.innerHTML = xhr.responseText;
        } else {
          // Handle error if needed
          console.error("Ajax request failed:", xhr.statusText);
        }
      };

      xhr.onerror = function () {
        console.error("Network error occurred");
      };

      // Send the request
      xhr.send(formData);
    };

    // Function to serialize form data
    function serializeForm(form) {
      var formData = [];
      for (var i = 0; i < form.elements.length; i++) {
        var field = form.elements[i];
        if (field.name && !field.disabled && field.type !== "file" && field.type !== "reset" &&
          field.type !== "submit" && field.type !== "button") {
          formData.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
        }
      }
      return formData.join("&");
    }


  }
}