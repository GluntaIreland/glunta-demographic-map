(() => {
  'use strict';

  const FILES = {
    census: 'SAPS_2022_CSOLEA270923.csv',
    boundaries: 'lea-boundaries.geojson',
    churches: 'churches-points.csv'
  };

  const CSO =
    'https://www.cso.ie/en/census/census2022/census2022smallareapopulationstatistics/';

  const colours = [
    '#185449',
    '#a87838',
    '#729580',
    '#b8b9ad'
  ];

  const integer = new Intl.NumberFormat('en-IE');

  const escape = value =>
    String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));

  const count = value =>
    value === null ? 'Unavailable' : integer.format(value);

  const title = value =>
    String(value ?? '')
      .toLocaleLowerCase('en-IE')
      .replace(
        /(^|[\s-])\p{L}/gu,
        c => c.toLocaleUpperCase('en-IE')
      );

  const normalise = value =>
    String(value ?? '')
      .trim()
      .replace(/[{}]/g, '')
      .toLowerCase();

  function numeric(value) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ''
    ) {
      return null;
    }

    const text = String(value).trim();

    return (
      /^-?\d+(?:\.\d+)?$/.test(text) &&
      Number.isFinite(Number(text))
    )
      ? Number(text)
      : null;
  }

  function sum(row, fields) {
    const values = fields.map(field =>
      numeric(row[field])
    );

    return values.some(value =>
      value === null || value < 0
    )
      ? null
      : values.reduce((a, b) => a + b, 0);
  }

  function percent(value, total) {
    return (
      value !== null &&
      total !== null &&
      total > 0 &&
      value >= 0 &&
      value <= total
    )
      ? value / total * 100
      : null;
  }

  function percentage(value, total) {
    const result = percent(value, total);

    return result === null
      ? '—'
      : result.toFixed(1) + '%';
  }

  function ratio(value, total) {
    if (value === null || total === null) {
      return 'Unavailable';
    }

    return (
      `${count(value)} of ${count(total)}` +
      (
        total > 0
          ? ` (${percentage(value, total)})`
          : ' (no percentage denominator)'
      )
    );
  }

  function parseCSV(text) {
    const rows = [];

    let row = [];
    let field = '';
    let quoted = false;

    text = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < text.length; i++) {
      const c = text[i];

      if (c === '"') {
        if (quoted && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (c === ',' && !quoted) {
        row.push(field);
        field = '';
      } else if (
        (c === '\n' || c === '\r') &&
        !quoted
      ) {
        row.push(field);

        if (row.some(cell => cell.trim() !== '')) {
          rows.push(row);
        }

        row = [];
        field = '';

        if (
          c === '\r' &&
          text[i + 1] === '\n'
        ) {
          i++;
        }
      } else {
        field += c;
      }
    }

    if (quoted) {
      throw new Error(
        'The CSV has an unfinished quoted value.'
      );
    }

    row.push(field);

    if (row.some(cell => cell.trim() !== '')) {
      rows.push(row);
    }

    if (!rows.length) {
      return [];
    }

    const headers = rows.shift().map(header =>
      header.trim()
    );

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
        'Birthplace is not citizenship, ethnicity or migration date. This table’s denominator may differ from the LEA population.',

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

    const rows = definition.rows.map(
      ([label, fields]) => ({
        label,
        value: sum(row, fields)
      })
    );

    const consistent =
      total !== null &&
      rows.every(item => item.value !== null) &&
      rows.reduce(
        (result, item) => result + item.value,
        0
      ) === total;

    return {
      ...definition,
      total,
      rows,
      consistent
    };
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
      graphic = chart.rows.map(item => `
        <div class="chart-row">
          <span class="row-label">
            ${escape(item.label)}
          </span>

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
              width="${percent(item.value, chart.total) ?? 0}"
              height="12"
              fill="#185449"
            />
          </svg>

          ${values(item)}
        </div>
      `).join('');
    }

    const warning = chart.consistent
      ? ''
      : `
        <p class="notice error">
          Some counts are unavailable or do not match the published
          total. Check the source before interpreting this chart.
        </p>
      `;

    return `
      <section
        class="chart-card"
        aria-labelledby="chart-${chart.id}"
      >
        <h3 id="chart-${chart.id}">
          ${escape(chart.title)}
        </h3>

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
                    <th scope="row">
                      ${escape(item.label)}
                    </th>
                    <td>${count(item.value)}</td>
                    <td>
                      ${percentage(item.value, chart.total)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    `;
  }

  function polygons(geometry) {
    if (geometry.type === 'Polygon') {
      return [geometry.coordinates];
    }

    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates;
    }

    throw new Error(
      'The LEA boundary must be a Polygon or MultiPolygon.'
    );
  }

  function* coordinates(geometry) {
    for (const polygon of polygons(geometry)) {
      for (const ring of polygon) {
        for (const point of ring) {
          yield point;
        }
      }
    }
  }

  function extent(geometry) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const [x, y] of coordinates(geometry)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    if (
      ![minX, minY, maxX, maxY].every(Number.isFinite)
    ) {
      throw new Error(
        'The LEA boundary has invalid coordinates.'
      );
    }

    return { minX, minY, maxX, maxY };
  }

  function toWGS84(feature, crsName, projector) {
    const crs = String(crsName || '');
    const box = extent(feature.geometry);

    if (!crs || /4326|CRS84/i.test(crs)) {
      if (
        box.minX < -180 ||
        box.maxX > 180 ||
        box.minY < -90 ||
        box.maxY > 90
      ) {
        throw new Error(
          'Projected boundary coordinates need a recognised coordinate system.'
        );
      }

      return feature;
    }

    if (!/2157$/.test(crs)) {
      throw new Error(
        'The boundary coordinate system is unsupported: ' + crs
      );
    }

    if (typeof projector !== 'function') {
      throw new Error(
        'The coordinate conversion library could not load. Refresh the report to load Proj4js.'
      );
    }

    const itm =
      '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=0.99982 ' +
      '+x_0=600000 +y_0=750000 +ellps=GRS80 ' +
      '+towgs84=0,0,0,0,0,0,0 +units=m +no_defs';

    const convert = values =>
      typeof values[0] === 'number'
        ? projector(
            itm,
            'EPSG:4326',
            values.slice(0, 2)
          )
        : values.map(convert);

    const converted = {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: convert(
          feature.geometry.coordinates
        )
      }
    };

    const result = extent(converted.geometry);

    if (
      result.minX < -180 ||
      result.maxX > 180 ||
      result.minY < -90 ||
      result.maxY > 90
    ) {
      throw new Error(
        'Boundary coordinate conversion failed.'
      );
    }

    return converted;
  }

  function ringContains([x, y], ring) {
    let inside = false;

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

  function contains(geometry, point) {
    return polygons(geometry).some(rings =>
      ringContains(point, rings[0]) &&
      !rings.slice(1).some(ring =>
        ringContains(point, ring)
      )
    );
  }

  function segmentDistance(point, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = dx * dx + dy * dy;

    const t = length
      ? Math.max(
          0,
          Math.min(
            1,
            (
              (point[0] - a[0]) * dx +
              (point[1] - a[1]) * dy
            ) / length
          )
        )
      : 0;

    return Math.hypot(
      point[0] - a[0] - t * dx,
      point[1] - a[1] - t * dy
    );
  }

  function boundaryDistance(geometry, [lng, lat]) {
    const radians = Math.PI / 180;

    const scaleX =
      6371 * radians * Math.cos(lat * radians);

    const scaleY = 6371 * radians;

    const project = point => [
      (point[0] - lng) * scaleX,
      (point[1] - lat) * scaleY
    ];

    let nearest = Infinity;

    for (const polygon of polygons(geometry)) {
      for (const ring of polygon) {
        for (
          let i = 0, j = ring.length - 1;
          i < ring.length;
          j = i++
        ) {
          nearest = Math.min(
            nearest,
            segmentDistance(
              [0, 0],
              project(ring[j]),
              project(ring[i])
            )
          );
        }
      }
    }

    return nearest;
  }

  function classifyChurches(records, geometry) {
    const inside = [];
    const nearby = [];
    const box = extent(geometry);

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
        name: String(record.name || 'Unnamed location'),
        lat,
        lng
      };

      if (contains(geometry, [lng, lat])) {
        inside.push(item);
      } else if (
        lat >= box.minY - 0.3 &&
        lat <= box.maxY + 0.3 &&
        lng >= box.minX - 0.6 &&
        lng <= box.maxX + 0.6
      ) {
        const km = boundaryDistance(
          geometry,
          [lng, lat]
        );

        if (km <= 15) {
          nearby.push({ ...item, km });
        }
      }
    }

    inside.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    nearby.sort((a, b) =>
      a.km - b.km ||
      a.name.localeCompare(b.name)
    );

    return {
      inside,
      nearby,
      invalid
    };
  }

  function selectFeature(features, code) {
    const matches = features.filter(feature =>
      ['LEA_ID', 'LEA_GUID', 'CSO_LEA'].some(key =>
        normalise(feature.properties[key]) ===
        normalise(code)
      )
    );

    return matches.length === 1
      ? matches[0]
      : null;
  }

  function selectRow(records, feature) {
    const p = feature.properties;

    const matches = records.filter(row =>
      String(row.GEOGID).trim() ===
      String(p.LEA_ID).trim()
    );

    if (matches.length !== 1) {
      throw new Error(
        'A unique Census row could not be found for this LEA. Check the LEA CSV.'
      );
    }

    if (
      !p.LEA_GUID ||
      normalise(matches[0].GUID) !==
        normalise(p.LEA_GUID)
    ) {
      throw new Error(
        'The Census row and LEA boundary have different GUIDs. Check the data versions.'
      );
    }

    return matches[0];
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
          const url = safeURL(item.website);

          const name = url
            ? `
              <a
                href="${escape(url)}"
                target="_blank"
                rel="noopener noreferrer"
              >${escape(item.name)}</a>
            `
            : escape(item.name);

          const note = nearby
            ? ` · approximately ${item.km.toFixed(1)} km from the LEA boundary`
            : ' · point inside this LEA';

          return `
            <li>
              <strong>${name}</strong>
              <small>
                ${escape(item.county || 'County not supplied')}
                ${note}
              </small>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  }

  function simplify(points, tolerance = 0.6) {
    if (points.length < 4) {
      return points;
    }

    const keep = new Uint8Array(points.length);
    const stack = [[0, points.length - 1]];

    keep[0] = keep[points.length - 1] = 1;

    while (stack.length) {
      const [first, last] = stack.pop();

      let maximum = tolerance;
      let chosen = -1;

      for (let i = first + 1; i < last; i++) {
        const distance = segmentDistance(
          points[i],
          points[first],
          points[last]
        );

        if (distance > maximum) {
          maximum = distance;
          chosen = i;
        }
      }

      if (chosen >= 0) {
        keep[chosen] = 1;

        stack.push(
          [first, chosen],
          [chosen, last]
        );
      }
    }

    return points.filter((_, index) =>
      keep[index]
    );
  }

  function staticMap(feature, churches) {
    const project = ([lng, lat]) => [
      lng * Math.PI / 180,
      -Math.log(
        Math.tan(
          Math.PI / 4 + lat * Math.PI / 360
        )
      )
    ];

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of coordinates(feature.geometry)) {
      const [x, y] = project(point);

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const spanX = maxX - minX;
    const spanY = maxY - minY;

    const scale = Math.min(
      640 / (spanX || 1),
      280 / (spanY || 1)
    );

    const xy = point => {
      const [x, y] = project(point);

      return [
        30 +
          (640 - spanX * scale) / 2 +
          (x - minX) * scale,

        20 +
          (280 - spanY * scale) / 2 +
          (y - minY) * scale
      ];
    };

    const paths = polygons(feature.geometry)
      .map(polygon => {
        const path = polygon.map(ring =>
          simplify(ring.map(xy))
            .map((point, index) =>
              `${index ? 'L' : 'M'}${point.map(
                n => n.toFixed(1)
              ).join(',')}`
            )
            .join(' ') + ' Z'
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

    const dots = churches.map(item => {
      const [x, y] = xy([item.lng, item.lat]);

      return `
        <circle
          cx="${x.toFixed(1)}"
          cy="${y.toFixed(1)}"
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
          title(feature.properties.CSO_LEA)
        )} LEA boundary and listed church points"
      >
        ${paths}
        ${dots}
      </svg>

      <figcaption>
        Simplified Census 2022 statistical LEA boundary; gold points
        show listed church locations inside it. Classification uses
        the full supplied boundary. Basemap tiles are omitted from
        this print diagram.
      </figcaption>
    `;
  }

  function drawMap(feature, churches) {
    const message = document.getElementById('mapStatus');

    if (!window.L) {
      message.textContent =
        'The interactive map library could not load. A boundary diagram remains available when printing.';
      return;
    }

    const box = extent(feature.geometry);

    const map = L.map('townContextMap', {
      scrollWheelZoom: false
    }).setView(
      [
        (box.minY + box.maxY) / 2,
        (box.minX + box.maxX) / 2
      ],
      10
    );

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
        'Some basemap tiles could not load. The boundary and listed points remain available.';
    });

    const boundary = L.geoJSON(feature, {
      style: {
        color: '#185449',
        weight: 2.5,
        fillColor: '#729580',
        fillOpacity: 0.16
      }
    }).addTo(map);

    const markerGroups = [
      [churches.inside, '#a87838'],
      [churches.nearby, '#185449']
    ];

    for (const [records, colour] of markerGroups) {
      records.forEach(item => {
        L.circleMarker([item.lat, item.lng], {
          radius: 6,
          color: '#fff',
          weight: 1.5,
          fillColor: colour,
          fillOpacity: 1
        })
          .bindPopup(`
            <strong>${escape(item.name)}</strong>
            <br>
            ${escape(item.county || '')}
          `)
          .addTo(map);
      });
    }

    map.fitBounds(boundary.getBounds(), {
      padding: [25, 25],
      maxZoom: 13
    });

    message.textContent =
      'Gold points: inside the LEA. Green points: nearby. Zoom out to explore beyond the boundary.';

    requestAnimationFrame(() =>
      map.invalidateSize()
    );
  }

  function observations(row, charts, name, churches) {
    const chart = id =>
      charts.find(c => c.id === id);

    const item = (id, index) =>
      chart(id)?.consistent
        ? chart(id).rows[index].value
        : null;

    const evidence = (id, index, statement) => {
      const c = chart(id);
      const v = item(id, index);

      return c?.consistent && v !== null
        ? `${ratio(v, c.total)} ${statement}`
        : 'The supporting measure is unavailable or inconsistent. Treat this as a general question without a local statistical conclusion.';
    };

    const churchCount = churches.available
      ? churches.inside.length
      : null;

    const limited = chart('english')?.consistent
      ? item('english', 2) + item('english', 3)
      : null;

    return [
      [
        'places',
        'Read the LEA as a network of places',

        `CSO recorded ${count(
          sum(row, ['T1_1AGETT'])
        )} residents across this statistical LEA in 2022.`,

        '#place',

        `${name} LEA is a statistical frame for exploring local mission. Ask which distinct neighbourhoods and communities it contains, how they relate, and where Christian witness is already present. An area-wide profile cannot show every local difference. Use the map to choose places for closer listening and to connect what you learn across the region.`,

        'Which communities need their own closer profile, and which relationships connect them?'
      ],

      [
        'witness',

        churchCount > 0
          ? 'Begin with existing witness'
          : 'Verify the local Christian witness',

        churchCount === null
          ? 'Church-location data is unavailable.'
          : `${count(churchCount)} church-location record(s) fall inside the supplied boundary. Coverage and current activity require verification.`,

        '#community',

        churchCount > 0
          ? 'Meet local leaders and members, honour existing ministry and understand their convictions. Ask where people travel from and which places remain difficult to reach. Partnership, strengthening, leadership development and new congregations may each have a place. A count of church points cannot decide what is needed or establish the health and capacity of existing churches.'
          : 'Ask residents and regional churches about congregations, house gatherings and Christian relationships missing from the map. An empty or unavailable listing cannot establish an absence of witness. Learn the local history and explore partnerships before deciding what future work could serve the area.',

        'Who should we meet, and what could existing churches strengthen together?'
      ],

      [
        'culture',
        'Think interculturally across the area',

        evidence(
          'birthplace',
          1,
          'people in the 2022 birthplace table were born outside Ireland. Birthplace does not establish ethnicity, language or length of residence.'
        ),

        '#chart-birthplace',

        'Explore which communities are present and how people describe their identities. Ask whether experiences differ between neighbourhoods or settlements. Hospitality and shared congregational life can make space for people from different backgrounds to contribute. Avoid assuming that everyone born abroad is recently arrived or needs the same form of support.',

        'Whose voices and cultural experiences are least represented in our relationships and leadership?'
      ],

      [
        'language',
        'Language may shape access',

        limited === null
          ? 'English-proficiency counts are unavailable.'
          : `${ratio(limited, chart('english').total)} people speaking another language at home reported English “not well” or “not at all” in 2022. The denominator is this language group.`,

        '#chart-english',

        'Ask how people access information, conversation and church life in different parts of the LEA. Clear language, translation and multilingual friendships may help. A different home language does not itself indicate difficulty with English. Listen before choosing a response and involve multilingual Christians in shaping it.',

        'Which communication barriers have residents actually identified, and who could help address them?'
      ],

      [
        'belief',
        'Join neighbourly respect with gospel clarity',

        evidence(
          'religion',
          2,
          'residents in the 2022 religion table reported no religion. Affiliation does not measure belief, attendance or receptivity.'
        ),

        '#chart-religion',

        'Ask what faith, doubt, religious identity and church experience mean in local lives. Differences within the LEA may be as important as the area-wide totals. Religious categories should open conversations. Offer a gracious, clear explanation of the gospel while learning about neighbours’ convictions and experiences.',

        'What questions are people asking in the different communities we hope to serve?'
      ],

      [
        'households',
        'Make room for different households',

        evidence(
          'households',
          0,
          'private households in the 2022 household-size table had one person. Living alone does not establish loneliness.'
        ),

        '#chart-households',

        'Consider children, older people, single adults, couples and households without children when shaping discipleship and community life. Ask how care, work and transport affect participation. A programme accessible in one part of the LEA may be impractical elsewhere. Let residents help identify useful places, times and relationships.',

        'Who finds our present arrangements difficult to access, and what would make participation possible?'
      ],

      [
        'housing',
        'Explore housing and belonging',

        evidence(
          'tenure',
          2,
          'permanent private households in the 2022 tenure table rented from a private landlord. This is a household measure.'
        ),

        '#chart-tenure',

        'Ask renters and owners what helps them feel at home and develop local relationships. Housing tenure alone cannot establish income, mobility or weak local roots. Explore hospitality and accessible gatherings across different communities, while listening carefully before deciding what practical support would be helpful.',

        'How does the experience of belonging differ between communities within this LEA?'
      ],

      [
        'fieldwork',
        'Follow relationships beyond the boundary',

        'The report supplies a boundary and demographic tables. Verified local journeys, meeting places and residents’ accounts have not yet been added.',

        '#field-guide',

        'Visit several places, return at different times and follow the everyday journeys residents describe. School, work, friendship and church relationships may cross the LEA boundary. Keep observation, testimony and interpretation distinct. Bring what you learn into prayer and discussion with local churches before agreeing a practical next step.',

        'Which journeys and relationships should we understand before proposing new work?'
      ]
    ].map(
      (
        [id, heading, basis, source, text, question],
        index
      ) => ({
        id,
        heading,
        basis,
        source,
        text,
        question,
        soft: [3, 4, 6].includes(index)
      })
    );
  }

  function missionHTML(card) {
    return `
      <article
        class="mission-card${card.soft ? ' mission-card--soft' : ''}"
        aria-labelledby="mission-${card.id}"
      >
        <h3 id="mission-${card.id}">
          ${escape(card.heading)}
        </h3>

        <p class="mission-text">
          ${escape(card.text)}
        </p>

        <details class="mission-details">
          <summary>Evidence and local questions</summary>

          <p>
            <strong>Reported evidence:</strong>
            ${escape(card.basis)}

            <a href="${card.source}">
              View supporting section
            </a>.
          </p>

          <p>
            <strong>Discuss locally:</strong>
            ${escape(card.question)}
          </p>
        </details>
      </article>
    `;
  }

  async function request(path, type) {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(
        `Could not load ${path} (HTTP ${response.status}). Upload it beside lea-profile.html.`
      );
    }

    if (type === 'json') {
      return response.json();
    }

    const bytes = await response.arrayBuffer();

    let text;

    try {
      text = new TextDecoder(
        'utf-8',
        { fatal: true }
      ).decode(bytes);
    } catch {
      text = new TextDecoder(
        'windows-1252'
      ).decode(bytes);
    }

    return parseCSV(text);
  }

  function printSupport() {
    let previous = null;

    window.addEventListener('beforeprint', () => {
      if (previous !== null) {
        return;
      }

      previous = Array.from(
        document.querySelectorAll('.mission-details')
      ).map(detail => ({
        detail,
        open: detail.open
      }));

      previous.forEach(({ detail }) => {
        detail.open = true;
      });
    });

    window.addEventListener('afterprint', () => {
      previous?.forEach(({ detail, open }) => {
        detail.open = open;
      });

      previous = null;
    });
  }

  async function init() {
    const status = document.getElementById('loadStatus');
    const button = document.getElementById('printButton');

    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    const set = (id, text) => {
      document.getElementById(id).textContent = text;
    };

    try {
      const data = await request(
        FILES.boundaries,
        'json'
      );

      if (!Array.isArray(data.features)) {
        throw new Error(
          'The boundary file is not a FeatureCollection.'
        );
      }

      const features = data.features.filter(feature =>
        feature.properties?.LEA_ID &&
        feature.properties?.LEA_GUID
      );

      const selected = code
        ? selectFeature(features, code)
        : null;

      if (!selected) {
        status.textContent = code
          ? 'That LEA code is missing or ambiguous. Choose an area below.'
          : 'Choose a Local Electoral Area to open its report.';

        const select = document.getElementById('areaSelect');

        features
          .sort((a, b) =>
            a.properties.CSO_LEA.localeCompare(
              b.properties.CSO_LEA
            )
          )
          .forEach(item => {
            const p = item.properties;

            select.add(
              new Option(
                `${title(p.CSO_LEA)} · ${title(p.COUNTY)} · ${p.LEA_ID}`,
                p.LEA_ID
              )
            );
          });

        document.getElementById('areaPicker').hidden = false;
        return;
      }

      const feature = toWGS84(
        selected,
        data.crs?.properties?.name,
        window.proj4
      );

      status.textContent =
        'Boundary loaded. Preparing the Census charts and church listings…';

      const [records, churchResult] = await Promise.all([
        request(FILES.census, 'csv'),

        request(FILES.churches, 'csv').then(
          value => ({ value }),
          error => ({ error })
        )
      ]);

      const row = selectRow(records, feature);
      const p = feature.properties;
      const name = title(p.CSO_LEA);

      const charts = groups.map(definition =>
        buildChart(row, definition)
      );

      const population = sum(row, ['T1_1AGETT']);

      if (population === null || population <= 0) {
        throw new Error(
          'The published LEA population is missing or invalid.'
        );
      }

      const churches = churchResult.error
        ? {
            available: false,
            inside: [],
            nearby: [],
            invalid: 0
          }
        : {
            available: true,
            ...classifyChurches(
              churchResult.value,
              feature.geometry
            )
          };

      set('leaName', name);

      set(
        'areaMeta',
        `${title(p.COUNTY)} · LEA ${p.LEA_ID} · Census 2022 statistical boundary`
      );

      document.title =
        `${name} LEA | Glúnta Research`;

      set(
        'boundaryNote',
        `This report covers the Census 2022 statistical LEA of ${name}, ${title(p.COUNTY)}. It uses the matching published CSO LEA row, rather than combining towns or averaging Small Area percentages.`
      );

      if (p.LEA_OFFICIAL === 'N') {
        set(
          'boundaryAdjustment',
          'CSO statistical boundary adjustment: the supplied dataset marks this LEA as differing from its statutory electoral boundary. The figures and map here use the matching Census 2022 statistical geography.'
        );

        document.getElementById(
          'boundaryAdjustment'
        ).hidden = false;
      }

      const age = charts.find(c =>
        c.id === 'ages'
      );

      const birth = charts.find(c =>
        c.id === 'birthplace'
      );

      const stats = [
        [
          count(population),
          'Residents across the LEA',
          'Census 2022 · all residents'
        ],
        [
          count(sum(row, ['T5_2_TH'])),
          'Private households',
          'Census 2022 · household total'
        ],
        [
          percentage(
            age.rows[0].value,
            age.total
          ),
          'Aged 0–14',
          `Denominator: ${count(age.total)} residents`
        ],
        [
          percentage(
            birth.rows[1].value,
            birth.total
          ),
          'Born outside Ireland',
          `Denominator: ${count(birth.total)} in birthplace table`
        ]
      ];

      document.getElementById(
        'headlineStats'
      ).innerHTML = stats.map(
        ([value, label, note]) => `
          <div class="stat">
            <strong>${escape(value)}</strong>
            <span>${escape(label)}</span>
            <small>${escape(note)}</small>
          </div>
        `
      ).join('');

      set(
        'peopleSummary',
        `${count(population)} residents were recorded across this LEA in 2022. These are area-wide figures. They are not the population or demographic profile of any one town within it.`
      );

      for (const chart of charts) {
        document
          .getElementById(chart.target)
          .insertAdjacentHTML(
            'beforeend',
            chartHTML(chart)
          );
      }

      if (!churches.available) {
        set(
          'churchSummary',
          'Church records are unavailable. The demographic report remains usable; no church count can be inferred.'
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
        const invalidNote = churches.invalid
          ? ` ${count(churches.invalid)} record(s) with invalid coordinates were excluded from geographic counts.`
          : '';

        set(
          'churchSummary',
          `${count(churches.inside.length)} listed location(s) fall inside the LEA. ${count(churches.nearby.length)} further listed location(s) lie outside it and within approximately 15 km of the nearest boundary. These are dataset records, not a complete church census.${invalidNote}`
        );

        document.getElementById(
          'insideChurches'
        ).innerHTML = churchList(
          churches.inside,
          false
        );

        document.getElementById(
          'nearbyChurches'
        ).innerHTML = churchList(
          churches.nearby.slice(0, 8),
          true
        );
      }

      document.getElementById(
        'missionCards'
      ).innerHTML = observations(
        row,
        charts,
        name,
        churches
      ).map(missionHTML).join('');

      document.getElementById(
        'printMap'
      ).innerHTML = staticMap(
        feature,
        churches.inside
      );

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
        `Report opened ${openedDate}. Statistics remain dated 2022; this is not a live population estimate.`
      );

      document.getElementById('report').hidden = false;
      status.hidden = true;

      printSupport();

      button.disabled = false;

      button.addEventListener('click', () =>
        window.print()
      );

      try {
        drawMap(feature, churches);
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
      status.hidden = false;
      status.classList.add('error');

      status.textContent =
        `${error.message} Open the report through your website or a local web server.`;

      button.disabled = true;
    }
  }

  const api = {
    numeric,
    sum,
    percent,
    parseCSV,
    groups,
    buildChart,
    chartHTML,
    contains,
    extent,
    toWGS84,
    boundaryDistance,
    classifyChurches,
    selectFeature,
    selectRow,
    simplify,
    staticMap,
    observations,
    missionHTML,
    safeURL
  };

  if (
    typeof module !== 'undefined' &&
    module.exports
  ) {
    module.exports = api;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        init
      );
    } else {
      init();
    }
  }
})();
