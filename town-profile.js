// Town Mission Profile
// Interactive mini-map version.
// Loads selected town, aggregates Small Area demographics,
// lists churches inside / near the town, generates rule-based missiological insights,
// and renders a contained contextual Leaflet map in the profile hero.

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

let miniMap = null;

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
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Could not load ${url}. HTTP status: ${response.status}`);
      return response.text();
    })
    .then(parseCsv);
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

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  coords.forEach(coord => {
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);

    if (Number.isNaN(lng) || Number.isNaN(lat)) return;

    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });

  if (!Number.isFinite(minLng)) return null;

  return { minLng, minLat, maxLng, maxLat };
}

function boundsIntersect(a, b) {
  if (!a || !b) return false;

  return !(
    b.minLng > a.maxLng ||
    b.maxLng < a.minLng ||
    b.minLat > a.maxLat ||
    b.maxLat < a.minLat
  );
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

  if (!smallAreaBounds || !townBounds || !boundsIntersect(smallAreaBounds, townBounds)) {
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

  if (Number.isNaN(number)) return "#e5eef0";
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

function initialiseMiniMap() {
  if (miniMap) {
    miniMap.remove();
  }

  miniMap = L.map("townMiniMap", {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
    dragging: true,
    doubleClickZoom: true,
    boxZoom: false,
    keyboard: true
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(miniMap);
}

function renderMiniMap(townFeature, matchingSmallAreas, lookup, churchAnalysis) {
  initialiseMiniMap();

  const smallAreasLayer = L.geoJSON(
    {
      type: "FeatureCollection",
      features: matchingSmallAreas.map(feature => {
        const clone = JSON.parse(JSON.stringify(feature));
        const code = getSmallAreaCode(clone.properties);
        const data = lookup[code] || {};
        clone.properties.population_2022 = data.population_2022;
        return clone;
      })
    },
    {
      style: feature => ({
        fillColor: getColorForPopulation(feature.properties.population_2022),
        fillOpacity: 0.48,
        color: "#0f172a",
        weight: 0.55,
        opacity: 0.65
      }),
      interactive: false
    }
  ).addTo(miniMap);

  const townLayer = L.geoJSON(townFeature, {
    style: {
      color: "#111827",
      weight: 3,
      opacity: 0.95,
      fillColor: "transparent",
      fillOpacity: 0
    }
  }).addTo(miniMap);

  churchAnalysis.inside.forEach(church => {
    const marker = L.circleMarker([church.lat, church.lng], {
      radius: 5.5,
      color: "#111827",
      weight: 2,
      fillColor: "#ffffff",
      fillOpacity: 1
    });

    marker.bindPopup(`<strong>${escapeHtml(getChurchName(church))}</strong><br>Listed inside this town`);
    marker.addTo(miniMap);
  });

  churchAnalysis.nearby.slice(0, 5).forEach(church => {
    const marker = L.circleMarker([church.lat, church.lng], {
      radius: 4,
      color: "#0f4f49",
      weight: 1.8,
      fillColor: "#ffffff",
      fillOpacity: 0.45
    });

    marker.bindPopup(`<strong>${escapeHtml(getChurchName(church))}</strong><br>${church.distanceKm.toFixed(1)} km from town centre`);
    marker.addTo(miniMap);
  });

  const bounds = townLayer.getBounds();

  setTimeout(() => {
    miniMap.invalidateSize(true);

    if (bounds.isValid()) {
      miniMap.fitBounds(bounds, {
        padding: [90, 90],
        maxZoom: 12,
        animate: false
      });
    }

    townLayer.bringToFront();
  }, 250);
}

function renderProfileData(townFeature, matchingSmallAreas, lookup, churches) {
  const props = townFeature.properties || {};
  const townName = getAreaName(props);
  const countyName = getCountyName(props);
  const urbanCode = getUrbanAreaCode(props) || selectedCode || "—";
  const profile = aggregateSmallAreas(matchingSmallAreas, lookup);
  const churchAnalysis = analyseChurches(churches, townFeature);

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

  renderMissiologicalInsights(profile, churchAnalysis, townName);
  renderMiniMap(townFeature, matchingSmallAreas, lookup, churchAnalysis);
}

function addInsight(insights, title, text, priority = false) {
  insights.push({ title, text, priority });
}

function renderMissiologicalInsights(profile, churchAnalysis, townName) {
  const insights = [];

  const population = Number(profile.population_2022);
  const children = Number(profile.age_0_14_pct);
  const youngAdults = Number(profile.age_15_34_pct);
  const olderAdults = Number(profile.age_65_plus_pct);
  const bornOutside = Number(profile.born_outside_ireland_pct);
  const nonIrishCitizenship = Number(profile.non_irish_citizenship_pct);
  const foreignLanguage = Number(profile.foreign_language_speakers_pct);
  const noReligion = Number(profile.religion_none_pct);
  const otherReligion = Number(profile.religion_other_pct);

  addInsight(
    insights,
    "Start with the question of presence",
    `The first question for ${townName} is not simply whether a church could be planted, but what kind of faithful gospel presence is already here, where it is visible, and where it is absent. The data should begin conversations, not end them.`,
    true
  );

  if (churchAnalysis.inside.length > 0) {
    addInsight(
      insights,
      "Begin with existing witness",
      "There is at least one listed church inside this urban boundary. Any new work should begin with listening, honouring existing ministry, and asking whether partnership, strengthening, or multiplication is wiser than starting something disconnected.",
      true
    );
  } else {
    addInsight(
      insights,
      "Verify the gospel presence on the ground",
      `No listed church appears inside this urban boundary in the current dataset. That should not be treated as proof that there is no Christian witness, but it does make ${townName} a place for careful local research, prayer, and conversation with nearby churches.`,
      true
    );
  }

  if (!Number.isNaN(population) && population >= 5000 && churchAnalysis.inside.length === 0) {
    addInsight(
      insights,
      "Population without listed church presence",
      "The town has a meaningful urban population but no listed church inside the boundary. That combination should raise the priority of local research, especially around meeting places, community rhythms, and whether believers are already travelling elsewhere for fellowship.",
      true
    );
  }

  if ((!Number.isNaN(bornOutside) && bornOutside >= 15) || (!Number.isNaN(nonIrishCitizenship) && nonIrishCitizenship >= 10)) {
    addInsight(
      insights,
      "Think interculturally from the beginning",
      "The migration profile suggests that ministry here should not assume one settled Irish cultural pathway. A planter or partner church should ask which communities are present, what languages are spoken at home, where newcomers build trust, and whether hospitality could become a central missionary practice.",
      true
    );
  }

  if (!Number.isNaN(foreignLanguage) && foreignLanguage >= 10) {
    addInsight(
      insights,
      "Language may shape access",
      "A noticeable foreign-language speaking population means that communication, friendship, translation, and multilingual relationships may matter. This does not necessarily mean launching language-specific services, but it does mean asking who is being unintentionally excluded by ordinary church habits."
    );
  }

  if (!Number.isNaN(noReligion) && noReligion >= 20) {
    addInsight(
      insights,
      "Evangelism may need to begin further back",
      "A higher non-religious profile suggests that mission may need to begin with patient trust-building, Bible discovery, apologetics, table fellowship, and visible community life rather than assuming people already share Christian categories.",
      true
    );
  }

  if (!Number.isNaN(otherReligion) && otherReligion >= 8) {
    addInsight(
      insights,
      "Religious plurality needs neighbourly clarity",
      "The presence of other religious affiliation calls for a posture that is both hospitable and clear. Local mission should be prepared for interfaith friendships, careful listening, and gracious explanation of the gospel without reducing people to census categories."
    );
  }

  if (!Number.isNaN(children) && children >= 20) {
    addInsight(
      insights,
      "Family rhythms may be a key doorway",
      "A significant children’s population points toward the importance of schools, sports clubs, parent-and-toddler relationships, youth work, and practical support for households. In a town like this, mission may move through ordinary family networks long before it moves through formal events."
    );
  }

  if (!Number.isNaN(youngAdults) && youngAdults >= 25) {
    addInsight(
      insights,
      "Do not ignore younger adult networks",
      "The younger adult profile suggests paying attention to work, commuting, rental housing, cafés, gyms, sports, and informal friendship networks. A church plant that only imagines Sunday attendance may miss where younger adults actually build community."
    );
  }

  if (!Number.isNaN(olderAdults) && olderAdults >= 20) {
    addInsight(
      insights,
      "Pastoral presence among older adults matters",
      "The older age profile means that loneliness, bereavement, care, weekday availability, and trusted pastoral presence may be central to faithful ministry. A mission strategy focused only on young families would read the town too narrowly."
    );
  }

  if (churchAnalysis.nearby.length >= 3 && churchAnalysis.inside.length === 0) {
    addInsight(
      insights,
      "Nearby churches may be partners, not competitors",
      `There are several listed churches within 15 km. Before asking whether ${townName} needs a separate new church, it would be wise to ask whether nearby congregations already have relationships here, whether a Bible study or outreach could be supported, and what collaboration might look like.`
    );
  }

  addInsight(
    insights,
    "Use the map as a prompt for fieldwork",
    "The next step is not just more data. Walk the town. Notice schools, estates, cafés, marts, shops, community halls, sports clubs, direct provision or migrant housing where relevant, and the places where people already gather. Good missiology starts with attention.",
    true
  );

  missionInsightsEl.innerHTML = insights
    .map(insight => `
      <article class="insight-card ${insight.priority ? "is-priority" : ""}">
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
      const townBounds = getFeatureBounds(selectedTownFeature);

      const matchingSmallAreas = smallAreasData.features.filter(feature => {
        return smallAreaLikelyOverlapsTown(feature, selectedTownFeature.geometry, townBounds);
      });

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