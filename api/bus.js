export default async function handler(req, res) {
  const accountKey = process.env.LTA_ACCOUNT_KEY;

  if (!accountKey || accountKey.trim() === '') {
    return res.status(503).json({
      error: 'LTA_ACCOUNT_KEY is not set. Add it in Vercel and redeploy.'
    });
  }

  const busStopCode = (req.query?.BusStopCode || req.query?.busStopCode || '77009').toString().trim();

  try {
    const url = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
    const response = await fetch(url, {
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream LTA service returned HTTP ${response.status}`,
        status: response.status
      });
    }

    const data = await response.json();
    const rawServices = Array.isArray(data?.Services) ? data.Services : [];
    const now = Date.now();

    const services = rawServices.map((service) => {
      const minutesList = [];
      for (const busKey of ['NextBus', 'NextBus2']) {
        const busObj = service[busKey];
        const estArrival = busObj?.EstimatedArrival;
        if (typeof estArrival === 'string' && estArrival.trim() !== '') {
          const arrivalTime = new Date(estArrival).getTime();
          if (!isNaN(arrivalTime)) {
            const diffMs = arrivalTime - now;
            // If more than 1 minute in the past, bus has gone: omit it entirely
            if (diffMs < -60000) {
              continue;
            }
            // Between 1 minute in past and 1 minute in future: Arriving (0)
            if (diffMs < 60000) {
              minutesList.push(0);
            } else {
              // Whole number of minutes, rounded down
              minutesList.push(Math.floor(diffMs / 60000));
            }
          }
        }
      }

      return {
        ServiceNo: service.ServiceNo,
        nextBuses: minutesList,
        minutes: minutesList
      };
    });

    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
    return res.status(200).json({
      BusStopCode: busStopCode,
      services: services
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to communicate with LTA upstream service'
    });
  }
}
