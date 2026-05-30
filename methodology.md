Methodology

Overview

The Glúnta Demographic Map uses Census 2022 data to visualise demographic patterns across Ireland.

The purpose of the map is to provide demographic context for churches, church leaders, mission agencies, researchers, and members of the public who are trying to better understand communities across Ireland.

The map does not measure spiritual need, gospel openness, church health, ministry effectiveness, church attendance, or planting priority by itself. It provides contextual demographic information that should be interpreted alongside local knowledge, church-presence data, community relationships, history, and pastoral judgement.

Current map views

The project currently includes two public map views.

1. County / Local Authority demographic map

This view uses administrative counties and local authority areas.

2. Local Electoral Area demographic map

This view uses Local Electoral Areas.

The two views are kept separate so that each geography remains clear and usable. County and local authority areas are useful for broad comparison. Local Electoral Areas provide a more detailed view inside counties and cities.

Geography

County / Local Authority geography

The county map uses administrative county and local authority areas.

This means the map does not always follow traditional county boundaries. For example:

* Dublin is divided into Dublin City, Fingal, South Dublin, and Dún Laoghaire-Rathdown.
* Cork is divided into Cork City and Cork County.
* Galway is divided into Galway City and Galway County.

This geography was chosen because it aligns with the Census 2022 administrative county / local authority tables used in the first prototype.

Local Electoral Area geography

The LEA map uses Census 2022 Local Electoral Area geography.

Local Electoral Areas are useful because they show variation within counties and cities. A county-level map can hide major internal differences, especially in places like Dublin, Cork, Galway, Donegal, Mayo, Kerry, and other geographically or demographically diverse counties.

The LEA layer currently contains 166 Local Electoral Areas.

Boundary data

Boundary data comes from publicly available administrative and statistical boundary datasets for Ireland, made available through Tailte Éireann / data.gov.ie sources.

The county map uses a county / local authority boundary file joined to cleaned Census 2022 data.

The LEA map uses a Local Electoral Area boundary file joined to cleaned Census 2022 LEA-level data.

The live map files are:

county-demographics-map.geojson

lea-demographics-map.geojson

Census data source

Demographic data comes from the Central Statistics Office Census 2022 Small Area Population Statistics.

The county map uses county / local authority-level Census 2022 SAPS tables.

The LEA map uses Local Electoral Area-level Census 2022 SAPS tables.

County tables used

The county / local authority prototype uses the following Census 2022 tables.

County population

SAP2022T1T1ACTY

Used for total population and age structure by administrative county / local authority.

Main fields include:

population_2022
age_0_14
age_15_34
age_35_64
age_65_plus
age_0_14_pct
age_15_34_pct
age_35_64_pct
age_65_plus_pct

County migration, birthplace, and citizenship

SAP2022T2T1ACTY

Used for birthplace and citizenship indicators.

Main fields include:

born_ireland
born_ireland_pct
born_outside_ireland
born_outside_ireland_pct
citizen_ireland
citizen_ireland_pct
non_irish_citizenship
non_irish_citizenship_pct
born_uk
born_uk_pct
born_poland
born_poland_pct
born_india
born_india_pct
born_other_eu
born_other_eu_pct
born_rest_world
born_rest_world_pct

Notes:

* Birthplace and citizenship are related but different measures.
* “Born outside Ireland” is not the same as “non-Irish citizen.”
* These fields should not be used as a proxy for ethnicity, religious identity, language ability, or integration.

County ethnicity and cultural background

SAP2022T2T2ACTY

Used for ethnicity and cultural background indicators.

Main fields include:

ethnicity_white_irish
ethnicity_white_irish_pct
ethnicity_white_irish_traveller
ethnicity_white_irish_traveller_pct
ethnicity_other_white
ethnicity_other_white_pct
ethnicity_black_or_black_irish
ethnicity_black_or_black_irish_pct
ethnicity_asian_or_asian_irish
ethnicity_asian_or_asian_irish_pct
ethnicity_other
ethnicity_other_pct
ethnicity_not_stated
ethnicity_not_stated_pct

Notes:

* Census categories are broad.
* These categories should not be overinterpreted.
* Ethnic and cultural identity is more complex than a map can represent.

County religion

SAP2022T2T4ACTY

Used for religious identity indicators.

Main fields include:

religion_catholic
religion_catholic_pct
religion_other
religion_other_pct
religion_none
religion_none_pct
religion_not_stated
religion_not_stated_pct

Notes:

* Census religious identity does not measure church attendance, Christian belief, discipleship, or gospel understanding.
* “Catholic,” “Other religion,” “No religion,” and “Not stated” are Census categories.
* These figures should be interpreted carefully and locally.

County language

SAP2022T2T5CTY

Used for foreign-language speaker indicators.

