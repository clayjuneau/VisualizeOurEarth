export function parseCountries(countries, co2Data) {
  const co2Map = new Map();
  for (const country of Object.values(co2Data)) {
    if (country.iso_code) co2Map.set(country.iso_code, country.data);
  }

  console.log(co2Map, "CO2Map");

  for (const country of countries.features) {
    const records = co2Map.get(country.properties.ISO_A3) ?? [];
    let co2DataByYear = {};
    for (const record of records) {
      co2DataByYear[record.year] = record;
    }
    country.properties.CO2_RAW_DATA = records;
    country.properties.CO2_DATA_BY_YEAR = co2DataByYear;
  }

  console.log(countries, "Countries");
  return countries;
}
