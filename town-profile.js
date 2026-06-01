// Town Mission Profile
// Loads selected town, renders a map-generated preview, aggregates Small Area demographics,
// and lists churches inside / near the selected town.

if (typeof L === "undefined") {
  console.error("Leaflet did not load.");
  throw new Error("Leaflet did not load.");
}

const params = new URLSearchParams(window.location.search);
const selectedCode = params.get("code");

const townNameEl = document.getElementById("townName");
const countyNameEl = document.getElementById("countyName");
const urbanAreaCodeEl = document.getElementById("urbanAreaCode");
const loadingNoticeEl = document.getElementById("loadingNotice");

const populationValueEl = document.getElementById("populationValue");
const smallAreasValueEl = document.getElementById("smallAreasValue");
const churchesValueEl = document.getElementById("churchesValue");
const nearbyChurchesValueEl = document.getElementById("nearbyChurchesValue");

const ageChildrenEl = document.getElementById("ageChildren");
const ageYoungAdultsEl = document.getElementById("ageYoungAdults");
const ageAdultsEl = document.getElementById("ageAdults");
const ageOlderAdultsEl = document.getElementById("ageOlderAdults");

const bornOutsideIrelandEl = document.getElementById("bornOutsideIreland");
const nonIrishCitizenshipEl = document.getElementById("nonIrishCitizenship");
const foreignLanguageSpeakersEl = document.getElementById("foreignLanguageSpeakers");
const otherWhiteBackgroundEl = document.getElementById("otherWhiteBackground");

const religionCatholicEl = document.getElementById("religionCatholic");
const religionOtherEl = document.getElementById("religionOther");
const religionNoneEl = document.getElementById("religionNone");
const religionNotStatedEl = document.getElementById("religionNotStated");

const churchesInsideListEl = document.getElementById("churchesInsideList");
const nearbyChurchesListEl = document.getElementById("nearbyChurchesList");
const missionInsightsEl = document.getElementById("missionInsights");

let previewMap = null;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toLocaleString("en-IE");
}

function formatPercent(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return number.toFixed(1) + "%";
}

function getAreaName(props) {
  return (
    props.area_name ||
    props.town_name ||
    props.TOWN_NAME ||
    props.URBAN_AREA_NAME ||
    props.ENGLISH ||
    props.name ||
    props.NAME ||
    "Unknown town"
  );
}

function getCountyName(props) {
  return props.county || props.COUNTY || props.County || "—";
}

function getUrbanAreaCode(props) {
  return String(
    props.urban_area_code ||
    props.URBAN_AREA_CODE ||
    props.urbanAreaCode ||
    props.URBAN_CODE ||
    props.BUA_CODE ||
    props.CSO_CODE ||
    props.code ||
    props.CODE ||
    ""
  ).trim();
}

function getSmallAreaCode(props) {
  return String(props.SA_PUB2022 || props.SA_PUB2016 || props.SA_PUB2011 || "").trim();
}

function propertyContainsSelectedCode(props, code) {
  if (!code) return false;
  const target = String(code).trim();

  return Object.values(props).some(value => String(value || "").trim() === target);
}

function findTownFeature(data, code) {
  if (!code) return null;

  return data.features.find(feature => {
    const props = feature.properties || {};
    const directCode = getUrbanAreaCode(props);

    if (directCode && directCode === String(code).trim()) return true;

    return propertyContainsSelectedCode(props, code);
  });
}

function setNotice(message, state) {
  loadingNoticeEl.textContent = message;
  loadingNoticeEl.classList.remove("is-success", "is-error");

  if (state === "success") loadingNoticeEl.classList.add("is-success");
  if (state === "error") loadingNoticeEl.classList.add("is-error");
}

function initialisePreviewMap() {
  previewMap = L.map("townMapPreview", {
    zoomControl: false,
    attributionControl: true,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false
  }).setView([53.4, -8.1], 7);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(previewMap);
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter(line => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(header => header.trim());

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : "";
    });

    return row;
  });
}

function loadJson(url) {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`Could not load ${url}. HTTP status: ${response.status}`);
    return response.json();
  });
}

function loadCsv(url) {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`Could not load ${url}. HTTP status: ${response.status}`);
    return response.text();
  }).then(parseCsv);
}

function collectCoordinates(geometry, output) {
  if (!geometry) return;

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach(ring => {
      ring.forEach(coord => output.push(coord));
    });
  }

  if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach(polygon => {
      polygon.forEach(ring => {
        ring.forEach(coord => output.push(coord));
      });
    });
  }
}

