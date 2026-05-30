# Methodology

## Overview

The Glúnta Demographic Map uses Census 2022 data to visualise demographic patterns across Ireland.

The purpose of the map is to provide demographic context for churches, church leaders, mission agencies, researchers, and members of the public who are trying to better understand communities across Ireland.

The map does not measure spiritual need, gospel openness, church health, ministry effectiveness, church attendance, or planting priority by itself. It provides contextual demographic information that should be interpreted alongside local knowledge, church-presence data, community relationships, history, and pastoral judgement.

## Current map views

The project currently includes two public map views.

1. **County / Local Authority demographic map**

   This view uses administrative counties and local authority areas.

2. **Local Electoral Area demographic map**

   This view uses Local Electoral Areas.

The two views are kept separate so that each geography remains clear and usable. County and local authority areas are useful for broad comparison. Local Electoral Areas provide a more detailed view inside counties and cities.

## Geography

### County / Local Authority geography

The county map uses administrative county and local authority areas.

This means the map does not always follow traditional county boundaries. For example:

- Dublin is divided into Dublin City, Fingal, South Dublin, and Dún Laoghaire-Rathdown.
- Cork is divided into Cork City and Cork County.
- Galway is divided into Galway City and Galway County.

This geography was chosen because it aligns with the Census 2022 administrative county / local authority tables used in the first prototype.

### Local Electoral Area geography

The LEA map uses Census 2022 Local Electoral Area geography.

Local Electoral Areas are useful because they show variation within counties and cities. A county-level map can hide major internal differences, especially in places like Dublin, Cork, Galway, Donegal, Mayo, Kerry, and other geographically or demographically diverse counties.

The LEA layer currently contains 166 Local Electoral Areas.

## Boundary data

Boundary data comes from publicly available administrative and statistical boundary datasets for Ireland, made available through Tailte Éireann / data.gov.ie sources.

The county map uses a county / local authority boundary file joined to cleaned Census 2022 data.

The LEA map uses a Local Electoral Area boundary file joined to cleaned Census 2022 LEA-level data.

The live map files are:

```text
county-demographics-map.geojson
lea-demographics-map.geojson
