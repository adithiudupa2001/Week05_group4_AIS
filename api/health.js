export default async function handler(req, res) {
  const accountKey = process.env.LTA_ACCOUNT_KEY;
  const keyConfigured = Boolean(accountKey && accountKey.trim().length > 0);

  let weatherStatus = null;
  let weatherAnswered = false;
  let busStatus = null;
  let busAnswered = false;

  try {
    const weatherRes = await fetch('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast');
    weatherStatus = weatherRes.status;
    weatherAnswered = true;
  } catch (err) {
    weatherStatus = 500;
    weatherAnswered = false;
  }

  if (keyConfigured) {
    try {
      const busRes = await fetch('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=77009', {
        headers: {
          AccountKey: accountKey.trim(),
          accept: 'application/json'
        }
      });
      busStatus = busRes.status;
      busAnswered = true;
    } catch (err) {
      busStatus = 500;
      busAnswered = false;
    }
  } else {
    busStatus = 503;
    busAnswered = false;
  }

  return res.status(200).json({
    keyConfigured,
    weather: {
      status: weatherStatus,
      answered: weatherAnswered
    },
    bus: {
      status: busStatus,
      answered: busAnswered
    }
  });
}
