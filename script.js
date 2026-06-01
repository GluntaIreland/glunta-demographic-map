// Glúnta Demographic Map
// Unified County + LEA + Town view
// Town view shows Small Areas inside a selected Built Up Area and colours them by selected Small Area demographic data.
// Town view includes a predictive town search placed above Reference Layers and a left-panel demographic profile.
// Switching between County, LEA, and Town preserves the current map view.

if (typeof L === "undefined") {
  console.error("Leaflet did not load. Check your internet connection or CDN access.");
  throw new Error("Leaflet did not load.");
}

const DEFAULT_FILL_OPACITY = 0.62;
const HOVER_FILL_OPACITY = 0.72;
const SELECTED_FILL_OPACITY = 0.78;

const GEOGRAPHIES = {
  county: {
    label: "County",
    subtitle: "County and local authority demographic data from Census 2022.",
    dataUrl: "county-demographics-map.geojson",
    selectedEyebrow: "Selected area",
    emptyName: "No area selected",
    emptyIntro: "Click a county or local authority area on the map to view its Census 2022 demographic profile.",
    selectedIntro: "Census 2022 demographic profile for this county or local authority area.",
    sourceNote: "Source: CSO Census 2022, county / local authority SAPS tables.",
    contextLabel: "",
    hasDemographics: true,
    isTown: false,
    weight: 1.1
  },
  lea: {
    label: "LEA",
    subtitle: "Local Electoral Area demographic data from Census 2022.",
    dataUrl: "lea-demographics-map.geojson",
    selectedEyebrow: "Selected LEA",
    emptyName: "No LEA selected",
    emptyIntro: "Click a Local Electoral Area on the map to view its Census 2022 demographic profile.",
    selectedIntro: "Census 2022 demographic profile for this Local Electoral Area.",
    sourceNote: "Source: CSO Census 2022, LEA-level SAPS tables.",
    contextLabel: "County",
    hasDemographics: true,
    isTown: false,
    weight: 0.9
  },
  town: {
    label: "Town",
    subtitle: "Census 2022 Built Up Area / Urban Area boundaries with Small Area demographics.",
    dataUrl: "urban-areas-boundaries.geojson",
    selectedEyebrow: "Selected town / urban area",
    emptyName: "No town selected",
    emptyIntro: "Click a town boundary or search for a town to show its Census 2022 Built Up Area and the Small Areas inside it.",
    selectedIntro: "This view shows the Census 2022 Built Up Area boundary and the Small Areas inside the selected town, coloured by the selected demographic measure.",
    sourceNote: "Source: Census 2022 Built Up Areas / Urban Areas boundary file, Small Area boundary file, and processed Census 2022 Small Area demographic tables.",
    contextLabel: "County",
    hasDemographics: false,
    isTown: true,
    weight: 1.5
  }
};

const GROUPS = [
  { label: "Population", options: [{ value: "population_2022", label: "Total population" }] },
  {
    label: "Age structure",
    options: [
      { value: "age_0_14_pct", label: "Children, 0 to 14 %" },
      { value: "age_15_34_pct", label: "Young adults, 15 to 34 %" },
      { value: "age_35_64_pct", label: "Adults, 35 to 64 %" },
      { value: "age_65_plus_pct", label: "Older adults, 65+ %" }
    ]
  },
  {
    label: "Religion",
    options: [
      { value: "religion_catholic_pct", label: "Catholic %" },
      { value: "religion_other_pct", label: "Other religion %" },
      { value: "religion_none_pct", label: "No religion %" },
      { value: "religion_not_stated_pct", label: "Religion not stated %" }
    ]
  },
  {
    label: "Migration and citizenship",
    options: [
      { value: "born_outside_ireland_pct", label: "Born outside Ireland %" },
      { value: "born_ireland_pct", label: "Born in Ireland %" },
      { value: "citizen_ireland_pct", label: "Irish citizenship %" },
      { value: "non_irish_citizenship_pct", label: "Non-Irish citizenship %" },
      { value: "born_uk_pct", label: "Born in UK %" },
      { value: "born_poland_pct", label: "Born in Poland %" },
      { value: "born_india_pct", label: "Born in India %" },
      { value: "born_other_eu_pct", label: "Born in Other EU %" },
      { value: "born_rest_world_pct", label: "Born in Rest of World %" }
    ]
  },
  {
    label: "Ethnicity / cultural background",
    options: [
      { value: "ethnicity_white_irish_pct", label: "White Irish %" },
      { value: "ethnicity_white_irish_traveller_pct", label: "White Irish Traveller %" },
      { value: "ethnicity_other_white_pct", label: "Other White %" },
      { value: "ethnicity_black_or_black_irish_pct", label: "Black or Black Irish %" },
      { value: "ethnicity_asian_or_asian_irish_pct", label: "Asian or Asian Irish %" },
      { value: "ethnicity_other_pct", label: "Other ethnic background %" },
      { value: "ethnicity_not_stated_pct", label: "Ethnicity not stated %" }
    ]
  },
  {
    label: "Language",
    options: [
      { value: "foreign_language_speakers_pct", label: "Foreign-language speakers %" },
      { value: "language_spanish_pct", label: "Spanish speakers %" },
      { value: "language_french_pct", label: "French speakers %" },
      { value: "language_polish_pct", label: "Polish speakers %" },
      { value: "language_other_incl_not_stated_pct", label: "Other / not stated language %" }
    ]
  },
  {
    label: "Families / household structure",
    options: [
      { value: "families_with_children_pct", label: "Families with children %", geographies: ["county", "town"] },
      { value: "families_without_children_pct", label: "Families without children %", geographies: ["county", "town"] },
      { value: "families_all_children_under15_pct", label: "Families: all children under 15 %", geographies: ["county", "town"] },
      { value: "families_all_children_15_plus_pct", label: "Families: all children 15+ %", geographies: ["county", "town"] },
      { value: "families_children_under_and_over15_pct", label: "Families: children under and over 15 %", geographies: ["county", "town"] },
      { value: "families_1_child_pct", label: "Families with 1 child %", geographies: ["county", "town"] },
      { value: "families_2_children_pct", label: "Families with 2 children %", geographies: ["county", "town"] },
      { value: "families_3_children_pct", label: "Families with 3 children %", geographies: ["county", "town"] },
      { value: "families_4_children_pct", label: "Families with 4 children %", geographies: ["county", "town"] },
      { value: "families_5_plus_children_pct", label: "Families with 5+ children %", geographies: ["county", "town"] },
      { value: "families_household_size_2_persons_pct", label: "2-person households %", geographies: ["lea", "town"] },
      { value: "families_household_size_3_persons_pct", label: "3-person households %", geographies: ["lea", "town"] },
      { value: "families_household_size_4_persons_pct", label: "4-person households %", geographies: ["lea", "town"] },
      { value: "families_household_size_5_persons_pct", label: "5-person households %", geographies: ["lea", "town"] },
      { value: "families_household_size_6_plus_persons_pct", label: "6+ person households %", geographies: ["lea", "town"] }
    ]
  },
  {
    label: "Principal economic status",
    options: [
      { value: "status_at_work_pct", label: "At work %" },
      { value: "status_student_pct", label: "Student %" },
      { value: "status_retired_pct", label: "Retired %" },
      { value: "status_home_family_pct", label: "Looking after home/family %" },
      { value: "status_unable_to_work_pct", label: "Unable to work due to sickness/disability %" },
      { value: "status_unemployed_pct", label: "Unemployed %" },
      { value: "status_other_pct", label: "Other status %" }
    ]
  }
];