Main fields include:

foreign_language_speakers
foreign_language_speakers_pct
language_spanish
language_spanish_pct
language_french
language_french_pct
language_polish
language_polish_pct
language_other_incl_not_stated
language_other_incl_not_stated_pct

Notes:

* Language percentages are calculated using total population as the denominator.
* This makes the language figures easier to compare with other whole-population indicators.
* “Other / not stated language” is a broad category and should not be read as a single language community.

County families and children

SAP2022T4T2CTY

Used for family units by number and age of children.

Main fields include:

families_total
families_with_children
families_with_children_pct
families_without_children
families_without_children_pct
families_all_children_under15
families_all_children_under15_pct
families_all_children_15_plus
families_all_children_15_plus_pct
families_children_under_and_over15
families_children_under_and_over15_pct
families_1_child
families_1_child_pct
families_2_children
families_2_children_pct
families_3_children
families_3_children_pct
families_4_children
families_4_children_pct
families_5_plus_children
families_5_plus_children_pct

Notes:

* This table describes family units by number and age of children.
* Family structure is complex and should not be reduced to one indicator.

County principal economic status

SAP2022T8T1CTY

Used for principal economic status indicators for people aged 15 years and over.

Main fields include:

status_total_15_plus
status_at_work
status_at_work_pct
status_student
status_student_pct
status_retired
status_retired_pct
status_home_family
status_home_family_pct
status_unable_to_work
status_unable_to_work_pct
status_unemployed
status_unemployed_pct
status_looking_first_job
status_looking_first_job_pct
status_short_term_unemployed
status_short_term_unemployed_pct
status_long_term_unemployed
status_long_term_unemployed_pct
status_other
status_other_pct

Notes:

* Percentages in this section use the population aged 15 years and over as the denominator.
* The combined status_unemployed field includes:
    * Looking for first regular job
    * Short-term unemployed
    * Long-term unemployed

LEA tables used

The Local Electoral Area map uses the following Census 2022 tables.

LEA population

SAP2022T1T1ALEA22

Used for total population and age structure by Local Electoral Area.

Main fields include:

population_2022
age_0_14
age_15_34
age_35_64
age_65_plus
age_0_14_pct
age_15_34_pct
age_35_64_pct
age_65_plus_pct

LEA migration, birthplace, and citizenship

SAP2022T2T1LEA22

Used for birthplace and citizenship indicators.

Main fields include:

born_ireland
born_ireland_pct
born_outside_ireland
born_outside_ireland_pct
citizen_ireland
citizen_ireland_pct
non_irish_citizenship
non_irish_citizenship_pct
born_uk
born_uk_pct
born_poland
born_poland_pct
born_india
born_india_pct
born_other_eu
born_other_eu_pct
born_rest_world
born_rest_world_pct

Notes:

* “Born in Ireland” and “Born outside Ireland” are birthplace measures.
* “Irish citizenship” and “Non-Irish citizenship” are citizenship measures.
* These should not be treated as interchangeable.

LEA ethnicity and cultural background

SAP2022T2T2LEA22

Used for ethnicity and cultural background indicators.

Main fields include:

ethnicity_white_irish
ethnicity_white_irish_pct
ethnicity_white_irish_traveller
ethnicity_white_irish_traveller_pct
ethnicity_other_white
ethnicity_other_white_pct
ethnicity_black_or_black_irish
ethnicity_black_or_black_irish_pct
ethnicity_asian_or_asian_irish
ethnicity_asian_or_asian_irish_pct
ethnicity_other
ethnicity_other_pct
ethnicity_not_stated
ethnicity_not_stated_pct

LEA religion

SAP2022T2T4LEA22

Used for religious identity indicators.

Main fields include:

religion_catholic
religion_catholic_pct
religion_other
religion_other_pct
religion_none
religion_none_pct
religion_not_stated
religion_not_stated_pct

LEA language

SAP2022T2T5LEA22

Used for foreign-language speaker indicators.

Main fields include:

foreign_language_speakers
foreign_language_speakers_pct
language_spanish
language_spanish_pct
language_french
language_french_pct
language_polish
language_polish_pct
language_other_incl_not_stated
language_other_incl_not_stated_pct

Notes:

* Language percentages are calculated using total population as the denominator.
* “Foreign-language speakers” is a combined field based on the language categories used in the cleaned dataset.

LEA household / family size

SAP2022T4T1LEA22

Used for household / family-size indicators.

Main fields include:

families_household_size_total
families_household_size_2_persons
families_household_size_2_persons_pct
families_household_size_3_persons
families_household_size_3_persons_pct
families_household_size_4_persons
families_household_size_4_persons_pct
families_household_size_5_persons
families_household_size_5_persons_pct
families_household_size_6_plus_persons
families_household_size_6_plus_persons_pct

