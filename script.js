// Glúnta Demographic Map
// Unified County + LEA + Town boundary view

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
    weight: 0.9
  },
  town: {
    label: "Town",
    subtitle: "Census 2022 Built Up Area / Urban Area boundaries.",
    dataUrl: "urban-areas-boundaries.geojson",
    selectedEyebrow: "Selected town / urban area",
    emptyName: "No town selected",
    emptyIntro: "Click an urban boundary on the map to view its name, county, and urban area code.",
    selectedIntro: "Census 2022 Built Up Area / Urban Area boundary.",
    sourceNote: "Source: Census 2022 Urban Areas / Built Up Areas boundary file.",
    contextLabel: "County",
    hasDemographics: false,
    weight: 1.5
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
  ],

  town: []
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

const percentGrades = [
  [40, "40%+"],
  [30, "30% to 39.9%"],
  [20, "20% to 29.9%"],
  [10, "10% to 19.9%"],
  [5, "5% to 9.9%"],
  [-Infinity, "Under 5%"]
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
    ])
  },

  age_0_14_pct: {
    county: pct("Children, 0 to 14 %", "residents aged 0 to 14", "Children, 0 to 14", "blue", percentGrades),
    lea: pct("Children, 0 to 14 %", "residents aged 0 to 14", "Children, 0 to 14", "blue", percentGrades)
  },
  age_15_34_pct: {
    county: pct("Young adults, 15 to 34 %", "residents aged 15 to 34", "Young adults, 15 to 34", "blue", percentGrades),
    lea: pct("Young adults, 15 to 34 %", "residents aged 15 to 34", "Young adults, 15 to 34", "blue", percentGrades)
  },
  age_35_64_pct: {
    county: pct("Adults, 35 to 64 %", "residents aged 35 to 64", "Adults, 35 to 64", "blue", percentGrades),
    lea: pct("Adults, 35 to 64 %", "residents aged 35 to 64", "Adults, 35 to 64", "blue", percentGrades)
  },
  age_65_plus_pct: {
    county: pct("Older adults, 65+ %", "residents aged 65 and over", "Older adults, 65+", "blue", percentGrades),
    lea: pct("Older adults, 65+ %", "residents aged 65 and over", "Older adults, 65+", "blue", percentGrades)
  },

  religion_catholic_pct: {
    county: pct("Catholic %", "residents recorded as Catholic", "Catholic", "purple", percentGrades),
    lea: pct("Catholic %", "residents recorded as Catholic", "Catholic", "purple", percentGrades)
  },
  religion_other_pct: {
    county: pct("Other religion %", "residents recorded under Other religion", "Other religion", "purple", percentGrades),
    lea: pct("Other religion %", "residents recorded under Other religion", "Other religion", "purple", percentGrades)
  },
  religion_none_pct: {
    county: pct("No religion %", "residents recorded as having No religion", "No religion", "purple", percentGrades),
    lea: pct("No religion %", "residents recorded as having No religion", "No religion", "purple", percentGrades)
  },
  religion_not_stated_pct: {
    county: pct("Religion not stated %", "residents who did not state a religion", "Religion not stated", "purple", percentGrades),
    lea: pct("Religion not stated %", "residents who did not state a religion", "Religion not stated", "purple", percentGrades)
  },

  born_outside_ireland_pct: {
    county: pct("Born outside Ireland %", "residents born outside Ireland", "Born outside Ireland", "orange", percentGrades),
    lea: pct("Born outside Ireland %", "residents born outside Ireland", "Born outside Ireland", "orange", percentGrades)
  },
  born_ireland_pct: {
    county: pct("Born in Ireland %", "residents born in Ireland", "Born in Ireland", "orange", percentGrades),
    lea: pct("Born in Ireland %", "residents born in Ireland", "Born in Ireland", "orange", percentGrades)
  },
  citizen_ireland_pct: {
    county: pct("Irish citizenship %", "residents with Irish citizenship", "Irish citizenship", "orange", percentGrades),
    lea: pct("Irish citizenship %", "residents with Irish citizenship", "Irish citizenship", "orange", percentGrades)
  },
  non_irish_citizenship_pct: {
    county: pct("Non-Irish citizenship %", "residents with non-Irish citizenship", "Non-Irish citizenship", "orange", percentGrades),
    lea: pct("Non-Irish citizenship %", "residents with non-Irish citizenship", "Non-Irish citizenship", "orange", percentGrades)
  },
  born_uk_pct: {
    county: pct("Born in UK %", "residents born in the United Kingdom", "Born in UK", "orange", percentGrades),
    lea: pct("Born in UK %", "residents born in the United Kingdom", "Born in UK", "orange", percentGrades)
  },
  born_poland_pct: {
    county: pct("Born in Poland %", "residents born in Poland", "Born in Poland", "orange", percentGrades),
    lea: pct("Born in Poland %", "residents born in Poland", "Born in Poland", "orange", percentGrades)
  },
  born_india_pct: {
    county: pct("Born in India %", "residents born in India", "Born in India", "orange", percentGrades),
    lea: pct("Born in India %", "residents born in India", "Born in India", "orange", percentGrades)
  },
  born_other_eu_pct: {
    county: pct("Born in Other EU %", "residents born in EU countries other than Ireland and Poland", "Born in Other EU", "orange", percentGrades),
    lea: pct("Born in Other EU %", "residents born in EU countries other than Ireland and Poland", "Born in Other EU", "orange", percentGrades)
  },
  born_rest_world_pct: {
    county: pct("Born in Rest of World %", "residents born outside Ireland, UK, Poland, India and Other EU", "Born in Rest of World", "orange", percentGrades),
    lea: pct("Born in Rest of World %", "residents born outside Ireland, UK, Poland, India and Other EU", "Born in Rest of World", "orange", percentGrades)
  },

  ethnicity_white_irish_pct: {
    county: pct("White Irish %", "residents recorded as White Irish", "White Irish", "green", percentGrades),
    lea: pct("White Irish %", "residents recorded as White Irish", "White Irish", "green", percentGrades)
  },
  ethnicity_white_irish_traveller_pct: {
    county: pct("White Irish Traveller %", "residents recorded as White Irish Traveller", "White Irish Traveller", "green", percentGrades),
    lea: pct("White Irish Traveller %", "residents recorded as White Irish Traveller", "White Irish Traveller", "green", percentGrades)
  },
  ethnicity_other_white_pct: {
    county: pct("Other White %", "residents recorded as Other White", "Other White", "green", percentGrades),
    lea: pct("Other White %", "residents recorded as Other White", "Other White", "green", percentGrades)
  },
  ethnicity_black_or_black_irish_pct: {
    county: pct("Black or Black Irish %", "residents recorded as Black or Black Irish", "Black or Black Irish", "green", percentGrades),
    lea: pct("Black or Black Irish %", "residents recorded as Black or Black Irish", "Black or Black Irish", "green", percentGrades)
  },
  ethnicity_asian_or_asian_irish_pct: {
    county: pct("Asian or Asian Irish %", "residents recorded as Asian or Asian Irish", "Asian or Asian Irish", "green", percentGrades),
    lea: pct("Asian or Asian Irish %", "residents recorded as Asian or Asian Irish", "Asian or Asian Irish", "green", percentGrades)
  },
  ethnicity_other_pct: {
    county: pct("Other ethnic background %", "residents recorded as Other ethnic background", "Other ethnic background", "green", percentGrades),
    lea: pct("Other ethnic background %", "residents recorded as Other ethnic background", "Other ethnic background", "green", percentGrades)
  },
  ethnicity_not_stated_pct: {
    county: pct("Ethnicity not stated %", "residents whose ethnicity was not stated", "Ethnicity not stated", "green", percentGrades),
    lea: pct("Ethnicity not stated %", "residents whose ethnicity was not stated", "Ethnicity not stated", "green", percentGrades)
  },

  foreign_language_speakers_pct: {
    county: pct("Foreign-language speakers %", "residents who speak a foreign language", "Foreign-language speakers", "red", percentGrades),
    lea: pct("Foreign-language speakers %", "residents who speak a foreign language", "Foreign-language speakers", "red", percentGrades)
  },
  language_spanish_pct: {
    county: pct("Spanish speakers %", "residents recorded as Spanish speakers", "Spanish speakers", "red", percentGrades),
    lea: pct("Spanish speakers %", "residents recorded as Spanish speakers", "Spanish speakers", "red", percentGrades)
  },
  language_french_pct: {
    county: pct("French speakers %", "residents recorded as French speakers", "French speakers", "red", percentGrades),
    lea: pct("French speakers %", "residents recorded as French speakers", "French speakers", "red", percentGrades)
  },
  language_polish_pct: {
    county: pct("Polish speakers %", "residents recorded as Polish speakers", "Polish speakers", "red", percentGrades),
    lea: pct("Polish speakers %", "residents recorded as Polish speakers", "Polish speakers", "red", percentGrades)
  },
  language_other_incl_not_stated_pct: {
    county: pct("Other / not stated language %", "residents recorded as speaking other foreign languages, including not stated", "Other / not stated language", "red", percentGrades),
    lea: pct("Other / not stated language %", "residents recorded as speaking other foreign languages, including not stated", "Other / not stated language", "red", percentGrades)
  },

  families_with_children_pct: {
    county: pct("Families with children %", "family units with children", "Families with children", "cyan", percentGrades)
  },
  families_without_children_pct: {
    county: pct("Families without children %", "family units without children", "Families without children", "cyan", percentGrades)
  },
  families_all_children_under15_pct: {
    county: pct("Families: all children under 15 %", "families where all children are under 15", "All children under 15", "cyan", percentGrades)
  },
  families_all_children_15_plus_pct: {
    county: pct("Families: all children 15+ %", "families where all children are 15 or over", "All children 15+", "cyan", percentGrades)
  },
  families_children_under_and_over15_pct: {
    county: pct("Families: children under and over 15 %", "families with children both under and over 15", "Children under and over 15", "cyan", percentGrades)
  },
  families_1_child_pct: {
    county: pct("Families with 1 child %", "families with 1 child", "Families with 1 child", "cyan", percentGrades)
  },
  families_2_children_pct: {
    county: pct("Families with 2 children %", "families with 2 children", "Families with 2 children", "cyan", percentGrades)
  },
  families_3_children_pct: {
    county: pct("Families with 3 children %", "families with 3 children", "Families with 3 children", "cyan", percentGrades)
  },
  families_4_children_pct: {
    county: pct("Families with 4 children %", "families with 4 children", "Families with 4 children", "cyan", percentGrades)
  },
  families_5_plus_children_pct: {
    county: pct("Families with 5+ children %", "families with 5 or more children", "Families with 5+ children", "cyan", percentGrades)
  },

  families_household_size_2_persons_pct: {
    lea: pct("2-person households %", "households / family units with 2 persons", "2-person households", "cyan", percentGrades)
  },
  families_household_size_3_persons_pct: {
    lea: pct("3-person households %", "households / family units with 3 persons", "3-person households", "cyan", percentGrades)
  },
  families_household_size_4_persons_pct: {
    lea: pct("4-person households %", "households / family units with 4 persons", "4-person households", "cyan", percentGrades)
  },
  families_household_size_5_persons_pct: {
    lea: pct("5-person households %", "households / family units with 5 persons", "5-person households", "cyan", percentGrades)
  },
  families_household_size_6_plus_persons_pct: {
    lea: pct("6+ person households %", "households / family units with 6 or more persons", "6+ person households", "cyan", percentGrades)
  },

  status_at_work_pct: {
    county: pct("At work %", "people aged 15+ who are at work", "At work", "rose", percentGrades),
    lea: pct("At work %", "people aged 15+ who are at work", "At work", "rose", percentGrades)
  },
  status_student_pct: {
    county: pct("Student %", "people aged 15+ who are students", "Student", "rose", percentGrades),
    lea: pct("Student %", "people aged 15+ who are students", "Student", "rose", percentGrades)
  },
  status_retired_pct: {
    county: pct("Retired %", "people aged 15+ who are retired", "Retired", "rose", percentGrades),
    lea: pct("Retired %", "people aged 15+ who are retired", "Retired", "rose", percentGrades)
  },
  status_home_family_pct: {
    county: pct("Looking after home/family %", "people aged 15+ looking after home or family", "Looking after home/family", "rose", percentGrades),
    lea: pct("Looking after home/family %", "people aged 15+ looking after home or family", "Looking after home/family", "rose", percentGrades)
  },
  status_unable_to_work_pct: {
    county: pct("Unable to work due to sickness/disability %", "people aged 15+ unable to work due to permanent sickness or disability", "Unable to work", "rose", percentGrades),
    lea: pct("Unable to work due to sickness/disability %", "people aged 15+ unable to work due to permanent sickness or disability", "Unable to work", "rose", percentGrades)
  },
  status_unemployed_pct: {
    county: pct("Unemployed %", "people aged 15+ who are unemployed", "Unemployed", "rose", percentGrades),
    lea: pct("Unemployed %", "people aged 15+ who are unemployed", "Unemployed", "rose", percentGrades)
  },
  status_other_pct: {
    county: pct("Other status %", "people aged 15+ in other principal economic status categories", "Other status", "rose", percentGrades),
    lea: pct("Other status %", "people aged 15+ in other principal economic status categories", "Other status", "rose", percentGrades)
  }
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
const resetButtonEl = document.getElementById("resetButton");
const churchOverlayToggleEl = document.getElementById("churchOverlayToggle");

