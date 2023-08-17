import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

import { Command, SlashCommand } from './types';

dotenv.config({ path: __dirname + '/.env' });

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

client.login(process.env.TOKEN);