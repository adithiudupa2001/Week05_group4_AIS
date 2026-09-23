export default async function handler(req, res) {
  try {
    const response = await fetch('https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast');
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream weather service returned HTTP ${response.status}`,
        status: response.status
      });
    }

    const data = await response.json();
    const item = data?.data?.items?.[0];
    const validPeriod = item?.valid_period?.text || '';
    const forecasts = item?.forecasts || [];
    const pasirRis = forecasts.find((f) => f.area === 'Pasir Ris');
    const forecastText = pasirRis ? pasirRis.forecast : 'No forecast available';

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      area: 'Pasir Ris',
      forecast: forecastText,
      valid_period: validPeriod
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to communicate with weather upstream service'
    });
  }
}
