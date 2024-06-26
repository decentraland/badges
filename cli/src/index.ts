import prompts from 'prompts'
import * as dotenv from 'dotenv'
dotenv.config({ path: './.env.local' })

import * as Events from './events'
import { publishEvent } from './publisher'

async function askUser(choices: { title: string; value: string }[]) {
  return await prompts({
    type: 'select',
    name: 'action',
    message: 'Select an action:',
    choices
  })
}

async function main() {
  const choices = [
    { title: 'Publish Move to Parcel event', value: 'move_to_parcel' },
    { title: 'Publish Test event', value: 'test' },
    { title: 'Exit', value: 'exit' }
  ]

  let response = await askUser(choices)

  while (response.action !== 'exit') {
    switch (response.action) {
      case 'move_to_parcel':
        await publishEvent(JSON.stringify(Events.MoveToParcelEvent))
        break
      case 'test':
        await publishEvent(JSON.stringify(Events.TestEvent))
        break
    }

    response = await askUser(choices)
  }

  process.exit(0)
}

// Start the CLI
main().then(console.info).catch(console.error)
