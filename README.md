<h1>Glúnta Demographic Map</h1>

<h2>Overview</h2>

<p>
  The Glúnta Demographic Map is an interactive visualisation of Census 2022 demographic data for Ireland.
</p>

<p>
  It is part of the wider Glúnta Research mapping work, which seeks to help churches, church leaders, mission agencies, researchers, and interested members of the public better understand the demographic and missional context of communities across Ireland.
</p>

<p>
  This is a demographic-context tool. It does not measure spiritual need, gospel openness, church health, church attendance, or ministry priority by itself. It is intended to prompt better questions, support local interpretation, and provide a clearer picture of the communities in which churches serve.
</p>

<h2>Live maps</h2>

<p>
  The project currently includes two public map views.
</p>

<h3>County / Local Authority map</h3>

<p>
  This map shows demographic data for Ireland’s administrative counties and local authority areas.
</p>

<p>
  <a href="https://gluntaireland.github.io/glunta-demographic-map/">
    https://gluntaireland.github.io/glunta-demographic-map/
  </a>
</p>

<h3>Local Electoral Area map</h3>

<p>
  This map shows demographic data for Local Electoral Areas.
</p>

<p>
  <a href="https://gluntaireland.github.io/glunta-demographic-map/lea.html">
    https://gluntaireland.github.io/glunta-demographic-map/lea.html
  </a>
</p>

<h2>Current version</h2>

<p>
  <strong>v0.2.0</strong>
</p>

<p>
  Current public map views:
</p>

<ul>
  <li>County / Local Authority demographic map</li>
  <li>Local Electoral Area demographic map</li>
</ul>

<h2>Relationship to the Glúnta Church Map</h2>

<p>
  This project is related to, but separate from, the Glúnta Church Map.
</p>

<p>
  The Glúnta Church Map asks:
</p>

<blockquote>
  <p>Where are churches publicly listed across Ireland?</p>
</blockquote>

<p>
  The Glúnta Demographic Map asks:
</p>

<blockquote>
  <p>What are the demographic profiles of the places where churches serve?</p>
</blockquote>

<p>
  The two maps are intended to be read together over time, but they are kept separate so that each tool remains clear, focused, and usable.
</p>

<p>
  Future versions may include links between the two tools, allowing users to move from a church-presence view to a demographic-context view for the same county, local authority area, Local Electoral Area, or town.
</p>

<h2>What the maps currently include</h2>

<p>
  The current maps include indicators for:
</p>

<ul>
  <li>Total population</li>
  <li>Age structure</li>
  <li>Religion</li>
  <li>Birthplace, migration, and citizenship</li>
  <li>Ethnicity and cultural background</li>
  <li>Foreign-language speakers</li>
  <li>Family / household indicators</li>
  <li>Principal economic status</li>
</ul>

<h3>County / Local Authority map features</h3>

<p>
  The County / Local Authority map includes:
</p>

<ul>
  <li>Search by county or local authority</li>
  <li>Reset map button</li>
  <li>Selected indicator card</li>
  <li>Area profile sidebar</li>
  <li>About / methodology panel</li>
  <li>Choropleth legend</li>
  <li>Labelled basemap</li>
  <li>Link to the LEA map</li>
</ul>

<h3>Local Electoral Area map features</h3>

<p>
  The Local Electoral Area map includes:
</p>

<ul>
  <li>LEA demographic profile sidebar</li>
  <li>Selected indicator card</li>
  <li>Choropleth legend</li>
  <li>Link back to the county map</li>
</ul>

<h2>Data sources</h2>

<p>
  Demographic data comes from the Central Statistics Office Census 2022 Small Area Population Statistics.
</p>

<p>
  Boundary data comes from public administrative and statistical boundary data made available through Tailte Éireann / data.gov.ie sources.
</p>

<p>
  More detail is provided in <code>methodology.md</code>.
</p>

<h2>Main files</h2>

<p>
  The live county map uses:
</p>

<ul>
  <li><code>index.html</code></li>
  <li><code>script.js</code></li>
  <li><code>county-demographics-map.geojson</code></li>
</ul>

<p>
  The live LEA map uses:
</p>

<ul>
  <li><code>lea.html</code></li>
  <li><code>lea-demographics-map.geojson</code></li>
</ul>

<p>
  Supporting files include:
</p>

<ul>
  <li><code>lea-demographics-clean.csv</code></li>
  <li><code>lea-demographics-join-report.csv</code></li>
  <li><code>README.md</code></li>
  <li><code>methodology.md</code></li>
  <li><code>LICENSE</code></li>
</ul>

<h2>Running the map locally</h2>

<p>
  From inside the project folder, run:
</p>

<pre><code>python3 -m http.server 8000</code></pre>

<p>
  Then open:
</p>

<pre><code>http://localhost:8000</code></pre>

<p>
  To view the LEA page locally, open:
</p>

<pre><code>http://localhost:8000/lea.html</code></pre>

<p>
  Do not open <code>index.html</code> directly by double-clicking it. The maps load local GeoJSON data, so they should be served through a local web server.
</p>

<h2>Current limitations</h2>

<p>
  The project currently does not include:
</p>

<ul>
  <li>Town or settlement demographic profiles</li>
  <li>Custom town-label overlays</li>
  <li>Direct integration with the Glúnta Church Map</li>
  <li>People-per-church or church-density analysis</li>
  <li>Population change over time</li>
  <li>State-average comparison panels</li>
  <li>Exportable filtered summaries</li>
</ul>

<p>
  The county and LEA maps do not use identical family / household tables.
</p>

<p>
  The county map uses a family-with-children style table, while the LEA map currently uses a household / family-size table. This is documented in <code>methodology.md</code>.
</p>

<p>
  Census categories are broad and should not be overinterpreted. Religious identity, ethnicity, language, citizenship, family structure, and economic status are complex realities that cannot be fully represented in a map.
</p>

<p>
  This tool should be used alongside local knowledge, pastoral judgement, church-presence data, historical context, and direct community relationships.
</p>

<h2>Planned future development</h2>

<p>
  Likely future phases include:
</p>

<ol>
  <li>Search and reset tools for the LEA page</li>
  <li>Town / settlement demographic layer</li>
  <li>Custom place-name labels</li>
  <li>Comparison with county and State averages</li>
  <li>Links to the Glúnta Church Map</li>
  <li>Future opportunity-analysis layer combining church presence and demographic context</li>
</ol>

<h2>Interpretation note</h2>

<p>
  This project is intended to support careful missional reflection, not replace it.
</p>

<p>
  Demographic mapping can help churches ask better questions about place, population, age, migration, language, family structure, and economic life. It cannot tell the whole story of a community. It cannot measure gospel need, church health, spiritual openness, or the strength of local relationships.
</p>

<p>
  The map is therefore best used as a starting point for prayer, research, conversation, partnership, and local discernment.
</p>
