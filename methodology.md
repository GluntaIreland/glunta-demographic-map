# Methodology

## Overview

The Glúnta Demographic Map uses Census 2022 data to visualise demographic patterns across Ireland’s administrative county and local authority areas.

The purpose of the map is to provide demographic context for churches, church leaders, mission agencies, researchers, and members of the public who are trying to better understand communities across Ireland.

The map does not measure spiritual need, gospel openness, church health, ministry effectiveness, or planting priority by itself. It provides contextual demographic information that should be interpreted alongside local knowledge, church-presence data, community relationships, history, and pastoral judgement.

## Geography

The v0.1 prototype uses administrative county and local authority areas.

This means the map does not always follow traditional county boundaries. For example:

- Dublin is divided into Dublin City, Fingal, South Dublin, and Dún Laoghaire-Rathdown.
- Cork is divided into Cork City and Cork County.
- Galway is divided into Galway City and Galway County.

This geography was chosen because it aligns with the Census 2022 administrative county / local authority tables used in the first prototype.

Future versions may add:

- Local Electoral Areas
- Settlements / towns
- Built-up areas
- Custom missionally useful town groupings

## Boundary data

Boundary data comes from publicly available administrative boundary datasets for Ireland, made available through Tailte Éireann / data.gov.ie sources.

The boundary file was joined to cleaned Census 2022 data using area names.

The live map file is:

```text
county-demographics-map.geojson
