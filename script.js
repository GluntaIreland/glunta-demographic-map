// Glunta Demographic Map
// County / local authority demographic prototype using Census 2022 data

if (typeof L === "undefined") {
  console.error("Leaflet did not load. Check your internet connection or CDN access.");
  throw new Error("Leaflet did not load.");
}

const DEFAULT_FILL_OPACITY = 0.62;
const HOVER_FILL_OPACITY = 0.72;
const SELECTED_FILL_OPACITY = 0.78;

const sidebarSections = [
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
    note: "Source: CSO Census 2022, SAP2022T2T4ACTY.",
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
    note: "Source: CSO Census 2022, SAP2022T2T1ACTY. This table includes birthplace and citizenship categories, but not a separate dual citizenship field.",
    barClass: "migration-bar",
    rows: [
      { label: "Born in Ireland", count: "born_ireland", pct: "born_ireland_pct" },
      { label: "Born outside Ireland", count: "born_outside_ireland", pct: "born_outside_ireland_pct" },
      { label: "Irish citizenship", count: "citizen_ireland", pct: "citizen_ireland_pct" },
      { label: "Non-Irish citizenship", count: "non_irish_citizenship", pct: "non_irish_citizenship_pct" }
    ]
  },
  {
    title: "Ethnicity / cultural background",
    note: "Source: CSO Census 2022, SAP2022T2T2ACTY.",
    barClass: "ethnicity-bar",
    rows: [
      { label: "White Irish", count: "ethnicity_white_irish", pct: "ethnicity_white_irish_pct" },
      { label: "White Irish Traveller", count: "ethnicity_white_irish_traveller", pct: "ethnicity_white_irish_traveller_pct" },
      { label: "Other White", count: "ethnicity_other_white", pct: "ethnicity_other_white_pct" },
      { label: "Black or Black Irish", count: "ethnicity_black_or_black_irish", pct: "ethnicity_black_or_black_irish_pct" },
      { label: "Asian or Asian Irish", count: "ethnicity_asian_or_asian_irish", pct: "ethnicity_asian_or_asian_irish_pct" },
      { label: "Other", count: "ethnicity_other", pct: "ethnicity_other_pct" }
    ]
  },
  {
    title: "Language",
    note: "Source: CSO Census 2022, SAP2022T2T5CTY. Percentages are calculated using total population as the denominator.",
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
    title: "Families",
    note: "Source: CSO Census 2022, SAP2022T4T2CTY. This table describes family units by number and age of children. It does not provide lone-parent family data.",
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
  },
  {
    title: "Principal economic status",
    note: "Source: CSO Census 2022, SAP2022T8T1CTY. Percentages use the population aged 15 years and over as the denominator. Unemployed combines looking for first regular job, short-term unemployed and long-term unemployed.",
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
  return config(
    label,
    `The map is currently coloured by the percentage of ${subject}.`,
    legendTitle,
    colorSet,
    "percent",
    grades
  );
}

