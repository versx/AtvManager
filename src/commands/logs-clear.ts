import { Message } from 'discord.js';

import { AndroidDevice, AndroidDeviceService, DeviceHosts } from '../services';
import { Command } from '../types';

const command: Command = {
  name: 'logs-clear',
  execute: async (message, args) => {
    if (!message.guild) return;

    const arg = args[1];
    if (!arg) {
      await message.channel.send(`Device not found '${arg}'`);
      return;
    }

    let devices: string[] = [];
    if (arg === 'all') {
      devices = DeviceHosts;
    } else if (arg.includes(',')) {
      devices = arg.split(/,\s?/g);
    } else {
      devices = [arg];
    }

    console.log('Preparing to clear all logs for the following devices:\n- ', devices.join('\n- '));
    await message.channel.send(`Preparing to clear all logs for the following devices:\n- ${devices.join('\n- ')}`);

    const service = new AndroidDeviceService(devices);
    for (const device of service.devices) {
      await deleteDeviceLogs(device, message);
    }
    //await service.kill();

    if (arg === 'all') {
      console.log('Log files for all devices deleted successfully.');
      await message.channel.send('Log files for all devices deleted successfully.');
    } else {
      console.log('Log files for', devices.length, 'devices deleted successfully.');
      await message.channel.send('Log files for ' + devices.length + ' devices deleted successfully.');
    }
  },
  permissions: ['Administrator'],
  aliases: [],
};

const deleteDeviceLogs = async (device: AndroidDevice, message: Message) => {
  try {
    if (await device.connect()) {
      console.log(`[${device.deviceId}] Connected`);
      await message.channel.send(`[${device.deviceId}] Connected`);

      await device.deleteLogs();

      if (await device.disconnect()) {
        console.log(`[${device.deviceId}] Disconnected`);
        await message.channel.send(`[${device.deviceId}] Disconnected`);
      }
    } else {
      console.log(`[${device.deviceId}] Failed connection`);
      await message.channel.send(`[${device.deviceId}] Failed connection`);
    }
  } catch (err: any) {
    console.error('error:', err.message);
    await message.channel.send(`[${device.deviceId}] Failed connection`);
  }
};

export default command;