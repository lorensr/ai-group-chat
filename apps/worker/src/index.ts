import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import * as activities from '@repo/activities'
import { Worker } from '@temporalio/worker'

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('../../../packages/durable-functions/'),
    activities,
    taskQueue: 'group-chat',
  })

  await worker.run()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
