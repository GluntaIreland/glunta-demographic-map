(() => {
  'use strict';

  const number = new Intl.NumberFormat('en-IE');

  const bible = passage =>
    'https://www.biblegateway.com/passage/?search=' +
    encodeURIComponent(passage) +
    '&version=ESV';

  const escape = value =>
    String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));

  function parseCount(value) {
    const text = String(value ?? '').trim();

    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text)) {
      return null;
    }

    const result = Number(text.replace(/,/g, ''));

    return Number.isSafeInteger(result) && result >= 0
      ? result
      : null;
  }

  /*
   * Read the report's exact counts, rather than rounded percentages.
   * Missing or inconsistent tables produce unavailable measures.
   */
  function readChart(doc, id) {
    const card = doc
      .getElementById('chart-' + id)
      ?.closest('.chart-card');

    if (!card) {
      return null;
    }

    const match = card
      .querySelector('.universe')
      ?.textContent.match(
        /denominator:\s*([\d,]+)(?:\s|·|$)/
      );

    const total = match ? parseCount(match[1]) : null;

    const entries = Array.from(
      card.querySelectorAll('tbody tr')
    ).map(tr => [
      tr.querySelector('th')?.textContent.trim(),
      parseCount(tr.querySelector('td')?.textContent)
    ]);

    const valid =
      total !== null &&
      entries.length > 0 &&
      entries.every(([label, count]) =>
        label && count !== null
      ) &&
      new Set(entries.map(([label]) => label)).size ===
        entries.length &&
      entries.reduce(
        (sum, [, count]) => sum + count,
        0
      ) === total;

    return valid
      ? {
          total,
          rows: Object.fromEntries(entries)
        }
      : null;
  }

  function value(chart, label) {
    return (
      chart &&
      Object.prototype.hasOwnProperty.call(
        chart.rows,
        label
      )
    )
      ? chart.rows[label]
      : null;
  }

  function ratio(part, total) {
    if (
      !Number.isSafeInteger(part) ||
      !Number.isSafeInteger(total) ||
      part < 0 ||
      part > total
    ) {
      return null;
    }

    return (
      number.format(part) +
      ' of ' +
      number.format(total) +
      (
        total > 0
          ? ' (' + (part / total * 100).toFixed(1) + '%)'
          : ' (no percentage denominator)'
      )
    );
  }

  function readReport(doc) {
    const inside = doc.getElementById('insideChurches');

    const listed = inside?.querySelectorAll(
      '.church-list li'
    );

    let churchCount = null;

    if (listed?.length) {
      churchCount = listed.length;
    } else if (
      inside
        ?.querySelector('p.small')
        ?.textContent.trim()
        .startsWith(
          'No locations are listed in this dataset'
        )
    ) {
      churchCount = 0;
    }

    return {
      town:
        doc.getElementById('townName')
          ?.textContent.trim() || 'this town',

      age: readChart(doc, 'ages'),
      birth: readChart(doc, 'birthplace'),
      english: readChart(doc, 'english'),
      religion: readChart(doc, 'religion'),
      households: readChart(doc, 'households'),
      tenure: readChart(doc, 'tenure'),
      churchCount
    };
  }

  function buildObservations(data) {
    const {
      town,
      age,
      birth,
      english,
      religion,
      households,
      tenure
    } = data;

    const missing =
      'The supporting figure is unavailable or did not pass the report-table check. Use this as a general discussion question, without drawing a town-specific conclusion.';

    const population = age?.total ?? null;

    const overseas = value(
      birth,
      'Born outside Ireland'
    );

    const englishNotWell = value(
      english,
      'Not well'
    );

    const englishNotAtAll = value(
      english,
      'Not at all'
    );

    const limitedEnglish =
      englishNotWell !== null &&
      englishNotAtAll !== null
        ? englishNotWell + englishNotAtAll
        : null;

    const otherReligion = value(
      religion,
      'Other religion'
    );

    const noReligion = value(
      religion,
      'No religion'
    );

    const children = value(
      age,
      'Children · 0–14'
    );

    const older = value(
      age,
      'Older adults · 65+'
    );

    const alone = value(
      households,
      'One person'
    );

    const privateRent = value(
      tenure,
      'Private landlord'
    );

    const churchEvidence =
      data.churchCount === null
        ? 'Church-location records are unavailable. No conclusion about the presence or absence of churches can be drawn from this report.'
        : data.churchCount === 0
          ? 'Glúnta lists no church points inside this boundary. The dataset has incomplete or unverified coverage; zero listed points does not establish that no churches exist.'
          : `Glúnta lists ${number.format(data.churchCount)} church-location record(s) inside this boundary. Their current activity, coverage and relationships need local verification.`;

    return [
      {
        id: 'presence',

        title:
          'Start with the question of presence',

        evidence:
          population !== null
            ? `CSO recorded ${number.format(population)} residents in this town’s 2022 Built Up Area. This is a geographic population count, not a measure of Christian witness.`
            : missing,

        source: '#people',
        sourceLabel: 'Population and geography',

        reflection:
          `The first task in ${town} is to understand how the gospel is already being proclaimed and embodied through congregations, households and daily work. Learn where Christian witness is present, how it is received, and who is seldom encountered. Consider what faithful, sustained presence would mean here before settling on a programme. A map can direct attention; it cannot reveal the whole relational life of a place.`,

        question:
          'Where do Christians already share ordinary life with their neighbours, and which parts of the town do we understand least?',

        scripture:
          'Acts 17:16–34'
      },

      {
        id: 'witness',

        title:
          data.churchCount > 0
            ? 'Begin with existing witness'
            : 'Verify the local Christian witness',

        evidence:
          churchEvidence,

        source: '#community',
        sourceLabel: 'Listed church locations',

        reflection:
          data.churchCount > 0
            ? 'Meet the listed congregations and ask what they have learned. Listen to their leaders and members, understand their convictions, and explore where partnership is possible. Strengthening an existing church, developing leaders or supporting a new congregation may each be appropriate; the number of map points cannot decide between them. Church health and capacity require conversation and careful judgement.'
            : 'Before describing the town as unreached, ask residents and regional churches about congregations, house gatherings and Christians whose presence is absent from the map. Verify what exists and learn its history. Any proposal for new work should grow from this listening, with attention to faithful teaching, local relationships and the possibility of partnership.',

        question:
          'Who should we meet before proposing a new initiative, and what might we strengthen together?',

        scripture:
          '1 Corinthians 3:5–9'
      },

      {
        id: 'intercultural',

        title:
          'Think interculturally from the beginning',

        evidence:
          birth && overseas !== null
            ? `In Census 2022, ${ratio(overseas, birth.total)} people in the birthplace table were born outside Ireland. Birthplace does not establish ethnicity, language or length of residence.`
            : missing,

        source: '#chart-birthplace',
        sourceLabel: 'Place-of-birth table',

        reflection:
          overseas === 0
            ? 'A birthplace table cannot establish cultural uniformity. Listen for differences in background, identity, language and experience, including those among people born in Ireland. Ask whose habits shape church life and whether people with different experiences can contribute to its friendships, service and leadership.'
            : 'Make room for residents from different backgrounds to contribute as neighbours, friends, fellow Christians and potential leaders. Ask how people describe their own identities and which relationships help them belong. Explore shared congregational life across cultural differences, without assuming that everyone born abroad is a recent arrival or needs the same form of support.',

        question:
          'Who could help us recognise cultural assumptions in our welcome, worship, friendships and leadership?',

        scripture:
          'Acts 17:16–34'
      },

      {
        id: 'language',

        title:
          'Consider language and access',

        evidence:
          english && limitedEnglish !== null
            ? `In Census 2022, ${ratio(limitedEnglish, english.total)} people who spoke a language other than English or Irish at home reported speaking English “not well” or “not at all”. The denominator is this language group, not the whole town.`
            : missing,

        source: '#chart-english',
        sourceLabel: 'English-proficiency table',

        reflection:
          limitedEnglish === 0
            ? 'No respondents in this table reported the two lowest English-proficiency categories. That does not settle every question about communication. Ask which languages people prefer for reading, prayer and conversation, and whether church language, unfamiliar terms or assumptions make participation difficult.'
            : 'Ask residents what would make communication easier: clearer language, translated information, interpretation or multilingual friendships. A different home language does not itself imply difficulty with English. Listen before choosing a response, and involve multilingual Christians in shaping it. Language-specific ministry may be useful in some settings, but these figures alone cannot establish that it is needed here.',

        question:
          'Can people understand what we say, participate in conversations and help shape the life of the church?',

        scripture:
          'Romans 12:9–13'
      },

      {
        id: 'belief',

        title:
          'Join neighbourly respect with gospel clarity',

        evidence:
          religion &&
          otherReligion !== null &&
          noReligion !== null
            ? `Census 2022 recorded ${ratio(otherReligion, religion.total)} residents under “Other religion” and ${ratio(noReligion, religion.total)} under “No religion”. “Other religion” includes other Christian traditions as well as non-Christian faiths.`
            : missing,

        source: '#chart-religion',
        sourceLabel: 'Religion table',

        reflection:
          'Ask people what faith, doubt, religious identity and church experience mean in their own lives. Neither a Catholic affiliation nor a response of no religion tells you how a person will receive the gospel. Be ready to explain Christian hope clearly and respectfully, while learning about the convictions and experiences of your neighbours. Religious categories should prompt conversation, not substitute for it.',

        question:
          'What questions are people actually asking, and how can we speak about Christ with clarity, gentleness and respect?',

        scripture:
          '1 Peter 3:15–16'
      },

      {
        id: 'household-life',

        title:
          'Make room for different households and generations',

        evidence:
          age &&
          households &&
          children !== null &&
          older !== null &&
          alone !== null
            ? `In Census 2022, ${ratio(children, age.total)} residents were aged 0–14 and ${ratio(older, age.total)} were aged 65+. Separately, ${ratio(alone, households.total)} private households had one person.`
            : missing,

        source: '#chart-households',
        sourceLabel: 'Household-size table',

        additionalSource: '#chart-ages',
        additionalSourceLabel: 'Age profile',

        reflection:
          'Consider children, younger and older adults, couples, single people and households without children when planning discipleship and community life. Explore relationships around schools, clubs and shared activities, while asking who those settings may leave out. Living alone does not establish loneliness, and the number of children does not tell you which family programmes are needed. Ask residents what would serve them.',

        question:
          'Whose household situation or stage of life is least reflected in our present rhythms of friendship and ministry?',

        scripture:
          'Romans 12:9–13'
      },

      {
        id: 'housing',

        title:
          'Explore housing, hospitality and belonging',

        evidence:
          tenure && privateRent !== null
            ? `In Census 2022, ${ratio(privateRent, tenure.total)} permanent private households rented from a private landlord. This is a household measure, not a population share.`
            : missing,

        source: '#chart-tenure',
        sourceLabel: 'Housing-tenure table',

        reflection:
          'Ask renters and owners what helps them feel at home and participate in local relationships. Consider the cost, timing and accessibility of gatherings, and whether hospitality can extend beyond established friendship groups. Tenure alone does not establish income, residential mobility or weak local roots. Let residents describe their experience before deciding what practical support or ministry would be helpful.',

        question:
          'What makes belonging easier or harder here, and what could our church change in response?',

        scripture:
          'Romans 12:9–13'
      },

      {
        id: 'fieldwork',

        title:
          'Use the map as a prompt for fieldwork',

        evidence:
          'The report supplies a town boundary and demographic tables. A verified local account of meeting places, community assets and residents’ experiences has not yet been added.',

        source: '#place',
        sourceLabel: 'Town map and boundary',

        reflection:
          `Walk ${town}, return at different times, and speak with residents and community organisations when conversation is welcome. Notice places of work, recreation, worship and informal meeting without assuming what happens inside them. Keep observation, testimony and interpretation distinct. Bring what you learn into prayer and discussion with local churches, asking how gospel proclamation, discipleship and practical love might take root over time.`,

        question:
          'What have we actually observed, what have residents told us, and which assumptions still need checking?',

        scripture:
          'Acts 17:16–34'
      }
    ];
  }

  function cardHTML(card) {
    const additionalSource = card.additionalSource
      ? `; <a href="${card.additionalSource}">${escape(card.additionalSourceLabel)}</a>`
      : '';

    const passageURL = bible(
      card.scripture.replace(/–/g, '-')
    );

    return `
      <article
        class="mission-card"
        aria-labelledby="mission-${card.id}"
      >
        <span class="mission-badge">
          Interpretation · local discernment
        </span>

        <h3 id="mission-${card.id}">
          ${escape(card.title)}
        </h3>

        <p class="mission-evidence">
          <strong>Evidence:</strong>
          ${escape(card.evidence)}
          <a href="${card.source}">
            ${escape(card.sourceLabel)}
          </a>${additionalSource}.
        </p>

        <p>${escape(card.reflection)}</p>

        <p class="mission-question">
          <strong>Discuss locally:</strong>
          ${escape(card.question)}
        </p>

        <p class="mission-reference">
          <strong>Biblical reflection:</strong>
          <a
            href="${escape(passageURL)}"
            target="_blank"
            rel="noopener noreferrer"
          >${escape(card.scripture)}</a>.
        </p>
      </article>
    `;
  }

  function start() {
    const report = document.getElementById('report');
    const cards = document.getElementById('missionCards');

    if (!report || !cards) {
      return;
    }

    let rendered = false;

    function render() {
      if (report.hidden || rendered) {
        return;
      }

      try {
        cards.innerHTML = buildObservations(
          readReport(document)
        ).map(cardHTML).join('');

        rendered = true;
      } catch {
        cards.textContent =
          'The mission reading could not be prepared. Use the Field Guide and check the reported figures before drawing local conclusions.';
      }
    }

    const observer = new MutationObserver(() => {
      render();

      if (rendered) {
        observer.disconnect();
      }
    });

    observer.observe(report, {
      attributes: true,
      attributeFilter: ['hidden']
    });

    render();

    if (rendered) {
      observer.disconnect();
    }

    window.addEventListener('beforeprint', render);
  }

  const api = {
    parseCount,
    readChart,
    readReport,
    ratio,
    buildObservations,
    cardHTML
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
        start
      );
    } else {
      start();
    }
  }
})();
