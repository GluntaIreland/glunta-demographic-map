(() => {
  'use strict';

  const number = new Intl.NumberFormat('en-IE');

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

    const total = match
      ? parseCount(match[1])
      : null;

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
      new Set(
        entries.map(([label]) => label)
      ).size === entries.length &&
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
      'The supporting figure is unavailable or did not pass the table-total check. Treat this reflection as a general question, without drawing a town-specific conclusion.';

    const population = age?.total ?? null;

    const overseas = value(
      birth,
      'Born outside Ireland'
    );

    const notWell = value(
      english,
      'Not well'
    );

    const notAtAll = value(
      english,
      'Not at all'
    );

    const limitedEnglish =
      notWell !== null &&
      notAtAll !== null
        ? notWell + notAtAll
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

    let churchEvidence;
    let churchReflection;

    if (data.churchCount === null) {
      churchEvidence =
        'Church-location records are unavailable. No conclusion about the presence or absence of churches can be drawn from this report.';

      churchReflection =
        'Begin by finding out which congregations and Christian relationships are already present. Speak with residents and regional churches, learn the local history, and ask where partnership may be possible. The unavailable listing cannot determine whether strengthening an existing church, developing leaders or supporting a new congregation would best serve this town.';
    } else if (data.churchCount === 0) {
      churchEvidence =
        'Glúnta lists no church points inside this boundary. Coverage is incomplete or unverified; zero listed points does not establish that no churches exist.';

      churchReflection =
        'No church locations are listed inside this boundary. Verify the picture with residents and regional churches, including congregations or house gatherings absent from the map. Learn the local history before describing the town as unreached, and explore relationships through which future work could be supported and sustained.';
    } else {
      const locations =
        number.format(data.churchCount) +
        (
          data.churchCount === 1
            ? ' church location'
            : ' church locations'
        );

      churchEvidence =
        `Glúnta lists ${locations} inside this boundary. Current activity and the dataset’s coverage require local verification.`;

      churchReflection =
        `Glúnta lists ${locations} inside this boundary. Begin by listening to local leaders and members, honouring existing ministry and understanding their convictions. Ask whether partnership, strengthening or multiplication would serve the town well. The number of listed locations cannot tell us about church health, capacity or the relationships already being formed.`;
    }

    return [
      {
        id: 'presence',

        title:
          'Start with the question of presence',

        evidence:
          population !== null
            ? `CSO recorded ${number.format(population)} residents in this town’s 2022 Built Up Area. This is a population count, not a measure of Christian witness.`
            : missing,

        source: '#people',
        sourceLabel: 'Population and geography',

        reflection:
          `The first question for ${town} concerns faithful gospel presence: where Christians already share ordinary life with neighbours, where that witness is visible, and who is seldom encountered. The data should open conversations about patient presence, gospel proclamation and discipleship. Listen locally before deciding what form a new initiative should take.`,

        question:
          'Where is Christian witness already present, and which parts of the town do we understand least?'
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
          churchReflection,

        question:
          'Who should we meet before proposing new work, and what could we strengthen together?'
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
            ? 'A birthplace table cannot establish cultural uniformity. Listen for differences in identity, background and experience among people born in Ireland as well as those who have moved here. Ask whose habits shape church life, and whether people with different experiences can contribute to its friendships, service and leadership.'
            : 'Explore which communities are present, how people describe their own identities, and where trust and friendship develop. Hospitality and shared congregational life can create space for people from different backgrounds to contribute. Avoid assuming that everyone born abroad is newly arrived, speaks another language or needs the same form of support.',

        question:
          'Which cultural assumptions shape our welcome, worship, friendships and leadership?'
      },

      {
        id: 'language',

        title:
          'Language may shape access',

        soft: true,

        evidence:
          english && limitedEnglish !== null
            ? `In Census 2022, ${ratio(limitedEnglish, english.total)} people who spoke a language other than English or Irish at home reported speaking English “not well” or “not at all”. This denominator is the language group, not the whole town.`
            : missing,

        source: '#chart-english',
        sourceLabel: 'English-proficiency table',

        reflection:
          limitedEnglish === 0
            ? 'This table records no respondents in the two lowest English-proficiency categories. Still ask which languages people prefer for reading, prayer and conversation. Clear communication, understandable church language and room for multilingual relationships can help people participate, even where reported English proficiency presents few difficulties.'
            : 'Communication, friendship, translation and multilingual relationships may shape how people participate. Ask residents what makes understanding easier and where ordinary church habits create barriers. Listen before choosing a response, and involve multilingual Christians in shaping it. A different home language does not itself indicate difficulty with English or a need for separate services.',

        question:
          'Can people understand our communication, join conversations and help shape church life?'
      },

      {
        id: 'belief',

        title:
          otherReligion > 0
            ? 'Religious plurality needs neighbourly clarity'
            : 'Begin faith conversations with care',

        soft: true,

        evidence:
          religion &&
          otherReligion !== null &&
          noReligion !== null
            ? `Census 2022 recorded ${ratio(otherReligion, religion.total)} residents under “Other religion” and ${ratio(noReligion, religion.total)} under “No religion”. “Other religion” includes other Christian traditions as well as non-Christian faiths.`
            : missing,

        source: '#chart-religion',
        sourceLabel: 'Religion table',

        reflection:
          'Local mission calls for hospitality, careful listening and a gracious explanation of the gospel. Ask how people understand faith, doubt, religious identity and their experience of church. Neither a Catholic affiliation nor a response of no religion tells us how an individual will receive the gospel. Let conversations deepen the picture provided by the Census.',

        question:
          'What questions are neighbours asking, and how can we speak about Christ clearly and respectfully?'
      },

      {
        id: 'household-life',

        title:
          'Make room for different households',

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
          'Consider children, younger and older adults, single people, couples and households without children when shaping discipleship and community life. Schools, clubs and shared activities may open relationships; ask whom they leave out. Living alone does not establish loneliness, and children’s numbers cannot decide which programmes are needed. Let residents help identify what would serve them.',

        question:
          'Whose household situation or stage of life is least reflected in our present ministry?'
      },

      {
        id: 'housing',

        title:
          'Explore housing and belonging',

        soft: true,

        evidence:
          tenure && privateRent !== null
            ? `In Census 2022, ${ratio(privateRent, tenure.total)} permanent private households rented from a private landlord. This is a household measure, not a population share.`
            : missing,

        source: '#chart-tenure',
        sourceLabel: 'Housing-tenure table',

        reflection:
          'Ask renters and owners what helps them feel at home and participate in local relationships. Hospitality, accessible gatherings and friendship beyond established circles may help. Housing tenure alone cannot establish income, mobility or weak local roots. Listen to residents before deciding what practical support or ministry would be useful.',

        question:
          'What makes belonging easier or harder here, and what could our church change?'
      },

      {
        id: 'fieldwork',

        title:
          'Use the map as a prompt for fieldwork',

        evidence:
          'The report supplies a boundary and demographic tables. A verified local account of meeting places, community assets and residents’ experiences has not yet been added.',

        source: '#place',
        sourceLabel: 'Town map and boundary',

        reflection:
          `Walk ${town}, return at different times, and speak with residents when conversation is welcome. Look for places where people work, meet, worship and relax. Keep observation, testimony and interpretation distinct. Bring what you learn into prayer and conversation with local churches, asking how gospel proclamation, discipleship and practical love might take root over time.`,

        question:
          'What have we observed, what have residents told us, and which assumptions still need checking?'
      }
    ];
  }

  function cardHTML(card) {
    const extra = card.additionalSource
      ? `; <a href="${card.additionalSource}">${escape(card.additionalSourceLabel)}</a>`
      : '';

    return `
      <article
        class="mission-card${card.soft ? ' mission-card--soft' : ''}"
        aria-labelledby="mission-${card.id}"
      >
        <h3 id="mission-${card.id}">
          ${escape(card.title)}
        </h3>

        <p class="mission-text">
          ${escape(card.reflection)}
        </p>

        <details class="mission-details">
          <summary>Evidence and local questions</summary>

          <p>
            <strong>Reported evidence:</strong>
            ${escape(card.evidence)}

            <a href="${card.source}">
              ${escape(card.sourceLabel)}
            </a>${extra}.
          </p>

          <p>
            <strong>Discuss locally:</strong>
            ${escape(card.question)}
          </p>
        </details>
      </article>
    `;
  }

  function openPrintDetails(root) {
    const state = Array.from(
      root.querySelectorAll('.mission-details')
    ).map(detail => ({
      detail,
      open: detail.open
    }));

    state.forEach(({ detail }) => {
      detail.open = true;
    });

    return state;
  }

  function restorePrintDetails(state) {
    state?.forEach(({ detail, open }) => {
      detail.open = open;
    });
  }

  function start() {
    const report = document.getElementById('report');
    const section = document.getElementById('mission-reading');
    const cards = document.getElementById('missionCards');

    if (!report || !section || !cards) {
      return;
    }

    let rendered = false;
    let printState = null;

    function render() {
      if (report.hidden || rendered) {
        return;
      }

      try {
        cards.innerHTML = buildObservations(
          readReport(document)
        ).map(cardHTML).join('');

        const intro = section
          .querySelector('h2')
          ?.nextElementSibling;

        if (intro?.tagName === 'P') {
          intro.classList.add('mission-intro');

          intro.textContent =
            'Reflections for local discernment. Open a card’s evidence and questions to explore its supporting figures.';
        }

        const method = section.querySelector(
          '.mission-method'
        );

        if (method) {
          method.textContent =
            'These are interpretive prompts for discussion with residents and local churches. They do not measure spiritual need, church health or receptivity to the gospel. Card colours distinguish panels; they do not score the town.';
        }

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

    window.addEventListener('beforeprint', () => {
      render();

      if (printState === null) {
        printState = openPrintDetails(section);
      }
    });

    window.addEventListener('afterprint', () => {
      restorePrintDetails(printState);
      printState = null;
    });
  }

  const api = {
    parseCount,
    readChart,
    readReport,
    ratio,
    buildObservations,
    cardHTML,
    openPrintDetails,
    restorePrintDetails
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