const TOWN_GROUPS = [
  { label: "Population", options: [{ value: "population_2022", label: "Small Area population, 2022" }] },
  {
    label: "Age structure",
    options: [
      { value: "age_0_14_pct", label: "Children, 0 to 14 %" },
      { value: "age_15_34_pct", label: "Young adults, 15 to 34 %" },
      { value: "age_35_64_pct", label: "Adults, 35 to 64 %" },
      { value: "age_65_plus_pct", label: "Older adults, 65+ %" }
    ]
  },
  {
    label: "Religion",
    options: [
      { value: "religion_catholic_pct", label: "Catholic %" },
      { value: "religion_other_pct", label: "Other religion %" },
      { value: "religion_none_pct", label: "No religion %" },
      { value: "religion_not_stated_pct", label: "Religion not stated %" }
    ]
  },
  {
    label: "Birthplace and citizenship",
    options: [
      { value: "born_ireland_pct", label: "Born in Ireland %" },
      { value: "born_outside_ireland_pct", label: "Born outside Ireland %" },
      { value: "born_uk_pct", label: "Born in UK %" },
      { value: "born_poland_pct", label: "Born in Poland %" },
      { value: "born_india_pct", label: "Born in India %" },
      { value: "born_other_eu_pct", label: "Born in Other EU %" },
      { value: "born_rest_world_pct", label: "Born in Rest of World %" },
      { value: "citizen_ireland_pct", label: "Irish citizenship %" },
      { value: "non_irish_citizenship_pct", label: "Non-Irish citizenship %" }
    ]
  },
  {
    label: "Ethnicity / cultural background",
    options: [
      { value: "ethnicity_white_irish_pct", label: "White Irish %" },
      { value: "ethnicity_white_irish_traveller_pct", label: "White Irish Traveller %" },
      { value: "ethnicity_other_white_pct", label: "Other White %" },
      { value: "ethnicity_black_or_black_irish_pct", label: "Black or Black Irish %" },
      { value: "ethnicity_asian_or_asian_irish_pct", label: "Asian or Asian Irish %" },
      { value: "ethnicity_other_pct", label: "Other ethnic background %" },
      { value: "ethnicity_not_stated_pct", label: "Ethnicity not stated %" }
    ]
  },
  {
    label: "Language",
    options: [
      { value: "foreign_language_speakers_pct", label: "Foreign-language speakers %" },
      { value: "language_spanish_pct", label: "Spanish speakers %" },
      { value: "language_french_pct", label: "French speakers %" },
      { value: "language_polish_pct", label: "Polish speakers %" },
      { value: "language_other_incl_not_stated_pct", label: "Other / not stated language %" }
    ]
  },
  {
    label: "Families / household structure",
    options: [
      { value: "families_with_children_pct", label: "Families with children %" },
      { value: "families_without_children_pct", label: "Families without children %" },
      { value: "families_1_child_pct", label: "Families with 1 child %" },
      { value: "families_2_children_pct", label: "Families with 2 children %" },
      { value: "families_3_children_pct", label: "Families with 3 children %" },
      { value: "families_4_children_pct", label: "Families with 4 children %" },
      { value: "families_5_plus_children_pct", label: "Families with 5+ children %" },
      { value: "families_household_size_2_persons_pct", label: "2-person households %" },
      { value: "families_household_size_3_persons_pct", label: "3-person households %" },
      { value: "families_household_size_4_persons_pct", label: "4-person households %" },
      { value: "families_household_size_5_persons_pct", label: "5-person households %" },
      { value: "families_household_size_6_plus_persons_pct", label: "6+ person households %" }
    ]
  },
  {
    label: "Principal economic status",
    options: [
      { value: "status_at_work_pct", label: "At work %" },
      { value: "status_student_pct", label: "Student %" },
      { value: "status_retired_pct", label: "Retired %" },
      { value: "status_home_family_pct", label: "Looking after home/family %" },
      { value: "status_unable_to_work_pct", label: "Unable to work due to sickness/disability %" },
      { value: "status_unemployed_pct", label: "Unemployed %" },
      { value: "status_other_pct", label: "Other status %" }
    ]
  }
];

const sharedProfileSections = [
  {
    title: "Age structure",
    note: "Age groups are simplified from the five-year Census 2022 age bands.",
    barClass: "age-bar",
    rows: [
      { label: "Children, 0 to 14", count: "age_0_14", pct: "age_0_14_pct" },
      { label: "Young adults, 15 to 34", count: "age_15_34", pct: "age_15_34_pct" },
      { label: "Adults, 35 to 64", count: "age_35_64", pct: "age_35_64_pct" },
      { label: "Older adults, 65+", count: "age_65_plus", pct: "age_65_plus_pct" }
    ]
  },
  {
    title: "Religion",
    note: "Source: CSO Census 2022 religion table.",
    barClass: "religion-bar",
    rows: [
      { label: "Catholic", count: "religion_catholic", pct: "religion_catholic_pct" },
      { label: "Other religion", count: "religion_other", pct: "religion_other_pct" },
      { label: "No religion", count: "religion_none", pct: "religion_none_pct" },
      { label: "Not stated", count: "religion_not_stated", pct: "religion_not_stated_pct" }
    ]
  },
  {
    title: "Migration and citizenship",
    note: "Source: CSO Census 2022 birthplace and citizenship table.",
    barClass: "migration-bar",
    rows: [
      { label: "Born in Ireland", count: "born_ireland", pct: "born_ireland_pct" },
      { label: "Born outside Ireland", count: "born_outside_ireland", pct: "born_outside_ireland_pct" },
      { label: "Irish citizenship", count: "citizen_ireland", pct: "citizen_ireland_pct" },
      { label: "Non-Irish citizenship", count: "non_irish_citizenship", pct: "non_irish_citizenship_pct" }
    ]
  },
  {
    title: "Birthplace outside Ireland",
    note: "Selected non-Ireland birthplace categories from CSO Census 2022.",
    barClass: "migration-bar",
    rows: [
      { label: "Born in UK", count: "born_uk", pct: "born_uk_pct" },
      { label: "Born in Poland", count: "born_poland", pct: "born_poland_pct" },
      { label: "Born in India", count: "born_india", pct: "born_india_pct" },
      { label: "Born in Other EU", count: "born_other_eu", pct: "born_other_eu_pct" },
      { label: "Born in Rest of World", count: "born_rest_world", pct: "born_rest_world_pct" }
    ]
  },
  {
    title: "Ethnicity / cultural background",
    note: "Source: CSO Census 2022 ethnicity and cultural background table.",
    barClass: "ethnicity-bar",
    rows: [
      { label: "White Irish", count: "ethnicity_white_irish", pct: "ethnicity_white_irish_pct" },
      { label: "White Irish Traveller", count: "ethnicity_white_irish_traveller", pct: "ethnicity_white_irish_traveller_pct" },
      { label: "Other White", count: "ethnicity_other_white", pct: "ethnicity_other_white_pct" },
      { label: "Black or Black Irish", count: "ethnicity_black_or_black_irish", pct: "ethnicity_black_or_black_irish_pct" },
      { label: "Asian or Asian Irish", count: "ethnicity_asian_or_asian_irish", pct: "ethnicity_asian_or_asian_irish_pct" },
      { label: "Other", count: "ethnicity_other", pct: "ethnicity_other_pct" },
      { label: "Not stated", count: "ethnicity_not_stated", pct: "ethnicity_not_stated_pct" }
    ]
  },
  {
    title: "Language",
    note: "Source: CSO Census 2022 language table. Percentages are calculated using total population as the denominator.",
    barClass: "language-bar",
    rows: [
      { label: "Foreign-language speakers", count: "foreign_language_speakers", pct: "foreign_language_speakers_pct" },
      { label: "Spanish speakers", count: "language_spanish", pct: "language_spanish_pct" },
      { label: "French speakers", count: "language_french", pct: "language_french_pct" },
      { label: "Polish speakers", count: "language_polish", pct: "language_polish_pct" },
      { label: "Other / not stated language", count: "language_other_incl_not_stated", pct: "language_other_incl_not_stated_pct" }
    ]
  },
  {
    title: "Principal economic status",
    note: "Percentages are shown as a population-weighted average of the Small Areas inside the selected boundary.",
    barClass: "status-bar",
    rows: [
      { label: "At work", count: "status_at_work", pct: "status_at_work_pct" },
      { label: "Student", count: "status_student", pct: "status_student_pct" },
      { label: "Retired", count: "status_retired", pct: "status_retired_pct" },
      { label: "Looking after home/family", count: "status_home_family", pct: "status_home_family_pct" },
      { label: "Unable to work due to sickness/disability", count: "status_unable_to_work", pct: "status_unable_to_work_pct" },
      { label: "Unemployed", count: "status_unemployed", pct: "status_unemployed_pct" },
      { label: "Other", count: "status_other", pct: "status_other_pct" }
    ]
  }
];

const countyFamilySection = {
  title: "Families",
  note: "This table describes family units by number and age of children.",
  barClass: "families-bar",
  rows: [
    { label: "Families with children", count: "families_with_children", pct: "families_with_children_pct" },
    { label: "Families without children", count: "families_without_children", pct: "families_without_children_pct" },
    { label: "All children under 15", count: "families_all_children_under15", pct: "families_all_children_under15_pct" },
    { label: "All children 15+", count: "families_all_children_15_plus", pct: "families_all_children_15_plus_pct" },
    { label: "Children under and over 15", count: "families_children_under_and_over15", pct: "families_children_under_and_over15_pct" },
    { label: "Families with 1 child", count: "families_1_child", pct: "families_1_child_pct" },
    { label: "Families with 2 children", count: "families_2_children", pct: "families_2_children_pct" },
    { label: "Families with 3 children", count: "families_3_children", pct: "families_3_children_pct" },
    { label: "Families with 4 children", count: "families_4_children", pct: "families_4_children_pct" },
    { label: "Families with 5+ children", count: "families_5_plus_children", pct: "families_5_plus_children_pct" }
  ]
};

const householdFamilySection = {
  title: "Household / family size",
  note: "This table reflects household / family size categories in the processed Census 2022 data.",
  barClass: "families-bar",
  rows: [
    { label: "2-person households", count: "families_household_size_2_persons", pct: "families_household_size_2_persons_pct" },
    { label: "3-person households", count: "families_household_size_3_persons", pct: "families_household_size_3_persons_pct" },
    { label: "4-person households", count: "families_household_size_4_persons", pct: "families_household_size_4_persons_pct" },
    { label: "5-person households", count: "families_household_size_5_persons", pct: "families_household_size_5_persons_pct" },
    { label: "6+ person households", count: "families_household_size_6_plus_persons", pct: "families_household_size_6_plus_persons_pct" }
  ]
};

const sidebarSectionsByGeography = {
  county: [...sharedProfileSections.slice(0, 6), countyFamilySection, sharedProfileSections[6]],
  lea: [...sharedProfileSections.slice(0, 6), householdFamilySection, sharedProfileSections[6]],
  town: [...sharedProfileSections.slice(0, 6), countyFamilySection, householdFamilySection, sharedProfileSections[6]]
};

const map = L.map("map", { zoomControl: true }).setView([53.4, -8.1], 7);

map.createPane("smallAreaPane");
map.getPane("smallAreaPane").style.zIndex = 690;
map.getPane("smallAreaPane").style.pointerEvents = "none";

