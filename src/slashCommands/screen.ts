import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js'

import DeviceHosts from '../devices.json';
import { AndroidDevice, AndroidDeviceService } from '../services';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('screen')
    .addStringOption(option =>
      option.setName('device')
        .setDescription('The name of the device to get a screenshot')
        .setRequired(true)
        .setAutocomplete(true)
      )
    .setDescription('Gets a screenshot of the device')
  ,
  autocomplete: async (interaction: AutocompleteInteraction) => {
    try {
      const devices = ['All', ...DeviceHosts];
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

      const { device } = options;
      const isAll = device.toString().toLowerCase() === 'all';
      const devices = isAll
        ? DeviceHosts
        : [device.toString()];
      const service = new AndroidDeviceService(devices);
      if (!isAll) {
        const atvDevice = service.devices.find(d => d.deviceHost === device);
        if (!atvDevice) {
          return await interaction.editReply({ content: `Failed to get screenshot for device ${device}` });
        }

        setTimeout(async () => {
          const screenshot = await screenshotDevice(atvDevice);
          return await interaction.editReply({
            content: `**Device Screenshot** (${atvDevice.deviceId})`,
            files: [screenshot],
          });
        }, 2 * 1000);
      } else {
        for (const device of service.devices) {
          setTimeout(async () => {
            const screenshot = await screenshotDevice(device);
            await interaction.channel?.send({
              content: `**Device Screenshot** (${device.deviceId})`,
              files: [screenshot],
            });
          }, 2 * 1000);
        }
      }
    } catch (error) {
      return await interaction.editReply({ content: 'Something went wrong...' });
    }
  },
  cooldown: 10,
};

const screenshotDevice = async (device: AndroidDevice) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      return `[${device.deviceId}] Connection failed`;
    }

    const screenshot = await device.getScreenshot();
    if (!screenshot) {
      console.warn('Failed to get screenshot for device', device.deviceId);
      return `Failed to get screenshot for device ${device.deviceId}`;
    }

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      return `[${device.deviceId}] Failed to disconnect`;
    }

    return screenshot;
  } catch (err: any) {
    console.error('error:', err.message);
    return `[${device.deviceId}] Failed connection`;
  }
};

export default command;