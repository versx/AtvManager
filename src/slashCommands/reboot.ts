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
    .setName('reboot')
    .addStringOption(option =>
      option.setName('device')
        .setDescription('The name of the device(s) to reboot')
        .setRequired(true)
        .setAutocomplete(true)
      )
    .setDescription('Reboots the selected device(s)')
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
      //let reboots = 0, fails = 0;

      if (!isAll) {
        const atvDevice = service.devices.find(d => d.deviceHost === device);
        if (!atvDevice) {
          return await interaction.editReply({ content: `Failed to get device ${device}` });
        }

        const result = await rebootDevice(atvDevice);
        return await interaction.editReply({ content: result });
      } else {
        for (const device of service.devices) {
          const result = await rebootDevice(device);
          await interaction.channel?.send({ content: result });
        }
        return await interaction.channel?.send({ content: `${Object.keys(service.devices).length.toString()} devices rebooted` });
      }
    } catch (error) {
      return await interaction.editReply({ content: 'Something went wrong...' });
    }
  },
  cooldown: 10,
};

const rebootDevice = async (device: AndroidDevice): Promise<string> => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      return `[${device.deviceId}] Connection failed`;
    }

    if (!await device.rebootDevice()) {
      console.error(`[${device.deviceId}] Reboot failed.`);
      return `[${device.deviceId}] Reboot failed`;
    }

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      return `[${device.deviceId}] Failed to disconnect`;
    }

    console.log(`[${device.deviceId}] Rebooted successfully.`);
    return `[${device.deviceId}] Rebooted successfully`;
  } catch (err: any) {
    console.error('error:', err.message);
    return `[${device.deviceId}] Failed connection`;
  }
};

export default command;