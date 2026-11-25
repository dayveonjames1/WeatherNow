const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const locationButton = document.querySelector(".locationButton");
const simpleCard = document.querySelector(".simpleCard");
const detailsCard = document.querySelector(".detailsCard");
const forecastCard = document.querySelector(".forecastCard");
const chartCard = document.querySelector(".chartCard");
const settingsCard = document.querySelector(".settingsCard");
const toggleBtns = document.querySelectorAll(".toggleBtn");
const apiKey = "69ea6ffb327d40df6a43c726c6fb8413";

let weatherChart = null;
let currentWeatherData = null;
let currentForecastData = null;

const userSettings = {
    temp: "C",
    wind: "ms",
    time: "12h",
    distance: "km",
    pressure: "hPa"
};

toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const setting = btn.dataset.setting;
        const value = btn.dataset.value;

        userSettings[setting] = value;

        document.querySelectorAll(`.toggleBtn[data-setting="${setting}"]`).forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        if(currentWeatherData && currentForecastData){
            displayWeatherInfo(currentWeatherData);
            displayForecastInfo(currentForecastData);
            displayHourlyChart(currentForecastData);
        }
    });
});

weatherForm.addEventListener("submit", async event => {
    event.preventDefault();
    const city = cityInput.value.trim();

    if(city){
        await fetchAndDisplayByCity(city);
    }else{
        displayError("Please enter a city.");
    }
});

locationButton.addEventListener("click", () => {
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(async position => {
            const {latitude, longitude} = position.coords;
            try{
                currentWeatherData = await getWeatherDataByCoords(latitude, longitude);
                currentForecastData = await getForecastDataByCoords(latitude, longitude);
                displayWeatherInfo(currentWeatherData);
                displayForecastInfo(currentForecastData);
                displayHourlyChart(currentForecastData);
            }
            catch(error){
                console.error(error);
                displayError("Could not fetch location weather.");
            }
        }, () => {
            displayError("Location access denied.");
        });
    }else{
        displayError("Geolocation is not supported.");
    }
});

async function fetchAndDisplayByCity(city){
    try{
        currentWeatherData = await getWeatherData(city);
        currentForecastData = await getForecastData(city);
        displayWeatherInfo(currentWeatherData);
        displayForecastInfo(currentForecastData);
        displayHourlyChart(currentForecastData);
    }
    catch(error){
        console.error(error);
        displayError(error.message);
    }
}

async function getWeatherData(city){
    const apiURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    const response = await fetch(apiURL);
    if(!response.ok){
        throw new Error("Could not fetch weather data.");
    }
    return await response.json();
}

async function getForecastData(city){
    const apiURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;
    const response = await fetch(apiURL);
    if(!response.ok){
        throw new Error("Could not fetch forecast data.");
    }
    return await response.json();
}

async function getWeatherDataByCoords(lat, lon){
    const apiURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const response = await fetch(apiURL);
    if(!response.ok){
        throw new Error("Could not fetch weather data.");
    }
    return await response.json();
}

async function getForecastDataByCoords(lat, lon){
    const apiURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const response = await fetch(apiURL);
    if(!response.ok){
        throw new Error("Could not fetch forecast data.");
    }
    return await response.json();
}

function formatTemp(kelvin){
    if(userSettings.temp === "F"){
        return `${((kelvin - 273.15) * 9/5 + 32).toFixed(1)}°F`;
    }else if(userSettings.temp === "K"){
        return `${kelvin.toFixed(1)}K`;
    }
    return `${(kelvin - 273.15).toFixed(1)}°C`;
}

function formatTempNumber(kelvin){
    if(userSettings.temp === "F"){
        return ((kelvin - 273.15) * 9/5 + 32).toFixed(1);
    }else if(userSettings.temp === "K"){
        return kelvin.toFixed(1);
    }
    return (kelvin - 273.15).toFixed(1);
}

function formatWind(speed){
    if(userSettings.wind === "mph"){
        return `${(speed * 2.23694).toFixed(1)} mph`;
    }else if(userSettings.wind === "kph"){
        return `${(speed * 3.6).toFixed(1)} kph`;
    }
    return `${speed} m/s`;
}

