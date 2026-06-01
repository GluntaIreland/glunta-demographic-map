// Town Mission Profile
// Phase 1: read selected town from urban-areas-boundaries.geojson and render a map-generated preview.

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

let previewMap = null;
let selectedTownFeature = null;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function propertyContainsSelectedCode(props, code) {
  if (!code) return false;

  const target = String(code).trim();

  return Object.values(props).some(value => {
    return String(value || "").trim() === target;
  });
}

function findTownFeature(data, code) {
  if (!code) return null;

  return data.features.find(feature => {
    const props = feature.properties || {};
    const directCode = getUrbanAreaCode(props);

    if (directCode && directCode === String(code).trim()) {
      return true;
    }

    return propertyContainsSelectedCode(props, code);
  });
}

function setNotice(message, state) {
  loadingNoticeEl.textContent = message;
  loadingNoticeEl.classList.remove("is-success", "is-error");

  if (state === "success") {
    loadingNoticeEl.classList.add("is-success");
  }

  if (state === "error") {
    loadingNoticeEl.classList.add("is-error");
  }
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

function renderTownPreview(feature) {
  const selectedLayer = L.geoJSON(feature, {
    style: {
      color: "#111827",
      weight: 3,
      opacity: 0.95,
      fillColor: "#1f77b4",
      fillOpacity: 0.28
    }
  }).addTo(previewMap);

  const bounds = selectedLayer.getBounds();

  if (bounds.isValid()) {
    previewMap.fitBounds(bounds, {
      padding: [26, 26],
      animate: false
    });
  }

  setTimeout(() => {
    previewMap.invalidateSize();
    if (bounds.isValid()) {
      previewMap.fitBounds(bounds, {
        padding: [26, 26],
        animate: false
      });
    }
  }, 250);
}

function updateProfileHeader(feature, requestedCode) {
  const props = feature.properties || {};
  const townName = getAreaName(props);
  const countyName = getCountyName(props);
  const urbanCode = getUrbanAreaCode(props) || requestedCode || "—";

  townNameEl.textContent = townName;
  countyNameEl.textContent = "County: " + countyName;
  urbanAreaCodeEl.textContent = "Urban Area Code: " + urbanCode;

  document.title = `${townName} Town Mission Profile | Glúnta`;

  populationValueEl.textContent = "Next step";
  smallAreasValueEl.textContent = "Next step";
  churchesValueEl.textContent = "Next step";
  nearbyChurchesValueEl.textContent = "Next step";

  setNotice(
    "Town boundary loaded. Next we will add Small Area population, demographic summaries, and church presence.",
    "success"
  );
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

  fetch("urban-areas-boundaries.geojson")
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not load urban-areas-boundaries.geojson. HTTP status: " + response.status);
      }

      return response.json();
    })
    .then(data => {
      selectedTownFeature = findTownFeature(data, selectedCode);

      if (!selectedTownFeature) {
        console.warn("Available sample properties:", data.features?.[0]?.properties || {});
        showTownNotFoundState(selectedCode);
        return;
      }

      updateProfileHeader(selectedTownFeature, selectedCode);
      renderTownPreview(selectedTownFeature);
    })
    .catch(error => {
      console.error(error);
      townNameEl.textContent = "Data could not be loaded";
      setNotice(
        "The town boundary file could not be loaded. Check that urban-areas-boundaries.geojson exists in the root of this GitHub Pages site.",
        "error"
      );
    });
}

loadTownProfile();
