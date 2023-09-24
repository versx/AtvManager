import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

import config from './config.json';
import { Command, SlashCommand } from './types';

const { Guilds, MessageContent, GuildMessages, GuildMembers } = GatewayIntentBits;
const client = new Client({intents:[Guilds, MessageContent, GuildMessages, GuildMembers]});

client.slashCommands = new Collection<string, SlashCommand>();
client.commands = new Collection<string, Command>();
client.cooldowns = new Collection<string, number>();

const handlersDir = join(__dirname, './handlers');
readdirSync(handlersDir).forEach((handler: string) => {
  if (!handler.endsWith('.js')) {
    return;
  }
  require(`${handlersDir}/${handler}`)(client);
});

client.login(config.discord.token);