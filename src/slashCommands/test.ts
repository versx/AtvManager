import {
  ActionRowBuilder,
  CacheType,
  ChatInputCommandInteraction,
  SelectMenuBuilder,
  SlashCommandBuilder,
  StringSelectMenuOptionBuilder,
  UserSelectMenuBuilder,
} from 'discord.js'

import DeviceHosts from '../devices.json';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test components')
  ,
  execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
    const options = DeviceHosts.slice(0, 25).map(device => ({ label: device, value: device }));
    console.log('options:', options);
    const deviceSelect = new SelectMenuBuilder()
		  .setCustomId('devices')
  		.setPlaceholder('Select device(s)')
      .setOptions(options)
			.setMinValues(1);
	  	//.setMaxValues(25);

	  const row1: any = new ActionRowBuilder()
			.addComponents(deviceSelect);

  	await interaction.reply({
	  	content: 'Select devices:',
			components: [row1],
  	});
  },
  cooldown: 10,
};

//const command: SlashCommand = {
//  command: new SlashCommandBuilder()
//    .setName('test')
//    .setDescription('Test components')
//  ,
//  execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
//    const userSelect = new UserSelectMenuBuilder()
//		  .setCustomId('users')
//  		.setPlaceholder('Select multiple users.')
//			.setMinValues(1)
//	  	.setMaxValues(25);
//
//	  const row1: any = new ActionRowBuilder()
//			.addComponents(userSelect);
//
//  	await interaction.reply({
//	  	content: 'Select users:',
//			components: [row1],
//  	});
//  },
//  cooldown: 10,
//};

export default command;