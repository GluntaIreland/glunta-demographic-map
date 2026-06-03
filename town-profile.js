// Town Mission Profile
// Parent profile page.
// Loads selected town, aggregates Small Area demographics,
// lists churches inside / near the town, generates rule-based missiological insights,
// and passes the town code to the isolated iframe map.

const params = new URLSearchParams(window.location.search);
const selectedCode = params.get("code");

const townMapFrameEl = document.getElementById("townMapFrame");

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
const fullDemographicProfileEl = document.getElementById("fullDemographicProfile");
const downloadPdfButtonEl = document.getElementById("downloadPdfButton");
const townStaticMapPreviewEl = document.getElementById("townStaticMapPreview");

let currentRenderedTownName = "town-mission-profile";
let currentExportReady = false;

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

function buildSmallAreaLookup(rows) {
  const lookup = {};

  rows.forEach(row => {
    const code = String(row.SA_PUB2022 || row.sa_code || "").trim();
    if (!code) return;

    const clean = {};

    Object.keys(row).forEach(key => {
      if (key === "SA_PUB2022" || key === "sa_code") {
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
      if (key === "SA_PUB2022" || key === "sa_code") return;

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


function getMetric(profile, keys) {
  for (const key of keys) {
    const value = profile[key];
    if (value !== null && value !== undefined && value !== "" && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return null;
}

function hasMetric(profile, keys) {
  return getMetric(profile, keys) !== null;
}

function formatCountAndPercent(profile, countKeys, pctKeys) {
  const count = getMetric(profile, countKeys);
  const pct = getMetric(profile, pctKeys);

  if (count === null && pct === null) return "—";
  if (count !== null && pct !== null) return `${formatNumber(count)} (${formatPercent(pct)})`;
  if (count !== null) return formatNumber(count);
  return formatPercent(pct);
}

function renderProfileSection(title, rows, note) {
  const visibleRows = rows.filter(row => {
    return hasMetric(row.profile, row.countKeys || []) || hasMetric(row.profile, row.pctKeys || []);
  });

  if (visibleRows.length === 0) return "";

  const rowsHtml = visibleRows.map(row => `
    <div class="data-row">
      <span>${escapeHtml(row.label)}</span>
      <strong>${escapeHtml(formatCountAndPercent(row.profile, row.countKeys || [], row.pctKeys || []))}</strong>
    </div>
  `).join("");

  return `
    <article class="panel">
      <div class="panel-header">
        <p class="eyebrow">Census 2022</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="data-list">
        ${rowsHtml}
      </div>
      ${note ? `<p class="source-note">${escapeHtml(note)}</p>` : ""}
    </article>
  `;
}

function renderFullDemographicProfile(profile) {
  if (!fullDemographicProfileEl) return;

  const sections = [
    {
      title: "Population and age",
      note: "Aggregated from the Small Areas inside this town boundary.",
      rows: [
        { label: "Total population", profile, countKeys: ["population_2022"] },
        { label: "Male", profile, countKeys: ["male_population_count"], pctKeys: ["male_population_pct"] },
        { label: "Female", profile, countKeys: ["female_population_count"], pctKeys: ["female_population_pct"] },
        { label: "Children, 0 to 14", profile, countKeys: ["age_0_14_count", "age_0_14"], pctKeys: ["age_0_14_pct"] },
        { label: "Young adults, 15 to 34", profile, countKeys: ["age_15_34_count", "age_15_34"], pctKeys: ["age_15_34_pct"] },
        { label: "Adults, 35 to 64", profile, countKeys: ["age_35_64_count", "age_35_64"], pctKeys: ["age_35_64_pct"] },
        { label: "Older adults, 65+", profile, countKeys: ["age_65_plus_count", "age_65_plus"], pctKeys: ["age_65_plus_pct"] }
      ]
    },
    {
      title: "Marital status",
      note: "Marital status is useful for reading household shape, loneliness, settledness, and pastoral care needs.",
      rows: [
        { label: "Single", profile, countKeys: ["marital_single_count"], pctKeys: ["marital_single_pct"] },
        { label: "Married", profile, countKeys: ["marital_married_count"], pctKeys: ["marital_married_pct"] },
        { label: "Separated", profile, countKeys: ["marital_separated_count"], pctKeys: ["marital_separated_pct"] },
        { label: "Divorced", profile, countKeys: ["marital_divorced_count"], pctKeys: ["marital_divorced_pct"] },
        { label: "Widowed", profile, countKeys: ["marital_widowed_count"], pctKeys: ["marital_widowed_pct"] }
      ]
    },
    {
      title: "Culture, religion, and language",
      note: "These figures should prompt local listening rather than assumptions about identity or belief.",
      rows: [
        { label: "Born in Ireland", profile, countKeys: ["born_ireland_count", "birthplace_ireland_count"], pctKeys: ["born_ireland_pct", "birthplace_ireland_pct"] },
        { label: "Born outside Ireland", profile, countKeys: ["born_outside_ireland_count"], pctKeys: ["born_outside_ireland_pct"] },
        { label: "Catholic", profile, countKeys: ["religion_catholic_count"], pctKeys: ["religion_catholic_pct"] },
        { label: "Other religion", profile, countKeys: ["religion_other_religion_count", "religion_other_count"], pctKeys: ["religion_other_religion_pct", "religion_other_pct"] },
        { label: "No religion", profile, countKeys: ["religion_no_religion_count", "religion_none"], pctKeys: ["religion_no_religion_pct", "religion_none_pct"] },
        { label: "Foreign-language speakers", profile, countKeys: ["foreign_language_speakers_count", "foreign_language_speakers"], pctKeys: ["foreign_language_speakers_pct"] },
        { label: "Can speak Irish", profile, countKeys: ["irish_yes_count"], pctKeys: ["irish_yes_pct"] },
        { label: "English not well / not at all", profile, countKeys: ["english_not_well_count", "english_not_at_all_count"], pctKeys: ["english_not_well_pct", "english_not_at_all_pct"] }
      ]
    },
    {
      title: "Families and households",
      note: "Household structure can shape ministry rhythms, hospitality, children’s work, and pastoral care.",
      rows: [
        { label: "Families with children", profile, countKeys: ["families_with_children_count"], pctKeys: ["families_with_children_pct"] },
        { label: "Families without children", profile, countKeys: ["families_without_children_count"], pctKeys: ["families_without_children_pct"] },
        { label: "2-person households", profile, countKeys: ["household_2_persons_count"], pctKeys: ["household_2_persons_pct"] },
        { label: "3-person households", profile, countKeys: ["household_3_persons_count"], pctKeys: ["household_3_persons_pct"] },
        { label: "4-person households", profile, countKeys: ["household_4_persons_count"], pctKeys: ["household_4_persons_pct"] },
        { label: "5+ person households", profile, countKeys: ["household_5_persons_count", "household_6_plus_persons_count"], pctKeys: ["household_5_persons_pct", "household_6_plus_persons_pct"] }
      ]
    },
    {
      title: "Housing",
      note: "Housing tenure can hint at stability, transience, affordability pressures, and community rootedness.",
      rows: [
        { label: "Owner occupied", profile, countKeys: ["housing_owner_occupied_count"], pctKeys: ["housing_owner_occupied_pct"] },
        { label: "Owned with mortgage / loan", profile, countKeys: ["housing_owned_with_mortgage_or_loan_count"], pctKeys: ["housing_owned_with_mortgage_or_loan_pct"] },
        { label: "Owned outright", profile, countKeys: ["housing_owned_outright_count"], pctKeys: ["housing_owned_outright_pct"] },
        { label: "Rented", profile, countKeys: ["housing_rented_count"], pctKeys: ["housing_rented_pct"] },
        { label: "Private rented", profile, countKeys: ["housing_rented_from_private_landlord_count"], pctKeys: ["housing_rented_from_private_landlord_pct"] },
        { label: "Rented from local authority", profile, countKeys: ["housing_rented_from_local_authority_count"], pctKeys: ["housing_rented_from_local_authority_pct"] }
      ]
    },
    {
      title: "Education and work",
      note: "These figures help describe daily rhythms, pressures, and possible community connection points.",
      rows: [
        { label: "At work", profile, countKeys: ["status_at_work_count"], pctKeys: ["status_at_work_pct"] },
        { label: "Student", profile, countKeys: ["status_student_count"], pctKeys: ["status_student_pct"] },
        { label: "Unemployed", profile, countKeys: ["status_unemployed_count"], pctKeys: ["status_unemployed_pct"] },
        { label: "Retired", profile, countKeys: ["status_retired_count"], pctKeys: ["status_retired_pct"] },
        { label: "Unable to work due to sickness/disability", profile, countKeys: ["status_unable_work_disability_count"], pctKeys: ["status_unable_work_disability_pct"] },
        { label: "Third level or higher", profile, countKeys: ["education_third_level_or_higher_count"], pctKeys: ["education_third_level_or_higher_pct"] }
      ]
    },
    {
      title: "Occupation and industry",
      note: "Work patterns can shape availability, social networks, and the kind of local presence churches may need.",
      rows: [
        { label: "Professional occupations", profile, countKeys: ["occupation_professional_occupations_count"], pctKeys: ["occupation_professional_occupations_pct"] },
        { label: "Managers / directors / senior officials", profile, countKeys: ["occupation_managers_directors_senior_officials_count"], pctKeys: ["occupation_managers_directors_senior_officials_pct"] },
        { label: "Skilled trades", profile, countKeys: ["occupation_skilled_trades_occupations_count"], pctKeys: ["occupation_skilled_trades_occupations_pct"] },
        { label: "Elementary occupations", profile, countKeys: ["occupation_elementary_occupations_count"], pctKeys: ["occupation_elementary_occupations_pct"] },
        { label: "Agriculture, forestry, fishing", profile, countKeys: ["industry_agriculture_forestry_fishing_count"], pctKeys: ["industry_agriculture_forestry_fishing_pct"] },
        { label: "Construction", profile, countKeys: ["industry_construction_count"], pctKeys: ["industry_construction_pct"] },
        { label: "Professional services", profile, countKeys: ["industry_professional_services_count"], pctKeys: ["industry_professional_services_pct"] }
      ]
    }
  ];

  const html = sections
    .map(section => renderProfileSection(section.title, section.rows, section.note))
    .filter(Boolean)
    .join("");

  fullDemographicProfileEl.innerHTML = html || `
    <article class="panel">
      <div class="panel-header">
        <p class="eyebrow">No data</p>
        <h2>Full profile unavailable</h2>
      </div>
      <p class="source-note">No matching rows were found in small-area-town-profile-2022.csv for the Small Areas inside this town.</p>
    </article>
  `;
}

function getFeatureCoords(geometry) {
  const coords = [];
  collectCoordinates(geometry, coords);
  return coords
    .map(coord => ({ lng: Number(coord[0]), lat: Number(coord[1]) }))
    .filter(coord => !Number.isNaN(coord.lng) && !Number.isNaN(coord.lat));
}

function geometryBounds(features) {
  const all = [];
  features.forEach(feature => {
    all.push(...getFeatureCoords(feature.geometry));
  });
  if (!all.length) return null;
  return {
    minLng: Math.min(...all.map(c => c.lng)),
    maxLng: Math.max(...all.map(c => c.lng)),
    minLat: Math.min(...all.map(c => c.lat)),
    maxLat: Math.max(...all.map(c => c.lat))
  };
}

function buildSvgPathForGeometry(geometry, project) {
  if (!geometry) return "";

  function ringToPath(ring) {
    return ring
      .map((coord, index) => {
        const point = project(Number(coord[0]), Number(coord[1]));
        return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
      })
      .join(" ") + " Z";
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join(" ");
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .flatMap(polygon => polygon.map(ringToPath))
      .join(" ");
  }

  return "";
}

function renderStaticMapPreview(townFeature, matchingSmallAreas, lookup, churchRows) {
  if (!townStaticMapPreviewEl || !townFeature) return;

  const townName = getAreaName(townFeature.properties || {});
  const width = 900;
  const height = 520;
  const padding = 34;
  const features = [townFeature, ...matchingSmallAreas];
  const bounds = geometryBounds(features);

  if (!bounds) {
    townStaticMapPreviewEl.innerHTML = `<div class="static-map-fallback">Map boundary unavailable</div>`;
    return;
  }

  const lngSpan = bounds.maxLng - bounds.minLng || 0.01;
  const latSpan = bounds.maxLat - bounds.minLat || 0.01;
  const scale = Math.min((width - padding * 2) / lngSpan, (height - padding * 2) / latSpan);
  const usedWidth = lngSpan * scale;
  const usedHeight = latSpan * scale;
  const offsetX = (width - usedWidth) / 2;
  const offsetY = (height - usedHeight) / 2;

  function project(lng, lat) {
    return {
      x: offsetX + (lng - bounds.minLng) * scale,
      y: offsetY + (bounds.maxLat - lat) * scale
    };
  }

  const smallAreaPaths = matchingSmallAreas.map(feature => {
    const code = getSmallAreaCode(feature.properties || {});
    const data = lookup[code] || {};
    const population = Number(data.population_2022);
    const fill = Number.isNaN(population)
      ? "#dbe7eb"
      : population >= 600
        ? "#5f8ebf"
        : population >= 300
          ? "#8fb4d1"
          : "#c6dce8";
    return `<path d="${buildSvgPathForGeometry(feature.geometry, project)}" fill="${fill}" fill-opacity="0.58" stroke="#1f3340" stroke-opacity="0.55" stroke-width="1"/>`;
  }).join("");

  const townPath = `<path d="${buildSvgPathForGeometry(townFeature.geometry, project)}" fill="none" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>`;

  const churchAnalysis = analyseChurches(churchRows || [], townFeature);
  const churchDots = churchAnalysis.inside.map(church => {
    const point = project(church.lng, church.lat);
    return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="7" fill="#ffffff" stroke="#111827" stroke-width="3"><title>${escapeHtml(getChurchName(church))}</title></circle>`;
  }).join("");

  townStaticMapPreviewEl.innerHTML = `
    <svg class="static-town-map-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Map of ${escapeHtml(townName)}">
      <rect width="${width}" height="${height}" fill="#dfe9e7"/>
      <g opacity="0.65">
        <path d="M0 ${height * 0.68} C ${width * 0.22} ${height * 0.58}, ${width * 0.42} ${height * 0.78}, ${width} ${height * 0.6}" fill="none" stroke="#c7d6d3" stroke-width="26" stroke-linecap="round"/>
        <path d="M${width * 0.08} ${height * 0.18} L${width * 0.92} ${height * 0.84}" stroke="#eef2d5" stroke-width="18" stroke-linecap="round"/>
        <path d="M${width * 0.08} ${height * 0.18} L${width * 0.92} ${height * 0.84}" stroke="#d5c16a" stroke-width="3" stroke-linecap="round"/>
      </g>
      ${smallAreaPaths}
      ${townPath}
      ${churchDots}
      <text x="24" y="42" font-size="24" font-weight="800" fill="#0f4f49">${escapeHtml(townName)}</text>
      <text x="24" y="72" font-size="15" fill="#5f6b76">Town boundary, Small Areas, and listed churches</text>
    </svg>
  `;
}

function slugifyFileName(value) {
  return String(value || "town-mission-profile")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "town-mission-profile";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPdfBlocks() {
  const blocks = [];
  const hero = document.querySelector(".profile-hero");
  const summary = document.querySelector(".town-summary-card");
  const metrics = document.querySelector(".metric-grid");
  const topPanels = document.querySelectorAll(".content-grid > .panel");
  const fullHeader = document.querySelector(".wide-panel .panel-header");
  const fullCards = document.querySelectorAll("#fullDemographicProfile > .panel");
  const insightsHeader = Array.from(document.querySelectorAll(".wide-panel .panel-header")).find(header => header.textContent.includes("Mission reading"));
  const insightCards = document.querySelectorAll("#missionInsights > .insight-card");
  const muted = document.querySelector(".muted-panel");

  [hero, summary, metrics].forEach(el => { if (el) blocks.push(el); });
  topPanels.forEach(el => blocks.push(el));
  if (fullHeader) blocks.push(fullHeader);
  fullCards.forEach(el => blocks.push(el));
  if (insightsHeader) blocks.push(insightsHeader);
  insightCards.forEach(el => blocks.push(el));
  if (muted) blocks.push(muted);

  return blocks;
}

async function addElementToPdf(pdf, element, layout) {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    logging: false,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.96);
  const imgWidth = layout.contentWidth;
  const imgHeight = canvas.height * imgWidth / canvas.width;

  if (layout.currentY + imgHeight > layout.pageHeight - layout.margin && layout.currentY > layout.margin) {
    pdf.addPage();
    layout.currentY = layout.margin;
  }

  if (imgHeight <= layout.pageHeight - layout.margin * 2) {
    pdf.addImage(imgData, "JPEG", layout.margin, layout.currentY, imgWidth, imgHeight);
    layout.currentY += imgHeight + layout.gap;
    return;
  }

  const pageCanvas = document.createElement("canvas");
  const pageCtx = pageCanvas.getContext("2d");
  const sliceHeight = Math.floor(canvas.width * (layout.pageHeight - layout.margin * 2) / imgWidth);
  pageCanvas.width = canvas.width;
  pageCanvas.height = sliceHeight;

  let sourceY = 0;
  while (sourceY < canvas.height) {
    pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageCtx.fillStyle = "#ffffff";
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    const sliceData = pageCanvas.toDataURL("image/jpeg", 0.96);
    const actualSliceHeight = Math.min(sliceHeight, canvas.height - sourceY) * imgWidth / canvas.width;
    if (layout.currentY > layout.margin) {
      pdf.addPage();
      layout.currentY = layout.margin;
    }
    pdf.addImage(sliceData, "JPEG", layout.margin, layout.currentY, imgWidth, actualSliceHeight);
    sourceY += sliceHeight;
    if (sourceY < canvas.height) {
      pdf.addPage();
      layout.currentY = layout.margin;
    } else {
      layout.currentY += actualSliceHeight + layout.gap;
    }
  }
}

async function downloadProfilePdf() {
  if (!downloadPdfButtonEl) return;

  if (!currentExportReady) {
    alert("The profile is still loading. Please wait a moment and try again.");
    return;
  }

  if (!window.html2canvas || !window.jspdf) {
    alert("The PDF tools did not load. Please refresh the page and try again.");
    return;
  }

  const originalText = downloadPdfButtonEl.textContent;
  downloadPdfButtonEl.disabled = true;
  downloadPdfButtonEl.textContent = "Creating PDF...";
  document.body.classList.add("pdf-export-mode");

  try {
    await sleep(250);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const layout = {
      margin: 10,
      gap: 5,
      pageWidth: 210,
      pageHeight: 297,
      contentWidth: 190,
      currentY: 10
    };

    const blocks = getPdfBlocks();
    for (const block of blocks) {
      await addElementToPdf(pdf, block, layout);
    }

    const filename = `${slugifyFileName(currentRenderedTownName)}-town-mission-profile.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error(error);
    alert("The PDF could not be created. Please try refreshing the page, then use Download PDF again.");
  } finally {
    document.body.classList.remove("pdf-export-mode");
    downloadPdfButtonEl.disabled = false;
    downloadPdfButtonEl.textContent = originalText;
  }
}

if (downloadPdfButtonEl) {
  downloadPdfButtonEl.addEventListener("click", downloadProfilePdf);
}

function renderProfileData(townFeature, matchingSmallAreas, summaryLookup, fullLookup, churches) {
  const props = townFeature.properties || {};
  const townName = getAreaName(props);
  const countyName = getCountyName(props);
  const urbanCode = getUrbanAreaCode(props) || selectedCode || "—";
  const summaryProfile = aggregateSmallAreas(matchingSmallAreas, summaryLookup);
  const fullProfile = aggregateSmallAreas(matchingSmallAreas, fullLookup);
  const profile = { ...summaryProfile, ...fullProfile };
  const churchAnalysis = analyseChurches(churches, townFeature);
  currentRenderedTownName = townName;
  currentExportReady = false;

  townNameEl.textContent = townName;
  countyNameEl.textContent = "County: " + countyName;
  urbanAreaCodeEl.textContent = "Urban Area Code: " + urbanCode;
  document.title = `${townName} Town Mission Profile | Glúnta`;

  populationValueEl.textContent = formatNumber(getMetric(profile, ["population_2022"]));
  smallAreasValueEl.textContent = formatNumber(matchingSmallAreas.length);

  ageChildrenEl.textContent = formatPercent(getMetric(profile, ["age_0_14_pct"]));
  ageYoungAdultsEl.textContent = formatPercent(getMetric(profile, ["age_15_34_pct"]));
  ageAdultsEl.textContent = formatPercent(getMetric(profile, ["age_35_64_pct"]));
  ageOlderAdultsEl.textContent = formatPercent(getMetric(profile, ["age_65_plus_pct"]));

  bornOutsideIrelandEl.textContent = formatPercent(getMetric(profile, ["born_outside_ireland_pct"]));
  nonIrishCitizenshipEl.textContent = formatPercent(getMetric(profile, ["non_irish_citizenship_pct"]));
  foreignLanguageSpeakersEl.textContent = formatPercent(getMetric(profile, ["foreign_language_speakers_pct"]));
  otherWhiteBackgroundEl.textContent = formatPercent(getMetric(profile, ["ethnicity_other_white_pct"]));

  religionCatholicEl.textContent = formatPercent(getMetric(profile, ["religion_catholic_pct"]));
  religionOtherEl.textContent = formatPercent(getMetric(profile, ["religion_other_religion_pct", "religion_other_pct"]));
  religionNoneEl.textContent = formatPercent(getMetric(profile, ["religion_no_religion_pct", "religion_none_pct"]));
  religionNotStatedEl.textContent = formatPercent(getMetric(profile, ["religion_not_stated_pct"]));

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

  renderFullDemographicProfile(profile);
  renderMissiologicalInsights(profile, churchAnalysis, townName);
  renderStaticMapPreview(townFeature, matchingSmallAreas, summaryLookup, churches);
  currentExportReady = true;
}

function addInsight(insights, title, text, priority = false) {
  insights.push({ title, text, priority });
}

function safeMetric(profile, keys) {
  const value = getMetric(profile, keys);
  return value === null ? NaN : Number(value);
}

function metricIsAtLeast(profile, keys, threshold) {
  const value = safeMetric(profile, keys);
  return !Number.isNaN(value) && value >= threshold;
}

function renderMissiologicalInsights(profile, churchAnalysis, townName) {
  const insights = [];

  const population = safeMetric(profile, ["population_2022"]);
  const children = safeMetric(profile, ["age_0_14_pct"]);
  const youngAdults = safeMetric(profile, ["age_15_34_pct"]);
  const olderAdults = safeMetric(profile, ["age_65_plus_pct"]);
  const bornOutside = safeMetric(profile, ["born_outside_ireland_pct", "birthplace_rest_world_pct"]);
  const nonIrishCitizenship = safeMetric(profile, ["non_irish_citizenship_pct"]);
  const foreignLanguage = safeMetric(profile, ["foreign_language_speakers_pct"]);
  const noReligion = safeMetric(profile, ["religion_no_religion_pct", "religion_none_pct"]);
  const otherReligion = safeMetric(profile, ["religion_other_religion_pct", "religion_other_pct"]);
  const privateRenting = safeMetric(profile, ["housing_rented_from_private_landlord_pct"]);
  const localAuthorityRenting = safeMetric(profile, ["housing_rented_from_local_authority_pct"]);
  const ownerOccupied = safeMetric(profile, ["housing_owner_occupied_pct"]);
  const thirdLevel = safeMetric(profile, ["education_third_level_or_higher_pct"]);
  const atWork = safeMetric(profile, ["status_at_work_pct"]);
  const students = safeMetric(profile, ["status_student_pct"]);
  const retired = safeMetric(profile, ["status_retired_pct"]);
  const unableWork = safeMetric(profile, ["status_unable_work_disability_pct", "status_unable_to_work_pct"]);
  const unemployment = safeMetric(profile, ["status_unemployed_pct"]);
  const households2 = safeMetric(profile, ["household_2_persons_pct"]);
  const familiesWithChildren = safeMetric(profile, ["families_with_children_pct"]);
  const professionalOccupations = safeMetric(profile, ["occupation_professional_occupations_pct"]);
  const skilledTrades = safeMetric(profile, ["occupation_skilled_trades_occupations_pct"]);
  const elementaryOccupations = safeMetric(profile, ["occupation_elementary_occupations_pct"]);
  const agriculture = safeMetric(profile, ["industry_agriculture_forestry_fishing_pct"]);
  const construction = safeMetric(profile, ["industry_construction_pct"]);
  const professionalServices = safeMetric(profile, ["industry_professional_services_pct"]);

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

  if (!Number.isNaN(children) && children >= 20 && !Number.isNaN(familiesWithChildren) && familiesWithChildren >= 50) {
    addInsight(
      insights,
      "Family networks may be a primary doorway",
      "The combination of children and families with children suggests that schools, sports clubs, parent-and-toddler relationships, children’s ministry, and practical support for households may be significant pathways into community life.",
      true
    );
  } else if (!Number.isNaN(children) && children >= 20) {
    addInsight(
      insights,
      "Family rhythms may be a key doorway",
      "A significant children’s population points toward the importance of schools, sports clubs, parent networks, and practical support for households. Mission may move through ordinary family relationships before it moves through formal events."
    );
  }

  if (!Number.isNaN(youngAdults) && youngAdults >= 25 && !Number.isNaN(privateRenting) && privateRenting >= 20) {
    addInsight(
      insights,
      "Younger adults may be mobile and relationally unsettled",
      "The profile combines a noticeable younger adult population with private renting. That often points to mobility, thinner local roots, and friendship networks built around work, cafés, gyms, sport, and shared housing rather than inherited community structures.",
      true
    );
  } else if (!Number.isNaN(youngAdults) && youngAdults >= 25) {
    addInsight(
      insights,
      "Do not ignore younger adult networks",
      "The younger adult profile suggests paying attention to work, rental housing, cafés, gyms, sports, and informal friendship networks. A church plant that only imagines Sunday attendance may miss where younger adults actually build community."
    );
  }

  if (!Number.isNaN(olderAdults) && olderAdults >= 20 && !Number.isNaN(retired) && retired >= 18) {
    addInsight(
      insights,
      "Pastoral presence among older adults matters",
      "The age and retirement profile suggest that loneliness, bereavement, transport, healthcare, weekday availability, and trusted pastoral presence may be central to faithful ministry. A strategy focused only on young families would read the place too narrowly.",
      true
    );
  }

  if (!Number.isNaN(ownerOccupied) && ownerOccupied >= 65) {
    addInsight(
      insights,
      "This may be a settled community",
      "A high owner-occupied housing profile can indicate stability and long local memory. New ministry here may need patience, consistency, and visible faithfulness over time rather than quick programme-driven activity."
    );
  }

  if (!Number.isNaN(privateRenting) && privateRenting >= 25) {
    addInsight(
      insights,
      "Housing may shape belonging",
      "A higher private-renting profile may mean people are more mobile, newer to the area, or less rooted in older local networks. Hospitality, small groups, and low-barrier community spaces could be unusually important."
    );
  }

  if (!Number.isNaN(localAuthorityRenting) && localAuthorityRenting >= 18) {
    addInsight(
      insights,
      "Pay attention to disadvantage without making assumptions",
      "A higher level of local-authority renting may point toward particular pastoral and community needs. This should lead to listening, dignity, practical friendship, and partnership with local workers, not crude assumptions about poverty or receptivity."
    );
  }

  if (!Number.isNaN(thirdLevel) && thirdLevel >= 45 && !Number.isNaN(noReligion) && noReligion >= 20) {
    addInsight(
      insights,
      "Apologetics and trust may belong together",
      "The combination of higher education and a sizeable non-religious population suggests that mission may need both intellectual clarity and relational credibility. People may not simply need an invitation to church; they may need space to reconsider whether Christianity is believable at all.",
      true
    );
  }

  if (!Number.isNaN(atWork) && atWork >= 62) {
    addInsight(
      insights,
      "Daily rhythms may be shaped by work pressure",
      "A high proportion of adults at work suggests that evening availability, commuting, childcare, tiredness, and weekend patterns should be considered carefully. Ministry rhythms that assume endless volunteer capacity may struggle here."
    );
  }

  if (!Number.isNaN(students) && students >= 12) {
    addInsight(
      insights,
      "Students may be a distinct mission field",
      "The student profile suggests the need to ask where younger adults gather, whether there are colleges nearby, and how transient student life affects discipleship, hospitality, and continuity."
    );
  }

  if (!Number.isNaN(unableWork) && unableWork >= 8) {
    addInsight(
      insights,
      "Accessibility and care should not be secondary",
      "A noticeable share of people unable to work because of sickness or disability should shape how churches think about access, transport, pastoral care, daytime presence, and the dignity of those often left at the edge of busy church life."
    );
  }

  if (!Number.isNaN(unemployment) && unemployment >= 8) {
    addInsight(
      insights,
      "Work, dignity, and hope may be live questions",
      "A higher unemployment profile may point to economic pressure, discouragement, and fragile confidence. Local mission should avoid treating people as projects, but practical care, friendship, and pathways into purposeful community may matter deeply."
    );
  }

  if (!Number.isNaN(households2) && households2 >= 45 && !Number.isNaN(olderAdults) && olderAdults >= 18) {
    addInsight(
      insights,
      "Small households may hide loneliness",
      "A high share of two-person households alongside an older age profile may indicate settled couples, empty nesters, widows and widowers, or smaller household units. Pastoral visiting and neighbourly attention may matter more than a purely event-led strategy."
    );
  }

  if (!Number.isNaN(professionalOccupations) && professionalOccupations >= 20 || !Number.isNaN(professionalServices) && professionalServices >= 25) {
    addInsight(
      insights,
      "Professional networks may shape community life",
      "The work profile suggests that professional networks, commuting patterns, and time pressure may shape how people form relationships. In a place like this, careful teaching, thoughtful apologetics, and flexible discipleship rhythms may carry particular weight."
    );
  }

  if (!Number.isNaN(skilledTrades) && skilledTrades >= 12 || !Number.isNaN(construction) && construction >= 12) {
    addInsight(
      insights,
      "Practical credibility may matter",
      "A strong trades or construction profile suggests that churches should not only think in terms of formal programmes. Practical service, reliability, embodied community, and everyday usefulness may speak loudly."
    );
  }

  if (!Number.isNaN(agriculture) && agriculture >= 10) {
    addInsight(
      insights,
      "Rural working patterns may shape ministry",
      "An agricultural profile may mean seasonal pressure, dispersed relationships, and a different rhythm of availability. Ministry here may need to account for farming calendars, local marts, parish memory, and the slow work of trust."
    );
  }

  if (!Number.isNaN(elementaryOccupations) && elementaryOccupations >= 12) {
    addInsight(
      insights,
      "Do not design ministry only for the articulate and available",
      "A noticeable elementary-occupations profile should remind churches not to build everything around middle-class assumptions of time, confidence, education, and communication style. Plain speech, practical friendship, and non-performative community may be important."
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
  if (selectedCode) {
    townMapFrameEl.src = `town-profile-map.html?code=${encodeURIComponent(selectedCode)}&v=iframe1`;
  } else {
    townMapFrameEl.src = "town-profile-map.html?v=iframe1";
  }

  if (!selectedCode) {
    showMissingCodeState();
    return;
  }

  urbanAreaCodeEl.textContent = "Urban Area Code: " + selectedCode;

  Promise.all([
    loadJson("urban-areas-boundaries.geojson"),
    loadJson("small-areas-2022.geojson"),
    loadCsv("small-area-demographics-2022.csv").catch(error => {
      console.warn("Summary demographic file could not be loaded. Continuing with full town profile file only.", error);
      return [];
    }),
    loadCsv("small-area-town-profile-2022.csv"),
    loadCsv("churches-points.csv")
  ])
    .then(([townData, smallAreasData, smallAreaDemographicsRows, fullProfileRows, churches]) => {
      const selectedTownFeature = findTownFeature(townData, selectedCode);

      if (!selectedTownFeature) {
        console.warn("Available sample properties:", townData.features?.[0]?.properties || {});
        showTownNotFoundState(selectedCode);
        return;
      }

      const summaryLookup = buildSmallAreaLookup(smallAreaDemographicsRows);
      const fullLookup = buildSmallAreaLookup(fullProfileRows);
      const townBounds = getFeatureBounds(selectedTownFeature);

      const matchingSmallAreas = smallAreasData.features.filter(feature => {
        return smallAreaLikelyOverlapsTown(feature, selectedTownFeature.geometry, townBounds);
      });

      renderProfileData(selectedTownFeature, matchingSmallAreas, summaryLookup, fullLookup, churches);

      setNotice(
        "Town profile loaded from the Glúnta demographic map data. Church presence is based on the current Glúnta church points dataset.",
        "success"
      );
    })
    .catch(error => {
      console.error(error);

      townNameEl.textContent = "Data could not be loaded";

      setNotice(
        "One or more profile files could not be loaded. Check that urban-areas-boundaries.geojson, small-areas-2022.geojson, small-area-town-profile-2022.csv, and churches-points.csv are in the root of this GitHub Pages site.",
        "error"
      );
    });
}

loadTownProfile();