map.createPane("churchPane");
map.getPane("churchPane").style.zIndex = 695;

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const mapSubtitleEl = document.getElementById("mapSubtitle");
const countyViewButtonEl = document.getElementById("countyViewButton");
const leaViewButtonEl = document.getElementById("leaViewButton");
const townViewButtonEl = document.getElementById("townViewButton");
const aboutButtonEl = document.getElementById("aboutButton");
const aboutPanelEl = document.getElementById("aboutPanel");
const aboutCloseButtonEl = document.getElementById("aboutCloseButton");

const indicatorSelectEl = document.getElementById("indicatorSelect");
const indicatorNoteEl = document.getElementById("indicatorNote");
const resetButtonEl = document.getElementById("resetButton");
const churchOverlayToggleEl = document.getElementById("churchOverlayToggle");

const selectedAreaEyebrowEl = document.getElementById("selectedAreaEyebrow");
const areaNameEl = document.getElementById("areaName");
const areaIntroEl = document.getElementById("areaIntro");
const selectedIndicatorCardEl = document.getElementById("selectedIndicatorCard");
const townProfileActionEl = document.getElementById("townProfileAction");
const townProfileLinkEl = document.getElementById("townProfileLink");
const selectedIndicatorNameEl = document.getElementById("selectedIndicatorName");
const selectedIndicatorValueEl = document.getElementById("selectedIndicatorValue");
const populationValueEl = document.getElementById("populationValue");
const contextValueEl = document.getElementById("contextValue");
const sourceNoteEl = document.getElementById("sourceNote");
const dataSectionsEl = document.getElementById("dataSections");

let currentGeography = "county";
let currentIndicator = "population_2022";
let activeLayer = null;
let selectedLayer = null;
let legend = null;
let sectionRowEls = [];
let allAreaLayers = [];
let loadedLayers = {};
let fullMapBoundsByGeography = {};

let townSearchSectionEl = null;
let townSearchInputEl = null;
let townSearchResultsEl = null;

let churchLayer = L.layerGroup();
let churchesLoaded = false;

let smallAreasData = null;
let smallAreasLoaded = false;
let smallAreaDisplayLayer = L.layerGroup();

let smallAreaDemographicsByCode = {};
let smallAreaDemographicsLoaded = false;

let dublinDetailActionEl = null;
let dublinDetailBackButtonEl = null;
let selectedTownLayerForSmallAreas = null;
let selectedTownPropsForSmallAreas = null;
let selectedTownSmallAreaSummary = null;
let selectedDublinSmallAreaLayer = null;
let selectedDublinSmallAreaFeature = null;

function config(label, note, legendTitle, colorSet, type, grades) {
  return {
    label,
    note,
    legendTitle,
    colorSet,
    type,
    grades: grades.map(([min, label]) => ({ min, label }))
  };
}

function pct(label, subject, legendTitle, colorSet, grades) {
  return config(label, `The map is currently coloured by the percentage of ${subject}.`, legendTitle, colorSet, "percent", grades);
}

const percentGrades = [
  [40, "40%+"],
  [30, "30% to 39.9%"],
  [20, "20% to 29.9%"],
  [10, "10% to 19.9%"],
  [5, "5% to 9.9%"],
  [-Infinity, "Under 5%"]
];

const smallAreaPopulationGrades = [
  [800, "800+"],
  [600, "600 to 799"],
  [400, "400 to 599"],
  [250, "250 to 399"],
  [100, "100 to 249"],
  [-Infinity, "Under 100"]
];

const indicatorConfigs = {
  population_2022: {
    county: config("Total population", "The map is currently coloured by total population.", "Population, 2022", "blue", "number", [
      [500000, "500,000+"],
      [300000, "300,001 to 500,000"],
      [200000, "200,001 to 300,000"],
      [150000, "150,001 to 200,000"],
      [100000, "100,001 to 150,000"],
      [75000, "75,001 to 100,000"],
      [50000, "50,001 to 75,000"],
      [-Infinity, "Up to 50,000"]
    ]),
    lea: config("Total population", "The map is currently coloured by total population.", "LEA population, 2022", "blue", "number", [
      [75000, "75,000+"],
      [50000, "50,001 to 75,000"],
      [35000, "35,001 to 50,000"],
      [25000, "25,001 to 35,000"],
      [15000, "15,001 to 25,000"],
      [-Infinity, "Up to 15,000"]
    ]),
    town: config("Small Area population", "Selected town Small Areas are coloured by Census 2022 population.", "Small Area population, 2022", "blue", "number", smallAreaPopulationGrades)
  }
};

const townFieldColorSets = {
  population_2022: "blue",
  age_0_14_pct: "blue",
  age_15_34_pct: "blue",
  age_35_64_pct: "blue",
  age_65_plus_pct: "blue",
  religion_catholic_pct: "purple",
  religion_other_pct: "purple",
  religion_none_pct: "purple",
  religion_not_stated_pct: "purple",
  born_ireland_pct: "orange",
  born_outside_ireland_pct: "orange",
  born_uk_pct: "orange",
  born_poland_pct: "orange",
  born_india_pct: "orange",
  born_other_eu_pct: "orange",
  born_rest_world_pct: "orange",
  citizen_ireland_pct: "orange",
  non_irish_citizenship_pct: "orange",
  ethnicity_white_irish_pct: "green",
  ethnicity_white_irish_traveller_pct: "green",
  ethnicity_other_white_pct: "green",
  ethnicity_black_or_black_irish_pct: "green",
  ethnicity_asian_or_asian_irish_pct: "green",
  ethnicity_other_pct: "green",
  ethnicity_not_stated_pct: "green",
  foreign_language_speakers_pct: "red",
  language_spanish_pct: "red",
  language_french_pct: "red",
  language_polish_pct: "red",
  language_other_incl_not_stated_pct: "red",
  families_with_children_pct: "cyan",
  families_without_children_pct: "cyan",
  families_all_children_under15_pct: "cyan",
  families_all_children_15_plus_pct: "cyan",
  families_children_under_and_over15_pct: "cyan",
  families_1_child_pct: "cyan",
  families_2_children_pct: "cyan",
  families_3_children_pct: "cyan",
  families_4_children_pct: "cyan",
  families_5_plus_children_pct: "cyan",
  families_household_size_2_persons_pct: "cyan",
  families_household_size_3_persons_pct: "cyan",
  families_household_size_4_persons_pct: "cyan",
  families_household_size_5_persons_pct: "cyan",
  families_household_size_6_plus_persons_pct: "cyan",
  status_at_work_pct: "rose",
  status_student_pct: "rose",
  status_retired_pct: "rose",
  status_home_family_pct: "rose",
  status_unable_to_work_pct: "rose",
  status_unemployed_pct: "rose",
  status_other_pct: "rose"
};

function getTownFieldLabel(field) {
  for (const group of TOWN_GROUPS) {
    const found = group.options.find(option => option.value === field);
    if (found) return found.label;
  }
  return field;
}

Object.keys(townFieldColorSets).forEach(key => {
  if (!indicatorConfigs[key]) indicatorConfigs[key] = {};
  indicatorConfigs[key].town = key === "population_2022"
    ? indicatorConfigs.population_2022.town
    : pct(getTownFieldLabel(key), getTownFieldLabel(key).replace(" %", "").toLowerCase(), getTownFieldLabel(key), townFieldColorSets[key], percentGrades);
});

[
  "age_0_14_pct",
  "age_15_34_pct",
  "age_35_64_pct",
  "age_65_plus_pct",
  "religion_catholic_pct",
  "religion_other_pct",
  "religion_none_pct",
  "religion_not_stated_pct",
  "born_outside_ireland_pct",
  "born_ireland_pct",
  "citizen_ireland_pct",
  "non_irish_citizenship_pct",
  "born_uk_pct",
  "born_poland_pct",
  "born_india_pct",
  "born_other_eu_pct",
  "born_rest_world_pct",
  "ethnicity_white_irish_pct",
  "ethnicity_white_irish_traveller_pct",
  "ethnicity_other_white_pct",
  "ethnicity_black_or_black_irish_pct",
  "ethnicity_asian_or_asian_irish_pct",
  "ethnicity_other_pct",
  "ethnicity_not_stated_pct",
  "foreign_language_speakers_pct",
  "language_spanish_pct",
  "language_french_pct",
  "language_polish_pct",
  "language_other_incl_not_stated_pct",
  "status_at_work_pct",
  "status_student_pct",
  "status_retired_pct",
  "status_home_family_pct",
  "status_unable_to_work_pct",
  "status_unemployed_pct",
  "status_other_pct"
].forEach(key => {
  const label = GROUPS.flatMap(group => group.options).find(option => option.value === key)?.label || key;
  if (!indicatorConfigs[key]) indicatorConfigs[key] = {};
  indicatorConfigs[key].county = pct(label, label.replace(" %", "").toLowerCase(), label.replace(" %", ""), townFieldColorSets[key] || "blue", percentGrades);
  indicatorConfigs[key].lea = pct(label, label.replace(" %", "").toLowerCase(), label.replace(" %", ""), townFieldColorSets[key] || "blue", percentGrades);
});

[
  "families_with_children_pct",
  "families_without_children_pct",
  "families_all_children_under15_pct",
  "families_all_children_15_plus_pct",
  "families_children_under_and_over15_pct",
  "families_1_child_pct",
  "families_2_children_pct",
  "families_3_children_pct",
  "families_4_children_pct",
  "families_5_plus_children_pct"
].forEach(key => {
  const label = GROUPS.flatMap(group => group.options).find(option => option.value === key)?.label || key;
  if (!indicatorConfigs[key]) indicatorConfigs[key] = {};
  indicatorConfigs[key].county = pct(label, label.replace(" %", "").toLowerCase(), label.replace(" %", ""), "cyan", percentGrades);
});

