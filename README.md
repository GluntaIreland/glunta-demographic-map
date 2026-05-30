# Glúnta Demographic Map

The Glúnta Demographic Map is an interactive visualisation of Census 2022 demographic data for Ireland’s administrative county and local authority areas.

It is part of the wider Glúnta Research mapping work, which seeks to help churches, church leaders, mission agencies, researchers, and interested members of the public better understand the demographic and missional context of communities across Ireland.

This map is a demographic-context tool. It does not measure spiritual need, gospel openness, church health, or ministry priority by itself. It is intended to prompt better questions, support local knowledge, and provide a clearer picture of the communities in which churches serve.

## Live map

The live version of this map is intended to be published through GitHub Pages.

Current prototype geography:

- Administrative counties and local authority areas
- Republic of Ireland
- Census 2022

## Relationship to the Glúnta Church Map

This map is related to, but separate from, the Glúnta Church Map.

The Glúnta Church Map asks:

> Where are churches publicly listed across Ireland?

The Glúnta Demographic Map asks:

> What are the demographic profiles of the places where churches serve?

The two maps are intended to be read together over time, but they are kept separate so that each tool remains clear, focused, and usable.

Future versions may include links between the two tools, allowing users to move from a church-presence view to a demographic-context view for the same county, local authority area, LEA, or town.

## What the map currently includes

The v0.1 county prototype includes indicators for:

- Total population
- Age structure
- Religion
- Birthplace, migration, and citizenship
- Ethnicity and cultural background
- Foreign-language speakers
- Family units and children
- Principal economic status

The map also includes:

- Search by county or local authority
- Reset map button
- Selected indicator card
- Area profile sidebar
- About / methodology panel
- Choropleth legend
- Labelled basemap

## Data sources

Demographic data comes from the Central Statistics Office Census 2022 Small Area Population Statistics.

Boundary data comes from public administrative boundary data made available through Tailte Éireann / data.gov.ie sources.

More detail is provided in `methodology.md`.

## Files

The live map uses:

```text
index.html
script.js
county-demographics-map.geojson