function formatDistance(meters){
    if(userSettings.distance === "mi"){
        return `${(meters / 1609.34).toFixed(1)} mi`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

function formatPressure(hpa){
    if(userSettings.pressure === "mb"){
        return `${hpa} mb`;
    }else if(userSettings.pressure === "inHg"){
        return `${(hpa * 0.02953).toFixed(2)} inHg`;
    }else if(userSettings.pressure === "mmHg"){
        return `${(hpa * 0.75006).toFixed(1)} mmHg`;
    }
    return `${hpa} hPa`;
}

function formatTime(dateObj, useUTC = false){
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: userSettings.time === "12h"
    };
    if(useUTC){
        options.timeZone = 'UTC';
    }
    return dateObj.toLocaleTimeString([], options);
}

function displayWeatherInfo(data){
    const {
        name: city, 
        main: {temp, feels_like, humidity, pressure}, 
        wind: {speed, deg},
        visibility,
        weather, 
        sys: {sunrise, sunset}, 
        timezone, 
        dt
    } = data;

    const weatherItem = weather && weather[0] ? weather[0] : { description: '', id: 800 };
    updateBackground(weatherItem.id, dt, sunrise, sunset);

    // Make cards visible
    if(simpleCard) simpleCard.style.display = "flex";
    if(detailsCard) detailsCard.style.display = "flex";
    if(settingsCard) settingsCard.style.display = "flex";

    if(simpleCard) {
        simpleCard.textContent = "";

        const cityDisplay = document.createElement("h1");
        const timeDisplay = document.createElement("p");
        const tempDisplay = document.createElement("p");
        const feelsLikeDisplay = document.createElement("p");
        const humidityDisplay = document.createElement("p");
        const descDisplay = document.createElement("p");
        const weatherEmoji = document.createElement("p");

        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const localTime = new Date(utcTime + (timezone * 1000));
        const timeString = formatTime(localTime);

        cityDisplay.textContent = city;
        timeDisplay.textContent = timeString;
        tempDisplay.textContent = formatTemp(temp);
        feelsLikeDisplay.textContent = `Feels like: ${formatTemp(feels_like)}`;
        humidityDisplay.innerHTML = `<i class="fa-solid fa-droplet"></i> Humidity: ${humidity}%`;
        descDisplay.textContent = weatherItem.description;
        weatherEmoji.innerHTML = getWeatherEmoji(weatherItem.id, dt, sunrise, sunset);

        cityDisplay.classList.add("cityDisplay");
        timeDisplay.classList.add("timeDisplay");
        tempDisplay.classList.add("tempDisplay");
        feelsLikeDisplay.classList.add("feelsLikeDisplay");
        humidityDisplay.classList.add("humidityDisplay");
        descDisplay.classList.add("descDisplay");
        weatherEmoji.classList.add("weatherEmoji");

        simpleCard.appendChild(cityDisplay);
        simpleCard.appendChild(timeDisplay);
        simpleCard.appendChild(tempDisplay);
        simpleCard.appendChild(feelsLikeDisplay);
        simpleCard.appendChild(humidityDisplay);
        simpleCard.appendChild(descDisplay);
        simpleCard.appendChild(weatherEmoji);
    }

    if(detailsCard) {
        detailsCard.textContent = "";

        const detailsTitle = document.createElement("h3");
        const windDisplay = document.createElement("p");
        const visibilityDisplay = document.createElement("p");
        const pressureDisplay = document.createElement("p");
        const sunriseDisplay = document.createElement("p");
        const sunsetDisplay = document.createElement("p");

        const windDir = getWindDirection(deg);
        const sunriseStr = formatTime(new Date((sunrise + timezone) * 1000), true);
        const sunsetStr = formatTime(new Date((sunset + timezone) * 1000), true);

        detailsTitle.textContent = "Weather Details";
        windDisplay.innerHTML = `<i class="fa-solid fa-wind"></i> Wind: ${windDir} ${formatWind(speed)}`;
        visibilityDisplay.innerHTML = `<i class="fa-solid fa-eye"></i> Visibility: ${formatDistance(visibility)}`;
        pressureDisplay.innerHTML = `<i class="fa-solid fa-gauge"></i> Pressure: ${formatPressure(pressure)}`;
        sunriseDisplay.innerHTML = `<i class="fa-solid fa-sun"></i> Sunrise: ${sunriseStr}`;
        sunsetDisplay.innerHTML = `<i class="fa-solid fa-moon"></i> Sunset: ${sunsetStr}`;

        detailsCard.appendChild(detailsTitle);
        detailsCard.appendChild(windDisplay);
        detailsCard.appendChild(visibilityDisplay);
        detailsCard.appendChild(pressureDisplay);
        detailsCard.appendChild(sunriseDisplay);
        detailsCard.appendChild(sunsetDisplay);
    }
}

function getWindDirection(deg){
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    const val = Math.floor((deg / 45) + 0.5);
    return directions[(val % 8)];
}

function displayForecastInfo(data){
    if(!forecastCard) return;
    forecastCard.textContent = "";
    forecastCard.style.display = "flex";

    const forecastTitle = document.createElement("h3");
    forecastTitle.textContent = "5-Day Forecast";
    forecastCard.appendChild(forecastTitle);

    const forecastItems = document.createElement("div");
    forecastItems.classList.add("forecastItems");

    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach(day => {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("forecastDay");

        const dateObj = new Date(day.dt * 1000);
        const dayName = dateObj.toLocaleDateString([], { weekday: 'short' });
        const tempFormatted = formatTemp(day.main.temp);
        const iconHTML = getWeatherEmoji(day.weather[0].id, 12, 0, 24);

        const dayLabel = document.createElement("p");
        dayLabel.textContent = dayName;

        const iconLabel = document.createElement("div");
        iconLabel.innerHTML = iconHTML;

        const tempLabel = document.createElement("p");
        tempLabel.textContent = tempFormatted;

        dayDiv.appendChild(dayLabel);
        dayDiv.appendChild(iconLabel);
        dayDiv.appendChild(tempLabel);
        forecastItems.appendChild(dayDiv);
    });

    forecastCard.appendChild(forecastItems);
}

function displayHourlyChart(data){
    if(!chartCard) return;
    chartCard.style.display = "flex";
    const next24Hours = data.list.slice(0, 8);
    
    const labels = next24Hours.map(item => {
        const dateObj = new Date(item.dt * 1000);
        return formatTime(dateObj);
    });
    
    const temps = next24Hours.map(item => formatTempNumber(item.main.temp));

    const ctx = document.getElementById("hourlyChart")?.getContext("2d");
    if(!ctx) return;

    if(weatherChart){
        weatherChart.destroy();
    }

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temp (${userSettings.temp === 'F' ? '°F' : userSettings.temp === 'K' ? 'K' : '°C'})`,
                data: temps,
                borderColor: '#0284C7',
                backgroundColor: 'rgba(2, 132, 199, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function updateBackground(weatherID, dt, sunrise, sunset){
    document.body.className = "";
    if(weatherID >= 200 && weatherID < 600){
        document.body.classList.add("rainy");
    }else if(weatherID >= 600 && weatherID < 700){
        document.body.classList.add("snowy");
    }else if(weatherID === 800){
        if(dt >= sunrise && dt < sunset){
            document.body.classList.add("clear-day");
        }else{
            document.body.classList.add("clear-night");
        }
    }else{
        document.body.classList.add("cloudy");
    }
}

function getWeatherEmoji(weatherID, dt, sunrise, sunset){
    switch(true){
        case(weatherID >= 200 && weatherID < 300):
            return '<i class="fa-solid fa-cloud-bolt"></i>';
        case(weatherID >= 300 && weatherID < 400):
            return '<i class="fa-solid fa-cloud-rain"></i>';
        case(weatherID >= 500 && weatherID < 600):
            return '<i class="fa-solid fa-cloud-rain"></i>';
        case(weatherID >= 600 && weatherID < 700):
            return '<i class="fa-regular fa-snowflake"></i>';
        case(weatherID >= 700 && weatherID < 800):
            return '<i class="fa-solid fa-smog"></i>';
        case(weatherID === 800):
            if(dt >= sunrise && dt < sunset){
                return '<i class="fa-solid fa-sun"></i>';
            }else{
                return '<i class="fa-solid fa-moon"></i>';
            }
        case(weatherID >= 801 && weatherID < 810):
            return '<i class="fa-solid fa-cloud"></i>';
        default:
            return '<i class="fa-solid fa-question"></i>';
    }
}

function displayError(message){
    const errorDisplay = document.createElement("p");
    errorDisplay.textContent = message;
    errorDisplay.classList.add("errorDisplay");

    if(simpleCard) {
        simpleCard.textContent = "";
        simpleCard.style.display = "flex";
        simpleCard.appendChild(errorDisplay);
    }

    if(detailsCard) detailsCard.style.display = "none";
    if(forecastCard) forecastCard.style.display = "none";
    if(chartCard) chartCard.style.display = "none";
    if(settingsCard) settingsCard.style.display = "none";
    
    if(weatherChart){
        weatherChart.destroy();
    }
}