[
  "families_household_size_2_persons_pct",
  "families_household_size_3_persons_pct",
  "families_household_size_4_persons_pct",
  "families_household_size_5_persons_pct",
  "families_household_size_6_plus_persons_pct"
].forEach(key => {
  const label = GROUPS.flatMap(group => group.options).find(option => option.value === key)?.label || key;
  if (!indicatorConfigs[key]) indicatorConfigs[key] = {};
  indicatorConfigs[key].lea = pct(label, label.replace(" %", "").toLowerCase(), label.replace(" %", ""), "cyan", percentGrades);
});

const colorSets = {
  blue: ["#08306b", "#08519c", "#2171b5", "#4292c6", "#9ecae1", "#deebf7", "#eff3ff", "#f7fbff"],
  purple: ["#3f007d", "#54278f", "#6a51a3", "#807dba", "#9e9ac8", "#dadaeb", "#efedf5", "#fcfbfd"],
  orange: ["#7f2704", "#a63603", "#d94801", "#f16913", "#fd8d3c", "#fdd0a2", "#feedde", "#fff5eb"],
  green: ["#00441b", "#006d2c", "#238b45", "#41ab5d", "#74c476", "#bae4b3", "#edf8e9", "#f7fcf5"],
  red: ["#67000d", "#a50f15", "#cb181d", "#ef3b2c", "#fb6a4a", "#fcae91", "#fee5d9", "#fff5f0"],
  cyan: ["#083344", "#075985", "#0369a1", "#0284c7", "#38bdf8", "#bae6fd", "#e0f2fe", "#f0f9ff"],
  rose: ["#4c0519", "#881337", "#be123c", "#e11d48", "#fb7185", "#fecdd3", "#ffe4e6", "#fff1f2"]
};

function getIndicatorConfig(indicatorKey) {
  const entry = indicatorConfigs[indicatorKey];
  if (!entry) return indicatorConfigs.population_2022[currentGeography];
  return entry[currentGeography] || entry.county || entry.lea || entry.town || indicatorConfigs.population_2022[currentGeography];
}

function isIndicatorAvailableForGeography(indicatorKey, geography) {
  const entry = indicatorConfigs[indicatorKey];
  return Boolean(entry && entry[geography]);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAreaName(props) {
  return props.area_name || props.lea_name || props.CSO_LEA || props.LEA_OFFICIAL || props.URBAN_AREA_NAME || props.ENGLISH || props.name || "Unknown area";
}

function getCountyName(props) {
  return props.county || props.COUNTY || "";
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

function getTownProfileUrl(props) {
  const code = getUrbanAreaCode(props);
  if (!code) return "";

  return `town-profile.html?code=${encodeURIComponent(code)}`;
}

function updateTownProfileAction(props) {
  if (!townProfileActionEl || !townProfileLinkEl) return;

  const shouldShow = currentGeography === "town" && props;
  const url = shouldShow ? getTownProfileUrl(props) : "";

  if (!url) {
    townProfileActionEl.style.display = "none";
    townProfileLinkEl.removeAttribute("href");
    return;
  }

  townProfileLinkEl.href = url;
  townProfileActionEl.style.display = "block";
}

function getSmallAreaCode(props) {
  return String(props.SA_PUB2022 || props.SA_PUB2016 || props.SA_PUB2011 || "").trim();
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

function formatIndicatorValue(value, indicatorKey) {
  const config = getIndicatorConfig(indicatorKey);
  return config.type === "percent" ? formatPercent(value) : formatNumber(value);
}

function ensureTownSearchSection() {
  if (!townSearchSectionEl) {
    townSearchSectionEl = document.createElement("div");
    townSearchSectionEl.className = "sidebar-section town-search-section";
    townSearchSectionEl.style.padding = "19px 21px";
    townSearchSectionEl.style.borderTop = "1px solid #d8e0e6";
    townSearchSectionEl.style.borderBottom = "1px solid #d8e0e6";
    townSearchSectionEl.style.background = "#ffffff";

    const heading = document.createElement("p");
    heading.className = "eyebrow";
    heading.textContent = "Search town";
    heading.style.marginBottom = "9px";
    townSearchSectionEl.appendChild(heading);

    townSearchInputEl = document.createElement("input");
    townSearchInputEl.type = "search";
    townSearchInputEl.className = "town-search-input";
    townSearchInputEl.placeholder = "Start typing a town name...";
    townSearchInputEl.autocomplete = "off";
    townSearchInputEl.setAttribute("aria-label", "Search town");
    townSearchInputEl.style.width = "100%";
    townSearchInputEl.style.fontSize = "0.9rem";
    townSearchInputEl.style.lineHeight = "1.3";
    townSearchInputEl.style.padding = "10px 12px";
    townSearchInputEl.style.border = "1px solid #cfd8df";
    townSearchInputEl.style.borderRadius = "9px";
    townSearchInputEl.style.color = "#17212b";
    townSearchInputEl.style.boxSizing = "border-box";
    townSearchSectionEl.appendChild(townSearchInputEl);

    townSearchResultsEl = document.createElement("div");
    townSearchResultsEl.className = "town-search-results";
    townSearchResultsEl.style.marginTop = "8px";
    townSearchResultsEl.style.display = "grid";
    townSearchResultsEl.style.gap = "7px";
    townSearchSectionEl.appendChild(townSearchResultsEl);

    const note = document.createElement("p");
    note.className = "source-note";
    note.textContent = "Search results match town names from the Census 2022 Built Up Area boundary file.";
    note.style.fontSize = "0.9rem";
    note.style.lineHeight = "1.35";
    note.style.marginTop = "10px";
    townSearchSectionEl.appendChild(note);

    townSearchInputEl.addEventListener("input", updateTownSearchResults);
    townSearchInputEl.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        townSearchInputEl.value = "";
        clearTownSearchResults();
      }
    });
  }

  const referenceSection =
    churchOverlayToggleEl?.closest(".sidebar-section") ||
    churchOverlayToggleEl?.closest("section") ||
    churchOverlayToggleEl?.parentElement?.parentElement ||
    null;

  if (referenceSection && referenceSection.parentNode && townSearchSectionEl.parentNode !== referenceSection.parentNode) {
    referenceSection.parentNode.insertBefore(townSearchSectionEl, referenceSection);
  } else if (referenceSection && referenceSection.parentNode && townSearchSectionEl.nextSibling !== referenceSection) {
    referenceSection.parentNode.insertBefore(townSearchSectionEl, referenceSection);
  } else if (!townSearchSectionEl.parentNode) {
    const resetSection = resetButtonEl?.closest(".sidebar-section") || resetButtonEl?.parentElement || dataSectionsEl;
    resetSection.parentNode.insertBefore(townSearchSectionEl, resetSection.nextSibling);
  }

  townSearchSectionEl.style.display = currentGeography === "town" ? "block" : "none";
}

function populateIndicatorSelect() {
  indicatorSelectEl.innerHTML = "";

  if (currentGeography === "town") {
    indicatorSelectEl.disabled = false;

    TOWN_GROUPS.forEach(group => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.label;

      group.options.forEach(option => {
        const optionEl = document.createElement("option");
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        optgroup.appendChild(optionEl);
      });

      indicatorSelectEl.appendChild(optgroup);
    });

    if (!isIndicatorAvailableForGeography(currentIndicator, "town")) {
      currentIndicator = "population_2022";
    }

    indicatorSelectEl.value = currentIndicator;
    indicatorNoteEl.textContent = getIndicatorConfig(currentIndicator).note;
    return;
  }

  indicatorSelectEl.disabled = false;

  GROUPS.forEach(group => {
    const availableOptions = group.options.filter(option => {
      if (option.geographies && !option.geographies.includes(currentGeography)) return false;
      return isIndicatorAvailableForGeography(option.value, currentGeography);
    });

    if (availableOptions.length === 0) return;

    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;

    availableOptions.forEach(option => {
      const optionEl = document.createElement("option");
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      optgroup.appendChild(optionEl);
    });

    indicatorSelectEl.appendChild(optgroup);
  });

  if (!isIndicatorAvailableForGeography(currentIndicator, currentGeography)) {
    currentIndicator = "population_2022";
  }

  indicatorSelectEl.value = currentIndicator;
  indicatorNoteEl.textContent = getIndicatorConfig(currentIndicator).note;
}

function buildSidebarSections() {
  dataSectionsEl.innerHTML = "";
  sectionRowEls = [];

  const sections = sidebarSectionsByGeography[currentGeography] || [];

  sections.forEach(section => {
    const sectionEl = document.createElement("div");
    sectionEl.className = "sidebar-section";

    const heading = document.createElement("p");
    heading.className = "eyebrow";
    heading.textContent = section.title;
    sectionEl.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "data-grid";

    section.rows.forEach(row => {
      const rowEl = document.createElement("div");
      rowEl.className = "data-row";

      rowEl.innerHTML = `
        <div class="data-row-top">
          <span class="data-label">${escapeHtml(row.label)}</span>
          <span class="data-value">—</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${section.barClass}"></div>
        </div>
      `;

      grid.appendChild(rowEl);

      sectionRowEls.push({
        countKey: row.count,
        pctKey: row.pct,
        valueEl: rowEl.querySelector(".data-value"),
        barEl: rowEl.querySelector(".bar-fill")
      });
    });

    sectionEl.appendChild(grid);

    const note = document.createElement("p");
    note.className = "source-note";
    note.textContent = section.note;
    sectionEl.appendChild(note);

    dataSectionsEl.appendChild(sectionEl);
  });

  ensureTownSearchSection();
}


