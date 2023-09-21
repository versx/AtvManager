import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js'

import DeviceHosts from '../devices.json';
import { AndroidDevice, AndroidDeviceService } from '../services';
import { SlashCommand } from '../types';

//const command: SlashCommand = {
//  command: new SlashCommandBuilder()
//    .setName('logs')
//    .addStringOption(option =>
//      option.setName('device')
//        .setDescription('The name of the device to pull logs')
//        .setRequired(true)
//        .setAutocomplete(true)
//      )
//    .setDescription('Pull logs from a device')
//  ,

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('logs')
    .addSubcommand(sub => sub
      .setName('get')
      .setDescription('Pull logs from a device')
      .addStringOption(option => option
          .setName('device')
          .setDescription('The name of the device to pull logs')
          .setRequired(true)
          .setAutocomplete(true)
      )
    )
    .addSubcommand(sub => sub
      .setName('clear')
      .setDescription('Clear all logs for a device')
      .addStringOption(option => option
        .setName('device')
        .setDescription('The name of the device to clear logs')
        .setRequired(true)
        .setAutocomplete(true)
      )
    )
    .setDescription('Device log commands')
  ,
  autocomplete: async (interaction: AutocompleteInteraction) => {
    try {
      const focusedValue = interaction.options.getFocused();
      const choices = DeviceHosts.map(device => ({ name: device, value: device }));
      const filtered: { name: string, value: string }[] = [];
      //const choices = DeviceHosts.splice(0, 75).map(device => ({ name: device, value: device }));
      //const filtered = choices.filter(choice => choice.name.startsWith(focusedValue));
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
      //const options: { [key: string]: string | number | boolean } = {};
      if (!interaction.options) {
        return await interaction.editReply({ content: 'Something went wrong...' });
      }

      const device = interaction.options.getString('device');
      if (!device) {
        return await interaction.editReply({ content: `Failed to get device ${device}` });
      }

      const service = new AndroidDeviceService([device.toString()!]);
      const atvDevice = service.devices.find(d => d.deviceHost === device);
      if (!atvDevice) {
        return await interaction.editReply({ content: `Failed to pull logs for device ${device}` });
      }

      const subcmd = interaction.options.getSubcommand(true);
      switch (subcmd) {
        case 'get':    
          const log = await pullDeviceLog(atvDevice);
          const title = `**Device Logs** (${device})\n------------------------------------\n`;
          const msg = log?.substring(0, Math.min(2000 - title.length - 6, (log?.length ?? 0) - title.length - 6));
          return await interaction.editReply({ content: title + '```' + msg + '```' });
        case 'clear':
          const result = await deleteDeviceLogs(atvDevice);
          return await interaction.editReply({ content: result });
        default:
          return;
      }

      //for (let i = 0; i < interaction.options.data.length; i++) {
      //  const element = interaction.options.data[i];
      //  if (element.name && element.value) {
      //    options[element.name] = element.value;
      //  }
      //}

      //console.log('options:', options);
      //const { device } = options;
      //if (!device) {
      //  console.error('failed to get device from options');
      //  return;
      //}

      //const service = new AndroidDeviceService([device?.toString()]);
      //const atvDevice = service.devices.find(d => d.deviceHost === device);
      //if (!atvDevice) {
      //  return interaction.editReply({ content: `Failed to pull logs for device ${device}` });
      //}

      //const log = await pullDeviceLog(atvDevice);
      //const title = `**Device Logs** (${device})\n------------------------------------\n`;
      //const msg = log?.substring(0, Math.min(2000 - title.length - 6, (log?.length ?? 0) - title.length - 6));
      //return await interaction.editReply({ content: title + '```' + msg + '```' });
    } catch (err) {
      console.error('execute:', err);
      return await interaction.editReply({ content: 'Something went wrong...' });
    }
  },
  cooldown: 10,
};

const pullDeviceLog = async (device: AndroidDevice) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      return `[${device.deviceId}] Connection failed`;
    }

    sleep(1500);

    const data = await device.getLog();
    if (!data) {
      return `[${device.deviceId}] Failed to pull latest log file.`;
    }

    // TODO: Return last 50 lines of log instead of top lines
    const title = `**Device Logs** (${device.deviceId})\n------------------------------------\n`;
    const msg = data.substring(0, Math.min(2000 - title.length - 6, data.length - title.length - 6));

    sleep(1500);

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      return `[${device.deviceId}] Failed to disconnect`;
    }
    return msg;
  } catch (err: any) {
    console.error('error:', err);
    return `[${device.deviceId}] Failed connection`;
  }
};

const deleteDeviceLogs = async (device: AndroidDevice) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      return `[${device.deviceId}] Connection failed`;
    }

    console.log(`[${device.deviceId}] Connected`);
    await device.deleteLogs();

    sleep(1500);

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      return `[${device.deviceId}] Failed to disconnect`;
    }

    console.log(`[${device.deviceId}] Disconnected`);
    return `[${device.deviceId}] Device logs have been cleared.`;
  } catch (err: any) {
    console.error('error:', err.message);
    return `[${device.deviceId}] Failed connection`;
  }
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default command;