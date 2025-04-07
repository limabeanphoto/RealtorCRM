import NodeCache from 'node-cache'

// Create a cache with 5-minute TTL
const metricsCache = new NodeCache({ stdTTL: 300 })

export default metricsCache