function normaliseName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isDublinTown(props) {
  const name = normaliseName(getAreaName(props));
  return name === "dublin" || name.includes("dublin city") || name.includes("dublin urban") || name.includes("dublin city and suburbs");
}

function ensureDublinDetailAction() {
  if (!dublinDetailActionEl) {
    dublinDetailActionEl = document.createElement("div");
    dublinDetailActionEl.className = "town-profile-action";
    dublinDetailActionEl.style.display = "none";
    dublinDetailActionEl.style.marginTop = "12px";

    dublinDetailBackButtonEl = document.createElement("button");
    dublinDetailBackButtonEl.type = "button";
    dublinDetailBackButtonEl.className = "town-profile-button";
    dublinDetailBackButtonEl.textContent = "Back to Dublin profile";
    dublinDetailBackButtonEl.style.width = "100%";
    dublinDetailBackButtonEl.style.fontFamily = "inherit";

    const note = document.createElement("p");
    note.className = "town-profile-note";
    note.textContent = "Dublin Detail Mode lets you inspect individual Census Small Areas inside the Dublin urban boundary.";

    dublinDetailActionEl.appendChild(dublinDetailBackButtonEl);
    dublinDetailActionEl.appendChild(note);

    dublinDetailBackButtonEl.addEventListener("click", restoreSelectedTownProfile);
  }

  if (townProfileActionEl && townProfileActionEl.parentNode && dublinDetailActionEl.parentNode !== townProfileActionEl.parentNode) {
    townProfileActionEl.parentNode.insertBefore(dublinDetailActionEl, townProfileActionEl.nextSibling);
  }
}

function hideDublinDetailAction() {
  ensureDublinDetailAction();
  dublinDetailActionEl.style.display = "none";
}

function setLayerPointerEvents(layer, value) {
  if (!layer || typeof layer.getElement !== "function") return;

  const element = layer.getElement();
  if (!element) return;

  if (value) {
    element.style.pointerEvents = value;
  } else {
    element.style.pointerEvents = "";
  }
}

function restoreSelectedBoundaryPointerEvents() {
  setLayerPointerEvents(selectedLayer, "");
  setLayerPointerEvents(selectedTownLayerForSmallAreas, "");
}

function showDublinDetailAction() {
  ensureDublinDetailAction();
  dublinDetailActionEl.style.display = "block";
}

function resetDublinSmallAreaLayerStyle(layer) {
  if (!layer || typeof layer.setStyle !== "function") return;
  layer.setStyle(styleSmallArea(layer.feature));
}

function resetAllDublinSmallAreaStyles() {
  if (!smallAreaDisplayLayer || typeof smallAreaDisplayLayer.eachLayer !== "function") return;

  smallAreaDisplayLayer.eachLayer(function (layer) {
    resetDublinSmallAreaLayerStyle(layer);
  });
}

function clearDublinSmallAreaSelection() {
  resetDublinSmallAreaLayerStyle(selectedDublinSmallAreaLayer);

  selectedDublinSmallAreaLayer = null;
  selectedDublinSmallAreaFeature = null;
  hideDublinDetailAction();
}

function restoreSelectedTownProfile() {
  if (!selectedTownLayerForSmallAreas || !selectedTownSmallAreaSummary) return;

  clearDublinSmallAreaSelection();

  if (selectedTownLayerForSmallAreas) {
    selectedTownLayerForSmallAreas.bringToFront();
    setLayerPointerEvents(selectedTownLayerForSmallAreas, "none");
  }

  const summary = selectedTownSmallAreaSummary;
  updateSidebar(
    selectedTownPropsForSmallAreas,
    summary.smallAreaCount,
    summary.selectedTownValue,
    summary.selectedTownPopulation,
    summary.townProfile
  );

  openAreaPopup(
    selectedTownLayerForSmallAreas,
    summary.smallAreaCount,
    summary.selectedTownValue,
    summary.selectedTownPopulation
  );
}

function getSmallAreaDisplayName(feature) {
  const code = getSmallAreaCode(feature.properties || {});
  return code ? `Small Area ${code}` : "Selected Small Area";
}

function updateSidebarForDublinSmallArea(feature) {
  const props = feature.properties || {};
  const code = getSmallAreaCode(props);
  const config = getIndicatorConfig(currentIndicator);
  const currentValue = props[currentIndicator];
  const population = Number(props.population_2022);

  selectedAreaEyebrowEl.textContent = "Dublin Detail Mode";
  areaNameEl.textContent = "Small Area inside Dublin";
  areaIntroEl.textContent = code
    ? `Selected Census Small Area: ${code}. This is a statistical area, not a named neighbourhood.`
    : "Selected Census Small Area inside Dublin. This is a statistical area, not a named neighbourhood.";

  selectedIndicatorCardEl.style.display = "";
  selectedIndicatorNameEl.textContent = config.label;
  selectedIndicatorValueEl.textContent = formatIndicatorValue(currentValue, currentIndicator);
  populationValueEl.textContent = Number.isNaN(population) ? "—" : formatNumber(population);

  const parts = ["Parent urban area: Dublin"];
  if (code) parts.push(`Small Area code: ${code}`);
  contextValueEl.textContent = parts.join(" · ");
  sourceNoteEl.textContent = "Source: CSO Census 2022 Small Area Population Statistics.";

  updateTownProfileAction(selectedTownPropsForSmallAreas);
  showDublinDetailAction();

  sectionRowEls.forEach(row => {
    setDataRow(row.valueEl, row.barEl, props[row.countKey], props[row.pctKey]);
  });
}

function openDublinSmallAreaPopup(layer) {
  const props = layer.feature.properties || {};
  const code = getSmallAreaCode(props);
  const config = getIndicatorConfig(currentIndicator);
  const population = Number(props.population_2022);
  const value = props[currentIndicator];

  let popupHtml = `
    <div class="area-popup">
      <h2>Small Area inside Dublin</h2>
  `;

  if (code) {
    popupHtml += `<p><strong>Small Area code:</strong> ${escapeHtml(code)}</p>`;
  }

  popupHtml += Number.isNaN(population)
    ? `<p><strong>Population:</strong> —</p>`
    : `<p><strong>Population:</strong> ${formatNumber(population)}</p>`;

  popupHtml += `<p><strong>${escapeHtml(config.label)}:</strong> ${escapeHtml(formatIndicatorValue(value, currentIndicator))}</p>`;
  popupHtml += `<p><strong>Note:</strong> Small Areas are statistical units and usually do not have public place names.</p>`;
  popupHtml += `</div>`;

  layer.bindPopup(popupHtml).openPopup();
}

function selectDublinSmallArea(layer) {
  // Reset every Dublin Small Area first. This avoids old outlines being left behind
  // and prevents a stale selected path from interfering with later clicks.
  resetAllDublinSmallAreaStyles();

  selectedDublinSmallAreaLayer = layer;
  selectedDublinSmallAreaFeature = layer.feature;

  layer.setStyle({
    fillOpacity: 0.88,
    color: "#111827",
    weight: 2.8
  });

  if (smallAreaDisplayLayer && typeof smallAreaDisplayLayer.bringToFront === "function") {
    smallAreaDisplayLayer.bringToFront();
  }

  layer.bringToFront();

  if (churchesLoaded && map.hasLayer(churchLayer)) {
    churchLayer.bringToFront();
  }

  updateSidebarForDublinSmallArea(layer.feature);

  // Do not open a Leaflet popup for Dublin Small Areas. The sidebar is the main detail view,
  // and popups can make repeated click handling feel sticky on dense city geometry.
  map.closePopup();
}

function resetSidebar() {
  const geography = GEOGRAPHIES[currentGeography];

  selectedAreaEyebrowEl.textContent = geography.selectedEyebrow;
  areaNameEl.textContent = geography.emptyName;
  areaIntroEl.textContent = geography.emptyIntro;
  selectedIndicatorNameEl.textContent = "—";
  selectedIndicatorValueEl.textContent = "—";
  populationValueEl.textContent = geography.isTown ? "Select town" : "—";
  contextValueEl.textContent = "";
  sourceNoteEl.textContent = geography.sourceNote;
  updateTownProfileAction(null);
  hideDublinDetailAction();

  if (geography.isTown) {
    selectedIndicatorCardEl.style.display = "";
    selectedIndicatorNameEl.textContent = getIndicatorConfig(currentIndicator).label;
    selectedIndicatorValueEl.textContent = "Select a town";
  } else if (geography.hasDemographics) {
    selectedIndicatorCardEl.style.display = "";
  } else {
    selectedIndicatorCardEl.style.display = "none";
  }

  sectionRowEls.forEach(row => {
    row.valueEl.textContent = "—";
    row.barEl.style.width = "0%";
  });
}

function setDataRow(valueEl, barEl, count, percent) {
  valueEl.textContent = `${formatNumber(count)} (${formatPercent(percent)})`;

  const safePercent = Number(percent);
  barEl.style.width = Number.isNaN(safePercent)
    ? "0%"
    : Math.max(0, Math.min(100, safePercent)) + "%";
}