function getFeatureCentroid(feature) {
  const coords = [];
  collectCoordinates(feature.geometry, coords);

  if (coords.length === 0) return null;

  let lngTotal = 0;
  let latTotal = 0;
  let validCount = 0;

  coords.forEach(coord => {
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);

    if (Number.isNaN(lng) || Number.isNaN(lat)) return;

    lngTotal += lng;
    latTotal += lat;
    validCount++;
  });

  if (validCount === 0) return null;

  return {
    lng: lngTotal / validCount,
    lat: latTotal / validCount
  };
}

function getFeatureBounds(feature) {
  const coords = [];
  collectCoordinates(feature.geometry, coords);

  if (coords.length === 0) return null;

  const latLngs = coords
    .map(coord => {
      const lng = Number(coord[0]);
      const lat = Number(coord[1]);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

      return L.latLng(lat, lng);
    })
    .filter(Boolean);

  if (latLngs.length === 0) return null;

  return L.latLngBounds(latLngs);
}

function pointInRing(lng, lat, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i][0]);
    const yi = Number(ring[i][1]);
    const xj = Number(ring[j][0]);
    const yj = Number(ring[j][1]);

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function pointInPolygon(lng, lat, rings) {
  if (!rings || rings.length === 0) return false;

  const insideOuter = pointInRing(lng, lat, rings[0]);
  if (!insideOuter) return false;

  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) return false;
  }

  return true;
}

function pointInGeometry(lng, lat, geometry) {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return pointInPolygon(lng, lat, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(polygon => pointInPolygon(lng, lat, polygon));
  }

  return false;
}

function smallAreaLikelyOverlapsTown(smallAreaFeature, townGeometry, townBounds) {
  const smallAreaBounds = getFeatureBounds(smallAreaFeature);

  if (!smallAreaBounds || !townBounds || !townBounds.intersects(smallAreaBounds)) {
    return false;
  }

  const centroid = getFeatureCentroid(smallAreaFeature);

  if (centroid && pointInGeometry(centroid.lng, centroid.lat, townGeometry)) {
    return true;
  }

  const smallAreaPoints = [];
  collectCoordinates(smallAreaFeature.geometry, smallAreaPoints);

  for (const coord of smallAreaPoints) {
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);

    if (pointInGeometry(lng, lat, townGeometry)) return true;
  }

  const townPoints = [];
  collectCoordinates(townGeometry, townPoints);

  for (const coord of townPoints) {
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);

    if (pointInGeometry(lng, lat, smallAreaFeature.geometry)) return true;
  }

  return false;
}

function getColorForPopulation(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return "#f0f0f0";
  if (number >= 800) return "#08306b";
  if (number >= 600) return "#08519c";
  if (number >= 400) return "#2171b5";
  if (number >= 250) return "#4292c6";
  if (number >= 100) return "#9ecae1";
  return "#deebf7";
}

function buildSmallAreaLookup(rows) {
  const lookup = {};

  rows.forEach(row => {
    const code = String(row.SA_PUB2022 || "").trim();
    if (!code) return;

    const clean = {};

    Object.keys(row).forEach(key => {
      if (key === "SA_PUB2022") {
        clean[key] = row[key];
        return;
      }

      const value = Number(row[key]);
      clean[key] = Number.isNaN(value) ? null : value;
    });

    lookup[code] = clean;
  });

  return lookup;
}

function aggregateSmallAreas(matchingFeatures, lookup) {
  const profile = {};
  const weightedTotals = {};
  const weightedWeights = {};

  matchingFeatures.forEach(feature => {
    const code = getSmallAreaCode(feature.properties);
    const data = lookup[code] || {};
    const population = Number(data.population_2022);

    Object.keys(data).forEach(key => {
      if (key === "SA_PUB2022") return;

      const value = Number(data[key]);
      if (Number.isNaN(value)) return;

      if (key.endsWith("_pct")) {
        if (!Number.isNaN(population) && population > 0) {
          weightedTotals[key] = (weightedTotals[key] || 0) + value * population;
          weightedWeights[key] = (weightedWeights[key] || 0) + population;
        }
      } else {
        profile[key] = (profile[key] || 0) + value;
      }
    });
  });

  Object.keys(weightedTotals).forEach(key => {
    profile[key] = weightedWeights[key] > 0 ? weightedTotals[key] / weightedWeights[key] : null;
  });

  return profile;
}

function renderTownPreview(townFeature, matchingSmallAreas, lookup) {
  const townLayer = L.geoJSON(townFeature, {
    style: {
      color: "#111827",
      weight: 3,
      opacity: 0.95,
      fillColor: "transparent",
      fillOpacity: 0
    }
  }).addTo(previewMap);

  L.geoJSON(
    {
      type: "FeatureCollection",
      features: matchingSmallAreas.map(feature => {
        const code = getSmallAreaCode(feature.properties);
        const data = lookup[code] || {};
        feature.properties.population_2022 = data.population_2022;
        return feature;
      })
    },
    {
      style: feature => ({
        fillColor: getColorForPopulation(feature.properties.population_2022),
        fillOpacity: 0.62,
        color: "#0f172a",
        weight: 0.6,
        opacity: 0.75
      })
    }
  ).addTo(previewMap);

  townLayer.bringToFront();

  const bounds = townLayer.getBounds();

  if (bounds.isValid()) {
    previewMap.fitBounds(bounds, {
      padding: [24, 24],
      animate: false
    });
  }

  setTimeout(() => {
    previewMap.invalidateSize();

    if (bounds.isValid()) {
      previewMap.fitBounds(bounds, {
        padding: [24, 24],
        animate: false
      });
    }
  }, 300);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
}

