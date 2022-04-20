import "./App.css";
import { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import chroma from "chroma-js";
import * as d3 from "d3";
import Denque from "denque";
import {
  CO2,
  CO2_PER_CAPITA,
  MAX_YEAR,
  MIN_YEAR,
  TIMELAPSE_INTERVAL,
  EMISSIONS_TYPES,
} from "./constants";
import { parseCountries } from "./parseCountries";

import Slider from "@mui/material/Slider";
import { IconButton, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { PauseCircle, PlayCircle } from "@mui/icons-material";

const getAltitudeCalculationFunction = (year, emissionsType) => (feat) => {
  const emissions = +feat.properties.CO2_DATA_BY_YEAR?.[year]?.[emissionsType];
  return Math.max(
    0.1,
    (EMISSIONS_TYPES[emissionsType].shouldUseLogScale
      ? getBaseLog(3, emissions)
      : emissions) * EMISSIONS_TYPES[emissionsType].coefficient
  );
};

function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

const colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd);

function App() {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [altitude, setAltitude] = useState(0.1);
  const [transitionDuration, setTransitionDuration] = useState(1000);
  const [year, setYear] = useState(2020);
  const [emissionsType, setEmissionsType] = useState(CO2);
  const timers = useRef(new Denque());
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep track of the latest year to handle edge case when user selects a year before the globe fully renders
  const latestYear = useRef(year);
  useEffect(() => {
    latestYear.current = year;
  });

  useEffect(() => {
    Promise.all([fetch("./countries.geojson"), fetch("./owid-co2-data.json")])
      .then(([countriesRes, co2Res]) =>
        Promise.all([countriesRes.json(), co2Res.json()])
      )
      .then(([countries, co2Data]) => {
        const parsedCountries = parseCountries(countries, co2Data);
        setCountries(parsedCountries);

        setTimeout(() => {
          setAltitude(() =>
            getAltitudeCalculationFunction(latestYear.current, emissionsType)
          );
        }, 1000);
      });
  }, []);

  useEffect(() => {
    // Auto-rotate
    globeEl.current.controls().autoRotate = true;
    globeEl.current.controls().autoRotateSpeed = 1.1;

    globeEl.current.pointOfView({ altitude: 4 }, 5000);
  }, []);

  const clearTimers = () => {
    while (!timers.current.isEmpty()) {
      let timerId = timers.current.shift();
      clearTimeout(timerId);
    }
    timers.current.clear();
  };

  const stopTimelapse = () => {
    clearTimers();
    setIsPlaying(false);
  };

  const startTimelapse = () => {
    if (!timers.current.isEmpty()) clearTimers();
    setIsPlaying(true);

    let j = 0;
    let startYear = year === MAX_YEAR ? MIN_YEAR : year;
    for (let i = startYear; i <= MAX_YEAR; ++i) {
      timers.current.push(
        setTimeout(() => {
          setYear(i);
          setTransitionDuration(TIMELAPSE_INTERVAL);
          setAltitude(() => getAltitudeCalculationFunction(i, emissionsType));
          timers.current.shift();
        }, j * TIMELAPSE_INTERVAL)
      );
      ++j;
    }
    setTimeout(() => {
      timers.current.clear();
      setIsPlaying(false);
    }, j * TIMELAPSE_INTERVAL);
  };

  const changeYear = (e, newYear) => {
    stopTimelapse();

    setYear(newYear);
    setTransitionDuration(100);
    setAltitude(() => getAltitudeCalculationFunction(newYear, emissionsType));
  };

  const changeEmissionsType = (e, newEmissionsType) => {
    if (newEmissionsType !== null) {
      stopTimelapse();

      setEmissionsType(newEmissionsType);
      setTransitionDuration(100);
      setAltitude(() => getAltitudeCalculationFunction(year, newEmissionsType));
    }
  };

  return (
    <div className="App">
      <div className="play-display">
        <IconButton
          aria-label="play"
          onClick={isPlaying ? stopTimelapse : startTimelapse}
          sx={{
            pr: 2,
          }}
        >
          {isPlaying ? (
            <PauseCircle
              sx={{
                width: 100,
                height: 100,
              }}
            />
          ) : (
            <PlayCircle
              sx={{
                width: 100,
                height: 100,
              }}
            />
          )}
        </IconButton>
        <div className="current-year">{year}</div>
        <div className="slider-container">
          <Slider
            aria-label="year"
            value={year}
            onChange={changeYear}
            step={1}
            min={MIN_YEAR}
            max={MAX_YEAR}
          />
        </div>
        <ToggleButtonGroup
          color="primary"
          value={emissionsType}
          exclusive
          onChange={changeEmissionsType}
          aria-label="emissions type"
          sx={{
            pt: 3,
            px: 2,
          }}
        >
          <ToggleButton
            value={CO2}
            sx={{
              border: "1px solid white",
              color: "white",
            }}
          >
            {EMISSIONS_TYPES[CO2].buttonName}
          </ToggleButton>
          <ToggleButton
            value={CO2_PER_CAPITA}
            sx={{
              border: "1px solid white",
              color: "white",
            }}
          >
            {EMISSIONS_TYPES[CO2_PER_CAPITA].buttonName}
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        // globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        polygonsData={countries.features.filter(
          (d) => d.properties.ISO_A2 !== "AQ"
        )}
        polygonAltitude={altitude}
        polygonCapColor={(feat) => {
          const range = chroma.scale([chroma("yellow").alpha(0.5), "red"]);
          return range(altitude(feat)).hex();
        }}
        polygonSideColor={() => "rgba(128,128,128, 0.15)"}
        polygonLabel={({ properties: d }) => `
        <b>${d.ADMIN} (${d.ISO_A2})</b> <br />
        ${EMISSIONS_TYPES[emissionsType].name}: <i>${
          Math.round(+d.CO2_DATA_BY_YEAR?.[year]?.[emissionsType] * 1000) / 1000
        } (tons)</i>
      `}
        polygonsTransitionDuration={transitionDuration}
      />
    </div>
  );
}

export default App;
