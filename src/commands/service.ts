import { Message } from 'discord.js';

import { AndroidDevice, AndroidDeviceService, DeviceHosts } from '../services';
import { Command } from '../types';

const command: Command = {
  name: 'service',
  execute: async (message, args) => {
    if (!message.guild) return;

    const start = args[1] === 'start';
    const serviceName = args[2];
    const deviceIds = args[3] === 'all'
      ? DeviceHosts
      : args.slice(3).map((arg: string) => arg.includes(',') ? arg.replace(/,/g, '') : arg);
    //arg.split(/,\s?/g);

    if (deviceIds.length === 0) {
      await message.channel.send(`No devices specified '${deviceIds}'`);
      return;
    }

    const service = new AndroidDeviceService(deviceIds);
    for (const device of service.devices) {
      await controlService(device, message, serviceName, start);
    }
    //await service.kill();
  },
  permissions: ['Administrator'],
  aliases: [],
};

const controlService = async (device: AndroidDevice, message: Message, serviceName: string, start: boolean = true) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      await message.channel.send(`[${device.deviceId}] Connection failed`);
      return;
    }

    if (start) {
      if (await device.startService(serviceName)) {
        await message.channel.send(`[${device.deviceId}] Service started: ${serviceName}`);
      } else {
        await message.channel.send(`[${device.deviceId}] Failed to start service: ${serviceName}`);
      }
    } else {
      if (await device.stopService(serviceName)) {
        await message.channel.send(`[${device.deviceId}] Service stopped: ${serviceName}`);
      } else {
        await message.channel.send(`[${device.deviceId}] Failed to stop service: ${serviceName}`);
      }
    }

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      await message.channel.send(`[${device.deviceId}] Failed to disconnect`);
      return;
    }
  } catch (err: any) {
    console.error('error:', err.message);
    await message.channel.send(`[${device.deviceId}] Failed connection`);
  }
};

export default command;