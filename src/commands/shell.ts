import { Message } from 'discord.js';

import DeviceHosts from '../devices.json';
import { AndroidDevice, AndroidDeviceService } from '../services';
import { Command } from '../types';

const command: Command = {
  name: 'shell',
  execute: async (message, args) => {
    //console.log('message:', message, 'args:', args);
    if (!message.guild) return;

    const arg = args[1];
    if (!arg) {
      await message.channel.send(`Device not found '${arg}'`);
      return;
    }
    const cmd  = args.slice(2).join(' ');
    if (!cmd) {
      await message.channel.send(`No command specified for device '${arg}'`);
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

    const service = new AndroidDeviceService(devices);
    for (const device of service.devices) {
      await shell(device, message, cmd);
    }
    //await service.kill();
  },
  permissions: ['Administrator'],
  aliases: [],
};

const shell = async (device: AndroidDevice, message: Message, command: string) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      await message.channel.send(`[${device.deviceId}] Connection failed`);
      return;
    }

    const response = await device.shell(command);
    if (!response) {
      await message.channel.send(`[${device.deviceId}] Failed to execute shell command, response: ${response}`);
      return;
    }

    const title = `**Shell Response** (${device.deviceId})\n`;
    const msg = response.substring(0, Math.min(2000 - title.length - 6, response.length - title.length - 6));
    await message.channel.send(title + '```' + msg + '```');

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