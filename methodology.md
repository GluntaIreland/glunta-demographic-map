# Glúnta Demographic Map

## Overview

The Glúnta Demographic Map is an interactive visualisation of Census 2022 demographic data for Ireland.

It is part of the wider Glúnta Research mapping work, which seeks to help churches, church leaders, mission agencies, researchers, and interested members of the public better understand the demographic and missional context of communities across Ireland.

This is a demographic-context tool. It does not measure spiritual need, gospel openness, church health, church attendance, or ministry priority by itself. It is intended to prompt better questions, support local interpretation, and provide a clearer picture of the communities in which churches serve.

## Live maps

The project currently includes two public map views.

### County / Local Authority map

This map shows demographic data for Ireland’s administrative counties and local authority areas.

https://gluntaireland.github.io/glunta-demographic-map/

### Local Electoral Area map

This map shows demographic data for Local Electoral Areas.

https://gluntaireland.github.io/glunta-demographic-map/lea.html

## Current version

v0.2.0

Current public map views:

- County / Local Authority demographic map
- Local Electoral Area demographic map

## Relationship to the Glúnta Church Map

This project is related to, but separate from, the Glúnta Church Map.

The Glúnta Church Map asks:

> Where are churches publicly listed across Ireland?

The Glúnta Demographic Map asks:

> What are the demographic profiles of the places where churches serve?

The two maps are intended to be read together over time, but they are kept separate so that each tool remains clear, focused, and usable.

Future versions may include links between the two tools, allowing users to move from a church-presence view to a demographic-context view for the same county, local authority area, Local Electoral Area, or town.

## What the maps currently include

The current maps include indicators for:

- Total population
- Age structure
- Religion
- Birthplace, migration, and citizenship
- Ethnicity and cultural background
- Foreign-language speakers
- Family / household indicators
- Principal economic status

### County / Local Authority map features

The County / Local Authority map includes:

- Search by county or local authority
- Reset map button
- Selected indicator card
- Area profile sidebar
- About / methodology panel
- Choropleth legend
- Labelled basemap
- Link to the LEA map

### Local Electoral Area map features

The Local Electoral Area map includes:

- LEA demographic profile sidebar
- Selected indicator card
- Choropleth legend
- Link back to the county map

## Data sources

Demographic data comes from the Central Statistics Office Census 2022 Small Area Population Statistics.

Boundary data comes from public administrative and statistical boundary data made available through Tailte Éireann / data.gov.ie sources.

More detail is provided in:

methodology.md

## Main files

The live county map uses:

index.html  
script.js  
county-demographics-map.geojson

The live LEA map uses:

lea.html  
lea-demographics-map.geojson

Supporting files include:

lea-demographics-clean.csv  
lea-demographics-join-report.csv  
README.md  
methodology.md  
LICENSE

## Running the map locally

From inside the project folder, run:

python3 -m http.server 8000

Then open:

http://localhost:8000

To view the LEA page locally, open:

http://localhost:8000/lea.html

Do not open index.html directly by double-clicking it. The maps load local GeoJSON data, so they should be served through a local web server.

## Current limitations

The project currently does not include:

- Town or settlement demographic profiles
- Custom town-label overlays
- Direct integration with the Glúnta Church Map
- People-per-church or church-density analysis
- Population change over time
- State-average comparison panels
- Exportable filtered summaries

The county and LEA maps do not use identical family / household tables.

The county map uses a family-with-children style table, while the LEA map currently uses a household / family-size table. This is documented in:

methodology.md

Census categories are broad and should not be overinterpreted. Religious identity, ethnicity, language, citizenship, family structure, and economic status are complex realities that cannot be fully represented in a map.

This tool should be used alongside local knowledge, pastoral judgement, church-presence data, historical context, and direct community relationships.

## Planned future development

Likely future phases include:

1. Search and reset tools for the LEA page
2. Town / settlement demographic layer
3. Custom place-name labels
4. Comparison with county and State averages
5. Links to the Glúnta Church Map
6. Future opportunity-analysis layer combining church presence and demographic context

## Interpretation note

This project is intended to support careful missional reflection, not replace it.

Demographic mapping can help churches ask better questions about place, population, age, migration, language, family structure, and economic life. It cannot tell the whole story of a community. It cannot measure gospel need, church health, spiritual openness, or the strength of local relationships.

The map is therefore best used as a starting point for prayer, research, conversation, partnership, and local discernment.
