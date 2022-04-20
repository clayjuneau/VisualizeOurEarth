import Papa from "papaparse";

// First 5 rows we can skip/ignore
// fifth row could be used to create the keys (starting from fifth colum)
// second column is country code
// fifth column is where the data starts

export async function parseCountriesOld(countries) {
  return new Promise((resolve) => {
    Papa.parse("./co2.csv", {
      download: true,
      complete: function (results) {
        console.log("Finished:", results.data);
        resolve(joinStuff(countries, results.data));
      },
    });
  });
}

function joinStuff(countries, co2Data) {
  const co2Map = new Map();
  const countryCodeKeyIndex = 1;
  const co2ColIndex = 4;
  const co2YearKeyIndex = 4;
  for (let i = 5; i < co2Data.length; ++i) {
    const a3 = co2Data.at(i).at(countryCodeKeyIndex);
    let co2Obj = {};
    for (let j = co2ColIndex; j < co2Data.at(i).length - 1; ++j) {
      co2Obj[co2Data.at(co2YearKeyIndex).at(j)] = co2Data.at(i).at(j);
    }
    co2Map.set(a3, co2Obj);
  }

  console.log(co2Map, "CO2Map");

  for (const country of countries.features) {
    country.properties.CO2_LVL_BY_YEAR = co2Map.get(country.properties.ISO_A3);
  }

  console.log(countries, "Countries");
  return countries;
}

// useEffect(() => {
//   fetch("./countries.geojson")
//     .then((res) => res.json())
//     .then(async (res) => {
//       const parsedCountries = await parseCountriesOld(res);
//       setCountries(parsedCountries);

//       setTimeout(() => {
//         setTransitionDuration(4000);
//         setAltitude(
//           () => (feat) =>
//             Math.max(0.1, +feat.properties.CO2_LVL_BY_YEAR?.[2018] * 7e-2)
//         );
//       }, 3000);
//     });
// }, []);
