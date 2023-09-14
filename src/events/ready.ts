import { Client } from 'discord.js';

import { color } from '../functions';
import { BotEvent } from '../types';

const event: BotEvent = {
  name: 'ready',
  once: true,
  execute: (client: Client) => {
    console.log(color('text', `💪 Logged in as ${color('variable', client.user?.tag)}`));
  },
};

export default event;