import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js'

import { Android, iPhone } from '../devices.json';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test components')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  ,
  execute: async (interaction: ChatInputCommandInteraction<CacheType>) => {
    const mapDevices = (devices: string[], type: string) => devices.map(device => ({ label: device, value: device, description: type }));
    const androidDevices = mapDevices(Android, 'Android');
    const iPhoneDevices = mapDevices(iPhone, 'iPhone');
    const options = [
      { label: 'All', value: 'all', description: 'All Android & iPhone Devices' },
      ...androidDevices,
      ...iPhoneDevices,
    ];
    const deviceSelect = new StringSelectMenuBuilder()
      .setCustomId('devices')
      .setPlaceholder('Select device(s)')
      .setOptions(options.slice(0, 25))
      .setMinValues(1)
      .setMaxValues(25);

    const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Primary);

    const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row1: any = new ActionRowBuilder()
      .addComponents(deviceSelect);
    const row2: any = new ActionRowBuilder()
      .addComponents([confirm, cancel]);

    const response = await interaction.reply({
      content: 'Select devices:',
      components: [row1, row2],
    });

    try {
      const collectFilter = (i: any) => i.user.id === interaction.user.id;
      const filterOptions = { filter: collectFilter, time: 60000 };
      const confirmation = await response.awaitMessageComponent(filterOptions);
      if (confirmation.customId !== 'devices') {
        console.warn('invalid customId:', confirmation.customId);
        return;
      }

      const selectedValues = (confirmation as StringSelectMenuInteraction).values;
      await confirmation.deferUpdate();

      const submit = await response.awaitMessageComponent(filterOptions);
      switch (submit.customId) {
        case 'confirm':
          await confirmation.editReply({
            content: `Selected Devices: ${selectedValues?.join(', ')}`,
            components: [],
          });
          break;
        case 'cancel':
          await confirmation.update({
            content: 'Action cancelled',
            components: [],
          });
          break;
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: 'Confirmation not received within 1 minute, cancelling',
        components: [],
      });
    }
  },
  cooldown: 10,
};

export default command;