function updateSidebar(props, smallAreaCount, selectedTownValue, selectedTownPopulation, townProfile) {
  const geography = GEOGRAPHIES[currentGeography];

  selectedAreaEyebrowEl.textContent = geography.selectedEyebrow;
  areaNameEl.textContent = getAreaName(props);
  areaIntroEl.textContent = geography.selectedIntro;

  const countyName = getCountyName(props);
  updateTownProfileAction(geography.isTown ? props : null);

  if (geography.hasDemographics) {
    const indicatorConfig = getIndicatorConfig(currentIndicator);

    selectedIndicatorCardEl.style.display = "";
    selectedIndicatorNameEl.textContent = indicatorConfig.label;
    selectedIndicatorValueEl.textContent = formatIndicatorValue(props[currentIndicator], currentIndicator);
    populationValueEl.textContent = formatNumber(props.population_2022);

    contextValueEl.textContent = geography.contextLabel && countyName ? `${geography.contextLabel}: ${countyName}` : "";

    sectionRowEls.forEach(row => {
      setDataRow(row.valueEl, row.barEl, props[row.countKey], props[row.pctKey]);
    });

    return;
  }

  if (geography.isTown) {
    const config = getIndicatorConfig(currentIndicator);

    selectedIndicatorCardEl.style.display = "";
    selectedIndicatorNameEl.textContent = config.label;

    selectedIndicatorValueEl.textContent =
      currentIndicator === "population_2022"
        ? typeof selectedTownValue === "number"
          ? `Selected town total: ${formatNumber(selectedTownValue)}`
          : "Loading..."
        : typeof selectedTownValue === "number"
          ? `Town average: ${formatPercent(selectedTownValue)}`
          : "Loading...";

    populationValueEl.textContent =
      typeof selectedTownPopulation === "number"
        ? formatNumber(selectedTownPopulation)
        : "Loading...";

    const parts = [];
    if (countyName) parts.push(`County: ${countyName}`);
    if (typeof smallAreaCount === "number") parts.push(`Small Areas shown: ${smallAreaCount}`);
    contextValueEl.textContent = parts.join(" · ");

    if (townProfile) {
      sectionRowEls.forEach(row => {
        setDataRow(row.valueEl, row.barEl, townProfile[row.countKey], townProfile[row.pctKey]);
      });
    }
  }

  sourceNoteEl.textContent = geography.sourceNote;
}

function getColorForValue(value, indicatorKey) {
  const config = getIndicatorConfig(indicatorKey);
  const number = Number(value);

  if (Number.isNaN(number)) return "#f0f0f0";

  const colors = colorSets[config.colorSet] || colorSets.blue;
  const matchedIndex = config.grades.findIndex(grade => number >= grade.min);

  return colors[matchedIndex] || colors[colors.length - 1];
}

function styleArea(feature) {
  const geography = GEOGRAPHIES[currentGeography];

  if (geography.isTown) {
    return {
      fillColor: "transparent",
      weight: geography.weight,
      opacity: 0.95,
      color: "#0f4f49",
      dashArray: "3",
      fillOpacity: 0
    };
  }

  return {
    fillColor: getColorForValue(feature.properties[currentIndicator], currentIndicator),
    weight: geography.weight,
    opacity: 1,
    color: "#333",
    fillOpacity: DEFAULT_FILL_OPACITY
  };
}

function styleSmallArea(feature) {
  const value = Number(feature.properties[currentIndicator]);

  return {
    pane: "smallAreaPane",
    fillColor: getColorForValue(value, currentIndicator),
    fillOpacity: 0.68,
    color: "#0f172a",
    weight: 0.55,
    opacity: 0.75
  };
}

function highlightFeature(e) {
  const layer = e.target;

  if (layer !== selectedLayer) {
    layer.setStyle({
      weight: currentGeography === "town" ? 2.2 : 2.5,
      color: "#111",
      fillOpacity: currentGeography === "town" ? 0 : HOVER_FILL_OPACITY
    });
  }

  layer.bringToFront();
}

function resetHighlight(e) {
  const layer = e.target;

  if (layer !== selectedLayer && activeLayer) {
    activeLayer.resetStyle(layer);
  }
}

function selectLayer(layer, options = {}) {
  restoreSelectedBoundaryPointerEvents();
  clearDublinSmallAreaSelection();
  selectedTownLayerForSmallAreas = null;
  selectedTownPropsForSmallAreas = null;
  selectedTownSmallAreaSummary = null;

  const props = layer.feature.properties;
  const isSameLayerAlreadySelected = selectedLayer === layer;

  if (isSameLayerAlreadySelected && currentGeography === "town" && !options.forceRefresh) {
    return;
  }

  if (selectedLayer && activeLayer) {
    activeLayer.resetStyle(selectedLayer);
  }

  selectedLayer = layer;

  if (currentGeography === "town") {
    clearSmallAreas();

    layer.setStyle({
      weight: 2.6,
      color: "#111827",
      dashArray: "",
      fillColor: "transparent",
      fillOpacity: 0
    });
  } else {
    clearSmallAreas();

    layer.setStyle({
      weight: 3.5,
      color: "#000",
      fillOpacity: SELECTED_FILL_OPACITY
    });
  }

  layer.bringToFront();
  updateSidebar(props);

  map.fitBounds(layer.getBounds(), {
    padding: [30, 30]
  });

  if (currentGeography === "town") {
    showSmallAreasInsideTown(layer);
  }

  openAreaPopup(layer);
}

function openAreaPopup(layer, smallAreaCount, selectedTownValue, selectedTownPopulation) {
  const props = layer.feature.properties;
  const areaName = getAreaName(props);
  const countyName = getCountyName(props);
  const config = getIndicatorConfig(currentIndicator);

  let popupHtml = `
    <div class="area-popup">
      <h2>${escapeHtml(areaName)}</h2>
  `;

  if (countyName) {
    popupHtml += `<p><strong>County:</strong> ${escapeHtml(countyName)}</p>`;
  }

  if (currentGeography === "town") {
    popupHtml += typeof smallAreaCount === "number"
      ? `<p><strong>Small Areas shown:</strong> ${formatNumber(smallAreaCount)}</p>`
      : `<p><strong>Small Areas:</strong> loading...</p>`;

    popupHtml += typeof selectedTownPopulation === "number"
      ? `<p><strong>Population:</strong> ${formatNumber(selectedTownPopulation)}</p>`
      : `<p><strong>Population:</strong> loading...</p>`;

    if (currentIndicator !== "population_2022") {
      popupHtml += typeof selectedTownValue === "number"
        ? `<p><strong>${escapeHtml(config.label)}:</strong> ${formatPercent(selectedTownValue)}</p>`
        : `<p><strong>${escapeHtml(config.label)}:</strong> loading...</p>`;
    }

    popupHtml += `${isDublinTown(props) ? `<p><strong>Dublin Detail Mode:</strong> Click any shaded Small Area to inspect that part of Dublin.</p>` : `<p><strong>Current view:</strong> Small Areas coloured by selected demographic measure</p>`}`;

    const profileUrl = getTownProfileUrl(props);
    if (profileUrl) {
      popupHtml += `<p><a href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer"><strong>Open Town Mission Profile</strong></a></p>`;
    }
  } else {
    const currentValue = formatIndicatorValue(props[currentIndicator], currentIndicator);
    popupHtml += `<p><strong>Population, 2022:</strong> ${formatNumber(props.population_2022)}</p>`;
    popupHtml += `<p><strong>${escapeHtml(config.label)}:</strong> ${escapeHtml(currentValue)}</p>`;
  }

  popupHtml += `</div>`;

  layer.bindPopup(popupHtml).openPopup();
}

function bindAreaInteractions(feature, layer) {
  allAreaLayers.push(layer);

  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: function (e) {
      selectLayer(e.target);
    }
  });
}

function updateLegend() {
  if (legend) {
    map.removeControl(legend);
    legend = null;
  }

  legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    const config = getIndicatorConfig(currentIndicator);
    const colors = colorSets[config.colorSet] || colorSets.blue;
    const opacity = currentGeography === "town" ? 0.68 : DEFAULT_FILL_OPACITY;

    div.innerHTML = `<div class="legend-title">${escapeHtml(config.legendTitle)}</div>`;

    config.grades.forEach((item, index) => {
      div.innerHTML += `
        <div class="legend-row">
          <span class="legend-color" style="background:${colors[index]}; opacity:${opacity};"></span>
          <span>${escapeHtml(item.label)}</span>
        </div>
      `;
    });

    if (currentGeography === "town") {
      div.innerHTML += `
        <div class="legend-row">
          <span class="legend-color" style="background:transparent; border:2px solid #111827;"></span>
          <span>Selected Built Up Area</span>
        </div>
      `;

      if (selectedTownPropsForSmallAreas && isDublinTown(selectedTownPropsForSmallAreas)) {
        div.innerHTML += `
          <div class="legend-row">
            <span class="legend-color" style="background:#0f766e; opacity:0.32; border:2px solid #111827;"></span>
            <span>Clickable Dublin Small Areas</span>
          </div>
        `;
      }
    }

    return div;
  };

  legend.addTo(map);
}

function updateMapIndicator(indicatorKey) {
  currentIndicator = indicatorKey;
  const config = getIndicatorConfig(currentIndicator);

  indicatorNoteEl.textContent = config.note;

  if (currentGeography === "town") {
    updateLegend();

    if (selectedLayer) {
      showSmallAreasInsideTown(selectedLayer);
    } else {
      resetSidebar();
    }

    return;
  }

  if (activeLayer) {
    activeLayer.setStyle(styleArea);
  }

  if (selectedLayer) {
    selectedLayer.setStyle({
      weight: 3.5,
      color: "#000",
      fillOpacity: SELECTED_FILL_OPACITY
    });

    updateSidebar(selectedLayer.feature.properties);
  }

  updateLegend();
}

