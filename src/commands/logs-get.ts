import { Message } from 'discord.js';

import { AndroidDevice, AndroidDeviceService } from '../services';
import { Command } from '../types';

const command: Command = {
  name: 'logs-get',
  execute: async (message, args) => {
    //console.log('message:', message, 'args:', args);
    if (!message.guild) return;

    const deviceUuid = args[1];
    if (!deviceUuid) {
      await message.channel.send(`Device not found '${deviceUuid}'`);
      return;
    }

    const service = new AndroidDeviceService([deviceUuid]);
    for (const device of service.devices) {
      await pullDeviceLog(device, message);
    }
    //await service.kill();
  },
  permissions: ['Administrator'],
  aliases: [],
};

const pullDeviceLog = async (device: AndroidDevice, message: Message) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      await message.channel.send(`[${device.deviceId}] Connection failed`);
      return;
    }

    const data = await device.getLog();
    if (!data) {
      await message.channel.send(`[${device.deviceId}] Failed to pull latest log file.`);
      return;
    }

    const title = `**Device Logs** (${device.deviceId})\n------------------------------------\n`;
    const msg = data.substring(0, Math.min(2000 - title.length - 6, data.length - title.length - 6));
    await message.channel.send(title + '```' + msg + '```');

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      await message.channel.send(`[${device.deviceId}] Failed to disconnect`);
    }
  } catch (err: any) {
    console.error('error:', err);
    await message.channel.send(`[${device.deviceId}] Failed connection`);
  }
};

export default command;