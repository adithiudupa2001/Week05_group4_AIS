// In-memory module-scope cache for LTA BusRoutes and BusStops datasets
let routeIndex = null;
let busStopIndex = null;
let loadPromise = null;

function getSingaporeDayOfWeek() {
  const now = new Date();
  const dayStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Singapore',
    weekday: 'short'
  }).format(now);
  if (dayStr === 'Sun') return 'SUN';
  if (dayStr === 'Sat') return 'SAT';
  return 'WD';
}

async function fetchAllBusRoutes(accountKey) {
  const tempRoutes = new Map();

  for (let page = 0; page < 200; page++) {
    const skip = page * 500;
    const url = `https://datamall2.mytransport.sg/ltaodataservice/BusRoutes?%24skip=${skip}`;

    const response = await fetch(url, {
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream LTA BusRoutes returned HTTP ${response.status} at page ${page} (skip ${skip})`);
    }

    const data = await response.json();
    const rows = Array.isArray(data?.value) ? data.value : [];

    for (const row of rows) {
      const serviceNo = String(row.ServiceNo || '').trim();
      const direction = String(row.Direction || '1').trim();
      // Bus stop codes MUST be kept strictly as strings to preserve leading zeroes
      const busStopCode = String(row.BusStopCode || '').trim();
      const stopSeq = Number(row.StopSequence);
      const distance = Number(row.Distance || 0);

      const routeKey = `${serviceNo}__${direction}`;
      if (!tempRoutes.has(routeKey)) {
        tempRoutes.set(routeKey, new Map());
      }

      tempRoutes.get(routeKey).set(busStopCode, {
        StopSequence: stopSeq,
        Distance: distance,
        WD_LastBus: row.WD_LastBus ? String(row.WD_LastBus).trim() : '',
        SAT_LastBus: row.SAT_LastBus ? String(row.SAT_LastBus).trim() : '',
        SUN_LastBus: row.SUN_LastBus ? String(row.SUN_LastBus).trim() : ''
      });
    }

    if (rows.length < 500) {
      break;
    }
  }

  return tempRoutes;
}

async function fetchAllBusStops(accountKey) {
  const tempStops = new Map();

  for (let page = 0; page < 50; page++) {
    const skip = page * 500;
    const url = `https://datamall2.mytransport.sg/ltaodataservice/BusStops?%24skip=${skip}`;

    const response = await fetch(url, {
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream LTA BusStops returned HTTP ${response.status} at page ${page} (skip ${skip})`);
    }

    const data = await response.json();
    const rows = Array.isArray(data?.value) ? data.value : [];

    for (const row of rows) {
      // Treat every bus stop code strictly as a string
      const busStopCode = String(row.BusStopCode || '').trim();
      if (busStopCode) {
        tempStops.set(busStopCode, {
          Description: String(row.Description || '').trim(),
          RoadName: String(row.RoadName || '').trim()
        });
      }
    }

    if (rows.length < 500) {
      break;
    }
  }

  return tempStops;
}

async function getOrLoadAllData(accountKey) {
  if (routeIndex && busStopIndex) {
    return { routeIndex, busStopIndex };
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const [loadedRoutes, loadedStops] = await Promise.all([
          fetchAllBusRoutes(accountKey),
          fetchAllBusStops(accountKey)
        ]);
        routeIndex = loadedRoutes;
        busStopIndex = loadedStops;
        return { routeIndex, busStopIndex };
      } catch (err) {
        routeIndex = null;
        busStopIndex = null;
        throw err;
      } finally {
        loadPromise = null;
      }
    })();
  }

  return await loadPromise;
}

export default async function handler(req, res) {
  const accountKey = process.env.LTA_ACCOUNT_KEY;

  // BEFORE any LTA fetch, check that key exists and is non-empty
  if (!accountKey || accountKey.trim() === '') {
    return res.status(503).json({
      error: 'LTA_ACCOUNT_KEY is not set. Add it in Vercel and redeploy.'
    });
  }

  // Treat every bus stop code strictly as a string
  const rawFrom = req.query?.from ?? req.query?.From;
  const fromStop = typeof rawFrom === 'string' ? rawFrom.trim() : (rawFrom != null ? String(rawFrom).trim() : '');

  if (!fromStop || !/^\d{5}$/.test(fromStop)) {
    return res.status(400).json({
      error: 'Please provide a 5-digit bus stop code as the "from" parameter (e.g. 04121).'
    });
  }

  const destinationStop = '77009'; // Fixed destination: Pasir Ris Interchange

  let routes;
  let stops;
  try {
    const loadedData = await getOrLoadAllData(accountKey);
    routes = loadedData.routeIndex;
    stops = loadedData.busStopIndex;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to load route data';
    return res.status(502).json({
      error: errorMsg,
      status: 502
    });
  }

  // 1. DIRECT SEARCH
  // Find all services where fromStop and 77009 appear on the same ServiceNo and Direction,
  // AND fromStop's StopSequence is LOWER than 77009's
  const rawMatches = [];
  const dayType = getSingaporeDayOfWeek();

  for (const [routeKey, stopsMap] of routes.entries()) {
    if (stopsMap.has(fromStop) && stopsMap.has(destinationStop)) {
      const fromInfo = stopsMap.get(fromStop);
      const destInfo = stopsMap.get(destinationStop);

      if (fromInfo.StopSequence < destInfo.StopSequence) {
        const [serviceNo] = routeKey.split('__');
        const stopsAway = destInfo.StopSequence - fromInfo.StopSequence;
        const distanceKm = Math.round(Math.max(0, destInfo.Distance - fromInfo.Distance) * 10) / 10;

        let rawLastBus = '';
        if (dayType === 'SUN') {
          rawLastBus = fromInfo.SUN_LastBus || destInfo.SUN_LastBus || '';
        } else if (dayType === 'SAT') {
          rawLastBus = fromInfo.SAT_LastBus || destInfo.SAT_LastBus || '';
        } else {
          rawLastBus = fromInfo.WD_LastBus || destInfo.WD_LastBus || '';
        }

        let lastBus = rawLastBus;
        if (rawLastBus && rawLastBus.length === 4 && /^\d{4}$/.test(rawLastBus)) {
          lastBus = `${rawLastBus.slice(0, 2)}:${rawLastBus.slice(2)}`;
        }

        rawMatches.push({
          type: 'direct',
          ServiceNo: serviceNo,
          stopsAway,
          distanceKm,
          lastBus: lastBus || 'N/A'
        });
      }
    }
  }

  // Deduplicate direct results by ServiceNo if multiple directions matched, picking the shortest stop count
  const serviceMap = new Map();
  for (const m of rawMatches) {
    if (!serviceMap.has(m.ServiceNo) || serviceMap.get(m.ServiceNo).stopsAway > m.stopsAway) {
      serviceMap.set(m.ServiceNo, m);
    }
  }

  const matchingServices = Array.from(serviceMap.values());
  matchingServices.sort((a, b) => a.ServiceNo.localeCompare(b.ServiceNo, undefined, { numeric: true }));

  // Helper to fetch live arrival minutes for services at the fromStop
  // FIX 4: Never clamp negative numbers to zero.
  // - If EstimatedArrival is more than 1 minute in the past, that bus has gone. OMIT it entirely.
  // - Between 1 minute in the past and 1 minute in the future, show "Arriving" (0 min).
  // - Otherwise show the whole number of minutes, rounded down.
  // - If every bus for a service has gone, treat that service as having no buses.
  const fetchLiveArrivalsAtOrigin = async () => {
    const arrivalsByService = new Map();
    try {
      const arrivalUrl = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(fromStop)}`;
      const arrivalRes = await fetch(arrivalUrl, {
        headers: {
          AccountKey: accountKey.trim(),
          accept: 'application/json'
        }
      });

      if (arrivalRes.ok) {
        const arrivalData = await arrivalRes.json();
        const rawServices = Array.isArray(arrivalData?.Services) ? arrivalData.Services : [];
        const now = Date.now();

        for (const s of rawServices) {
          const sNo = String(s.ServiceNo || '').trim();
          const minsList = [];
          for (const busKey of ['NextBus', 'NextBus2']) {
            const busObj = s[busKey];
            const estArrival = busObj?.EstimatedArrival;
            if (typeof estArrival === 'string' && estArrival.trim() !== '') {
              const arrTime = new Date(estArrival).getTime();
              if (!isNaN(arrTime)) {
                const diffMs = arrTime - now;
                // If more than 1 minute in the past, that bus has gone: omit it entirely
                if (diffMs < -60000) {
                  continue;
                }
                // Between 1 minute in the past and 1 minute in the future: show "Arriving" (0)
                if (diffMs < 60000) {
                  minsList.push(0);
                } else {
                  // Whole number of minutes, rounded down
                  minsList.push(Math.floor(diffMs / 60000));
                }
              }
            }
          }
          arrivalsByService.set(sNo, minsList);
        }
      }
    } catch (err) {
      // Return empty map on failure
    }
    return arrivalsByService;
  };

  // If direct buses found, attach arrival minutes and return
  // FIX 1: Match LTA refresh rate (Cache-Control: s-maxage=20, stale-while-revalidate=40)
  if (matchingServices.length > 0) {
    const arrivalsByService = await fetchLiveArrivalsAtOrigin();
    for (const service of matchingServices) {
      service.nextBuses = arrivalsByService.get(service.ServiceNo) || [];
    }

    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    return res.status(200).json({
      from: fromStop,
      destination: destinationStop,
      type: 'direct',
      services: matchingServices,
      directServices: matchingServices,
      oneChangeServices: []
    });
  }

  // 2. ONE-CHANGE SEARCH (run only when the direct search returns nothing)
  // a. REACHABLE: for every ServiceNo+Direction calling at fromStop, every stop with a HIGHER StopSequence
  const reachableMap = new Map(); // interchangeStop -> Array<{ ServiceNo, stops, distanceKm }>

  for (const [routeKey, stopsMap] of routes.entries()) {
    if (stopsMap.has(fromStop)) {
      const originInfo = stopsMap.get(fromStop);
      const [serviceNo] = routeKey.split('__');

      for (const [stopCode, stopInfo] of stopsMap.entries()) {
        if (stopInfo.StopSequence > originInfo.StopSequence) {
          // Exclude origin and destination
          if (stopCode === fromStop || stopCode === destinationStop) continue;

          const stopsCount = stopInfo.StopSequence - originInfo.StopSequence;
          const distKm = Math.round(Math.max(0, stopInfo.Distance - originInfo.Distance) * 10) / 10;

          if (!reachableMap.has(stopCode)) {
            reachableMap.set(stopCode, []);
          }
          reachableMap.get(stopCode).push({
            ServiceNo: serviceNo,
            stops: stopsCount,
            distanceKm: distKm
          });
        }
      }
    }
  }

  // b. FEEDERS: for every ServiceNo+Direction calling at 77009, every stop with a LOWER StopSequence
  const feederMap = new Map(); // interchangeStop -> Array<{ ServiceNo, stops, distanceKm }>

  for (const [routeKey, stopsMap] of routes.entries()) {
    if (stopsMap.has(destinationStop)) {
      const destInfo = stopsMap.get(destinationStop);
      const [serviceNo] = routeKey.split('__');

      for (const [stopCode, stopInfo] of stopsMap.entries()) {
        if (stopInfo.StopSequence < destInfo.StopSequence) {
          // Exclude origin and destination
          if (stopCode === fromStop || stopCode === destinationStop) continue;

          const stopsCount = destInfo.StopSequence - stopInfo.StopSequence;
          const distKm = Math.round(Math.max(0, destInfo.Distance - stopInfo.Distance) * 10) / 10;

          if (!feederMap.has(stopCode)) {
            feederMap.set(stopCode, []);
          }
          feederMap.get(stopCode).push({
            ServiceNo: serviceNo,
            stops: stopsCount,
            distanceKm: distKm
          });
        }
      }
    }
  }

  // c. Any stop in BOTH is a valid interchange.
  // Exclude options where both legs use the same ServiceNo.
  // Collect all valid combinations.
  const allCandidateJourneys = [];

  for (const [interchangeCode, leg1List] of reachableMap.entries()) {
    if (!feederMap.has(interchangeCode)) continue;
    const leg2List = feederMap.get(interchangeCode);

    for (const leg1 of leg1List) {
      for (const leg2 of leg2List) {
        if (leg1.ServiceNo === leg2.ServiceNo) continue; // Exclude same ServiceNo

        const totalStops = leg1.stops + leg2.stops;
        const totalDistance = Math.round((leg1.distanceKm + leg2.distanceKm) * 10) / 10;

        allCandidateJourneys.push({
          leg1Service: leg1.ServiceNo,
          leg1Stops: leg1.stops,
          leg1DistanceKm: leg1.distanceKm,
          interchangeStop: interchangeCode,
          leg2Service: leg2.ServiceNo,
          leg2Stops: leg2.stops,
          leg2DistanceKm: leg2.distanceKm,
          totalStops,
          totalDistance
        });
      }
    }
  }

  // Rank by total stops, lowest first. Ties broken by total distance.
  allCandidateJourneys.sort((a, b) => {
    if (a.totalStops !== b.totalStops) {
      return a.totalStops - b.totalStops;
    }
    return a.totalDistance - b.totalDistance;
  });

  // FIX 3: Return at most one option per INTERCHANGE STOP, and at most one per LEG-TWO SERVICE.
  // If after that fewer than three genuinely different journeys exist, return fewer.
  const seenInterchangeStops = new Set();
  const seenLeg2Services = new Set();
  const topOneChangeJourneys = [];

  for (const candidate of allCandidateJourneys) {
    if (seenInterchangeStops.has(candidate.interchangeStop)) {
      continue;
    }
    if (seenLeg2Services.has(candidate.leg2Service)) {
      continue;
    }

    seenInterchangeStops.add(candidate.interchangeStop);
    seenLeg2Services.add(candidate.leg2Service);
    topOneChangeJourneys.push(candidate);

    if (topOneChangeJourneys.length === 3) {
      break;
    }
  }

  if (topOneChangeJourneys.length > 0) {
    const arrivalsByService = await fetchLiveArrivalsAtOrigin();

    // Consistency fix: use ServiceNo in both direct and one-change objects
    const formattedOneChange = topOneChangeJourneys.map((item) => {
      const stopInfo = stops.get(item.interchangeStop);
      // NEVER invent or guess a stop name. If not in dataset, description is empty.
      const desc = stopInfo?.Description ? String(stopInfo.Description).trim() : '';
      const road = stopInfo?.RoadName ? String(stopInfo.RoadName).trim() : '';

      return {
        type: 'one_change',
        totalStops: item.totalStops,
        leg1: {
          ServiceNo: item.leg1Service,
          stops: item.leg1Stops,
          distanceKm: item.leg1DistanceKm,
          nextBuses: arrivalsByService.get(item.leg1Service) || []
        },
        interchange: {
          code: item.interchangeStop,
          description: desc,
          roadName: road
        },
        leg2: {
          ServiceNo: item.leg2Service,
          stops: item.leg2Stops,
          distanceKm: item.leg2DistanceKm
        }
      };
    });

    // FIX 1: Cache-Control: s-maxage=20, stale-while-revalidate=40
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    return res.status(200).json({
      from: fromStop,
      destination: destinationStop,
      type: 'one_change',
      services: [],
      directServices: [],
      oneChangeServices: formattedOneChange,
      message: 'No direct bus — here are journeys with one change'
    });
  }

  // If neither direct nor one-change exists:
  // FIX 1: Cache-Control: s-maxage=20, stale-while-revalidate=40
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
  return res.status(200).json({
    from: fromStop,
    destination: destinationStop,
    type: 'none',
    services: [],
    directServices: [],
    oneChangeServices: [],
    message: 'No bus journey to Pasir Ris Interchange with one change or fewer was found from that stop.'
  });
}
