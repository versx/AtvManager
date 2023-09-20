import { Message } from 'discord.js';

import DeviceHosts from '../devices.json';
import { AndroidDevice, AndroidDeviceService } from '../services';
import { Command } from '../types';

//const service = new DeviceService(deviceHosts);
const command: Command = {
  name: 'reboot',
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

    let reboots = 0, fails = 0;
    const service = new AndroidDeviceService(devices);
    for (const device of service.devices) {
      if (await rebootDevice(device, message)) {
        reboots++;
      } else {
        fails++;
      }
    }

    if (reboots === 0 && fails === 0) {
      return;
    }

    console.log(devices.length, 'devices rebooted successfully.');
    if (fails > 0) {
      await message.channel.send(`${reboots} devices rebooted successfully and ${fails} failed.`);
    } else {
      await message.channel.send(`${reboots} devices rebooted successfully.`);
    }
  },
  permissions: ['Administrator'],
  aliases: [],
};

const rebootDevice = async (device: AndroidDevice, message: Message): Promise<boolean> => {
  try {
    if (!await device.connect()) {
      console.log(`[${device.deviceId}] Connection failed`);
      await message.channel.send(`[${device.deviceId}] Connection failed`);
      return false;
    }

    let result = false;
    if (await device.rebootDevice()) {
      console.log(`[${device.deviceId}] Rebooted successfully.`);
      await message.channel.send(`[${device.deviceId}] Rebooted successfully`);
      result = true;
    } else {
      console.error(`[${device.deviceId}] Reboot failed.`);
      await message.channel.send(`[${device.deviceId}] Reboot failed`);
      result = false;
    }

    if (!await device.disconnect()) {
      console.log(`[${device.deviceId}] Failed to disconnect`);
      await message.channel.send(`[${device.deviceId}] Failed to disconnect`);
      result = false;
    }

    return result;
  } catch (err: any) {
    console.error('error:', err.message);
    await message.channel.send(`[${device.deviceId}] Failed connection`);
    return false;
  }
};

export default command;