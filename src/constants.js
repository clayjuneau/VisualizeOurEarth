export const MIN_YEAR = 1820;
export const MAX_YEAR = 2020;

export const TIMELAPSE_INTERVAL = 500;

export const CO2 = "co2";
export const CO2_PER_CAPITA = "co2_per_capita";
export const CUMULATIVE_CO2 = "cumulative_co2";
export const EMISSIONS_TYPES = {
  [CO2]: {
    id: CO2,
    name: "CO2 Emissions",
    buttonName: "Annual",
    coefficient: 10e-2,
    shouldUseLogScale: true,
  },
  [CO2_PER_CAPITA]: {
    id: CO2_PER_CAPITA,
    name: "CO2 Emissions Per Capita",
    buttonName: "Per Capita",
    coefficient: 7e-2,
    shouldUseLogScale: false,
  },
};