function getChurchName(row) {
  return row.name || row["Church Name"] || row.church_name || "Unnamed church";
}

function getChurchWebsite(row) {
  return row.website || row.Website || "";
}

function renderChurchList(listEl, churches, emptyText, showDistance = false) {
  listEl.innerHTML = "";

  if (churches.length === 0) {
    const li = document.createElement("li");
    li.textContent = emptyText;
    listEl.appendChild(li);
    return;
  }

  churches.forEach(church => {
    const li = document.createElement("li");
    const name = escapeHtml(getChurchName(church));
    const website = getChurchWebsite(church);
    const distance = showDistance && typeof church.distanceKm === "number"
      ? `, ${church.distanceKm.toFixed(1)} km away`
      : "";

    if (website) {
      li.innerHTML = `<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">${name}</a>${distance}`;
    } else {
      li.innerHTML = `${name}${distance}`;
    }

    listEl.appendChild(li);
  });
}

function analyseChurches(churchRows, townFeature) {
  const townGeometry = townFeature.geometry;
  const townCentroid = getFeatureCentroid(townFeature);

  const validChurches = churchRows
    .map(row => {
      const lat = Number(row.latitude || row.Latitude);
      const lng = Number(row.longitude || row.Longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

      return {
        ...row,
        lat,
        lng,
        distanceKm: townCentroid ? haversineKm(townCentroid.lat, townCentroid.lng, lat, lng) : null
      };
    })
    .filter(Boolean);

  const inside = validChurches
    .filter(church => pointInGeometry(church.lng, church.lat, townGeometry))
    .sort((a, b) => getChurchName(a).localeCompare(getChurchName(b), "en-IE"));

  const nearby = validChurches
    .filter(church => !pointInGeometry(church.lng, church.lat, townGeometry))
    .filter(church => typeof church.distanceKm === "number" && church.distanceKm <= 15)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 8);

  return { inside, nearby };
}

function renderProfileData(townFeature, matchingSmallAreas, lookup, churches) {
  const props = townFeature.properties || {};
  const townName = getAreaName(props);
  const countyName = getCountyName(props);
  const urbanCode = getUrbanAreaCode(props) || selectedCode || "—";
  const profile = aggregateSmallAreas(matchingSmallAreas, lookup);

  townNameEl.textContent = townName;
  countyNameEl.textContent = "County: " + countyName;
  urbanAreaCodeEl.textContent = "Urban Area Code: " + urbanCode;
  document.title = `${townName} Town Mission Profile | Glúnta`;

  populationValueEl.textContent = formatNumber(profile.population_2022);
  smallAreasValueEl.textContent = formatNumber(matchingSmallAreas.length);

  ageChildrenEl.textContent = formatPercent(profile.age_0_14_pct);
  ageYoungAdultsEl.textContent = formatPercent(profile.age_15_34_pct);
  ageAdultsEl.textContent = formatPercent(profile.age_35_64_pct);
  ageOlderAdultsEl.textContent = formatPercent(profile.age_65_plus_pct);

  bornOutsideIrelandEl.textContent = formatPercent(profile.born_outside_ireland_pct);
  nonIrishCitizenshipEl.textContent = formatPercent(profile.non_irish_citizenship_pct);
  foreignLanguageSpeakersEl.textContent = formatPercent(profile.foreign_language_speakers_pct);
  otherWhiteBackgroundEl.textContent = formatPercent(profile.ethnicity_other_white_pct);

  religionCatholicEl.textContent = formatPercent(profile.religion_catholic_pct);
  religionOtherEl.textContent = formatPercent(profile.religion_other_pct);
  religionNoneEl.textContent = formatPercent(profile.religion_none_pct);
  religionNotStatedEl.textContent = formatPercent(profile.religion_not_stated_pct);

  const churchAnalysis = analyseChurches(churches, townFeature);

  churchesValueEl.textContent = formatNumber(churchAnalysis.inside.length);
  nearbyChurchesValueEl.textContent = formatNumber(churchAnalysis.nearby.length);

  renderChurchList(
    churchesInsideListEl,
    churchAnalysis.inside,
    "No listed churches inside this urban boundary."
  );

  renderChurchList(
    nearbyChurchesListEl,
    churchAnalysis.nearby,
    "No listed churches within 15 km.",
    true
  );

  renderInsights(profile, churchAnalysis);
}

