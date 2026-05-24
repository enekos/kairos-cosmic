// data.js — mock data for Kairos
// Clusters represent groups of semantically/visually similar photos.
// Each photo has tags, an author, a date, and a 2D embedding position
// (x,y) used by the constellation canvas. Real backend would compute
// these from CLIP-like embeddings + UMAP/t-SNE projection.

export const KAIROS_DATA = (function () {
  // Stable Unsplash photo IDs grouped by theme. These are well-known
  // photos that have been live on Unsplash for years.
  const POOL = {
    architecture: [
      'photo-1487958449943-2429e8be8625',
      'photo-1448630360428-65456885c650',
      'photo-1496564203457-11bb12075d90',
      'photo-1511818966892-d7d671e672a2',
      'photo-1493663284031-b7e3aefcae8e',
      'photo-1518391846015-55a9cc003b25',
      'photo-1465447142348-e9952c393450',
      'photo-1517398741578-2c8b6c9ad60a',
      'photo-1486718448742-163732cd1544',
      'photo-1470723710355-95304d8aece4',
      'photo-1481026469463-66327c86e544',
      'photo-1473950519436-13c41e2b65a3'
    ],
    portraits: [
      'photo-1494790108377-be9c29b29330',
      'photo-1535713875002-d1d0cf377fde',
      'photo-1438761681033-6461ffad8d80',
      'photo-1531123897727-8f129e1688ce',
      'photo-1500648767791-00dcc994a43e',
      'photo-1544005313-94ddf0286df2',
      'photo-1487412720507-e7ab37603c6f',
      'photo-1502823403499-6ccfcf4fb453',
      'photo-1521119989659-a83eee488004',
      'photo-1463453091185-61582044d556',
      'photo-1517841905240-472988babdf9'
    ],
    forests: [
      'photo-1448375240586-882707db888b',
      'photo-1441974231531-c6227db76b6e',
      'photo-1518495973542-4542c06a5843',
      'photo-1502082553048-f009c37129b9',
      'photo-1469474968028-56623f02e42e',
      'photo-1426604966848-d7adac402bff',
      'photo-1414016642750-7fdd78dc33d9',
      'photo-1500382017468-9049fed747ef',
      'photo-1473773508845-188df298d2d1',
      'photo-1542273917363-3b1817f69a2d'
    ],
    urban: [
      'photo-1444723121867-7a241cacace9',
      'photo-1449034446853-66c86144b0ad',
      'photo-1492144534655-ae79c964c9d7',
      'photo-1496588152823-86ff7695e68f',
      'photo-1502602898657-3e91760cbb34',
      'photo-1517935706615-2717063c2225',
      'photo-1487958449943-2429e8be8625',
      'photo-1485871981521-5b1fd3805eee',
      'photo-1480714378408-67cf0d13bc1b'
    ],
    food: [
      'photo-1504674900247-0877df9cc836',
      'photo-1476224203421-9ac39bcb3327',
      'photo-1414235077428-338989a2e8c0',
      'photo-1466637574441-749b8f19452f',
      'photo-1495474472287-4d71bcdd2085',
      'photo-1473093226795-af9932fe5856',
      'photo-1490474418585-ba9bad8fd0ea',
      'photo-1482049016688-2d3e1b311543',
      'photo-1551183053-bf91a1d81141'
    ],
    abstract: [
      'photo-1507842217343-583bb7270b66',
      'photo-1550684376-efcbd6e3f031',
      'photo-1557672172-298e090bd0f1',
      'photo-1558591710-4b4a1ae0f04d',
      'photo-1535378620166-273708d44e4c',
      'photo-1549490349-8643362247b5',
      'photo-1493514789931-586cb221d7a7',
      'photo-1519074069390-98277fc02a5b'
    ],
    ocean: [
      'photo-1505142468610-359e7d316be0',
      'photo-1439405326854-014607f694d7',
      'photo-1507525428034-b723cf961d3e',
      'photo-1473116763249-2faaef81ccda',
      'photo-1518837695005-2083093ee35b',
      'photo-1471922694854-ff1b63b20054',
      'photo-1502209524164-acea936639a2',
      'photo-1439066615861-d1af74d74000'
    ],
    sky: [
      'photo-1419242902214-272b3f66ee7a',
      'photo-1444080748397-f442aa95c3e5',
      'photo-1505533321630-975218a5f66f',
      'photo-1502082553048-f009c37129b9',
      'photo-1518562180175-34a163b1a9a6',
      'photo-1500964757637-c85e8a162699',
      'photo-1419833173245-f59e1b93f9ee'
    ],
    animals: [
      'photo-1474511320723-9a56873867b5',
      'photo-1425082661705-1834bfd09dca',
      'photo-1444212477490-ca407925329e',
      'photo-1500595046743-cd271d694d30',
      'photo-1518715308788-3005759c61d3',
      'photo-1561948955-570b270e7c36',
      'photo-1462888210965-cdf193fb74de'
    ],
    night: [
      'photo-1494783367193-149034c05e8f',
      'photo-1506905925346-21bda4d32df4',
      'photo-1505761671935-60b3a7427bad',
      'photo-1500382017468-9049fed747ef',
      'photo-1519074069444-1ba4fff66d16',
      'photo-1502086223501-7ea6ecd79368'
    ]
  };

  const url = (id, w = 480) =>
    `https://images.unsplash.com/${id}?w=${w}&q=70&auto=format&fit=crop`;

  // Clusters: each has a center (x,y), color tint, label, tag chain.
  // Positions are in canvas world coords (roughly -1500..+1500).
  const CLUSTERS = [
    { id: 'architecture', label: 'Architecture',  sublabel: 'concrete · light · structure',
      x:  -780, y: -420, hue: 32,  size: 'large',
      tags: ['brutalism', 'facade', 'staircase', 'minimal', 'modernism'] },
    { id: 'portraits',    label: 'Portraits',     sublabel: 'human · gaze · skin',
      x:   460, y: -560, hue: 18,  size: 'large',
      tags: ['portrait', 'studio', 'street', 'mood', 'gaze'] },
    { id: 'forests',      label: 'Forests',       sublabel: 'green · moss · canopy',
      x: -1020, y:  280, hue: 142, size: 'large',
      tags: ['conifer', 'fog', 'undergrowth', 'wilderness'] },
    { id: 'urban',        label: 'Urban',         sublabel: 'streets · neon · crowd',
      x:   140, y:  -80, hue: 210, size: 'medium',
      tags: ['street', 'neon', 'rain', 'crosswalk', 'subway'] },
    { id: 'food',         label: 'Table',         sublabel: 'plates · hands · light',
      x:   880, y:   60, hue: 36,  size: 'medium',
      tags: ['plate', 'breakfast', 'still life', 'overhead'] },
    { id: 'abstract',     label: 'Abstract',      sublabel: 'texture · color · grain',
      x:  -260, y:  640, hue: 280, size: 'medium',
      tags: ['gradient', 'macro', 'pattern', 'paint'] },
    { id: 'ocean',        label: 'Tides',         sublabel: 'water · horizon · salt',
      x:   520, y:  720, hue: 188, size: 'medium',
      tags: ['wave', 'coast', 'aerial', 'surface'] },
    { id: 'sky',          label: 'Skies',         sublabel: 'cloud · dusk · stratosphere',
      x:  -480, y: -880, hue: 220, size: 'small',
      tags: ['dusk', 'cumulus', 'contrail', 'storm'] },
    { id: 'animals',      label: 'Fauna',         sublabel: 'eyes · feathers · fur',
      x:  1180, y: -240, hue: 60,  size: 'small',
      tags: ['feline', 'bird', 'farm', 'wild'] },
    { id: 'night',        label: 'After dark',    sublabel: 'long exposure · light trails',
      x: -1180, y: -120, hue: 260, size: 'small',
      tags: ['long exposure', 'bokeh', 'city lights', 'star'] }
  ];

  const AUTHORS = [
    'lena.k', 'studio_atrium', 'iorek', 'm.varga', 'nilsenfilm',
    'asuka.f', 'okwuosa', 'tom.de.wit', 'sara_mn', 'rom_ph',
    'devna.b', 'kaspar', 'eos__', 'mira.eks', 'oren.tov',
    'pip.studio', 'wren', 'ami_o', 'fjeld', 'sundae'
  ];

  // Deterministic pseudo-random so layout is stable.
  function seeded(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  }

  // Generate photos for each cluster, spread around its center.
  const PHOTOS = [];
  let pid = 0;
  const BASE_DATE = new Date('2024-01-01').getTime();
  const NOW = new Date('2026-05-20').getTime();
  const SPAN = NOW - BASE_DATE;

  CLUSTERS.forEach((c, ci) => {
    const pool = POOL[c.id] || POOL.abstract;
    const rand = seeded(1000 + ci * 137);
    const spread = c.size === 'large' ? 280 : c.size === 'medium' ? 210 : 160;
    const count = c.size === 'large' ? 42 : c.size === 'medium' ? 30 : 20;
    for (let i = 0; i < count; i++) {
      // Spiral-ish placement so cluster has texture, not just a blob
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * spread + 20;
      const x = c.x + Math.cos(angle) * r + (rand() - 0.5) * 30;
      const y = c.y + Math.sin(angle) * r + (rand() - 0.5) * 30;
      const photoId = pool[i % pool.length];
      // Distribute dates non-uniformly — clusters peak at different times.
      const peakOffset = (ci / CLUSTERS.length) * SPAN;
      const wobble = (rand() - 0.5) * SPAN * 0.6;
      const ts = BASE_DATE + peakOffset + wobble;
      const date = new Date(Math.max(BASE_DATE, Math.min(NOW, ts)));
      // Each photo has 2-4 tags drawn from the cluster's tag bag.
      const tagCount = 2 + Math.floor(rand() * 3);
      const tags = [];
      const bag = [...c.tags];
      for (let t = 0; t < tagCount && bag.length; t++) {
        tags.push(bag.splice(Math.floor(rand() * bag.length), 1)[0]);
      }
      // Aesthetic / vibe score for sorting + "similarity"
      const vibe = rand();
      // Stable z-depth in [-1..1] for 3D perspective. Mix of cluster depth + jitter.
      const clusterZ = Math.sin(ci * 1.7) * 0.6;
      const photoZ = clusterZ + (rand() - 0.5) * 0.7;
      const z = Math.max(-1, Math.min(1, photoZ));
      // Random brightness / warmth for palette/mood projections
      const brightness = rand();
      const warmth = rand();
      const composition = rand();
      // ── Multi-dim semantic positions ──
      // Each axis projection maps photos into a different 2D layout. Switching
      // axes triggers a morph in the canvas.
      const dims = {
        // 1) Subject (current layout — cluster topology)
        subject: { x, y },
        // 2) Palette — group by hue then jitter; arrange as a color wheel
        palette: (() => {
          const hue = c.hue + (rand() - 0.5) * 18;
          const rad = 700 + (1 - brightness) * 500;
          const ang = (hue / 360) * Math.PI * 2;
          return { x: Math.cos(ang) * rad + (rand() - 0.5) * 80,
                   y: Math.sin(ang) * rad + (rand() - 0.5) * 80 };
        })(),
        // 3) Mood — bright/dark on X, warm/cool on Y; clusters keep distinct centers
        //    on a ring so labels don't pile up at origin
        mood: (() => {
          const ang = (ci / CLUSTERS.length) * Math.PI * 2 + 0.5;
          const rad = 850 + (rand() - 0.5) * 200;
          return {
            x: Math.cos(ang) * rad + (brightness - 0.5) * 520,
            y: Math.sin(ang) * rad + (warmth - 0.5) * 520,
          };
        })(),
        // 4) Time — x = chronology, y = cluster lane
        time: { x: ((date.getTime() - BASE_DATE) / SPAN - 0.5) * 2800,
                y: (ci - CLUSTERS.length / 2) * 200 + (rand() - 0.5) * 80 },
        // 5) Composition — distinct cluster centers on a rotated ring + jitter
        composition: (() => {
          const ang = (ci / CLUSTERS.length) * Math.PI * 2 + 1.7;
          const rad = 800 + (rand() - 0.5) * 250;
          return {
            x: Math.cos(ang) * rad + (rand() - 0.5) * 480,
            y: Math.sin(ang) * rad + (rand() - 0.5) * 480,
          };
        })(),
      };
      PHOTOS.push({
        id: 'p' + (pid++),
        cluster: c.id,
        ci,
        x, y, z,
        url: url(photoId, 480),
        thumb: url(photoId, 240),
        tags,
        author: AUTHORS[(pid + ci) % AUTHORS.length],
        date: date.toISOString(),
        ts: date.getTime(),
        likes: Math.floor(rand() * 900) + 5,
        vibe,
        brightness, warmth, composition,
        dims,
        // size weight — a few "hero" images per cluster
        weight: rand() < 0.15 ? 1.7 : rand() < 0.5 ? 1.15 : 1
      });
    }
  });

  // Tag index for search
  const TAG_INDEX = {};
  PHOTOS.forEach(p => p.tags.forEach(t => {
    if (!TAG_INDEX[t]) TAG_INDEX[t] = [];
    TAG_INDEX[t].push(p.id);
  }));

  // "Following" — a small subset of authors the current user follows
  const FOLLOWING = new Set(['lena.k', 'iorek', 'pip.studio', 'wren']);

  // Current user's uploads (a handful)
  const ME = {
    handle: 'you',
    joined: '2025-11-04',
    uploads: PHOTOS.filter((_, i) => i % 23 === 0).slice(0, 9).map(p => p.id)
  };

  // Semantic dimensions exposed to the UI — each remaps photo positions.
  const DIMENSIONS = [
    { id: 'subject',     label: 'Subject',     hint: 'topic clusters' },
    { id: 'palette',     label: 'Palette',     hint: 'color wheel · hue × brightness' },
    { id: 'mood',        label: 'Mood',        hint: 'bright ↔ dark · warm ↔ cool' },
    { id: 'time',        label: 'Time',        hint: 'chronology × cluster lane' },
    { id: 'composition', label: 'Composition', hint: 'abstract embedding scatter' },
  ];

  return { CLUSTERS, PHOTOS, TAG_INDEX, AUTHORS, FOLLOWING, ME, DIMENSIONS };
})();