Important note:

The LEA household / family-size table is not the same as the county family-with-children table used in the county map.

The county map currently shows indicators such as:

* Families with children
* Families without children
* Families with children under 15
* Families with 1, 2, 3, 4, or 5+ children

The LEA map currently shows indicators such as:

* 2-person households / family units
* 3-person households / family units
* 4-person households / family units
* 5-person households / family units
* 6+ person households / family units

These two sections are related to family and household structure, but they should not be compared as if they are identical measures.

LEA principal economic status

SAP2022T8T1LEA22

Used for principal economic status indicators for people aged 15 years and over.

Main fields include:

status_total_15_plus
status_at_work
status_at_work_pct
status_student
status_student_pct
status_retired
status_retired_pct
status_home_family
status_home_family_pct
status_unable_to_work
status_unable_to_work_pct
status_unemployed
status_unemployed_pct
status_looking_first_job
status_looking_first_job_pct
status_short_term_unemployed
status_short_term_unemployed_pct
status_long_term_unemployed
status_long_term_unemployed_pct
status_other
status_other_pct

Notes:

* Percentages in this section use the population aged 15 years and over as the denominator.
* The combined status_unemployed field includes:
    * Looking for first regular job
    * Short-term unemployed
    * Long-term unemployed

Percentage calculations

Percentages were calculated using the relevant Census table totals wherever possible.

This means denominators differ by topic:

* Population indicators use total population.
* Age indicators use total population.
* Religion indicators use the religion table total.
* Migration and citizenship indicators use the relevant table total.
* Ethnicity indicators use the ethnicity table total.
* Language indicators use total population.
* County family indicators use total family units.
* LEA household / family-size indicators use the relevant household / family-size table total.
* Principal economic status indicators use the population aged 15 years and over.

Because denominators vary, users should avoid comparing percentages across unrelated sections too casually.

For example:

* student_pct is a percentage of people aged 15+.
* families_with_children_pct is a percentage of family units in the county table.
* families_household_size_4_persons_pct is a percentage of the relevant LEA household / family-size table.
* born_outside_ireland_pct is a percentage of population.
* religion_none_pct is a percentage of the religion table total.

Data cleaning

Raw Census CSV files were cleaned into simpler, map-ready files.

The general process was:

1. Download the relevant Census 2022 table.
2. Filter to the relevant geography.
3. Filter to both sexes or total categories where required.
4. Reshape the data into one row per area.
5. Calculate relevant percentages.
6. Standardise field names.
7. Join cleaned data to the relevant boundary file.
8. Export the merged GeoJSON file used by the map.

Join method

County join

The county / local authority data was joined to the county / local authority boundary file using area names.

LEA join

The LEA data was joined to the LEA boundary file using LEA name and county where required.

This matters because some LEA names can repeat across county contexts. Using LEA name plus county provides a safer join than LEA name alone.

The completed LEA join report showed:

166 out of 166 LEAs matched
0 unmatched

Map classification

The map uses hand-defined class breaks for each indicator rather than automatically calculated breaks.

This was chosen because fixed breaks are easier for users to interpret and make the map more stable across indicators.

However, this means that some indicators may show stronger or weaker visual contrast depending on the national distribution of that variable.

Future versions may consider:

* Quantile breaks
* Natural breaks
* State average comparison
* County average comparison
* User-selectable classification methods

Interpretation cautions

This map should be used as a prompt for better questions, not as a final answer.

It should not be used to claim that one area is more spiritually needy than another simply because of one demographic indicator.

It should not be used to stereotype communities.

It should not be used as a substitute for local relationships, pastoral judgement, careful research, or church-presence data.

Examples of better questions the map may prompt:

* Where are younger populations concentrated?
* Where are older populations concentrated?
* Which areas have larger migrant or multilingual communities?
* Which places may need multilingual ministry resources?
* Which areas have a high proportion of families or larger households?
* Which places have high student, retired, or unemployment indicators?
* How does demographic context relate to existing church presence?
* What local knowledge is needed to interpret these figures well?

Relationship to missional analysis

The map is intended to support missional reflection, but it is not itself a missional priority ranking.

Future work may connect this demographic data with the Glúnta Church Map to explore questions such as:

* Population per listed church
* Church density by county, LEA, or town
* Areas with large populations and few publicly listed churches
* Areas with demographic change and limited visible church presence
* Towns or LEAs that may warrant further research, prayer, partnership, or planting discussion

Any such analysis will require additional caution, because church presence, church health, theological identity, accessibility, language, and local mission history cannot be fully captured in one dataset.

Current version

This methodology applies to:

v0.2.0

Current public map views:

* County / Local Authority demographic map
* Local Electoral Area demographic map
