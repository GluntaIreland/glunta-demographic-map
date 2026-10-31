(() => {
  'use strict';

  const FILES = {
    census: 'SAPS_2022_BUA_270923.csv',
    boundaries: 'urban-areas-boundaries.geojson',
    churches: 'churches-points.csv'
  };

  const CSO =
    'https://www.cso.ie/en/census/census2022/census2022smallareapopulationstatistics/';

  const colours = ['#185449', '#a87838', '#729580', '#b8b9ad'];
  const integer = new Intl.NumberFormat('en-IE');

  const escape = value =>
    String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));

  const count = value =>
    value === null ? 'Unavailable' : integer.format(value);

  function numeric(value) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ''
    ) {
      return null;
    }

    const text = String(value).trim();

    return /^-?\d+(?:\.\d+)?$/.test(text) &&
      Number.isFinite(Number(text))
      ? Number(text)
      : null;
  }

  function sum(row, fields) {
    const values = fields.map(field => numeric(row[field]));

    return values.some(value => value === null || value < 0)
      ? null
      : values.reduce((a, b) => a + b, 0);
  }

  function percent(value, denominator) {
    return (
      value !== null &&
      denominator !== null &&
      denominator > 0 &&
      value >= 0 &&
      value <= denominator
    )
      ? value / denominator * 100
      : null;
  }

  function percentage(value, denominator) {
    const result = percent(value, denominator);

    return result === null ? '—' : result.toFixed(1) + '%';
  }

  function parseCSV(text) {
    const rows = [];

    let row = [];
    let field = '';
    let quoted = false;

    text = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < text.length; i++) {
      const character = text[i];

      if (character === '"') {
        if (quoted && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (character === ',' && !quoted) {
        row.push(field);
        field = '';
      } else if (
        (character === '\n' || character === '\r') &&
        !quoted
      ) {
        row.push(field);

        if (row.some(cell => cell.trim() !== '')) {
          rows.push(row);
        }

        row = [];
        field = '';

        if (
          character === '\r' &&
          text[i + 1] === '\n'
        ) {
          i++;
        }
      } else {
        field += character;
      }
    }

    if (quoted) {
      throw new Error(
        'The CSV contains an unfinished quoted value.'
      );
    }

    row.push(field);

    if (row.some(cell => cell.trim() !== '')) {
      rows.push(row);
    }

    if (!rows.length) {
      return [];
    }

    const headers = rows.shift().map(header => header.trim());

    if (new Set(headers).size !== headers.length) {
      throw new Error('Duplicate CSV headings.');
    }

    return rows.map(cells => {
      if (cells.length !== headers.length) {
        throw new Error(
          'A CSV row has the wrong number of columns.'
        );
      }

      return Object.fromEntries(
        headers.map((header, index) => [
          header,
          cells[index]
        ])
      );
    });
  }

  const ageFields = (start, end) =>
    Array.from(
      { length: end - start + 1 },
      (_, index) => `T1_1AGE${start + index}T`
    );

  const groups = [
    {
      id: 'ages',
      target: 'peopleCharts',
      title: 'Age profile',
      denominator: 'T1_1AGETT',
      universe: 'All residents',
      rows: [
        [
          'Children · 0–14',
          ageFields(0, 14)
        ],
        [
          'Young adults · 15–34',
          [
            ...ageFields(15, 19),
            'T1_1AGE20_24T',
            'T1_1AGE25_29T',
            'T1_1AGE30_34T'
          ]
        ],
        [
          'Adults · 35–64',
          [
            '35_39',
            '40_44',
            '45_49',
            '50_54',
            '55_59',
            '60_64'
          ].map(age => `T1_1AGE${age}T`)
        ],
        [
          'Older adults · 65+',
          [
            '65_69',
            '70_74',
            '75_79',
            '80_84',
            'GE_85'
          ].map(age => `T1_1AGE${age}T`)
        ]
      ],
      question:
        'Which ages are well served by existing places and activities? Who could help you understand the gaps?'
    },

    {
      id: 'birthplace',
      target: 'peopleCharts',
      title: 'Place of birth',
      denominator: 'T2_1TBP',
      universe: 'Population in the place-of-birth table',
      rows: [
        [
          'Born in Ireland',
          ['T2_1IEBP']
        ],
        [
          'Born outside Ireland',
          [
            'T2_1UKBP',
            'T2_1PLBP',
            'T2_1INBP',
            'T2_1EUBP',
            'T2_1RWBP'
          ]
        ]
      ],
      note:
        'Birthplace is not citizenship, ethnicity or migration date. This table’s denominator may differ from the town population.',
      question:
        'What helps people who have moved here build friendships and feel at home?'
    },

    {
      id: 'citizenship',
      target: 'peopleCharts',
      title: 'Citizenship',
      denominator: 'T2_1TC',
      universe: 'Population in the citizenship table',
      rows: [
        [
          'Irish',
          ['T2_1IEC']
        ],
        [
          'Other citizenship',
          [
            'T2_1UKC',
            'T2_1PLC',
            'T2_1INC',
            'T2_1EUC',
            'T2_1RWC'
          ]
        ],
        [
          'Not stated',
          ['T2_1NSC']
        ]
      ],
      question:
        'Which local organisations already connect residents from different backgrounds?'
    },

    {
      id: 'households',
      target: 'homeCharts',
      title: 'Household size',
      denominator: 'T5_2_TH',
      universe: 'Private households',
      rows: [
        ['One person', ['T5_2_1PH']],
        ['Two people', ['T5_2_2PH']],
        ['Three people', ['T5_2_3PH']],
        ['Four people', ['T5_2_4PH']],
        [
          'Five or more',
          [
            'T5_2_5PH',
            'T5_2_6PH',
            'T5_2_7PH',
            'T5_2_GE8PH'
          ]
        ]
      ],
      note:
        'These are households, not counts of people or families. Living alone does not establish loneliness.',
      question:
        'Where can people living alone and larger households both find connection and practical support?'
    },

    {
      id: 'tenure',
      target: 'homeCharts',
      title: 'Housing tenure',
      denominator: 'T6_3_TH',
      universe: 'Permanent private households',
      rows: [
        [
          'Owner occupied · mortgage',
          ['T6_3_OMLH']
        ],
        [
          'Owner occupied · outright',
          ['T6_3_OOH']
        ],
        [
          'Private landlord',
          ['T6_3_RPLH']
        ],
        [
          'Local authority',
          ['T6_3_RLAH']
        ],
        [
          'Voluntary / co-operative body',
          ['T6_3_RVCHBH']
        ],
        [
          'Occupied free of rent',
          ['T6_3_OFRH']
        ],
        [
          'Not stated',
          ['T6_3_NSH']
        ]
      ],
      note:
        'Tenure does not measure income, housing quality, affordability or deprivation.',
      question:
        'How do residents describe housing stability, access and the experience of moving into the town?'
    },

    {
      id: 'religion',
      target: 'cultureCharts',
      title: 'Religion',
      denominator: 'T2_4T',
      type: 'donut',
      universe: 'All residents in the religion table',
      rows: [
        ['Roman Catholic', ['T2_4CA']],
        ['Other religion', ['T2_4OR']],
        ['No religion', ['T2_4NR']],
        ['Not stated', ['T2_4NS']]
      ],
      note:
        '“Other religion” combines different traditions. These responses do not measure church attendance or belief in detail.',
      question:
        'How do residents describe faith, belonging, trust and their experience of local churches?'
    },

    {
      id: 'english',
      target: 'cultureCharts',
      title: 'English proficiency',
      denominator: 'T2_6T',
      universe:
        'Speakers of a language other than English or Irish at home',
      rows: [
        ['Very well', ['T2_6VW']],
        ['Well', ['T2_6W']],
        ['Not well', ['T2_6NW']],
        ['Not at all', ['T2_6NAA']],
        ['Not stated', ['T2_6NS']]
      ],
      note:
        'Percentages describe this language group, not all residents.',
      question:
        'Which translated information, language support or multilingual relationships would residents find useful?'
    },

    {
      id: 'status',
      target: 'workCharts',
      title: 'Principal economic status',
      denominator: 'T8_1_TT',
      universe: 'Population aged 15 years and over',
      rows: [
        [
          'At work',
          ['T8_1_WT']
        ],
        [
          'Unemployed / seeking first job',
          [
            'T8_1_LFFJT',
            'T8_1_STUT',
            'T8_1_LTUT'
          ]
        ],
        [
          'Student',
          ['T8_1_ST']
        ],
        [
          'Looking after home / family',
          ['T8_1_LAHFT']
        ],
        [
          'Retired',
          ['T8_1_RT']
        ],
        [
          'Unable to work · sickness / disability',
          ['T8_1_UTWSDT']
        ],
        [
          'Other',
          ['T8_1_OTHT']
        ]
      ],
      note:
        'The unemployment share here uses everyone in this table as its denominator. It is not the labour-force unemployment rate.',
      question:
        'How do work, care, study and retirement shape the times people can meet and participate?'
    },

    {
      id: 'education',
      target: 'workCharts',
      title: 'Highest education completed',
      denominator: 'T10_4_TT',
      universe:
        'Population aged 15+ in the highest-education-completed table',
      rows: [
        [
          'No formal / primary education',
          ['T10_4_NFT', 'T10_4_PT']
        ],
        [
          'Lower secondary',
          ['T10_4_LST']
        ],
        [
          'Upper secondary',
          ['T10_4_UST']
        ],
        [
          'Technical / vocational',
          ['T10_4_TVT']
        ],
        [
          'Advanced certificate / apprenticeship',
          ['T10_4_ACCAT']
        ],
        [
          'Higher certificate, diploma or degree',
          [
            'T10_4_HCT',
            'T10_4_ODNDT',
            'T10_4_HDPQT',
            'T10_4_PDT',
            'T10_4_DT'
          ]
        ],
        [
          'Not stated',
          ['T10_4_NST']
        ]
      ],
      note:
        'Use this table’s published total; it differs from the total population aged 15+. Qualifications do not measure a person’s full skills or experience.',
      question:
        'What skills, practical knowledge and learning opportunities could local partnerships bring together?'
    }
  ];

  function buildChart(row, definition) {
    const total = sum(row, [definition.denominator]);

    const rows = definition.rows.map(([label, fields]) => ({
      label,
      value: sum(row, fields)
    }));

    const consistent =
      total !== null &&
      rows.every(item => item.value !== null) &&
      rows.reduce((totalValue, item) => totalValue + item.value, 0) === total;

    return {
      ...definition,
      total,
      rows,
      consistent
    };
  }

  function ringContains(point, ring) {
    let inside = false;
    const [x, y] = point;

    for (
      let i = 0, j = ring.length - 1;
      i < ring.length;
      j = i++
    ) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];

      const cross =
        (x - xi) * (yj - yi) -
        (y - yi) * (xj - xi);

      if (
        Math.abs(cross) < 1e-10 &&
        x >= Math.min(xi, xj) &&
        x <= Math.max(xi, xj) &&
        y >= Math.min(yi, yj) &&
        y <= Math.max(yi, yj)
      ) {
        return true;
      }

      if (
        (yi > y) !== (yj > y) &&
        x < (xj - xi) * (y - yi) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }

    return inside;
  }

  function polygons(geometry) {
    if (geometry.type === 'Polygon') {
      return [geometry.coordinates];
    }

    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates;
    }

    throw new Error(
      'The town boundary must be a Polygon or MultiPolygon.'
    );
  }

  function contains(geometry, point) {
    return polygons(geometry).some(rings =>
      ringContains(point, rings[0]) &&
      !rings.slice(1).some(ring => ringContains(point, ring))
    );
  }

  function midpoint(geometry) {
    const points = polygons(geometry).flat(2);

    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);

    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2
    ];
  }

  function distance(a, b) {
    const radians = value => value * Math.PI / 180;

    const dlat = radians(b[1] - a[1]);
    const dlon = radians(b[0] - a[0]);

    const h =
      Math.sin(dlat / 2) ** 2 +
      Math.cos(radians(a[1])) *
      Math.cos(radians(b[1])) *
      Math.sin(dlon / 2) ** 2;

    return 6371 * 2 * Math.atan2(
      Math.sqrt(h),
      Math.sqrt(Math.max(0, 1 - h))
    );
  }

  function classifyChurches(records, geometry) {
    const centre = midpoint(geometry);

    const inside = [];
    const nearby = [];

    let invalid = 0;

    for (const record of records) {
      const lat = numeric(record.latitude);
      const lng = numeric(record.longitude);

      if (
        lat === null ||
        lng === null ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      ) {
        invalid++;
        continue;
      }

      const item = {
        ...record,
        lat,
        lng,
        km: distance(centre, [lng, lat])
      };

      if (contains(geometry, [lng, lat])) {
        inside.push(item);
      } else if (item.km <= 15) {
        nearby.push(item);
      }
    }

    inside.sort((a, b) => a.name.localeCompare(b.name));
    nearby.sort((a, b) => a.km - b.km);

    return {
      inside,
      nearby,
      invalid
    };
  }

  function safeURL(value) {
    try {
      const url = new URL(value);

      return ['https:', 'http:'].includes(url.protocol)
        ? url.href
        : null;
    } catch {
      return null;
    }
  }

  function selectRow(records, feature) {
    const properties = feature.properties;

    const rows = records.filter(row =>
      String(row.GEOGID) === String(properties.URBAN_AREA_CODE)
    );

    if (rows.length !== 1) {
      throw new Error(
        'A unique Census row could not be found for this town. Check the uploaded BUA CSV.'
      );
    }

    const normalise = value =>
      String(value ?? '')
        .replace(/[{}]/g, '')
        .toLowerCase();

    if (
      !properties.URBAN_AREA_GUID ||
      normalise(rows[0].GUID) !==
        normalise(properties.URBAN_AREA_GUID)
    ) {
      throw new Error(
        'The Census row and town boundary have different identifiers. Check the data versions.'
      );
    }

    return rows[0];
  }

  function chartHTML(chart) {
    const values = item => `
      <span class="row-value">
        ${count(item.value)}
        <span>${percentage(item.value, chart.total)}</span>
      </span>
    `;

    let graphic;

    if (
      chart.type === 'donut' &&
      chart.consistent &&
      chart.total > 0
    ) {
      const circumference = 2 * Math.PI * 46;
      let offset = 0;

      const arcs = chart.rows.map((item, index) => {
        const length =
          item.value / chart.total * circumference;

        const arc = `
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="${colours[index]}"
            stroke-width="16"
            stroke-dasharray="${length} ${circumference - length}"
            stroke-dashoffset="${-offset}"
            transform="rotate(-90 60 60)"
          />
        `;

        offset += length;
        return arc;
      }).join('');

      graphic = `
        <div class="donut-layout">
          <svg
            class="donut"
            viewBox="0 0 120 120"
            aria-hidden="true"
          >
            ${arcs}
            <text
              x="60"
              y="58"
              text-anchor="middle"
              font-size="16"
              fill="#185449"
            >${count(chart.total)}</text>
            <text
              x="60"
              y="73"
              text-anchor="middle"
              font-size="7"
              fill="#5e6c65"
            >residents</text>
          </svg>

          <div>
            ${chart.rows.map((item, index) => `
              <div class="legend-row">
                <span
                  class="swatch"
                  style="--swatch:${colours[index]}"
                ></span>
                <span>${escape(item.label)}</span>
                ${values(item)}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      graphic = chart.rows.map(item => {
        const width = percent(item.value, chart.total);

        return `
          <div class="chart-row">
            <span class="row-label">${escape(item.label)}</span>

            <svg
              class="bar"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect
                width="100"
                height="12"
                fill="#edf0e9"
              />
              <rect
                width="${width ?? 0}"
                height="12"
                fill="#185449"
              />
            </svg>

            ${values(item)}
          </div>
        `;
      }).join('');
    }

    const warning = chart.consistent
      ? ''
      : `
        <p class="notice error">
          Some counts are unavailable or do not match the published total.
          Check the source before interpreting this chart.
        </p>
      `;

    return `
      <section
        class="chart-card"
        aria-labelledby="chart-${chart.id}"
      >
        <h3 id="chart-${chart.id}">${escape(chart.title)}</h3>

        <p class="universe">
          ${escape(chart.universe)}
          · denominator: ${count(chart.total)}
          · Census 2022
        </p>

        ${warning}
        ${graphic}

        <p class="chart-note">
          <span class="badge">Published statistic</span>
          <a href="${CSO}">CSO Census 2022</a>.
          ${escape(
            chart.note ||
            'Percentages use the published total shown above.'
          )}
        </p>

        <p class="chart-prompt">
          <strong>Local listening question:</strong>
          ${escape(chart.question)}
        </p>

        <details>
          <summary>View the figures as a table</summary>

          <div class="table-scroll">
            <table>
              <caption>
                ${escape(chart.title)}
                · denominator ${count(chart.total)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Count</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                ${chart.rows.map(item => `
                  <tr>
                    <th scope="row">${escape(item.label)}</th>
                    <td>${count(item.value)}</td>
                    <td>${percentage(item.value, chart.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    `;
  }

  function staticMap(feature, churches) {
    const project = ([lng, lat]) => [
      lng * Math.PI / 180,
      -Math.log(
        Math.tan(Math.PI / 4 + lat * Math.PI / 360)
      )
    ];

    const rings = polygons(feature.geometry).flat();
    const points = rings.flat().map(project);

    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    const spanX = Math.max(...xs) - minX;
    const spanY = Math.max(...ys) - minY;

    const scale = Math.min(
      640 / (spanX || 1),
      280 / (spanY || 1)
    );

    const xy = point => {
      const [x, y] = project(point);

      return [
        30 + (640 - spanX * scale) / 2 + (x - minX) * scale,
        20 + (280 - spanY * scale) / 2 + (y - minY) * scale
      ];
    };

    const paths = polygons(feature.geometry).map(polygon => {
      const path = polygon.map(ring =>
        ring.map((point, index) =>
          `${index ? 'L' : 'M'}${xy(point).join(',')}`
        ).join(' ') + ' Z'
      ).join(' ');

      return `
        <path
          d="${path}"
          fill="#eaf0e7"
          stroke="#185449"
          stroke-width="1.5"
          fill-rule="evenodd"
        />
      `;
    }).join('');

    const markers = churches.map(item => {
      const [x, y] = xy([item.lng, item.lat]);

      return `
        <circle
          cx="${x}"
          cy="${y}"
          r="4"
          fill="#a87838"
          stroke="#fff"
          stroke-width="1"
        />
      `;
    }).join('');

    return `
      <svg
        viewBox="0 0 700 320"
        role="img"
        aria-label="${escape(
          feature.properties.URBAN_AREA_NAME
        )} boundary and listed church locations within it"
      >
        ${paths}
        ${markers}
      </svg>

      <figcaption>
        CSO town boundary; gold dots show listed church points inside it.
        This print diagram has no basemap.
        © OpenStreetMap contributors provide the separate interactive basemap.
      </figcaption>
    `;
  }

  async function request(path, type) {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(
        `Could not load ${path} (HTTP ${response.status}). Check that it is uploaded beside town-profile.html.`
      );
    }

    if (type === 'json') {
      return response.json();
    }

    if (type === 'census') {
      const buffer = await response.arrayBuffer();
      const text = new TextDecoder('windows-1252').decode(buffer);

      return parseCSV(text);
    }

    return parseCSV(await response.text());
  }

  function churchList(records, nearby) {
    if (!records.length) {
      return `
        <p class="small">
          No locations are listed in this dataset for this area.
          This does not establish that no churches exist.
        </p>
      `;
    }

    return `
      <ul class="church-list">
        ${records.map(item => {
          const website = safeURL(item.website);
          const name = escape(item.name || 'Unnamed location');

          const title = website
            ? `
              <a
                href="${escape(website)}"
                target="_blank"
                rel="noopener noreferrer"
              >${name}</a>
            `
            : name;

          const locationNote = nearby
            ? ` · approximately ${item.km.toFixed(1)} km from town midpoint`
            : ' · point inside town boundary';

          return `
            <li>
              <strong>${title}</strong>
              <small>
                ${escape(item.county || 'County not supplied')}
                ${locationNote}
              </small>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  function drawInteractiveMap(feature, churches) {
    const message = document.getElementById('mapStatus');

    if (!window.L) {
      message.textContent =
        'The interactive map library could not load. The boundary diagram remains available when printing.';
      return;
    }

    const [lng, lat] = midpoint(feature.geometry);

    const map = L.map('townContextMap', {
      scrollWheelZoom: false
    }).setView([lat, lng], 12);

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    ).addTo(map);

    tiles.on('tileerror', () => {
      message.textContent =
        'Some basemap tiles could not load. The town boundary and listed points are still shown.';
    });

    const boundary = L.geoJSON(feature, {
      style: {
        color: '#185449',
        weight: 2.5,
        fillColor: '#729580',
        fillOpacity: 0.16
      }
    }).addTo(map);

    churches.inside.concat(churches.nearby).forEach(item => {
      const isInside = contains(
        feature.geometry,
        [item.lng, item.lat]
      );

      L.circleMarker([item.lat, item.lng], {
        radius: 6,
        color: '#fff',
        weight: 1.5,
        fillColor: isInside ? '#a87838' : '#185449',
        fillOpacity: 1
      })
        .bindPopup(`
          <strong>
            ${escape(item.name || 'Listed church location')}
          </strong>
          <br>
          ${escape(item.county || '')}
        `)
        .addTo(map);
    });

    map.fitBounds(boundary.getBounds(), {
      padding: [25, 25],
      maxZoom: 14
    });

    message.textContent =
      'Gold points: inside the town. Green points: nearby. Zoom out to explore nearby locations.';

    requestAnimationFrame(() => map.invalidateSize());
  }

  async function init() {
    const status = document.getElementById('loadStatus');
    const button = document.getElementById('printButton');

    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    let boundaryData;

    try {
      boundaryData = await request(
        FILES.boundaries,
        'json'
      );

      if (!Array.isArray(boundaryData.features)) {
        throw new Error(
          'The boundary file is not a FeatureCollection.'
        );
      }

      const features = boundaryData.features.filter(feature =>
        /^\d{5}$/.test(
          String(feature.properties?.URBAN_AREA_CODE)
        )
      );

      const validCode =
        code &&
        /^\d{5}$/.test(code) &&
        features.some(feature =>
          String(feature.properties.URBAN_AREA_CODE) === code
        );

      if (!validCode) {
        status.textContent = code
          ? 'That town code was not found. Choose a town below.'
          : 'Choose a town to open its report.';

        const select = document.getElementById('townSelect');

        features
          .sort((a, b) =>
            a.properties.URBAN_AREA_NAME.localeCompare(
              b.properties.URBAN_AREA_NAME
            )
          )
          .forEach(feature => {
            const properties = feature.properties;

            select.add(
              new Option(
                `${properties.URBAN_AREA_NAME} · ${properties.COUNTY} · ${properties.URBAN_AREA_CODE}`,
                properties.URBAN_AREA_CODE
              )
            );
          });

        document.getElementById('townPicker').hidden = false;
        return;
      }

      const feature = features.find(item =>
        String(item.properties.URBAN_AREA_CODE) === code
      );

      const [records, churchResult] = await Promise.all([
        request(FILES.census, 'census'),

        request(FILES.churches, 'text').then(
          value => ({ value }),
          error => ({ error })
        )
      ]);

      const row = selectRow(records, feature);

      const charts = groups.map(definition =>
        buildChart(row, definition)
      );

      const population = sum(row, ['T1_1AGETT']);

      if (population === null || population <= 0) {
        throw new Error(
          'The town population is missing or invalid in the Census file.'
        );
      }

      const properties = feature.properties;

      const churchData = churchResult.error
        ? {
            inside: [],
            nearby: [],
            invalid: 0
          }
        : classifyChurches(
            churchResult.value,
            feature.geometry
          );

      const set = (id, text) => {
        document.getElementById(id).textContent = text;
      };

      set('townName', properties.URBAN_AREA_NAME);

      set(
        'townMeta',
        `${properties.COUNTY} · Built Up Area ${code} · Census 2022`
      );

      document.title =
        `${properties.URBAN_AREA_NAME} | Glúnta Town Mission Profile`;

      set(
        'boundaryNote',
        `This report uses the 2022 Built Up Area boundary for ${properties.URBAN_AREA_NAME}, ${properties.COUNTY}. The population comes directly from the matching published CSO town row.`
      );

      const ages = charts.find(chart => chart.id === 'ages');
      const born = charts.find(chart => chart.id === 'birthplace');

      const householdTotal = sum(row, ['T5_2_TH']);

      const stats = [
        [
          count(population),
          'Residents',
          'Census 2022 · all residents'
        ],
        [
          count(householdTotal),
          'Private households',
          'Census 2022 · household total'
        ],
        [
          percentage(ages.rows[0].value, ages.total),
          'Aged 0–14',
          `Denominator: ${count(ages.total)} residents`
        ],
        [
          percentage(born.rows[1].value, born.total),
          'Born outside Ireland',
          `Denominator: ${count(born.total)} in birthplace table`
        ]
      ];

      document.getElementById('headlineStats').innerHTML =
        stats.map(([value, label, note]) => `
          <div class="stat">
            <strong>${escape(value)}</strong>
            <span>${escape(label)}</span>
            <small>${escape(note)}</small>
          </div>
        `).join('');

      set(
        'peopleSummary',
        `${count(population)} people were recorded in this town’s 2022 Built Up Area. The charts below use each table’s published denominator, which can differ from the headline population.`
      );

      for (const chart of charts) {
        document
          .getElementById(chart.target)
          .insertAdjacentHTML(
            'beforeend',
            chartHTML(chart)
          );
      }

      if (churchResult.error) {
        set(
          'churchSummary',
          'The church-points file could not be loaded. Church counts and lists are unavailable; the demographic report remains usable.'
        );

        set(
          'insideChurches',
          'Unavailable. Check churches-points.csv.'
        );

        set(
          'nearbyChurches',
          'Unavailable. Check churches-points.csv.'
        );
      } else {
        const invalidNote = churchData.invalid
          ? ` ${count(churchData.invalid)} record(s) with missing or invalid coordinates were excluded from geographic counts.`
          : '';

        set(
          'churchSummary',
          `${count(churchData.inside.length)} listed location(s) fall inside the boundary. ${count(churchData.nearby.length)} further listed location(s) lie outside it and within 15 km of the town midpoint. These are records, not a complete church census.${invalidNote}`
        );

        document.getElementById('insideChurches').innerHTML =
          churchList(churchData.inside, false);

        document.getElementById('nearbyChurches').innerHTML =
          churchList(
            churchData.nearby.slice(0, 8),
            true
          );
      }

      document.getElementById('printMap').innerHTML =
        staticMap(feature, churchData.inside);

      const openedDate = new Date().toLocaleDateString(
        'en-IE',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }
      );

      set(
        'reportStamp',
        `Report opened ${openedDate}. Census statistics remain dated 2022; this is not a live population estimate.`
      );

      document.getElementById('report').hidden = false;
      status.hidden = true;

      button.disabled = false;
      button.addEventListener('click', () => window.print());

      try {
        drawInteractiveMap(feature, churchData);
      } catch {
        set(
          'mapStatus',
          'The interactive map could not be displayed. The report and printable boundary diagram remain available.'
        );
      }

      if (params.get('print') === '1') {
        await document.fonts.ready;

        await new Promise(resolve =>
          requestAnimationFrame(() =>
            requestAnimationFrame(resolve)
          )
        );

        window.print();
      }
    } catch (error) {
      status.classList.add('error');

      status.textContent =
        `${error.message} Open this page through your website or a local web server, rather than as a file on your computer.`;

      button.disabled = true;
    }
  }

  const api = {
    parseCSV,
    numeric,
    sum,
    percent,
    groups,
    buildChart,
    contains,
    midpoint,
    distance,
    classifyChurches,
    selectRow,
    safeURL
  };

  if (
    typeof module !== 'undefined' &&
    module.exports
  ) {
    module.exports = api;
  }

  if (typeof window !== 'undefined') {
    window.GluntaTown = api;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