const indicatorConfigs = {
  population_2022: config("Total population", "The map is currently coloured by total population.", "Population, 2022", "blue", "number", [
    [500000, "500,000+"],
    [300000, "300,001 to 500,000"],
    [200000, "200,001 to 300,000"],
    [150000, "150,001 to 200,000"],
    [100000, "100,001 to 150,000"],
    [75000, "75,001 to 100,000"],
    [50000, "50,001 to 75,000"],
    [-Infinity, "Up to 50,000"]
  ]),

  age_0_14_pct: pct("Children, 0 to 14 %", "residents aged 0 to 14", "Children, 0 to 14", "blue", [[24,"24%+"],[22,"22% to 23.9%"],[20,"20% to 21.9%"],[18,"18% to 19.9%"],[16,"16% to 17.9%"],[-Infinity,"Under 16%"]]),
  age_15_34_pct: pct("Young adults, 15 to 34 %", "residents aged 15 to 34", "Young adults, 15 to 34", "blue", [[32,"32%+"],[30,"30% to 31.9%"],[28,"28% to 29.9%"],[26,"26% to 27.9%"],[24,"24% to 25.9%"],[-Infinity,"Under 24%"]]),
  age_35_64_pct: pct("Adults, 35 to 64 %", "residents aged 35 to 64", "Adults, 35 to 64", "blue", [[44,"44%+"],[42,"42% to 43.9%"],[40,"40% to 41.9%"],[38,"38% to 39.9%"],[36,"36% to 37.9%"],[-Infinity,"Under 36%"]]),
  age_65_plus_pct: pct("Older adults, 65+ %", "residents aged 65 and over", "Older adults, 65+", "blue", [[22,"22%+"],[20,"20% to 21.9%"],[18,"18% to 19.9%"],[16,"16% to 17.9%"],[14,"14% to 15.9%"],[-Infinity,"Under 14%"]]),

  religion_catholic_pct: pct("Catholic %", "residents recorded as Catholic", "Catholic", "purple", [[80,"80%+"],[75,"75% to 79.9%"],[70,"70% to 74.9%"],[65,"65% to 69.9%"],[60,"60% to 64.9%"],[-Infinity,"Under 60%"]]),
  religion_other_pct: pct("Other religion %", "residents recorded under Other religion", "Other religion", "purple", [[18,"18%+"],[15,"15% to 17.9%"],[12,"12% to 14.9%"],[9,"9% to 11.9%"],[6,"6% to 8.9%"],[-Infinity,"Under 6%"]]),
  religion_none_pct: pct("No religion %", "residents recorded as having No religion", "No religion", "purple", [[20,"20%+"],[17,"17% to 19.9%"],[14,"14% to 16.9%"],[11,"11% to 13.9%"],[8,"8% to 10.9%"],[-Infinity,"Under 8%"]]),
  religion_not_stated_pct: pct("Religion not stated %", "residents who did not state a religion", "Religion not stated", "purple", [[12,"12%+"],[10,"10% to 11.9%"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[-Infinity,"Under 4%"]]),

  born_outside_ireland_pct: pct("Born outside Ireland %", "residents born outside Ireland", "Born outside Ireland", "orange", [[32,"32%+"],[28,"28% to 31.9%"],[24,"24% to 27.9%"],[20,"20% to 23.9%"],[16,"16% to 19.9%"],[-Infinity,"Under 16%"]]),
  born_ireland_pct: pct("Born in Ireland %", "residents born in Ireland", "Born in Ireland", "orange", [[84,"84%+"],[80,"80% to 83.9%"],[76,"76% to 79.9%"],[72,"72% to 75.9%"],[68,"68% to 71.9%"],[-Infinity,"Under 68%"]]),
  citizen_ireland_pct: pct("Irish citizenship %", "residents with Irish citizenship", "Irish citizenship", "orange", [[90,"90%+"],[86,"86% to 89.9%"],[82,"82% to 85.9%"],[78,"78% to 81.9%"],[74,"74% to 77.9%"],[-Infinity,"Under 74%"]]),
  non_irish_citizenship_pct: pct("Non-Irish citizenship %", "residents with non-Irish citizenship", "Non-Irish citizenship", "orange", [[22,"22%+"],[18,"18% to 21.9%"],[14,"14% to 17.9%"],[10,"10% to 13.9%"],[6,"6% to 9.9%"],[-Infinity,"Under 6%"]]),
  born_uk_pct: pct("Born in UK %", "residents born in the United Kingdom", "Born in UK", "orange", [[10,"10%+"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[-Infinity,"Under 2%"]]),
  born_poland_pct: pct("Born in Poland %", "residents born in Poland", "Born in Poland", "orange", [[5,"5%+"],[4,"4% to 4.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]),
  born_india_pct: pct("Born in India %", "residents born in India", "Born in India", "orange", [[4,"4%+"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[-Infinity,"Under 0.5%"]]),
  born_other_eu_pct: pct("Born in Other EU %", "residents born in EU countries other than Ireland and Poland", "Born in Other EU", "orange", [[10,"10%+"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[-Infinity,"Under 2%"]]),
  born_rest_world_pct: pct("Born in Rest of World %", "residents born outside Ireland, UK, Poland, India and Other EU", "Born in Rest of World", "orange", [[12,"12%+"],[10,"10% to 11.9%"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[-Infinity,"Under 4%"]]),

  ethnicity_white_irish_pct: pct("White Irish %", "residents recorded as White Irish", "White Irish", "green", [[85,"85%+"],[80,"80% to 84.9%"],[75,"75% to 79.9%"],[70,"70% to 74.9%"],[65,"65% to 69.9%"],[-Infinity,"Under 65%"]]),
  ethnicity_white_irish_traveller_pct: pct("White Irish Traveller %", "residents recorded as White Irish Traveller", "White Irish Traveller", "green", [[2,"2%+"],[1.5,"1.5% to 1.9%"],[1,"1% to 1.4%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]),
  ethnicity_other_white_pct: pct("Other White %", "residents recorded as Other White", "Other White", "green", [[20,"20%+"],[16,"16% to 19.9%"],[12,"12% to 15.9%"],[8,"8% to 11.9%"],[4,"4% to 7.9%"],[-Infinity,"Under 4%"]]),
  ethnicity_black_or_black_irish_pct: pct("Black or Black Irish %", "residents recorded as Black or Black Irish", "Black or Black Irish", "green", [[6,"6%+"],[4,"4% to 5.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]),
  ethnicity_asian_or_asian_irish_pct: pct("Asian or Asian Irish %", "residents recorded as Asian or Asian Irish", "Asian or Asian Irish", "green", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[-Infinity,"Under 2%"]]),
  ethnicity_other_pct: pct("Other ethnic background %", "residents recorded as Other ethnic background", "Other ethnic background", "green", [[4,"4%+"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[-Infinity,"Under 0.5%"]]),
  ethnicity_not_stated_pct: pct("Ethnicity not stated %", "residents whose ethnicity was not stated", "Ethnicity not stated", "green", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]),

  foreign_language_speakers_pct: pct("Foreign-language speakers %", "residents who speak a foreign language", "Foreign-language speakers", "red", [[18,"18%+"],[15,"15% to 17.9%"],[12,"12% to 14.9%"],[9,"9% to 11.9%"],[6,"6% to 8.9%"],[-Infinity,"Under 6%"]]),
  language_spanish_pct: pct("Spanish speakers %", "residents recorded as Spanish speakers", "Spanish speakers", "red", [[2,"2%+"],[1.5,"1.5% to 1.9%"],[1,"1% to 1.4%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]),
  language_french_pct: pct("French speakers %", "residents recorded as French speakers", "French speakers", "red", [[2,"2%+"],[1.5,"1.5% to 1.9%"],[1,"1% to 1.4%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]),
  language_polish_pct: pct("Polish speakers %", "residents recorded as Polish speakers", "Polish speakers", "red", [[5,"5%+"],[4,"4% to 4.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]),
  language_other_incl_not_stated_pct: pct("Other / not stated language %", "residents recorded as speaking other foreign languages, including not stated", "Other / not stated language", "red", [[12,"12%+"],[10,"10% to 11.9%"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[-Infinity,"Under 4%"]]),

  families_with_children_pct: pct("Families with children %", "family units with children", "Families with children", "cyan", [[75,"75%+"],[70,"70% to 74.9%"],[65,"65% to 69.9%"],[60,"60% to 64.9%"],[55,"55% to 59.9%"],[-Infinity,"Under 55%"]]),
  families_without_children_pct: pct("Families without children %", "family units without children", "Families without children", "cyan", [[45,"45%+"],[40,"40% to 44.9%"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[-Infinity,"Under 25%"]]),
  families_all_children_under15_pct: pct("Families: all children under 15 %", "families where all children are under 15", "All children under 15", "cyan", [[45,"45%+"],[40,"40% to 44.9%"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[-Infinity,"Under 25%"]]),
  families_all_children_15_plus_pct: pct("Families: all children 15+ %", "families where all children are 15 or over", "All children 15+", "cyan", [[35,"35%+"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[20,"20% to 24.9%"],[15,"15% to 19.9%"],[-Infinity,"Under 15%"]]),
  families_children_under_and_over15_pct: pct("Families: children under and over 15 %", "families with children both under and over 15", "Children under and over 15", "cyan", [[20,"20%+"],[16,"16% to 19.9%"],[12,"12% to 15.9%"],[8,"8% to 11.9%"],[4,"4% to 7.9%"],[-Infinity,"Under 4%"]]),
  families_1_child_pct: pct("Families with 1 child %", "families with 1 child", "Families with 1 child", "cyan", [[40,"40%+"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[20,"20% to 24.9%"],[-Infinity,"Under 20%"]]),
  families_2_children_pct: pct("Families with 2 children %", "families with 2 children", "Families with 2 children", "cyan", [[40,"40%+"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[20,"20% to 24.9%"],[-Infinity,"Under 20%"]]),
  families_3_children_pct: pct("Families with 3 children %", "families with 3 children", "Families with 3 children", "cyan", [[20,"20%+"],[16,"16% to 19.9%"],[12,"12% to 15.9%"],[8,"8% to 11.9%"],[4,"4% to 7.9%"],[-Infinity,"Under 4%"]]),
  families_4_children_pct: pct("Families with 4 children %", "families with 4 children", "Families with 4 children", "cyan", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]),
  families_5_plus_children_pct: pct("Families with 5+ children %", "families with 5 or more children", "Families with 5+ children", "cyan", [[4,"4%+"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[-Infinity,"Under 0.5%"]]),

  status_at_work_pct: pct("At work %", "people aged 15+ who are at work", "At work", "rose", [[62,"62%+"],[58,"58% to 61.9%"],[54,"54% to 57.9%"],[50,"50% to 53.9%"],[46,"46% to 49.9%"],[-Infinity,"Under 46%"]]),
  status_student_pct: pct("Student %", "people aged 15+ who are students", "Student", "rose", [[18,"18%+"],[16,"16% to 17.9%"],[14,"14% to 15.9%"],[12,"12% to 13.9%"],[10,"10% to 11.9%"],[-Infinity,"Under 10%"]]),
  status_retired_pct: pct("Retired %", "people aged 15+ who are retired", "Retired", "rose", [[25,"25%+"],[22,"22% to 24.9%"],[19,"19% to 21.9%"],[16,"16% to 18.9%"],[13,"13% to 15.9%"],[-Infinity,"Under 13%"]]),
  status_home_family_pct: pct("Looking after home/family %", "people aged 15+ looking after home or family", "Looking after home/family", "rose", [[8,"8%+"],[7,"7% to 7.9%"],[6,"6% to 6.9%"],[5,"5% to 5.9%"],[4,"4% to 4.9%"],[-Infinity,"Under 4%"]]),
  status_unable_to_work_pct: pct("Unable to work due to sickness/disability %", "people aged 15+ unable to work due to permanent sickness or disability", "Unable to work", "rose", [[8,"8%+"],[7,"7% to 7.9%"],[6,"6% to 6.9%"],[5,"5% to 5.9%"],[4,"4% to 4.9%"],[-Infinity,"Under 4%"]]),
  status_unemployed_pct: pct("Unemployed %", "people aged 15+ who are unemployed", "Unemployed", "rose", [[8,"8%+"],[7,"7% to 7.9%"],[6,"6% to 6.9%"],[5,"5% to 5.9%"],[4,"4% to 4.9%"],[-Infinity,"Under 4%"]]),
  status_other_pct: pct("Other status %", "people aged 15+ in other principal economic status categories", "Other status", "rose", [[4,"4%+"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1.5,"1.5% to 1.9%"],[1,"1% to 1.4%"],[-Infinity,"Under 1%"]])
};

const colorSets = {
  blue: ["#08306b", "#08519c", "#2171b5", "#4292c6", "#9ecae1", "#deebf7", "#eff3ff", "#f7fbff"],
  purple: ["#3f007d", "#54278f", "#6a51a3", "#807dba", "#9e9ac8", "#dadaeb", "#efedf5", "#fcfbfd"],
  orange: ["#7f2704", "#a63603", "#d94801", "#f16913", "#fd8d3c", "#fdd0a2", "#feedde", "#fff5eb"],
  green: ["#00441b", "#006d2c", "#238b45", "#41ab5d", "#74c476", "#bae4b3", "#edf8e9", "#f7fcf5"],
  red: ["#67000d", "#a50f15", "#cb181d", "#ef3b2c", "#fb6a4a", "#fcae91", "#fee5d9", "#fff5f0"],
  cyan: ["#083344", "#075985", "#0369a1", "#0284c7", "#38bdf8", "#bae6fd", "#e0f2fe", "#f0f9ff"],
  rose: ["#4c0519", "#881337", "#be123c", "#e11d48", "#fb7185", "#fecdd3", "#ffe4e6", "#fff1f2"]
};

const map = L.map("map", { zoomControl: true }).setView([53.4, -8.1], 7);

map.createPane("labelsPane");
map.getPane("labelsPane").style.zIndex = 650;
map.getPane("labelsPane").style.pointerEvents = "none";

L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
}).addTo(map);

L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  pane: "labelsPane",
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
}).addTo(map);

const indicatorSelectEl = document.getElementById("indicatorSelect");
const indicatorNoteEl = document.getElementById("indicatorNote");
const areaSearchEl = document.getElementById("areaSearch");
const searchButtonEl = document.getElementById("searchButton");
const resetButtonEl = document.getElementById("resetButton");
const searchResultsEl = document.getElementById("searchResults");
const aboutButtonEl = document.getElementById("aboutButton");
const aboutPanelEl = document.getElementById("aboutPanel");
const aboutCloseButtonEl = document.getElementById("aboutCloseButton");
const areaNameEl = document.getElementById("areaName");
const areaIntroEl = document.getElementById("areaIntro");
const selectedIndicatorNameEl = document.getElementById("selectedIndicatorName");
const selectedIndicatorValueEl = document.getElementById("selectedIndicatorValue");
const populationValueEl = document.getElementById("populationValue");
const sourceNoteEl = document.getElementById("sourceNote");
const dataSectionsEl = document.getElementById("dataSections");

let currentIndicator = "population_2022";
let countyLayer;
let selectedLayer = null;
let legend;
let sectionRowEls = [];
let allAreaLayers = [];
let fullMapBounds = null;

function buildSidebarSections() {
  dataSectionsEl.innerHTML = "";
  sectionRowEls = [];

  sidebarSections.forEach(section => {
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
          <span class="data-label">${row.label}</span>
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
}

buildSidebarSections();

function getColorForValue(value, indicatorKey) {
  const config = indicatorConfigs[indicatorKey];
  const number = Number(value);

  if (Number.isNaN(number)) return "#f0f0f0";

  const colors = colorSets[config.colorSet] || colorSets.blue;
  const matchedIndex = config.grades.findIndex(grade => number >= grade.min);

  return colors[matchedIndex] || colors[colors.length - 1];
}

function styleCounty(feature) {
  const value = feature.properties[currentIndicator];

  return {
    fillColor: getColorForValue(value, currentIndicator),
    weight: 1.1,
    opacity: 1,
    color: "#333",
    fillOpacity: DEFAULT_FILL_OPACITY
  };
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
  const config = indicatorConfigs[indicatorKey];
  return config.type === "percent" ? formatPercent(value) : formatNumber(value);
}

function getAreaName(props) {
  return props.area_name || props.ENGLISH || props.name || "Unknown area";
}

function setDataRow(valueEl, barEl, count, percent) {
  valueEl.textContent = `${formatNumber(count)} (${formatPercent(percent)})`;

  const safePercent = Number(percent);
  barEl.style.width = Number.isNaN(safePercent)
    ? "0%"
    : Math.max(0, Math.min(100, safePercent)) + "%";
}

function resetSidebar() {
  areaNameEl.textContent = "No area selected";
  areaIntroEl.textContent = "Click a county or local authority area on the map to view its Census 2022 demographic profile.";
  selectedIndicatorNameEl.textContent = "—";
  selectedIndicatorValueEl.textContent = "—";
  populationValueEl.textContent = "—";
  sourceNoteEl.textContent = "Source: CSO Census 2022, SAP2022T1T1ACTY.";

  sectionRowEls.forEach(row => {
    row.valueEl.textContent = "—";
    row.barEl.style.width = "0%";
  });
}

function updateSidebar(props) {
  const name = getAreaName(props);
  const indicatorConfig = indicatorConfigs[currentIndicator];

  areaNameEl.textContent = name;
  areaIntroEl.textContent = "Census 2022 demographic profile for this county or local authority area.";

  selectedIndicatorNameEl.textContent = indicatorConfig.label;
  selectedIndicatorValueEl.textContent = formatIndicatorValue(props[currentIndicator], currentIndicator);

  populationValueEl.textContent = formatNumber(props.population_2022);
  sourceNoteEl.textContent = "Source: CSO Census 2022, SAP2022T1T1ACTY.";

  sectionRowEls.forEach(row => {
    setDataRow(row.valueEl, row.barEl, props[row.countKey], props[row.pctKey]);
  });
}

function highlightFeature(e) {
  const layer = e.target;

  if (layer !== selectedLayer) {
    layer.setStyle({
      weight: 2.5,
      color: "#111",
      fillOpacity: HOVER_FILL_OPACITY
    });
  }

  layer.bringToFront();
}

function resetHighlight(e) {
  const layer = e.target;

  if (layer !== selectedLayer) {
    countyLayer.resetStyle(layer);
  }
}

function selectLayer(layer) {
  const props = layer.feature.properties;

  if (selectedLayer) {
    countyLayer.resetStyle(selectedLayer);
  }

  selectedLayer = layer;

  layer.setStyle({
    weight: 3.5,
    color: "#000",
    fillOpacity: SELECTED_FILL_OPACITY
  });

  layer.bringToFront();
  updateSidebar(props);

  map.fitBounds(layer.getBounds(), {
    padding: [30, 30]
  });

  const name = getAreaName(props);
  const population = props.population_2022
    ? formatNumber(props.population_2022)
    : "No population data";

  const currentValue = formatIndicatorValue(props[currentIndicator], currentIndicator);
  const currentLabel = indicatorConfigs[currentIndicator].label;

  layer.bindPopup(`
    <div class="county-popup">
      <h2>${name}</h2>
      <p><strong>Population, 2022:</strong> ${population}</p>
      <p><strong>${currentLabel}:</strong> ${currentValue}</p>
    </div>
  `).openPopup();
}

function selectFeature(e) {
  selectLayer(e.target);
}

function bindCountyInteractions(feature, layer) {
  allAreaLayers.push(layer);

  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: selectFeature
  });
}

function updateLegend() {
  if (legend) {
    map.removeControl(legend);
  }

  legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    const config = indicatorConfigs[currentIndicator];
    const colors = colorSets[config.colorSet] || colorSets.blue;

    div.innerHTML = `<div class="legend-title">${config.legendTitle}</div>`;

    config.grades.forEach((item, index) => {
      div.innerHTML += `
        <div class="legend-row">
          <span class="legend-color" style="background:${colors[index]}; opacity:${DEFAULT_FILL_OPACITY}; border:1px solid #555;"></span>
          <span>${item.label}</span>
        </div>
      `;
    });

    return div;
  };

  legend.addTo(map);
}

function updateMapIndicator(indicatorKey) {
  currentIndicator = indicatorKey;
  const config = indicatorConfigs[currentIndicator];

  indicatorNoteEl.textContent = config.note;

  if (countyLayer) {
    countyLayer.setStyle(styleCounty);
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

function normaliseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace("county council", "")
    .replace("city council", "")
    .replace("city and county council", "")
    .replace("county", "")
    .replace("city", "")
    .replace(/\s+/g, " ")
    .trim();
}

function performSearch() {
  const query = normaliseText(areaSearchEl.value);
  searchResultsEl.innerHTML = "";

  if (!query) return;

  const matches = allAreaLayers
    .map(layer => ({
      layer,
      name: getAreaName(layer.feature.properties)
    }))
    .filter(item => normaliseText(item.name).includes(query))
    .slice(0, 8);

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "source-note";
    empty.textContent = "No matching area found.";
    searchResultsEl.appendChild(empty);
    return;
  }

  matches.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.textContent = item.name;

    button.addEventListener("click", () => {
      selectLayer(item.layer);
      searchResultsEl.innerHTML = "";
      areaSearchEl.value = item.name;
    });

    searchResultsEl.appendChild(button);
  });
}

function resetMap() {
  if (selectedLayer && countyLayer) {
    countyLayer.resetStyle(selectedLayer);
  }

  selectedLayer = null;
  map.closePopup();

  if (fullMapBounds) {
    map.fitBounds(fullMapBounds, {
      padding: [20, 20]
    });
  }

  areaSearchEl.value = "";
  searchResultsEl.innerHTML = "";
  resetSidebar();
}

function openAboutPanel() {
  aboutPanelEl.classList.add("is-open");
  aboutPanelEl.setAttribute("aria-hidden", "false");
}

function closeAboutPanel() {
  aboutPanelEl.classList.remove("is-open");
  aboutPanelEl.setAttribute("aria-hidden", "true");
}

indicatorSelectEl.addEventListener("change", function (event) {
  updateMapIndicator(event.target.value);
});

searchButtonEl.addEventListener("click", performSearch);

areaSearchEl.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    performSearch();
  }
});

areaSearchEl.addEventListener("input", function () {
  if (areaSearchEl.value.length >= 2) {
    performSearch();
  } else {
    searchResultsEl.innerHTML = "";
  }
});

resetButtonEl.addEventListener("click", resetMap);

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
  }
});

fetch("county-demographics-map.geojson")
  .then(response => {
    if (!response.ok) {
      throw new Error("Could not load county-demographics-map.geojson. HTTP status: " + response.status);
    }

    return response.json();
  })
  .then(data => {
    countyLayer = L.geoJSON(data, {
      style: styleCounty,
      onEachFeature: bindCountyInteractions
    }).addTo(map);

    fullMapBounds = countyLayer.getBounds();

    map.fitBounds(fullMapBounds, {
      padding: [20, 20]
    });

    updateLegend();

    console.log("Loaded " + data.features.length + " county areas.");
  })
  .catch(error => {
    console.error(error);
    alert(
      "The county demographics GeoJSON file could not be loaded. Check that the filename is exactly county-demographics-map.geojson and that you are using http://localhost:8000."
    );
  });
