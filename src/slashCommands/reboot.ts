import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'

import { Android, iPhone } from '../devices.json';
import { AndroidDevice, AndroidDeviceService } from '../services';
import { SlashCommand } from '../types';

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName('reboot')
    .addStringOption(option => option
      .setName('type')
      .setDescription('Device type to reboot')
      .setRequired(true)
      .addChoices(
        { name: 'Android', value: 'Android' },
        { name: 'iPhone', value: 'iPhone' },
      )
    )
    .addStringOption(option => option
      .setName('device')
      .setDescription('The name of the device(s) to reboot')
      .setRequired(true)
      .setAutocomplete(true)
    )
    .setDescription('Reboots the selected device(s)')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  ,
  autocomplete: async (interaction: AutocompleteInteraction) => {
    try {
      let devices = ['All'];
      const type = interaction.options.getString('type', true);
      switch (type) {
        case 'Android':
          devices = ['All', ...Android];
          break;
        case 'iPhone':
          devices = ['All', ...iPhone];
          break;
      }
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

      const { device, type } = options;

      const isAll = device.toString().toLowerCase() === 'all';
      switch (type) {
        case 'Android':
          {
            const devices = isAll
              ? Android
              : [device.toString()];
            const service = new AndroidDeviceService(devices);
            // TODO: let reboots = 0, fails = 0;
     
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

              //if (reboots === 0 && fails === 0) {
              //  return;
              //}

              //console.log(devices.length, 'devices rebooted successfully.');
              //if (fails > 0) {
              //  await interaction.channel?.send(`${reboots} devices rebooted successfully and ${fails} failed.`);
              //} else {
              //  await interaction.channel?.send(`${reboots} devices rebooted successfully.`);
              //}

              //return await (interaction.channel as TextChannel)?.send({ content: `${Object.keys(service.devices).length.toLocaleString()} devices rebooted` });
              await interaction.editReply({ content: `Rebooted ${service.devices.length.toLocaleString()} Android devices` });
            }
          }
        case 'iPhone':
          {
            if (!isAll) {
              await rebootPhone(device.toString());
            } else {
              for (const device of iPhone) {
                setTimeout(async () => {
                  const result = await rebootPhone(device);
                  if (result) {
                    await interaction.channel?.send({ content: `[${device}] Rebooted successfully` });
                  } else {
                    //await interaction.channel?.send({ content: `[${device}] Failed to reboot` });
                  }
                }, 2 * 1000);
              }
              await interaction.editReply({ content: `Rebooted ${iPhone.length.toLocaleString()} iPhone devices` });
            }
          }
          break;
      }
    } catch (error) {
      console.error(error);
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

const rebootPhone = async (name: string): Promise<boolean> => {
  const url = process.env.AGENT_URL?.toString();
  const response = await fetch(url!, {
    method: 'POST',
    body: JSON.stringify({
      type: 'restart',
      device: name,
    }),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    console.warn('error:', response);
    return false;
  }

  let body;
  try {
    body = await response.json();
    const result = body.status === 'ok';
    console.log('body:', body, 'result:', result);
    return result;
  } catch (err) {
    console.error(err);
  }
  return false;
};

export default command;