function resetMap() {
  if (selectedLayer && activeLayer) {
    activeLayer.resetStyle(selectedLayer);
  }

  selectedLayer = null;
  selectedTownLayerForSmallAreas = null;
  selectedTownPropsForSmallAreas = null;
  selectedTownSmallAreaSummary = null;
  map.closePopup();
  clearSmallAreas();
  clearDublinSmallAreaSelection();

  if (townSearchInputEl) {
    townSearchInputEl.value = "";
  }

  clearTownSearchResults();

  const bounds = fullMapBoundsByGeography[currentGeography];

  if (bounds) {
    map.fitBounds(bounds, {
      padding: [20, 20]
    });
  }

  resetSidebar();
}

function setActiveNavButton() {
  countyViewButtonEl.classList.toggle("is-active", currentGeography === "county");
  leaViewButtonEl.classList.toggle("is-active", currentGeography === "lea");
  townViewButtonEl.classList.toggle("is-active", currentGeography === "town");
}

function configureViewText() {
  const geography = GEOGRAPHIES[currentGeography];
  mapSubtitleEl.textContent = geography.subtitle;
}

function switchGeography(geographyKey) {
  if (!GEOGRAPHIES[geographyKey]) return;

  const previousCenter = map.getCenter();
  const previousZoom = map.getZoom();

  if (selectedLayer && activeLayer) {
    activeLayer.resetStyle(selectedLayer);
  }

  selectedLayer = null;
  selectedTownLayerForSmallAreas = null;
  selectedTownPropsForSmallAreas = null;
  selectedTownSmallAreaSummary = null;
  map.closePopup();
  clearSmallAreas();
  clearDublinSmallAreaSelection();
  clearTownSearchResults();

  if (activeLayer) {
    map.removeLayer(activeLayer);
  }

  currentGeography = geographyKey;
  allAreaLayers = [];

  setActiveNavButton();
  configureViewText();
  populateIndicatorSelect();
  buildSidebarSections();
  resetSidebar();
  ensureTownSearchSection();

  const existingLayer = loadedLayers[currentGeography];

  if (existingLayer) {
    activeLayer = existingLayer;
    activeLayer.addTo(map);
    activeLayer.setStyle(styleArea);
    updateLegend();

    map.setView(previousCenter, previousZoom, {
      animate: false
    });

    return;
  }

  loadGeographyLayer(currentGeography, {
    preserveView: true,
    center: previousCenter,
    zoom: previousZoom
  });
}

