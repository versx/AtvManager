import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  CommandInteraction,
  Message,
  PermissionResolvable,
  SlashCommandBuilder,
} from 'discord.js';

export interface SlashCommand {
  command: SlashCommandBuilder,
  execute: (interaction: ChatInputCommandInteraction) => void,
  autocomplete?: (interaction: AutocompleteInteraction) => void,
  cooldown?: number, // in seconds
};

export interface Command {
  name: string,
  execute: (message: Message, args: Array<string>) => void,
  permissions: Array<PermissionResolvable>,
  aliases: Array<string>,
  cooldown?: number,
};

export interface BotEvent {
  name: string,
  once?: boolean | false,
  execute: (...args?) => void,
};

declare module 'discord.js' {
  export interface Client {
    slashCommands: Collection<string, SlashCommand>
    commands: Collection<string, Command>,
    cooldowns: Collection<string, number>,
  };
};