import { Message } from 'discord.js';

import { AndroidDevice, AndroidDeviceService, DeviceHosts } from '../services';
import { Command } from '../types';

const command: Command = {
  name: 'screen',
  execute: async (message, args) => {
    //console.log('message:', message, 'args:', args);
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

    const service = new AndroidDeviceService(devices);
    for (const device of service.devices) {
      setTimeout(async () => {
        await screenshotDevice(device, message);
      }, 2 * 1000);
    }
    //await service.kill();
  },
  permissions: ['Administrator'],
  aliases: [],
};

const screenshotDevice = async (device: AndroidDevice, message: Message) => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      await message.channel.send(`[${device.deviceId}] Connection failed`);
      return;
    }

    const screenshot = await device.getScreenshot();
    if (!screenshot) {
      console.warn('Failed to get screenshot for device', device.deviceId);
      await message.channel.send(`Failed to get screenshot for device ${device.deviceId}`);
      return;
    }

    await message.channel.send({
      content: `**Device Screenshot** (${device.deviceId})`,
      files: [screenshot],
    });

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