const selectedAreaEyebrowEl = document.getElementById("selectedAreaEyebrow");
const areaNameEl = document.getElementById("areaName");
const areaIntroEl = document.getElementById("areaIntro");
const selectedIndicatorCardEl = document.getElementById("selectedIndicatorCard");
const selectedIndicatorNameEl = document.getElementById("selectedIndicatorName");
const selectedIndicatorValueEl = document.getElementById("selectedIndicatorValue");
const populationSectionEl = document.getElementById("populationSection");
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
  return (
    props.area_name ||
    props.lea_name ||
    props.CSO_LEA ||
    props.LEA_OFFICIAL ||
    props.URBAN_AREA_NAME ||
    props.ENGLISH ||
    props.name ||
    "Unknown area"
  );
}

function getCountyName(props) {
  return props.county || props.COUNTY || "";
}

function getUrbanAreaCode(props) {
  return props.URBAN_AREA_CODE || props.urban_area_code || "";
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

  if (!GEOGRAPHIES[currentGeography].hasDemographics) {
    indicatorSelectEl.disabled = true;
    const optionEl = document.createElement("option");
    optionEl.value = "boundaries";
    optionEl.textContent = "Boundary view only";
    indicatorSelectEl.appendChild(optionEl);
    indicatorNoteEl.textContent = "Town view currently shows Census 2022 Built Up Area / Urban Area boundaries only.";
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

  if (geography.hasDemographics) {
    selectedIndicatorCardEl.style.display = "";
    populationSectionEl.style.display = "";
  } else {
    selectedIndicatorCardEl.style.display = "none";
    populationSectionEl.style.display = "";
    populationValueEl.textContent = "Boundary only";
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

function updateSidebar(props) {
  const geography = GEOGRAPHIES[currentGeography];

  selectedAreaEyebrowEl.textContent = geography.selectedEyebrow;
  areaNameEl.textContent = getAreaName(props);
  areaIntroEl.textContent = geography.selectedIntro;

  const countyName = getCountyName(props);

  if (geography.hasDemographics) {
    const indicatorConfig = getIndicatorConfig(currentIndicator);

    selectedIndicatorCardEl.style.display = "";
    populationSectionEl.style.display = "";

    selectedIndicatorNameEl.textContent = indicatorConfig.label;
    selectedIndicatorValueEl.textContent = formatIndicatorValue(props[currentIndicator], currentIndicator);

    populationValueEl.textContent = formatNumber(props.population_2022);

    contextValueEl.textContent = geography.contextLabel && countyName
      ? `${geography.contextLabel}: ${countyName}`
      : "";

    sectionRowEls.forEach(row => {
      setDataRow(row.valueEl, row.barEl, props[row.countKey], props[row.pctKey]);
    });
  } else {
    selectedIndicatorCardEl.style.display = "none";
    populationSectionEl.style.display = "";

    populationValueEl.textContent = "Boundary only";

    const code = getUrbanAreaCode(props);
    const parts = [];

    if (countyName) parts.push(`County: ${countyName}`);
    if (code) parts.push(`Urban Area Code: ${code}`);

    contextValueEl.textContent = parts.join(" · ");
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

  if (!geography.hasDemographics) {
    return {
      fillColor: "#ffffff",
      weight: geography.weight,
      opacity: 1,
      color: "#0f4f49",
      dashArray: "3",
      fillOpacity: 0.08
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

function highlightFeature(e) {
  const layer = e.target;

  if (layer !== selectedLayer) {
    layer.setStyle({
      weight: 2.5,
      color: "#111",
      fillOpacity: currentGeography === "town" ? 0.18 : HOVER_FILL_OPACITY
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

  if (currentGeography === "town") {
    layer.setStyle({
      weight: 3,
      color: "#000",
      dashArray: "",
      fillOpacity: 0.2
    });
  } else {
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

  const areaName = getAreaName(props);
  const countyName = getCountyName(props);
  const code = getUrbanAreaCode(props);

  let popupHtml = `
    <div class="area-popup">
      <h2>${escapeHtml(areaName)}</h2>
  `;

  if (countyName) {
    popupHtml += `<p><strong>County:</strong> ${escapeHtml(countyName)}</p>`;
  }

  if (currentGeography === "town") {
    if (code) {
      popupHtml += `<p><strong>Urban Area Code:</strong> ${escapeHtml(code)}</p>`;
    }
    popupHtml += `<p><strong>Current view:</strong> Boundary only</p>`;
  } else {
    const indicatorConfig = getIndicatorConfig(currentIndicator);
    const currentValue = formatIndicatorValue(props[currentIndicator], currentIndicator);
    popupHtml += `<p><strong>Population, 2022:</strong> ${formatNumber(props.population_2022)}</p>`;
    popupHtml += `<p><strong>${escapeHtml(indicatorConfig.label)}:</strong> ${escapeHtml(currentValue)}</p>`;
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

  if (!GEOGRAPHIES[currentGeography].hasDemographics) {
    legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "legend");
      div.innerHTML = `
        <div class="legend-title">Town / Urban Area boundaries</div>
        <div class="legend-row">
          <span class="legend-color" style="background:#ffffff; opacity:0.3; border:2px dashed #0f4f49;"></span>
          <span>Census 2022 Built Up Areas</span>
        </div>
      `;
      return div;
    };

    legend.addTo(map);
    return;
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

townViewButtonEl.addEventListener("click", function () {
  switchGeography("town");
});

indicatorSelectEl.addEventListener("change", function (event) {
  if (!GEOGRAPHIES[currentGeography].hasDemographics) return;
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
  }
});

configureViewText();
populateIndicatorSelect();
buildSidebarSections();
resetSidebar();
loadGeographyLayer("county");
