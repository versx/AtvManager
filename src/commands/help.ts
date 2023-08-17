import { Command } from '../types';

const command: Command = {
  name: 'help',
  execute: async (message, args) => {
    const prefix = process.env.PREFIX;
    let msg = '**Help**\n' +
      '-------------------------------------------\n' +
      '- **' + prefix + 'help**\n\t- Shows this page.\n' +
      '- **' + prefix + 'reboot** `<all, device1, device2>`\n\t- Reboot selected devices or all if `all` is specified.\n' + 
      '- **' + prefix + 'screen** `<all, device1, device2>`\n\t- Upload screenshots of selected devices or all if `all` is specified.\n' + 
      '- **' + prefix + 'service** `<start, stop> <all, device1, device2>`\n\t- Starts or stops the atlas service of selected devices or all if `all` is specified.\n' + 
      '- **' + prefix + 'shell** `<all, device1, device2> <command>`\n\t- Runs shell command on selected devices or all if `all` is specified.\n' + 
      '- **' + prefix + 'logs-get** `<device1>`\n\t- Get latest logs of specified device.\n' +
      '- **' + prefix + 'logs-clear** `<all, device1, device2>`\n\t- Clear all log files on selected devices or all if `all` is specified.\n'
    ;
    await message.channel.send(msg);
  },
  permissions: [],
  aliases: [],
};

export default command;