function renderInsights(profile, churchAnalysis) {
  const insights = [];

  insights.push({
    title: "Begin with local listening",
    text: "This profile is intended to support prayer, partnership, and research. It should not be read as a mechanical church planting recommendation."
  });

  if (churchAnalysis.inside.length > 0) {
    insights.push({
      title: "Start with existing witness",
      text: "There is at least one listed church inside this urban boundary. Any new work should begin by asking what God is already doing locally and how existing witness might be strengthened rather than bypassed."
    });
  } else {
    insights.push({
      title: "Research the actual local witness",
      text: "No listed church appears inside this urban boundary in the current dataset. That does not prove there is no Christian witness, but it does suggest the town deserves closer local research."
    });
  }

  if (Number(profile.born_outside_ireland_pct) >= 15 || Number(profile.non_irish_citizenship_pct) >= 10) {
    insights.push({
      title: "Pay attention to migration and hospitality",
      text: "The demographic profile suggests that intercultural ministry may matter here. A planter should ask which communities are present, where people gather, and whether language, work patterns, or housing shape access to local relationships."
    });
  }

  if (Number(profile.religion_none_pct) >= 20) {
    insights.push({
      title: "Evangelism may need to begin further back",
      text: "A higher non-religious profile suggests that patient trust-building, Bible discovery, apologetics, and embodied community may be more important than invitation-only programming."
    });
  }

  if (Number(profile.age_0_14_pct) >= 20) {
    insights.push({
      title: "Consider family and school-gate rhythms",
      text: "A significant children’s population may point toward family ministry, parent-and-toddler relationships, youth work, and practical support for households."
    });
  }

  if (Number(profile.age_65_plus_pct) >= 20) {
    insights.push({
      title: "Do not miss older adults",
      text: "An older age profile may mean that pastoral presence, loneliness, bereavement, care networks, and weekday ministry rhythms are especially important."
    });
  }

  missionInsightsEl.innerHTML = insights
    .map(insight => `
      <article class="insight-card">
        <h3>${escapeHtml(insight.title)}</h3>
        <p>${escapeHtml(insight.text)}</p>
      </article>
    `)
    .join("");
}

function showMissingCodeState() {
  townNameEl.textContent = "No town selected";
  countyNameEl.textContent = "County: —";
  urbanAreaCodeEl.textContent = "Urban Area Code: —";

  setNotice(
    "No urban area code was provided. Open this page with a URL like town-profile.html?code=27301.",
    "error"
  );
}

function showTownNotFoundState(code) {
  townNameEl.textContent = "Town not found";
  countyNameEl.textContent = "County: —";
  urbanAreaCodeEl.textContent = "Urban Area Code: " + code;

  setNotice(
    "The town boundary could not be found for this code. The code may not match the field names in urban-areas-boundaries.geojson.",
    "error"
  );
}

function loadTownProfile() {
  initialisePreviewMap();

  if (!selectedCode) {
    showMissingCodeState();
    return;
  }

  urbanAreaCodeEl.textContent = "Urban Area Code: " + selectedCode;

  Promise.all([
    loadJson("urban-areas-boundaries.geojson"),
    loadJson("small-areas-2022.geojson"),
    loadCsv("small-area-demographics-2022.csv"),
    loadCsv("churches-points.csv")
  ])
    .then(([townData, smallAreasData, smallAreaDemographicsRows, churches]) => {
      const selectedTownFeature = findTownFeature(townData, selectedCode);

      if (!selectedTownFeature) {
        console.warn("Available sample properties:", townData.features?.[0]?.properties || {});
        showTownNotFoundState(selectedCode);
        return;
      }

      const lookup = buildSmallAreaLookup(smallAreaDemographicsRows);
      const townBounds = L.geoJSON(selectedTownFeature).getBounds();

      const matchingSmallAreas = smallAreasData.features.filter(feature => {
        return smallAreaLikelyOverlapsTown(feature, selectedTownFeature.geometry, townBounds);
      });

      renderTownPreview(selectedTownFeature, matchingSmallAreas, lookup);
      renderProfileData(selectedTownFeature, matchingSmallAreas, lookup, churches);

      setNotice(
        "Town profile loaded from the Glúnta demographic map data. Church presence is based on the current Glúnta church points dataset.",
        "success"
      );
    })
    .catch(error => {
      console.error(error);

      townNameEl.textContent = "Data could not be loaded";

      setNotice(
        "One or more profile files could not be loaded. Check that urban-areas-boundaries.geojson, small-areas-2022.geojson, small-area-demographics-2022.csv, and churches-points.csv are in the root of this GitHub Pages site.",
        "error"
      );
    });
}

loadTownProfile();
