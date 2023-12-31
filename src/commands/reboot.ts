import { Message } from 'discord.js';

import config from '../config.json';
import { Android, iPhone } from '../devices.json';
import { AndroidDevice, AndroidDeviceService } from '../services';
import { Command } from '../types';

const command: Command = {
  name: 'reboot',
  execute: async (message, args) => {
    //console.log('message:', message, 'args:', args);
    if (!message.guild) return;

    const type = args[1];
    if (!type) {
      await message.channel.send(`Must specify device type, i.e. 'Android' or 'iPhone'`);
      return;
    }

    const arg = args[2];
    if (!arg) {
      await message.channel.send(`Device not found '${arg}'`);
      return;
    }

    const isAndroid = type.toLowerCase() === 'android';

    let devices: string[] = [];
    if (arg === 'all') {
      devices = isAndroid ? Android : iPhone;
    } else if (arg.includes(',')) {
      devices = arg.split(/,\s?/g);
    } else {
      devices = [arg];
    }

    let reboots = 0, fails = 0;
    if (isAndroid) {
      const service = new AndroidDeviceService(devices);
      for (const device of service.devices) {
        if (await rebootDevice(device, message)) {
          reboots++;
        } else {
          fails++;
        }
      }
    } else {
      for (const device of devices) {
        setTimeout(async () => {
          try {
            const result = await rebootPhone(device);
            if (result) {
              reboots++;
            } else {
              fails++;
            }
            const content = result
              ? `[${device}] Rebooted successfully`
              : `[${device}] Failed to reboot`;
            await message.channel.send({ content });
          } catch (err) {
            console.error(`[${device}] ${err}`);
          }
        }, 1 * 1000);
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

const rebootPhone = async (name: string): Promise<boolean> => {
  for (const url of config.discord.agentUrls) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({
          type: 'restart',
          device: name,
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 5 * 1000,
      });
      if (!response.ok) {
        console.warn('error:', response);
        //return false;
        continue;
      }
  
      let body;
      body = await response.json();
      const result = body.status === 'ok';
      console.log('body:', body, 'result:', result);
      if (result) {
        return true;
      }
    } catch (err) {
      console.error(err);
    }
  }
  return false;
};

interface RequestOptions extends RequestInit {
  timeout: number;
};

const fetchWithTimeout = async (url: string, options: RequestOptions) => {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

export default command;