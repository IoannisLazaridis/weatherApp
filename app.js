window.addEventListener("load",() => {
    let long;
    let lat;
    let temperatureDescription = document.querySelector(".temperature-description");
    let temperatureDegree = document.querySelector(".temperature-degree");
    let locationTimezone = document.querySelector(".location-timezone");
    let temperatureSection = document.querySelector(".temperature");
    const temperatureSpan = document.querySelector(".temperature span");

    //Έλεγχος τοποθεσίας...
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            long = position.coords.longitude;
            lat = position.coords.latitude;
            const proxy = "https://cors-anywhere.herokuapp.com/"; //Proxy API για χρήση του app σε localhsot.(Delete it για live server χρήση)

            

            const api = `${proxy}https://api.darksky.net/forecast/1057e2b9c370a9a2c441454dd9e9c403/${lat},${long}`; //DarkSky API  για την αντληση καριρικών δεδομένων ανάλογα με την τοποθεσία μας. 

            fetch(api)
            .then(response =>{
                return response.json();
                
                
            })
            .then(data => {
                const { temperature, summary, icon} = data.currently;
                console.log(lat, long);
                console.log(data);

                //Set Dom Elements from the API
                temperatureDegree.textContent = temperature;
                temperatureDescription.textContent = summary;
                locationTimezone.textContent = data.timezone;
                console.log(data.currently);



                // Formula for Celsius
                let Celsius = (temperature - 32) * (5/9);

                //Set Icons
                setIcons(icon, document.querySelector(".icon"));

                //Set Degree format C/F
                temperatureSection.addEventListener('click', () =>{
                    if(temperatureSpan.textContent == "F"){
                        temperatureSpan.textContent = "C";
                        temperatureDegree.textContent = Math.floor(Celsius);
                    } else{
                        temperatureSpan.textContent = "F";
                        temperatureDegree.textContent = temperature;
                    }
                });


            })
        });
    }

    function setIcons(icon, iconId){
        const skycons = new Skycons({color: "white" });
        const currentIcon = icon.replace(/-/g, "_").toUpperCase();
        skycons.play();
        return skycons.set(iconId, Skycons[currentIcon]);

    }
});

        
            