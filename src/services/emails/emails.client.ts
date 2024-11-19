import { SESClient } from '@aws-sdk/client-ses'

const emailClient = new SESClient({
  region: process.env.AWS_REGION
})

export default emailClient
