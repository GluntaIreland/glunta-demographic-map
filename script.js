// Glúnta Demographic Map
// Unified County + LEA view using Census 2022 data

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
    searchLabel: "Search area",
    searchPlaceholder: "Search county or local authority...",
    sourceNote: "Source: CSO Census 2022, county / local authority SAPS tables.",
    contextLabel: "",
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
    searchLabel: "Search LEA",
    searchPlaceholder: "Search LEA, e.g. Ballina, Athlone...",
    sourceNote: "Source: CSO Census 2022, LEA-level SAPS tables.",
    contextLabel: "County",
    weight: 0.9
  }
};

const GROUPS = [
  {
    label: "Population",
    options: [
      { value: "population_2022", label: "Total population" }
    ]
  },
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
      { value: "families_with_children_pct", label: "Families with children %", geographies: ["county"] },
      { value: "families_without_children_pct", label: "Families without children %", geographies: ["county"] },
      { value: "families_all_children_under15_pct", label: "Families: all children under 15 %", geographies: ["county"] },
      { value: "families_all_children_15_plus_pct", label: "Families: all children 15+ %", geographies: ["county"] },
      { value: "families_children_under_and_over15_pct", label: "Families: children under and over 15 %", geographies: ["county"] },
      { value: "families_1_child_pct", label: "Families with 1 child %", geographies: ["county"] },
      { value: "families_2_children_pct", label: "Families with 2 children %", geographies: ["county"] },
      { value: "families_3_children_pct", label: "Families with 3 children %", geographies: ["county"] },
      { value: "families_4_children_pct", label: "Families with 4 children %", geographies: ["county"] },
      { value: "families_5_plus_children_pct", label: "Families with 5+ children %", geographies: ["county"] },
      { value: "families_household_size_2_persons_pct", label: "2-person households %", geographies: ["lea"] },
      { value: "families_household_size_3_persons_pct", label: "3-person households %", geographies: ["lea"] },
      { value: "families_household_size_4_persons_pct", label: "4-person households %", geographies: ["lea"] },
      { value: "families_household_size_5_persons_pct", label: "5-person households %", geographies: ["lea"] },
      { value: "families_household_size_6_plus_persons_pct", label: "6+ person households %", geographies: ["lea"] }
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

const sidebarSectionsByGeography = {
  county: [
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
      title: "Families",
      note: "This county table describes family units by number and age of children.",
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
      note: "Percentages use the population aged 15 years and over as the denominator.",
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
  ],

  lea: [
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
      title: "Household / family size",
      note: "This LEA table reflects household / family size rather than the county family-with-children table.",
      barClass: "families-bar",
      rows: [
        { label: "2-person households", count: "families_household_size_2_persons", pct: "families_household_size_2_persons_pct" },
        { label: "3-person households", count: "families_household_size_3_persons", pct: "families_household_size_3_persons_pct" },
        { label: "4-person households", count: "families_household_size_4_persons", pct: "families_household_size_4_persons_pct" },
        { label: "5-person households", count: "families_household_size_5_persons", pct: "families_household_size_5_persons_pct" },
        { label: "6+ person households", count: "families_household_size_6_plus_persons", pct: "families_household_size_6_plus_persons_pct" }
      ]
    },
    {
      title: "Principal economic status",
      note: "Percentages use the population aged 15 years and over as the denominator.",
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
  ]
};

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
    ])
  },

  age_0_14_pct: {
    county: pct("Children, 0 to 14 %", "residents aged 0 to 14", "Children, 0 to 14", "blue", [[24,"24%+"],[22,"22% to 23.9%"],[20,"20% to 21.9%"],[18,"18% to 19.9%"],[16,"16% to 17.9%"],[-Infinity,"Under 16%"]]),
    lea: pct("Children, 0 to 14 %", "residents aged 0 to 14", "Children, 0 to 14", "blue", [[28,"28%+"],[24,"24% to 27.9%"],[20,"20% to 23.9%"],[16,"16% to 19.9%"],[12,"12% to 15.9%"],[-Infinity,"Under 12%"]])
  },
  age_15_34_pct: {
    county: pct("Young adults, 15 to 34 %", "residents aged 15 to 34", "Young adults, 15 to 34", "blue", [[32,"32%+"],[30,"30% to 31.9%"],[28,"28% to 29.9%"],[26,"26% to 27.9%"],[24,"24% to 25.9%"],[-Infinity,"Under 24%"]]),
    lea: pct("Young adults, 15 to 34 %", "residents aged 15 to 34", "Young adults, 15 to 34", "blue", [[40,"40%+"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[20,"20% to 24.9%"],[-Infinity,"Under 20%"]])
  },
  age_35_64_pct: {
    county: pct("Adults, 35 to 64 %", "residents aged 35 to 64", "Adults, 35 to 64", "blue", [[44,"44%+"],[42,"42% to 43.9%"],[40,"40% to 41.9%"],[38,"38% to 39.9%"],[36,"36% to 37.9%"],[-Infinity,"Under 36%"]]),
    lea: pct("Adults, 35 to 64 %", "residents aged 35 to 64", "Adults, 35 to 64", "blue", [[48,"48%+"],[44,"44% to 47.9%"],[40,"40% to 43.9%"],[36,"36% to 39.9%"],[32,"32% to 35.9%"],[-Infinity,"Under 32%"]])
  },
  age_65_plus_pct: {
    county: pct("Older adults, 65+ %", "residents aged 65 and over", "Older adults, 65+", "blue", [[22,"22%+"],[20,"20% to 21.9%"],[18,"18% to 19.9%"],[16,"16% to 17.9%"],[14,"14% to 15.9%"],[-Infinity,"Under 14%"]]),
    lea: pct("Older adults, 65+ %", "residents aged 65 and over", "Older adults, 65+", "blue", [[25,"25%+"],[21,"21% to 24.9%"],[17,"17% to 20.9%"],[13,"13% to 16.9%"],[9,"9% to 12.9%"],[-Infinity,"Under 9%"]])
  },

  religion_catholic_pct: { county: pct("Catholic %", "residents recorded as Catholic", "Catholic", "purple", [[80,"80%+"],[75,"75% to 79.9%"],[70,"70% to 74.9%"],[65,"65% to 69.9%"],[60,"60% to 64.9%"],[-Infinity,"Under 60%"]]), lea: pct("Catholic %", "residents recorded as Catholic", "Catholic", "purple", [[85,"85%+"],[75,"75% to 84.9%"],[65,"65% to 74.9%"],[55,"55% to 64.9%"],[45,"45% to 54.9%"],[-Infinity,"Under 45%"]]) },
  religion_other_pct: { county: pct("Other religion %", "residents recorded under Other religion", "Other religion", "purple", [[18,"18%+"],[15,"15% to 17.9%"],[12,"12% to 14.9%"],[9,"9% to 11.9%"],[6,"6% to 8.9%"],[-Infinity,"Under 6%"]]), lea: pct("Other religion %", "residents recorded under Other religion", "Other religion", "purple", [[25,"25%+"],[20,"20% to 24.9%"],[15,"15% to 19.9%"],[10,"10% to 14.9%"],[5,"5% to 9.9%"],[-Infinity,"Under 5%"]]) },
  religion_none_pct: { county: pct("No religion %", "residents recorded as having No religion", "No religion", "purple", [[20,"20%+"],[17,"17% to 19.9%"],[14,"14% to 16.9%"],[11,"11% to 13.9%"],[8,"8% to 10.9%"],[-Infinity,"Under 8%"]]), lea: pct("No religion %", "residents recorded as having No religion", "No religion", "purple", [[25,"25%+"],[20,"20% to 24.9%"],[15,"15% to 19.9%"],[10,"10% to 14.9%"],[5,"5% to 9.9%"],[-Infinity,"Under 5%"]]) },
  religion_not_stated_pct: { county: pct("Religion not stated %", "residents who did not state a religion", "Religion not stated", "purple", [[12,"12%+"],[10,"10% to 11.9%"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[-Infinity,"Under 4%"]]), lea: pct("Religion not stated %", "residents who did not state a religion", "Religion not stated", "purple", [[15,"15%+"],[12,"12% to 14.9%"],[9,"9% to 11.9%"],[6,"6% to 8.9%"],[3,"3% to 5.9%"],[-Infinity,"Under 3%"]]) },

  born_outside_ireland_pct: { county: pct("Born outside Ireland %", "residents born outside Ireland", "Born outside Ireland", "orange", [[32,"32%+"],[28,"28% to 31.9%"],[24,"24% to 27.9%"],[20,"20% to 23.9%"],[16,"16% to 19.9%"],[-Infinity,"Under 16%"]]), lea: pct("Born outside Ireland %", "residents born outside Ireland", "Born outside Ireland", "orange", [[40,"40%+"],[32,"32% to 39.9%"],[24,"24% to 31.9%"],[16,"16% to 23.9%"],[8,"8% to 15.9%"],[-Infinity,"Under 8%"]]) },
  born_ireland_pct: { county: pct("Born in Ireland %", "residents born in Ireland", "Born in Ireland", "orange", [[84,"84%+"],[80,"80% to 83.9%"],[76,"76% to 79.9%"],[72,"72% to 75.9%"],[68,"68% to 71.9%"],[-Infinity,"Under 68%"]]), lea: pct("Born in Ireland %", "residents born in Ireland", "Born in Ireland", "orange", [[90,"90%+"],[84,"84% to 89.9%"],[78,"78% to 83.9%"],[72,"72% to 77.9%"],[66,"66% to 71.9%"],[-Infinity,"Under 66%"]]) },
  citizen_ireland_pct: { county: pct("Irish citizenship %", "residents with Irish citizenship", "Irish citizenship", "orange", [[90,"90%+"],[86,"86% to 89.9%"],[82,"82% to 85.9%"],[78,"78% to 81.9%"],[74,"74% to 77.9%"],[-Infinity,"Under 74%"]]), lea: pct("Irish citizenship %", "residents with Irish citizenship", "Irish citizenship", "orange", [[94,"94%+"],[88,"88% to 93.9%"],[82,"82% to 87.9%"],[76,"76% to 81.9%"],[70,"70% to 75.9%"],[-Infinity,"Under 70%"]]) },
  non_irish_citizenship_pct: { county: pct("Non-Irish citizenship %", "residents with non-Irish citizenship", "Non-Irish citizenship", "orange", [[22,"22%+"],[18,"18% to 21.9%"],[14,"14% to 17.9%"],[10,"10% to 13.9%"],[6,"6% to 9.9%"],[-Infinity,"Under 6%"]]), lea: pct("Non-Irish citizenship %", "residents with non-Irish citizenship", "Non-Irish citizenship", "orange", [[28,"28%+"],[22,"22% to 27.9%"],[16,"16% to 21.9%"],[10,"10% to 15.9%"],[4,"4% to 9.9%"],[-Infinity,"Under 4%"]]) },
  born_uk_pct: { county: pct("Born in UK %", "residents born in the United Kingdom", "Born in UK", "orange", [[10,"10%+"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[-Infinity,"Under 2%"]]), lea: pct("Born in UK %", "residents born in the United Kingdom", "Born in UK", "orange", [[12,"12%+"],[9,"9% to 11.9%"],[6,"6% to 8.9%"],[3,"3% to 5.9%"],[1,"1% to 2.9%"],[-Infinity,"Under 1%"]]) },
  born_poland_pct: { county: pct("Born in Poland %", "residents born in Poland", "Born in Poland", "orange", [[5,"5%+"],[4,"4% to 4.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]), lea: pct("Born in Poland %", "residents born in Poland", "Born in Poland", "orange", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]) },
  born_india_pct: { county: pct("Born in India %", "residents born in India", "Born in India", "orange", [[4,"4%+"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[-Infinity,"Under 0.5%"]]), lea: pct("Born in India %", "residents born in India", "Born in India", "orange", [[8,"8%+"],[5,"5% to 7.9%"],[3,"3% to 4.9%"],[1,"1% to 2.9%"],[0.5,"0.5% to 0.9%"],[-Infinity,"Under 0.5%"]]) },
  born_other_eu_pct: { county: pct("Born in Other EU %", "residents born in EU countries other than Ireland and Poland", "Born in Other EU", "orange", [[10,"10%+"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[-Infinity,"Under 2%"]]), lea: pct("Born in Other EU %", "residents born in EU countries other than Ireland and Poland", "Born in Other EU", "orange", [[14,"14%+"],[11,"11% to 13.9%"],[8,"8% to 10.9%"],[5,"5% to 7.9%"],[2,"2% to 4.9%"],[-Infinity,"Under 2%"]]) },
  born_rest_world_pct: { county: pct("Born in Rest of World %", "residents born outside Ireland, UK, Poland, India and Other EU", "Born in Rest of World", "orange", [[12,"12%+"],[10,"10% to 11.9%"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[-Infinity,"Under 4%"]]), lea: pct("Born in Rest of World %", "residents born outside Ireland, UK, Poland, India and Other EU", "Born in Rest of World", "orange", [[18,"18%+"],[14,"14% to 17.9%"],[10,"10% to 13.9%"],[6,"6% to 9.9%"],[3,"3% to 5.9%"],[-Infinity,"Under 3%"]]) },

  ethnicity_white_irish_pct: { county: pct("White Irish %", "residents recorded as White Irish", "White Irish", "green", [[85,"85%+"],[80,"80% to 84.9%"],[75,"75% to 79.9%"],[70,"70% to 74.9%"],[65,"65% to 69.9%"],[-Infinity,"Under 65%"]]), lea: pct("White Irish %", "residents recorded as White Irish", "White Irish", "green", [[90,"90%+"],[82,"82% to 89.9%"],[74,"74% to 81.9%"],[66,"66% to 73.9%"],[58,"58% to 65.9%"],[-Infinity,"Under 58%"]]) },
  ethnicity_white_irish_traveller_pct: { county: pct("White Irish Traveller %", "residents recorded as White Irish Traveller", "White Irish Traveller", "green", [[2,"2%+"],[1.5,"1.5% to 1.9%"],[1,"1% to 1.4%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]), lea: pct("White Irish Traveller %", "residents recorded as White Irish Traveller", "White Irish Traveller", "green", [[3,"3%+"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]) },
  ethnicity_other_white_pct: { county: pct("Other White %", "residents recorded as Other White", "Other White", "green", [[20,"20%+"],[16,"16% to 19.9%"],[12,"12% to 15.9%"],[8,"8% to 11.9%"],[4,"4% to 7.9%"],[-Infinity,"Under 4%"]]), lea: pct("Other White %", "residents recorded as Other White", "Other White", "green", [[25,"25%+"],[20,"20% to 24.9%"],[15,"15% to 19.9%"],[10,"10% to 14.9%"],[5,"5% to 9.9%"],[-Infinity,"Under 5%"]]) },
  ethnicity_black_or_black_irish_pct: { county: pct("Black or Black Irish %", "residents recorded as Black or Black Irish", "Black or Black Irish", "green", [[6,"6%+"],[4,"4% to 5.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]), lea: pct("Black or Black Irish %", "residents recorded as Black or Black Irish", "Black or Black Irish", "green", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]) },
  ethnicity_asian_or_asian_irish_pct: { county: pct("Asian or Asian Irish %", "residents recorded as Asian or Asian Irish", "Asian or Asian Irish", "green", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[-Infinity,"Under 2%"]]), lea: pct("Asian or Asian Irish %", "residents recorded as Asian or Asian Irish", "Asian or Asian Irish", "green", [[12,"12%+"],[9,"9% to 11.9%"],[6,"6% to 8.9%"],[3,"3% to 5.9%"],[1,"1% to 2.9%"],[-Infinity,"Under 1%"]]) },
  ethnicity_other_pct: { county: pct("Other ethnic background %", "residents recorded as Other ethnic background", "Other ethnic background", "green", [[4,"4%+"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[-Infinity,"Under 0.5%"]]), lea: pct("Other ethnic background %", "residents recorded as Other ethnic background", "Other ethnic background", "green", [[5,"5%+"],[4,"4% to 4.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]) },
  ethnicity_not_stated_pct: { county: pct("Ethnicity not stated %", "residents whose ethnicity was not stated", "Ethnicity not stated", "green", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]), lea: pct("Ethnicity not stated %", "residents whose ethnicity was not stated", "Ethnicity not stated", "green", [[10,"10%+"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[-Infinity,"Under 2%"]]) },

  foreign_language_speakers_pct: { county: pct("Foreign-language speakers %", "residents who speak a foreign language", "Foreign-language speakers", "red", [[18,"18%+"],[15,"15% to 17.9%"],[12,"12% to 14.9%"],[9,"9% to 11.9%"],[6,"6% to 8.9%"],[-Infinity,"Under 6%"]]), lea: pct("Foreign-language speakers %", "residents who speak a foreign language", "Foreign-language speakers", "red", [[25,"25%+"],[20,"20% to 24.9%"],[15,"15% to 19.9%"],[10,"10% to 14.9%"],[5,"5% to 9.9%"],[-Infinity,"Under 5%"]]) },
  language_spanish_pct: { county: pct("Spanish speakers %", "residents recorded as Spanish speakers", "Spanish speakers", "red", [[2,"2%+"],[1.5,"1.5% to 1.9%"],[1,"1% to 1.4%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]), lea: pct("Spanish speakers %", "residents recorded as Spanish speakers", "Spanish speakers", "red", [[3,"3%+"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]) },
  language_french_pct: { county: pct("French speakers %", "residents recorded as French speakers", "French speakers", "red", [[2,"2%+"],[1.5,"1.5% to 1.9%"],[1,"1% to 1.4%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]), lea: pct("French speakers %", "residents recorded as French speakers", "French speakers", "red", [[3,"3%+"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[0.25,"0.25% to 0.49%"],[-Infinity,"Under 0.25%"]]) },
  language_polish_pct: { county: pct("Polish speakers %", "residents recorded as Polish speakers", "Polish speakers", "red", [[5,"5%+"],[4,"4% to 4.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]), lea: pct("Polish speakers %", "residents recorded as Polish speakers", "Polish speakers", "red", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]) },
  language_other_incl_not_stated_pct: { county: pct("Other / not stated language %", "residents recorded as speaking other foreign languages, including not stated", "Other / not stated language", "red", [[12,"12%+"],[10,"10% to 11.9%"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[-Infinity,"Under 4%"]]), lea: pct("Other / not stated language %", "residents recorded as speaking other foreign languages, including not stated", "Other / not stated language", "red", [[18,"18%+"],[14,"14% to 17.9%"],[10,"10% to 13.9%"],[6,"6% to 9.9%"],[3,"3% to 5.9%"],[-Infinity,"Under 3%"]]) },

  families_with_children_pct: { county: pct("Families with children %", "family units with children", "Families with children", "cyan", [[75,"75%+"],[70,"70% to 74.9%"],[65,"65% to 69.9%"],[60,"60% to 64.9%"],[55,"55% to 59.9%"],[-Infinity,"Under 55%"]]) },
  families_without_children_pct: { county: pct("Families without children %", "family units without children", "Families without children", "cyan", [[45,"45%+"],[40,"40% to 44.9%"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[-Infinity,"Under 25%"]]) },
  families_all_children_under15_pct: { county: pct("Families: all children under 15 %", "families where all children are under 15", "All children under 15", "cyan", [[45,"45%+"],[40,"40% to 44.9%"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[-Infinity,"Under 25%"]]) },
  families_all_children_15_plus_pct: { county: pct("Families: all children 15+ %", "families where all children are 15 or over", "All children 15+", "cyan", [[35,"35%+"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[20,"20% to 24.9%"],[15,"15% to 19.9%"],[-Infinity,"Under 15%"]]) },
  families_children_under_and_over15_pct: { county: pct("Families: children under and over 15 %", "families with children both under and over 15", "Children under and over 15", "cyan", [[20,"20%+"],[16,"16% to 19.9%"],[12,"12% to 15.9%"],[8,"8% to 11.9%"],[4,"4% to 7.9%"],[-Infinity,"Under 4%"]]) },
  families_1_child_pct: { county: pct("Families with 1 child %", "families with 1 child", "Families with 1 child", "cyan", [[40,"40%+"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[20,"20% to 24.9%"],[-Infinity,"Under 20%"]]) },
  families_2_children_pct: { county: pct("Families with 2 children %", "families with 2 children", "Families with 2 children", "cyan", [[40,"40%+"],[35,"35% to 39.9%"],[30,"30% to 34.9%"],[25,"25% to 29.9%"],[20,"20% to 24.9%"],[-Infinity,"Under 20%"]]) },
  families_3_children_pct: { county: pct("Families with 3 children %", "families with 3 children", "Families with 3 children", "cyan", [[20,"20%+"],[16,"16% to 19.9%"],[12,"12% to 15.9%"],[8,"8% to 11.9%"],[4,"4% to 7.9%"],[-Infinity,"Under 4%"]]) },
  families_4_children_pct: { county: pct("Families with 4 children %", "families with 4 children", "Families with 4 children", "cyan", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]) },
  families_5_plus_children_pct: { county: pct("Families with 5+ children %", "families with 5 or more children", "Families with 5+ children", "cyan", [[4,"4%+"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[0.5,"0.5% to 0.9%"],[-Infinity,"Under 0.5%"]]) },

  families_household_size_2_persons_pct: { lea: pct("2-person households %", "households / family units with 2 persons", "2-person households", "cyan", [[45,"45%+"],[38,"38% to 44.9%"],[31,"31% to 37.9%"],[24,"24% to 30.9%"],[17,"17% to 23.9%"],[-Infinity,"Under 17%"]]) },
  families_household_size_3_persons_pct: { lea: pct("3-person households %", "households / family units with 3 persons", "3-person households", "cyan", [[25,"25%+"],[21,"21% to 24.9%"],[17,"17% to 20.9%"],[13,"13% to 16.9%"],[9,"9% to 12.9%"],[-Infinity,"Under 9%"]]) },
  families_household_size_4_persons_pct: { lea: pct("4-person households %", "households / family units with 4 persons", "4-person households", "cyan", [[25,"25%+"],[21,"21% to 24.9%"],[17,"17% to 20.9%"],[13,"13% to 16.9%"],[9,"9% to 12.9%"],[-Infinity,"Under 9%"]]) },
  families_household_size_5_persons_pct: { lea: pct("5-person households %", "households / family units with 5 persons", "5-person households", "cyan", [[12,"12%+"],[10,"10% to 11.9%"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[-Infinity,"Under 4%"]]) },
  families_household_size_6_plus_persons_pct: { lea: pct("6+ person households %", "households / family units with 6 or more persons", "6+ person households", "cyan", [[8,"8%+"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]) },

  status_at_work_pct: { county: pct("At work %", "people aged 15+ who are at work", "At work", "rose", [[62,"62%+"],[58,"58% to 61.9%"],[54,"54% to 57.9%"],[50,"50% to 53.9%"],[46,"46% to 49.9%"],[-Infinity,"Under 46%"]]), lea: pct("At work %", "people aged 15+ who are at work", "At work", "rose", [[70,"70%+"],[62,"62% to 69.9%"],[54,"54% to 61.9%"],[46,"46% to 53.9%"],[38,"38% to 45.9%"],[-Infinity,"Under 38%"]]) },
  status_student_pct: { county: pct("Student %", "people aged 15+ who are students", "Student", "rose", [[18,"18%+"],[16,"16% to 17.9%"],[14,"14% to 15.9%"],[12,"12% to 13.9%"],[10,"10% to 11.9%"],[-Infinity,"Under 10%"]]), lea: pct("Student %", "people aged 15+ who are students", "Student", "rose", [[25,"25%+"],[20,"20% to 24.9%"],[15,"15% to 19.9%"],[10,"10% to 14.9%"],[5,"5% to 9.9%"],[-Infinity,"Under 5%"]]) },
  status_retired_pct: { county: pct("Retired %", "people aged 15+ who are retired", "Retired", "rose", [[25,"25%+"],[22,"22% to 24.9%"],[19,"19% to 21.9%"],[16,"16% to 18.9%"],[13,"13% to 15.9%"],[-Infinity,"Under 13%"]]), lea: pct("Retired %", "people aged 15+ who are retired", "Retired", "rose", [[32,"32%+"],[26,"26% to 31.9%"],[20,"20% to 25.9%"],[14,"14% to 19.9%"],[8,"8% to 13.9%"],[-Infinity,"Under 8%"]]) },
  status_home_family_pct: { county: pct("Looking after home/family %", "people aged 15+ looking after home or family", "Looking after home/family", "rose", [[8,"8%+"],[7,"7% to 7.9%"],[6,"6% to 6.9%"],[5,"5% to 5.9%"],[4,"4% to 4.9%"],[-Infinity,"Under 4%"]]), lea: pct("Looking after home/family %", "people aged 15+ looking after home or family", "Looking after home/family", "rose", [[10,"10%+"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[-Infinity,"Under 2%"]]) },
  status_unable_to_work_pct: { county: pct("Unable to work due to sickness/disability %", "people aged 15+ unable to work due to permanent sickness or disability", "Unable to work", "rose", [[8,"8%+"],[7,"7% to 7.9%"],[6,"6% to 6.9%"],[5,"5% to 5.9%"],[4,"4% to 4.9%"],[-Infinity,"Under 4%"]]), lea: pct("Unable to work due to sickness/disability %", "people aged 15+ unable to work due to permanent sickness or disability", "Unable to work", "rose", [[10,"10%+"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[-Infinity,"Under 2%"]]) },
  status_unemployed_pct: { county: pct("Unemployed %", "people aged 15+ who are unemployed", "Unemployed", "rose", [[8,"8%+"],[7,"7% to 7.9%"],[6,"6% to 6.9%"],[5,"5% to 5.9%"],[4,"4% to 4.9%"],[-Infinity,"Under 4%"]]), lea: pct("Unemployed %", "people aged 15+ who are unemployed", "Unemployed", "rose", [[10,"10%+"],[8,"8% to 9.9%"],[6,"6% to 7.9%"],[4,"4% to 5.9%"],[2,"2% to 3.9%"],[-Infinity,"Under 2%"]]) },
  status_other_pct: { county: pct("Other status %", "people aged 15+ in other principal economic status categories", "Other status", "rose", [[4,"4%+"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1.5,"1.5% to 1.9%"],[1,"1% to 1.4%"],[-Infinity,"Under 1%"]]), lea: pct("Other status %", "people aged 15+ in other principal economic status categories", "Other status", "rose", [[5,"5%+"],[4,"4% to 4.9%"],[3,"3% to 3.9%"],[2,"2% to 2.9%"],[1,"1% to 1.9%"],[-Infinity,"Under 1%"]]) }
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

map.createPane("churchPane");
map.getPane("churchPane").style.zIndex = 720;

L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
}).addTo(map);

L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  pane: "labelsPane",
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
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
const searchLabelEl = document.getElementById("searchLabel");
const areaSearchEl = document.getElementById("areaSearch");
const searchButtonEl = document.getElementById("searchButton");
const resetButtonEl = document.getElementById("resetButton");
const searchResultsEl = document.getElementById("searchResults");
const churchOverlayToggleEl = document.getElementById("churchOverlayToggle");

const selectedAreaEyebrowEl = document.getElementById("selectedAreaEyebrow");
const areaNameEl = document.getElementById("areaName");
const areaIntroEl = document.getElementById("areaIntro");
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

let churchLayer = L.layerGroup();
let churchesLoaded = false;

function getIndicatorConfig(indicatorKey) {
  const entry = indicatorConfigs[indicatorKey];
  if (!entry) return indicatorConfigs.population_2022[currentGeography];
  return entry[currentGeography] || entry.county || entry.lea || indicatorConfigs.population_2022[currentGeography];
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
  return props.area_name || props.lea_name || props.CSO_LEA || props.LEA_OFFICIAL || props.ENGLISH || props.name || "Unknown area";
}

function getCountyName(props) {
  return props.county || props.COUNTY || "";
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

function populateIndicatorSelect() {
  indicatorSelectEl.innerHTML = "";

  GROUPS.forEach(group => {
    const availableOptions = group.options.filter(option => {
      if (option.geographies && !option.geographies.includes(currentGeography)) {
        return false;
      }

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
}

function resetSidebar() {
  const geography = GEOGRAPHIES[currentGeography];

  selectedAreaEyebrowEl.textContent = geography.selectedEyebrow;
  areaNameEl.textContent = geography.emptyName;
  areaIntroEl.textContent = geography.emptyIntro;
  selectedIndicatorNameEl.textContent = "—";
  selectedIndicatorValueEl.textContent = "—";
  populationValueEl.textContent = "—";
  contextValueEl.textContent = "";
  sourceNoteEl.textContent = geography.sourceNote;

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

function updateSidebar(props) {
  const geography = GEOGRAPHIES[currentGeography];
  const indicatorConfig = getIndicatorConfig(currentIndicator);

  selectedAreaEyebrowEl.textContent = geography.selectedEyebrow;
  areaNameEl.textContent = getAreaName(props);
  areaIntroEl.textContent = geography.selectedIntro;

  selectedIndicatorNameEl.textContent = indicatorConfig.label;
  selectedIndicatorValueEl.textContent = formatIndicatorValue(props[currentIndicator], currentIndicator);

  populationValueEl.textContent = formatNumber(props.population_2022);

  const countyName = getCountyName(props);
  contextValueEl.textContent = geography.contextLabel && countyName
    ? `${geography.contextLabel}: ${countyName}`
    : "";

  sourceNoteEl.textContent = geography.sourceNote;

  sectionRowEls.forEach(row => {
    setDataRow(row.valueEl, row.barEl, props[row.countKey], props[row.pctKey]);
  });
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

  return {
    fillColor: getColorForValue(feature.properties[currentIndicator], currentIndicator),
    weight: geography.weight,
    opacity: 1,
    color: "#333",
    fillOpacity: DEFAULT_FILL_OPACITY
  };
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

  if (layer !== selectedLayer && activeLayer) {
    activeLayer.resetStyle(layer);
  }
}

function selectLayer(layer) {
  const props = layer.feature.properties;

  if (selectedLayer && activeLayer) {
    activeLayer.resetStyle(selectedLayer);
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

  const indicatorConfig = getIndicatorConfig(currentIndicator);
  const currentValue = formatIndicatorValue(props[currentIndicator], currentIndicator);
  const countyName = getCountyName(props);

  const countyLine = currentGeography === "lea" && countyName
    ? `<p><strong>County:</strong> ${escapeHtml(countyName)}</p>`
    : "";

  layer.bindPopup(`
    <div class="area-popup">
      <h2>${escapeHtml(getAreaName(props))}</h2>
      ${countyLine}
      <p><strong>Population, 2022:</strong> ${formatNumber(props.population_2022)}</p>
      <p><strong>${escapeHtml(indicatorConfig.label)}:</strong> ${escapeHtml(currentValue)}</p>
    </div>
  `).openPopup();
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
  }

  legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    const config = getIndicatorConfig(currentIndicator);
    const colors = colorSets[config.colorSet] || colorSets.blue;

    div.innerHTML = `<div class="legend-title">${escapeHtml(config.legendTitle)}</div>`;

    config.grades.forEach((item, index) => {
      div.innerHTML += `
        <div class="legend-row">
          <span class="legend-color" style="background:${colors[index]}; opacity:${DEFAULT_FILL_OPACITY};"></span>
          <span>${escapeHtml(item.label)}</span>
        </div>
      `;
    });

    return div;
  };

  legend.addTo(map);
}

function updateMapIndicator(indicatorKey) {
  currentIndicator = indicatorKey;
  const config = getIndicatorConfig(currentIndicator);

  indicatorNoteEl.textContent = config.note;

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

function normaliseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace("county council", "")
    .replace("city council", "")
    .replace("city and county council", "")
    .replace("local electoral area", "")
    .replace("lea", "")
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
      name: getAreaName(layer.feature.properties),
      county: getCountyName(layer.feature.properties)
    }))
    .filter(item => {
      const combined = normaliseText(`${item.name} ${item.county}`);
      return combined.includes(query);
    })
    .slice(0, 10);

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "source-note";
    empty.textContent = currentGeography === "lea"
      ? "No matching LEA found."
      : "No matching area found.";
    searchResultsEl.appendChild(empty);
    return;
  }

  matches.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.textContent = item.county && currentGeography === "lea"
      ? `${item.name} (${item.county})`
      : item.name;

    button.addEventListener("click", () => {
      selectLayer(item.layer);
      searchResultsEl.innerHTML = "";
      areaSearchEl.value = item.name;
    });

    searchResultsEl.appendChild(button);
  });
}

function resetMap() {
  if (selectedLayer && activeLayer) {
    activeLayer.resetStyle(selectedLayer);
  }

  selectedLayer = null;
  map.closePopup();

  const bounds = fullMapBoundsByGeography[currentGeography];

  if (bounds) {
    map.fitBounds(bounds, {
      padding: [20, 20]
    });
  }

  areaSearchEl.value = "";
  searchResultsEl.innerHTML = "";
  resetSidebar();
}

function setActiveNavButton() {
  countyViewButtonEl.classList.toggle("is-active", currentGeography === "county");
  leaViewButtonEl.classList.toggle("is-active", currentGeography === "lea");
}

function configureViewText() {
  const geography = GEOGRAPHIES[currentGeography];

  mapSubtitleEl.textContent = geography.subtitle;
  searchLabelEl.textContent = geography.searchLabel;
  areaSearchEl.placeholder = geography.searchPlaceholder;
}

function switchGeography(geographyKey) {
  if (!GEOGRAPHIES[geographyKey]) return;

  if (selectedLayer && activeLayer) {
    activeLayer.resetStyle(selectedLayer);
  }

  selectedLayer = null;
  map.closePopup();

  if (activeLayer) {
    map.removeLayer(activeLayer);
  }

  currentGeography = geographyKey;
  allAreaLayers = [];
  searchResultsEl.innerHTML = "";
  areaSearchEl.value = "";

  setActiveNavButton();
  configureViewText();
  populateIndicatorSelect();
  buildSidebarSections();
  resetSidebar();

  const existingLayer = loadedLayers[currentGeography];

  if (existingLayer) {
    activeLayer = existingLayer;
    activeLayer.addTo(map);
    activeLayer.setStyle(styleArea);
    updateLegend();

    const bounds = fullMapBoundsByGeography[currentGeography];
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    return;
  }

  loadGeographyLayer(currentGeography);
}

function loadGeographyLayer(geographyKey) {
  const geography = GEOGRAPHIES[geographyKey];

  fetch(geography.dataUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Could not load ${geography.dataUrl}. HTTP status: ${response.status}`);
      }

      return response.json();
    })
    .then(data => {
      const layer = L.geoJSON(data, {
        style: styleArea,
        onEachFeature: bindAreaInteractions
      });

      loadedLayers[geographyKey] = layer;
      activeLayer = layer;
      activeLayer.addTo(map);

      fullMapBoundsByGeography[geographyKey] = activeLayer.getBounds();

      map.fitBounds(fullMapBoundsByGeography[geographyKey], {
        padding: [20, 20]
      });

      updateLegend();

      console.log(`Loaded ${data.features.length} ${geographyKey} areas.`);
    })
    .catch(error => {
      console.error(error);
      alert(`The ${geography.label} GeoJSON file could not be loaded. Check that ${geography.dataUrl} is in the root of this GitHub Pages site.`);
    });
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
  const placeLine = placeParts.length > 0
    ? `<p>${placeParts.join(" · ")}</p>`
    : "";

  const websiteLine = website
    ? `<p><a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">View website</a></p>`
    : "";

  return `
    <div class="church-popup">
      <h2>${name}</h2>
      ${placeLine}
      ${websiteLine}
    </div>
  `;
}

function loadChurchOverlay() {
  if (churchesLoaded) {
    churchLayer.addTo(map);
    return;
  }

  fetch("churches-points.csv")
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not load churches-points.csv. HTTP status: " + response.status);
      }

      return response.text();
    })
    .then(csvText => {
      const rows = parseCsv(csvText);
      let addedCount = 0;

      rows.forEach(row => {
        const lat = Number(row.latitude);
        const lng = Number(row.longitude);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          return;
        }

        const marker = L.circleMarker([lat, lng], {
          pane: "churchPane",
          radius: 4.4,
          color: "#111827",
          weight: 1.3,
          fillColor: "#ffffff",
          fillOpacity: 0.95
        });

        marker.bindPopup(buildChurchPopup(row));
        marker.addTo(churchLayer);
        addedCount++;
      });

      churchesLoaded = true;
      churchLayer.addTo(map);

      console.log("Loaded " + addedCount + " church overlay points.");
    })
    .catch(error => {
      console.error(error);
      alert("The church overlay file could not be loaded. Check that churches-points.csv is in the root of this GitHub Pages site and has columns: name,county,website,latitude,longitude,lea.");

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
  }
});

configureViewText();
populateIndicatorSelect();
buildSidebarSections();
resetSidebar();
loadGeographyLayer("county");
