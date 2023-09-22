import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js'

import { Android } from '../devices.json';
import { AndroidDevice, AndroidDeviceService } from '../services';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('shell')
    .addStringOption(option => option
      .setName('device')
      .setDescription('The name of the device to execute the command on')
      .setRequired(true)
      .setAutocomplete(true)
    )
    .addStringOption(option => option
      .setName('command')
      .setDescription('The command to execute on the device')
      .setRequired(true)
    )
    .setDescription('Executes a command on a specified device (Android Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  ,
  autocomplete: async (interaction: AutocompleteInteraction) => {
    try {
      const devices = ['All', ...Android];
      const focusedValue = interaction.options.getFocused();
      const choices = devices.map(device => ({ name: device, value: device }));
      const filtered: { name: string, value: string }[] = [];
      for (const choice of choices) {
        if (choice.value.includes(focusedValue)) {
          filtered.push(choice);
        }
      }
      await interaction.respond(filtered);
    } catch (err) {
      console.error(err.message);
    }
  },
  execute: async (interaction: ChatInputCommandInteraction) => {
    try {
      await interaction.deferReply({ ephemeral: true });
      const options: { [key: string]: string | number | boolean } = {};
      if (!interaction.options) {
        return await interaction.editReply({ content: 'Something went wrong...' });
      }

      for (let i = 0; i < interaction.options.data.length; i++) {
        const element = interaction.options.data[i];
        if (element.name && element.value) {
          options[element.name] = element.value;
        }
      }

      const { command, device } = options;
      const isAll = device.toString().toLowerCase() === 'all';
      const devices = isAll
        ? Android
        : [device.toString()];
      const service = new AndroidDeviceService(devices);
      if (!isAll) {
        const atvDevice = service.devices.find(d => d.deviceHost === device);
        if (!atvDevice) {
          return await interaction.editReply({ content: `Failed to get device ${device}` });
        }

        const result = await shell(atvDevice, command.toString());
        return await interaction.editReply({ content: `**Shell Result** (${atvDevice.deviceId})\n${result}` });
      } else {
        for (const device of service.devices) {
          const result = await shell(device, command.toString());
          await interaction.channel?.send({ content: `**Shell Result** (${device.deviceId})\n${result}` });
        }
      }
    } catch (error) {
      return await interaction.editReply({ content: 'Something went wrong...' });
    }
  },
  cooldown: 10,
};

const shell = async (device: AndroidDevice, command: string) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      return `[${device.deviceId}] Connection failed`;
    }

    const response = await device.shell(command);
    if (!response) {
      return `[${device.deviceId}] Failed to execute shell command, response: ${response}`;
    }

    const title = `**Shell Response** (${device.deviceId})\n`;
    const msg = response.substring(0, Math.min(2000 - title.length - 6, response.length - title.length - 6));

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      return `[${device.deviceId}] Failed to disconnect`;
    }

    return title + '```' + msg + '```';
  } catch (err: any) {
    console.error('error:', err.message);
    return `[${device.deviceId}] Failed connection`;
  }
};

export default command;