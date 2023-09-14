import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js'

import { getThemeColor } from '../functions';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows the bot\'s ping')
    ,
    execute: (interaction: ChatInputCommandInteraction<CacheType>) => {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
          .setAuthor({name: 'versx'})
          .setDescription(`🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}ms`)
          .setColor(getThemeColor('text')),
        ],
      });
    },
    cooldown: 10,
};

export default command;