function loadGeographyLayer(geographyKey, options = {}) {
  const geography = GEOGRAPHIES[geographyKey];

  fetch(geography.dataUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Could not load ${geography.dataUrl}. HTTP status: ${response.status}`);
      }

      return response.json();
    })
    .then(data => {
      allAreaLayers = [];

      const layer = L.geoJSON(data, {
        style: styleArea,
        onEachFeature: bindAreaInteractions
      });

      loadedLayers[geographyKey] = layer;
      activeLayer = layer;
      activeLayer.addTo(map);

      fullMapBoundsByGeography[geographyKey] = activeLayer.getBounds();

      if (options.preserveView && options.center && typeof options.zoom === "number") {
        map.setView(options.center, options.zoom, {
          animate: false
        });
      } else {
        map.fitBounds(fullMapBoundsByGeography[geographyKey], {
          padding: [20, 20]
        });
      }

      updateLegend();

      console.log(`Loaded ${data.features.length} ${geographyKey} areas.`);
    })
    .catch(error => {
      console.error(error);
      alert(`The ${geography.label} GeoJSON file could not be loaded. Check that ${geography.dataUrl} is in the root of this GitHub Pages site.`);
    });
}

function clearSmallAreas() {
  if (map.getPane("smallAreaPane")) {
    map.getPane("smallAreaPane").style.pointerEvents = "none";
  }

  smallAreaDisplayLayer.clearLayers();

  if (map.hasLayer(smallAreaDisplayLayer)) {
    map.removeLayer(smallAreaDisplayLayer);
  }
}

function loadSmallAreas() {
  if (smallAreasLoaded && smallAreasData) {
    return Promise.resolve(smallAreasData);
  }

  return fetch("small-areas-2022.geojson")
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not load small-areas-2022.geojson. HTTP status: " + response.status);
      }

      return response.json();
    })
    .then(data => {
      smallAreasData = data;
      smallAreasLoaded = true;
      console.log("Loaded " + data.features.length + " Small Areas.");
      return data;
    });
}

function loadSmallAreaDemographics() {
  if (smallAreaDemographicsLoaded) {
    return Promise.resolve(smallAreaDemographicsByCode);
  }

  return fetch("small-area-demographics-2022.csv")
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not load small-area-demographics-2022.csv. HTTP status: " + response.status);
      }

      return response.text();
    })
    .then(csvText => {
      const rows = parseCsv(csvText);
      const lookup = {};

      rows.forEach(row => {
        const code = String(row.SA_PUB2022 || "").trim();
        if (!code) return;

        const cleanRow = {};

        Object.keys(row).forEach(key => {
          if (key === "SA_PUB2022") {
            cleanRow[key] = row[key];
            return;
          }

          const value = Number(row[key]);
          cleanRow[key] = Number.isNaN(value) ? null : value;
        });

        lookup[code] = cleanRow;
      });

      smallAreaDemographicsByCode = lookup;
      smallAreaDemographicsLoaded = true;
      console.log("Loaded demographic data for " + Object.keys(lookup).length + " Small Areas.");
      return lookup;
    });
}

function showSmallAreasInsideTown(townLayer) {
  const townFeature = townLayer.feature;
  const townProps = townFeature.properties;
  const dublinMode = isDublinTown(townProps);

  populationValueEl.textContent = "Loading...";
  selectedIndicatorValueEl.textContent = "Loading...";
  contextValueEl.textContent = "Loading Small Areas and demographic data inside selected town...";

  Promise.all([loadSmallAreas(), loadSmallAreaDemographics()])
    .then(([data, demographicsLookup]) => {
      clearSmallAreas();
      clearDublinSmallAreaSelection();

      selectedTownLayerForSmallAreas = townLayer;
      selectedTownPropsForSmallAreas = townProps;

      /*
        Dublin Detail Mode needs the Small Area polygons to receive the click.
        The selected town boundary is an invisible-filled polygon, so even with fillOpacity: 0
        it can still catch clicks across the whole city. Disable pointer events on the
        selected Dublin boundary while its Small Areas are being inspected.
      */
      setLayerPointerEvents(townLayer, dublinMode ? "none" : "");

      const selectedGeometry = townFeature.geometry;
      const selectedBounds = townLayer.getBounds();

      let selectedTownPopulation = 0;
      let selectedTownWeightedValue = 0;
      let selectedTownWeight = 0;
      let selectedTownPopulationValue = 0;

      const townProfile = { population_2022: 0 };
      const weightedPctTotals = {};
      const weightedPctWeights = {};

      const matchingFeatures = data.features
        .filter(feature => {
          return smallAreaLikelyOverlapsTown(feature, selectedGeometry, selectedBounds);
        })
        .map(feature => {
          const clonedFeature = JSON.parse(JSON.stringify(feature));
          const code = getSmallAreaCode(clonedFeature.properties);
          const demographics = demographicsLookup[code] || {};

          Object.keys(demographics).forEach(key => {
            if (key !== "SA_PUB2022") {
              clonedFeature.properties[key] = demographics[key];
            }
          });

          const population = Number(demographics.population_2022);
          const currentValue = Number(demographics[currentIndicator]);

          if (!Number.isNaN(population)) {
            selectedTownPopulation += population;
            townProfile.population_2022 += population;
          }

          Object.keys(demographics).forEach(key => {
            if (key === "SA_PUB2022") return;

            const value = Number(demographics[key]);
            if (Number.isNaN(value)) return;

            if (key.endsWith("_pct")) {
              if (!Number.isNaN(population) && population > 0) {
                weightedPctTotals[key] = (weightedPctTotals[key] || 0) + value * population;
                weightedPctWeights[key] = (weightedPctWeights[key] || 0) + population;
              }
            } else {
              townProfile[key] = (townProfile[key] || 0) + value;
            }
          });

          if (currentIndicator === "population_2022") {
            if (!Number.isNaN(currentValue)) {
              selectedTownPopulationValue += currentValue;
            }
          } else if (!Number.isNaN(currentValue) && !Number.isNaN(population) && population > 0) {
            selectedTownWeightedValue += currentValue * population;
            selectedTownWeight += population;
          }

          return clonedFeature;
        });

      Object.keys(weightedPctTotals).forEach(key => {
        townProfile[key] = weightedPctWeights[key] > 0 ? weightedPctTotals[key] / weightedPctWeights[key] : null;
      });

      const selectedTownValue =
        currentIndicator === "population_2022"
          ? selectedTownPopulationValue
          : selectedTownWeight > 0
            ? selectedTownWeightedValue / selectedTownWeight
            : null;

      selectedTownSmallAreaSummary = {
        smallAreaCount: matchingFeatures.length,
        selectedTownValue,
        selectedTownPopulation,
        townProfile
      };

      if (map.getPane("smallAreaPane")) {
        map.getPane("smallAreaPane").style.pointerEvents = dublinMode ? "auto" : "none";
      }

      const layer = L.geoJSON(
        {
          type: "FeatureCollection",
          features: matchingFeatures
        },
        {
          pane: "smallAreaPane",
          style: styleSmallArea,
          interactive: dublinMode,
          onEachFeature: function (feature, smallAreaLayer) {
            if (!dublinMode) return;

            smallAreaLayer.on({
              mouseover: function (event) {
                const target = event.target;
                if (target !== selectedDublinSmallAreaLayer) {
                  target.setStyle({
                    fillOpacity: 0.82,
                    color: "#111827",
                    weight: 1.4
                  });
                }
              },
              mouseout: function (event) {
                const target = event.target;
                if (target !== selectedDublinSmallAreaLayer) {
                  target.setStyle(styleSmallArea(target.feature));
                }
              },
              click: function (event) {
                if (event.originalEvent) {
                  L.DomEvent.stop(event.originalEvent);
                }
                selectDublinSmallArea(event.target);
              }
            });

            const code = getSmallAreaCode(feature.properties);
            smallAreaLayer.bindTooltip(code ? `Small Area ${code}` : "Dublin Small Area", {
              sticky: true,
              direction: "top"
            });
          }
        }
      );

      smallAreaDisplayLayer = layer;
      smallAreaDisplayLayer.addTo(map);

      if (selectedLayer && !dublinMode) {
        selectedLayer.bringToFront();
      }

      if (churchesLoaded && map.hasLayer(churchLayer)) {
        churchLayer.bringToFront();
      }

      updateSidebar(townProps, matchingFeatures.length, selectedTownValue, selectedTownPopulation, townProfile);

      if (dublinMode) {
        contextValueEl.textContent += " · Click a Small Area to inspect Dublin in more detail.";
      }

      if (dublinMode) {
        map.closePopup();
      } else {
        openAreaPopup(townLayer, matchingFeatures.length, selectedTownValue, selectedTownPopulation);
      }

      updateLegend();

      console.log("Displayed " + matchingFeatures.length + " Small Areas inside " + getAreaName(townProps) + " using " + currentIndicator + (dublinMode ? " with Dublin Detail Mode enabled." : "."));
    })
    .catch(error => {
      console.error(error);
      populationValueEl.textContent = "Data unavailable";
      selectedIndicatorValueEl.textContent = "Demographic data could not be loaded.";
      contextValueEl.textContent = "Small Area demographic data could not be loaded.";
      alert("The Small Area boundary or demographic file could not be loaded. Check that small-areas-2022.geojson and small-area-demographics-2022.csv are both in the root of this GitHub Pages site.");
    });
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

    if (pointInGeometry(lng, lat, townGeometry)) {
      return true;
    }
  }

  const townPoints = [];
  collectCoordinates(townGeometry, townPoints);

  for (const coord of townPoints) {
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);

    if (pointInGeometry(lng, lat, smallAreaFeature.geometry)) {
      return true;
    }
  }

  return false;
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

function pointInPolygon(lng, lat, rings) {
  if (!rings || rings.length === 0) return false;

  const insideOuter = pointInRing(lng, lat, rings[0]);
  if (!insideOuter) return false;

  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) {
      return false;
    }
  }

  return true;
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

function getTownSearchItems() {
  if (currentGeography !== "town") return [];

  return allAreaLayers
    .map(layer => ({
      name: getAreaName(layer.feature.properties),
      county: getCountyName(layer.feature.properties),
      layer
    }))
    .filter(item => item.name && item.name !== "Unknown area")
    .sort((a, b) => a.name.localeCompare(b.name, "en-IE"));
}

function updateTownSearchResults() {
  if (!townSearchInputEl || !townSearchResultsEl) return;

  const query = townSearchInputEl.value.trim().toLowerCase();
  clearTownSearchResults();

  if (query.length === 0) return;

  const items = getTownSearchItems();
  const startsWithMatches = items.filter(item => item.name.toLowerCase().startsWith(query));
  const containsMatches = items.filter(item => {
    const name = item.name.toLowerCase();
    return !name.startsWith(query) && name.includes(query);
  });

  const matches = [...startsWithMatches, ...containsMatches].slice(0, 12);

  if (matches.length === 0) {
    const empty = document.createElement("div");
    empty.className = "town-search-empty";
    empty.textContent = "No matching towns found.";
    empty.style.fontSize = "0.9rem";
    empty.style.color = "#5f6b76";
    empty.style.padding = "7px 2px";
    townSearchResultsEl.appendChild(empty);
    return;
  }

  matches.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "town-search-result";
    button.style.width = "100%";
    button.style.textAlign = "left";
    button.style.border = "1px solid #d8e0e6";
    button.style.background = "#f8fbfc";
    button.style.borderRadius = "9px";
    button.style.padding = "9px 10px";
    button.style.cursor = "pointer";
    button.style.fontSize = "0.9rem";
    button.style.color = "#17212b";
    button.style.display = "grid";
    button.style.gap = "2px";

    button.innerHTML = `
      <span style="font-weight:700;">${escapeHtml(item.name)}</span>
      ${item.county ? `<small style="font-size:0.82rem;color:#5f6b76;">${escapeHtml(item.county)}</small>` : ""}
    `;

    button.addEventListener("click", function () {
      townSearchInputEl.value = item.name;
      clearTownSearchResults();
      selectLayer(item.layer, { forceRefresh: true });
    });

    townSearchResultsEl.appendChild(button);
  });
}

function clearTownSearchResults() {
  if (townSearchResultsEl) {
    townSearchResultsEl.innerHTML = "";
  }
}

function openAboutPanel() {
  aboutPanelEl.classList.add("is-open");
  aboutPanelEl.setAttribute("aria-hidden", "false");
}

function closeAboutPanel() {
  aboutPanelEl.classList.remove("is-open");
  aboutPanelEl.setAttribute("aria-hidden", "true");
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

function buildChurchPopup(row) {
  const name = escapeHtml(row.name || "Church");
  const county = escapeHtml(row.county || "");
  const lea = escapeHtml(row.lea || "");
  const website = String(row.website || "").trim();

  const placeParts = [county, lea].filter(Boolean);
  const placeLine = placeParts.length > 0 ? `<p>${placeParts.join(" · ")}</p>` : "";
  const websiteLine = website ? `<p><a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">View website</a></p>` : "";

  return `
    <div class="church-popup">
      <h2>${name}</h2>
      ${placeLine}
      ${websiteLine}
    </div>
  `;
}

function loadChurchOverlay(retryAttempt = 0) {
  if (churchesLoaded) {
    churchLayer.addTo(map);
    churchLayer.bringToFront();
    return;
  }

  fetch("churches-points.csv?v=" + Date.now())
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not load churches-points.csv. HTTP status: " + response.status);
      }

      return response.text();
    })
    .then(csvText => {
      const rows = parseCsv(csvText);
      let addedCount = 0;

      churchLayer.clearLayers();

      rows.forEach(row => {
        const lat = Number(row.latitude || row.Latitude);
        const lng = Number(row.longitude || row.Longitude);

        if (Number.isNaN(lat) || Number.isNaN(lng)) return;

        const marker = L.circleMarker([lat, lng], {
          pane: "churchPane",
          radius: 5,
          color: "#111827",
          weight: 1.8,
          fillColor: "#ffffff",
          fillOpacity: 1
        });

        marker.bindPopup(buildChurchPopup(row));
        marker.addTo(churchLayer);
        addedCount++;
      });

      churchesLoaded = true;
      churchLayer.addTo(map);
      churchLayer.bringToFront();
      console.log("Loaded " + addedCount + " church overlay points.");
    })
    .catch(error => {
      console.warn("Church overlay did not load on attempt " + (retryAttempt + 1) + ".", error);

      // GitHub Pages can briefly serve stale/cached assets during deploys. Retry once
      // without showing a blocking browser alert to the user.
      if (retryAttempt < 1 && churchOverlayToggleEl && churchOverlayToggleEl.checked) {
        setTimeout(() => loadChurchOverlay(retryAttempt + 1), 1200);
        return;
      }

      if (churchOverlayToggleEl) {
        churchOverlayToggleEl.checked = false;
      }
    });
}

function toggleChurchOverlay() {
  if (!churchOverlayToggleEl) return;

  if (churchOverlayToggleEl.checked) {
    loadChurchOverlay();
  } else {
    map.removeLayer(churchLayer);
  }
}

countyViewButtonEl.addEventListener("click", function () {
  switchGeography("county");
});

leaViewButtonEl.addEventListener("click", function () {
  switchGeography("lea");
});

townViewButtonEl.addEventListener("click", function () {
  switchGeography("town");
});

indicatorSelectEl.addEventListener("change", function (event) {
  updateMapIndicator(event.target.value);
});

resetButtonEl.addEventListener("click", resetMap);

if (churchOverlayToggleEl) {
  churchOverlayToggleEl.addEventListener("change", toggleChurchOverlay);
}

aboutButtonEl.addEventListener("click", openAboutPanel);
aboutCloseButtonEl.addEventListener("click", closeAboutPanel);

aboutPanelEl.addEventListener("click", function (event) {
  if (event.target === aboutPanelEl) {
    closeAboutPanel();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeAboutPanel();
    clearTownSearchResults();
  }
});

configureViewText();
populateIndicatorSelect();
buildSidebarSections();
resetSidebar();
ensureTownSearchSection();
loadGeographyLayer("county");
