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
    .setName('service')
    .addStringOption(option => option
      .setName('name')
      .setDescription('The service name to start or stop')
      .setRequired(true)
      .addChoices(
        { name: 'Atlas', value: 'atlas' },
        { name: 'Pokemon', value: 'pogo' },
        { name: 'VNC', value: 'vnc' },
      )
    )
    .addStringOption(option => option
      .setName('action')
      .setDescription('Whether to start or stop the service')
      .setRequired(true)
      .addChoices(
        { name: 'Start', value: 'start' },
        { name: 'Stop', value: 'stop' },
        //{ name: 'Restart', value: 'restart' },
      )
    )
    .addStringOption(option => option
      .setName('device')
      .setDescription('The name of the device to start or stop the service on')
      .setRequired(true)
      .setAutocomplete(true)
    )
    .setDescription('Starts or stops the specified service by name (Android Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
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

      //const start = args[1] === 'start';
      //const serviceName = args[2];
      //const deviceIds = args[3] === 'all'
      //  ? Android // TODO: iPhone
      //  : args.slice(3).map((arg: string) => arg.includes(',') ? arg.replace(/,/g, '') : arg);
      ////arg.split(/,\s?/g);
      //if (deviceIds.length === 0) {
      //  await message.channel.send(`No devices specified '${deviceIds}'`);
      //  return;
      //}
      //const service = new AndroidDeviceService(deviceIds);
      //for (const device of service.devices) {
      //  await controlService(device, message, serviceName, start);
      //}

      const { action, device, name } = options;
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

        const result = await controlService(atvDevice, name.toString(), action === 'start');
        return await interaction.editReply({ content: `**Service Result** (${atvDevice.deviceId})\n${result}` });
      } else {
        for (const device of service.devices) {
          const result = await controlService(device, name.toString(), action === 'start');
          await interaction.channel?.send({ content: `**Service Result** (${device.deviceId})\n${result}` });
        }
      }
    } catch (error) {
      return await interaction.editReply({ content: 'Something went wrong...' });
    }
  },
  cooldown: 10,
};

const controlService = async (device: AndroidDevice, serviceName: string, start: boolean = true) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      return `[${device.deviceId}] Connection failed`;
    }

    let message = '';
    if (start) {
      if (await device.startService(serviceName)) {
        message = `[${device.deviceId}] Service started: ${serviceName}`;
      } else {
        message = `[${device.deviceId}] Failed to start service: ${serviceName}`;
      }
    } else {
      if (await device.stopService(serviceName)) {
        message = `[${device.deviceId}] Service stopped: ${serviceName}`;
      } else {
        message = `[${device.deviceId}] Failed to stop service: ${serviceName}`;
      }
    }

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      message = `[${device.deviceId}] Failed to disconnect`;
    }
    return message;
  } catch (err: any) {
    console.error('error:', err.message);
    return `[${device.deviceId}] Failed connection`;
  }
};

export default command;